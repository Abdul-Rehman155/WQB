const express = require('express');
const router = express.Router();
const Payroll = require('../Model/payrolleSchema');
const Attendance = require('../Model/attendenceSchema');
const Employee = require('../Model/employeeSchema');
const EmployeeSalaryComponent = require('../Model/employeeSalaryComponentSchema');
const LoanAdvance = require('../Model/loanAdvanceSchema');
const Arrear = require('../Model/arrearSchema');

const monthName = (month, year) => new Date(Number(year), Number(month) - 1, 1)
  .toLocaleString('default', { month: 'short', year: 'numeric' });

const calculatePayslip = async (employee, month, year) => {
  const monthNumber = String(month).padStart(2, '0');
  const monthLabel = monthName(month, year);
  const totalDays = new Date(Number(year), Number(month), 0).getDate();
  const attendance = await Attendance.find({
    employeeId: employee._id,
    date: { $regex: `^${year}-${monthNumber}` },
  }).lean();
  const presentDays = attendance.filter((item) => ['Present', 'Late'].includes(item.status)).length;
  const absentDays = Math.max(0, totalDays - presentDays);
  const baseSalary = Number(employee.baseSalary || 0);
  const leaveDeduction = Number((baseSalary / totalDays * absentDays).toFixed(2));
  const tax = Number((baseSalary * 0.05).toFixed(2));
  const pf = Number((baseSalary * 0.10).toFixed(2));

  const assignments = await EmployeeSalaryComponent.find({ employeeId: employee._id, active: true })
    .populate('componentId').lean();
  const earnings = [];
  const deductionLines = [
    { name: 'Tax', amount: tax, source: 'statutory' },
    { name: 'PF', amount: pf, source: 'statutory' },
    { name: 'Leave deduction', amount: leaveDeduction, source: 'attendance' },
  ];
  assignments.forEach((assignment) => {
    const component = assignment.componentId;
    if (!component || component.status !== 'Active') return;
    const amount = assignment.calculationType === 'Percentage'
      ? Number((baseSalary * assignment.value / 100).toFixed(2))
      : Number(assignment.value);
    const line = { name: component.name, amount, source: 'salary component' };
    if (component.type === 'Deduction') deductionLines.push(line);
    else earnings.push(line);
  });

  const loans = await LoanAdvance.find({
    employeeId: employee._id,
    status: 'Active',
    outstandingBalance: { $gt: 0 },
    $or: [{ lastAppliedMonth: null }, { lastAppliedMonth: { $ne: monthLabel } }],
  }).lean();
  const loanRepayment = loans.reduce((sum, loan) => sum + Math.min(Number(loan.installmentAmount), Number(loan.outstandingBalance)), 0);
  if (loanRepayment) deductionLines.push({ name: 'Loan/advance repayment', amount: loanRepayment, source: 'loan' });

  const arrears = await Arrear.findOne({ employeeId: employee._id, status: 'Approved', appliedMonth: null }).lean();
  const arrearAmount = arrears ? Number(arrears.amount) : 0;
  if (arrearAmount) earnings.push({ name: arrears.title, amount: arrearAmount, source: 'arrear' });

  const grossSalary = Number((baseSalary + earnings.reduce((sum, line) => sum + line.amount, 0)).toFixed(2));
  const totalDeductions = Number(deductionLines.reduce((sum, line) => sum + line.amount, 0).toFixed(2));
  const netSalary = Number((grossSalary - totalDeductions).toFixed(2));
  return {
    employeeId: employee._id,
    employeeName: employee.name,
    month: monthLabel,
    baseSalary,
    presentDays,
    absentDays,
    earnings,
    deductionLines,
    grossSalary,
    totalDeductions,
    loanRepayment,
    arrears: arrearAmount,
    allowances: {
      hra: earnings.find((line) => line.name.toLowerCase() === 'hra')?.amount || 0,
      travel: earnings.find((line) => line.name.toLowerCase() === 'travel')?.amount || 0,
      bonus: earnings.find((line) => line.name.toLowerCase() === 'bonus')?.amount || 0,
    },
    deductions: { tax, pf, leaveDeduction },
    netSalary,
    payDate: `${year}-${monthNumber}-05`,
    status: 'Generated',
  };
};

router.post('/payroll/generate', async (req, res) => {
  const { month, year, employeeId } = req.body;
  if (!month || !year || Number(month) < 1 || Number(month) > 12) {
    return res.status(400).json({ message: 'A valid month and year are required.' });
  }
  try {
    const employeeQuery = employeeId
      ? { _id: employeeId, status: 'Active' }
      : { status: 'Active' };
    const employees = await Employee.find(employeeQuery);
    if (employeeId && !employees.length) {
      return res.status(404).json({ message: 'Active employee not found.' });
    }
    const results = [];
    for (const employee of employees) {
      const breakdown = await calculatePayslip(employee, month, year);
      const existing = await Payroll.findOne({ employeeId: employee._id, month: breakdown.month });
      if (existing?.status === 'Paid') {
        results.push(existing);
        continue;
      }
      const payslip = await Payroll.findOneAndUpdate(
        { employeeId: employee._id, month: breakdown.month },
        breakdown,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      // Only apply balance-changing adjustments when the payslip is first created.
      // Re-generating a Generated/Downloaded slip must recalculate components
      // without deducting the same loan or arrear a second time.
      if (!existing && breakdown.loanRepayment > 0) {
        const loans = await LoanAdvance.find({
          employeeId: employee._id,
          status: 'Active',
          outstandingBalance: { $gt: 0 },
          $or: [{ lastAppliedMonth: null }, { lastAppliedMonth: { $ne: breakdown.month } }],
        }).sort({ createdAt: 1 });
        let remaining = breakdown.loanRepayment;
        for (const loan of loans) {
          if (remaining <= 0) break;
          const applied = Math.min(Number(loan.installmentAmount), Number(loan.outstandingBalance), remaining);
          loan.outstandingBalance = Number((loan.outstandingBalance - applied).toFixed(2));
          loan.lastAppliedMonth = breakdown.month;
          if (loan.outstandingBalance <= 0) loan.status = 'Completed';
          await loan.save();
          remaining = Number((remaining - applied).toFixed(2));
        }
      }
      if (!existing && breakdown.arrears > 0) {
        await Arrear.updateOne(
          { employeeId: employee._id, status: 'Approved', appliedMonth: null },
          { $set: { status: 'Applied', appliedMonth: breakdown.month } },
        );
      }
      results.push(payslip);
    }
    return res.status(200).json({ message: 'Payroll generated', count: results.length, payslips: results });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/payroll/preview/:employeeId/:month/:year', async (req, res) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.employeeId, status: 'Active' });
    if (!employee) return res.status(404).json({ message: 'Active employee not found.' });
    const preview = await calculatePayslip(employee, req.params.month, req.params.year);
    return res.json(preview);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get('/payroll/:monthYear', async (req, res) => {
  try {
    const payslips = await Payroll.find({ month: req.params.monthYear }).populate('employeeId');
    return res.status(200).json(payslips);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/payroll/me/:email', async (req, res) => {
  try {
    const email = req.params.email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const employee = await Employee.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!employee) return res.json([]);
    const payslips = await Payroll.find({ employeeId: employee._id }).sort({ createdAt: -1 }).populate('employeeId');
    return res.json(payslips);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/payroll/status/:id', async (req, res) => {
  const allowed = ['Generated', 'Paid', 'Downloaded'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid payslip status.' });
  try {
    const updated = await Payroll.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Payslip not found.' });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const adjustmentRoutes = (Model) => {
  router.get(`/payroll-adjustments/${Model.modelName}`, async (req, res) => {
    try { return res.json(await Model.find().populate('employeeId').sort({ createdAt: -1 })); }
    catch (error) { return res.status(500).json({ message: error.message }); }
  });
  router.post(`/payroll-adjustments/${Model.modelName}`, async (req, res) => {
    try { return res.status(201).json(await Model.create(req.body)); }
    catch (error) { return res.status(400).json({ message: error.message }); }
  });
};
adjustmentRoutes(LoanAdvance);
adjustmentRoutes(Arrear);

router.get('/payroll-components/assignments/:employeeId', async (req, res) => {
  try { return res.json(await EmployeeSalaryComponent.find({ employeeId: req.params.employeeId }).populate('componentId')); }
  catch (error) { return res.status(500).json({ message: error.message }); }
});
router.post('/payroll-components/assignments', async (req, res) => {
  try {
    const { employeeId, componentId, value, calculationType } = req.body;
    if (!employeeId || !componentId || value === undefined || !calculationType) {
      return res.status(400).json({ message: 'Employee, component, value and calculation type are required.' });
    }

    const assignment = await EmployeeSalaryComponent.findOneAndUpdate(
      { employeeId, componentId },
      { employeeId, componentId, value: Number(value), calculationType, active: true },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).populate('componentId');
    return res.status(200).json(assignment);
  }
  catch (error) { return res.status(400).json({ message: error.message }); }
});

module.exports = router;
