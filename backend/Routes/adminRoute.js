const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');         // Aapka Leave Schema
const Attendance = require('../models/Attendance'); // Aapka Attendance Schema
const Payroll = require('../models/Payroll');       // Naya Payroll Schema

// 1. Get Core Analytics for Admin Stats
router.get('/api/admin/dashboard-stats', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalPresent = await Attendance.countDocuments({ date: todayStr, status: 'Present' });
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });
    const pendingPayroll = await Payroll.countDocuments({ status: 'Pending' });

    res.status(200).json({ totalPresent, pendingLeaves, pendingPayroll });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Process Payroll (Salary Release)
router.post('/api/admin/payroll/release', async (req, res) => {
  const { employeeId, employeeName, month, baseSalary, allowances, deductions } = req.body;
  const netSalary = (baseSalary + allowances) - deductions;
  try {
    const newPayroll = new Payroll({
      employeeId, employeeName, month, baseSalary, allowances, deductions, netSalary, status: 'Paid'
    });
    await newPayroll.save();
    res.status(201).json({ message: "Salary dispatched successfully!", data: newPayroll });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;