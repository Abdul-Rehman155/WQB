const DEFAULT_ALLOWANCES = { hra: 2000, travel: 2000, bonus: 1000 };
const DEFAULT_TAX_RATE = 0.05;
const DEFAULT_PF_RATE = 0.10;

function calculatePayrollBreakdown({
  baseSalary = 30000,
  presentDays = 0,
  absentDays,
  totalDaysInMonth = 30,
  allowances = DEFAULT_ALLOWANCES,
  taxRate = DEFAULT_TAX_RATE,
  pfRate = DEFAULT_PF_RATE
} = {}) {
  const effectiveAbsentDays = typeof absentDays === 'number'
    ? absentDays
    : Math.max(0, totalDaysInMonth - presentDays);

  const perDayWage = baseSalary / totalDaysInMonth;
  const leaveDeduction = Number((perDayWage * effectiveAbsentDays).toFixed(2));
  const tax = Number((baseSalary * taxRate).toFixed(2));
  const pf = Number((baseSalary * pfRate).toFixed(2));
  const allowanceTotal = Number((allowances?.hra || 0) + (allowances?.travel || 0) + (allowances?.bonus || 0));
  const totalDeduction = Number((leaveDeduction + tax + pf).toFixed(2));
  const netSalary = Number((baseSalary + allowanceTotal - totalDeduction).toFixed(2));

  return {
    baseSalary,
    presentDays,
    absentDays: effectiveAbsentDays,
    perDayWage,
    leaveDeduction,
    tax,
    pf,
    allowanceTotal,
    allowances: {
      hra: Number(allowances?.hra || 0),
      travel: Number(allowances?.travel || 0),
      bonus: Number(allowances?.bonus || 0)
    },
    totalDeduction,
    netSalary
  };
}

module.exports = {
  calculatePayrollBreakdown,
  DEFAULT_ALLOWANCES,
  DEFAULT_TAX_RATE,
  DEFAULT_PF_RATE
};
