const mongoose = require('mongoose');

const ArrearSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  title: { type: String, required: true, trim: true },
  period: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Pending', 'Approved', 'Applied'], default: 'Pending' },
  appliedMonth: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Arrear', ArrearSchema);
