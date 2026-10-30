const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  employeeName: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  status: { 
    type: String, 
    required: true, 
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'Not Marked'], // 'Not Marked' add kiya
    default: 'Not Marked'
  },
  checkIn: { type: String, default: '--:--' },
  checkOut: { type: String, default: '--:--' }
}, { timestamps: true });

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);