const mongoose = require('mongoose');

const EmployeeSalaryComponentSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryComponent', required: true },
  value: { type: Number, required: true },
  calculationType: { type: String, enum: ['Fixed', 'Percentage'], required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('EmployeeSalaryComponent', EmployeeSalaryComponentSchema);
