const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeName: { type: String, required: true },
  month: { type: String, required: true }, // Format: "July 2026"
  baseSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 }, // Attendance shorts/leaves cut
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Payroll', PayrollSchema);