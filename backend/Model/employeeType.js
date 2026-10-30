const mongoose = require('mongoose');

const EmployeeTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,   
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeType', EmployeeTypeSchema);