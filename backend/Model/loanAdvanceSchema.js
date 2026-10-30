const mongoose = require('mongoose');

const LoanAdvanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  title: { type: String, required: true, trim: true },
  principal: { type: Number, required: true, min: 0 },
  outstandingBalance: { type: Number, required: true, min: 0 },
  installmentAmount: { type: Number, required: true, min: 0 },
  lastAppliedMonth: { type: String, default: null },
  issueDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('LoanAdvance', LoanAdvanceSchema);
