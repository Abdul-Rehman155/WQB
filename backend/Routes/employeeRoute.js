const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const path = require('path');
const Employee = require('../Model/employeeSchema');
const Payroll = require('../Model/payrolleSchema');
const { calculatePayrollBreakdown } = require('../utils/payrollUtils');

// --- Multer Setup for Multiple Files ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// मल्टीपल फाइल्स को हैंडल करने के लिए fields का उपयोग
const multiUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'aadhaarFile', maxCount: 1 },
  { name: 'panFile', maxCount: 1 },
  { name: 'marksheetFile', maxCount: 1 }
]);

// 1. CREATE: Naya Employee add karne ke liye
router.post('/', multiUpload, async (req, res) => {
  try {
    const employeeData = { ...req.body };

    // फाइलों के पाथ को सेव करना
    if (req.files) {
      if (req.files.image) employeeData.image = req.files.image[0].path;
      if (req.files.aadhaarFile) employeeData.aadhaarFile = req.files.aadhaarFile[0].path;
      if (req.files.panFile) employeeData.panFile = req.files.panFile[0].path;
      if (req.files.marksheetFile) employeeData.marksheetFile = req.files.marksheetFile[0].path;
    }

    const newEmployee = new Employee(employeeData);
    const savedEmployee = await newEmployee.save();

    // --- Payroll Logic (Preserved - No Change) ---
    (async () => {
      try {
        const now = new Date();
        const displayMonth = now.toLocaleString('default', { month: 'short', year: 'numeric' });
        const payrollInfo = calculatePayrollBreakdown({
          baseSalary: savedEmployee.baseSalary || 30000,
          presentDays: 0,
          absentDays: 0,
          totalDaysInMonth: 30,
          allowances: { hra: 2000, travel: 2000, bonus: 1000 }
        });

        await Payroll.findOneAndUpdate(
          { employeeId: savedEmployee._id, month: displayMonth },
          {
            employeeId: savedEmployee._id,
            employeeName: savedEmployee.name,
            baseSalary: payrollInfo.baseSalary,
            presentDays: payrollInfo.presentDays,
            absentDays: payrollInfo.absentDays,
            allowances: payrollInfo.allowances,
            deductions: {
              tax: payrollInfo.tax,
              pf: payrollInfo.pf,
              leaveDeduction: payrollInfo.leaveDeduction
            },
            netSalary: payrollInfo.netSalary,
            payDate: `${now.getFullYear()}-${now.getMonth() + 2}-05`,
            status: 'Generated'
          },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.error('Failed to create default payslip:', e.message);
      }
    })();

    res.status(201).json(savedEmployee);
  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({ message: "Error saving employee", error: error.message });
  }
});

// 2. READ ALL: Saare Employees ki list
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. READ SINGLE: Detail by ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. UPDATE: Employee edit karne ke liye
router.put('/:id', multiUpload, async (req, res) => {
  try {
    const updateData = { ...req.body };

    // अगर नयी फाइलें अपलोड की गयी हैं तो उन्हें अपडेट करें
    if (req.files) {
      if (req.files.image) updateData.image = req.files.image[0].path;
      if (req.files.aadhaarFile) updateData.aadhaarFile = req.files.aadhaarFile[0].path;
      if (req.files.panFile) updateData.panFile = req.files.panFile[0].path;
      if (req.files.marksheetFile) updateData.marksheetFile = req.files.marksheetFile[0].path;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedEmployee) return res.status(404).json({ message: "Employee not found" });
    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Error updating employee", error: error.message });
  }
});

// 5. DELETE: Employee delete
router.delete('/:id', async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) return res.status(404).json({ message: "Employee not found" });
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;