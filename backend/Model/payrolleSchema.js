const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  employeeName: String,
  month: { type: String, required: true }, // Format: "Jul 2026"
  baseSalary: { type: Number, required: true },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  allowances: {
    hra: { type: Number, default: 0 },
    travel: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 }
  },
  deductions: {
    tax: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },
    leaveDeduction: { type: Number, default: 0 }
  },
  earnings: [{
    name: String,
    amount: Number,
    source: String
  }],
  deductionLines: [{
    name: String,
    amount: Number,
    source: String
  }],
  grossSalary: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  loanRepayment: { type: Number, default: 0 },
  arrears: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Generated', 'Paid', 'Downloaded'], 
    default: 'Generated' 
  },
  payDate: { type: String }, // Kab pay hogi
  generatedOn: { type: Date, default: Date.now }
}, { timestamps: true });

// Ek employee ki ek mahine mein ek hi payslip honi chahiye
PayrollSchema.index({ employeeId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', PayrollSchema);