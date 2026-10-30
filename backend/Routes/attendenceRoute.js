const express = require('express');
const router = express.Router(); // Is line ki wajah se error aa rahi thi
const Attendance = require('../Model/attendenceSchema');

// 1. Mark or Update Attendance (Upsert Logic)
router.post('/attendance', async (req, res) => {
  const { employeeId, employeeName, date, status, checkIn, checkOut } = req.body;

  if (!employeeId || !date || !status) {
    return res.status(400).json({ message: 'employeeId, date and status are required' });
  }

  try {
    const attendance = await Attendance.findOneAndUpdate(
      { employeeId, date }, // Is condition se purana data dhoondega
      {
        employeeName: employeeName || 'Unknown',
        status,
        checkIn: checkIn || '--:--',
        checkOut: checkOut || '--:--'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } // Agar nahi mila toh naya bana dega (Upsert)
    );

    res.status(200).json(attendance);
  } catch (error) {
    console.error("Error in /attendance POST:", error);
    res.status(500).json({ message: 'Error updating attendance', error: error.message });
  }
});

// 2. Get Attendance by Date
router.get('/attendance', async (req, res) => {
  try {
    const query = req.query.date ? { date: req.query.date } : {};
    const records = await Attendance.find(query).sort({ date: -1, employeeName: 1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Attendance by Date (legacy route)
router.get('/attendance/:date', async (req, res) => {
  try {
    const records = await Attendance.find({ date: req.params.date });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Attendance for a Month (YYYY-MM)
router.get('/attendance/month/:yearMonth', async (req, res) => {
  try {
    const records = await Attendance.find({
      date: { $regex: `^${req.params.yearMonth}` }
    });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; // Router ko export karna zaroori hai