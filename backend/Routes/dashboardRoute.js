const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Employee = require('../Model/employeeSchema');
const Attendance = require('../Model/attendenceSchema');
const authMiddleware = require('../middleware/authMiddleware');

let Event;
try {
  Event = mongoose.model('Event');
} catch (error) {
  Event = null;
}

// GET http://localhost:5000/api/dashboard-stats
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  const fallbackStats = {
    totalEmployees: { value: '0', subtext: 'No employees yet' },
    branches: { value: '0', subtext: 'No departments' },
    attendanceRate: { value: '0%', subtext: 'No attendance data' },
    pendingLeaves: { value: '0', subtext: 'No pending leave requests' },
    activeJobs: { value: '0', subtext: 'No active employees' },
    totalCandidates: { value: '0', subtext: 'No inactive employees' },
    realtimeSummary: { value: '0/0', subtext: 'No records available' }
  };

  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    return res.json(fallbackStats);
  }

  try {
    const [employees, leaveEvents, attendanceRecords] = await Promise.all([
      Employee.find({}).lean().catch(() => []),
      Event ? Event.find({ category: 'Leave' }).lean().catch(() => []) : Promise.resolve([]),
      Attendance.find({}).lean().catch(() => [])
    ]);

    const totalEmployees = Array.isArray(employees) ? employees.length : 0;
    const activeEmployees = Array.isArray(employees)
      ? employees.filter((employee) => employee.status === 'Active').length
      : 0;
    const inactiveEmployees = totalEmployees - activeEmployees;
    const departments = Array.isArray(employees)
      ? [...new Set(employees.map((employee) => employee.department).filter(Boolean))]
      : [];
    const pendingLeaves = Array.isArray(leaveEvents) ? leaveEvents.length : 0;
    const presentCount = Array.isArray(attendanceRecords)
      ? attendanceRecords.filter((record) => record.status === 'Present' || record.status === 'Late').length
      : 0;
    const absentCount = Array.isArray(attendanceRecords)
      ? attendanceRecords.filter((record) => record.status === 'Absent').length
      : 0;
    const attendanceRate = totalEmployees > 0
      ? Math.round((presentCount / Math.max(totalEmployees, 1)) * 100)
      : 0;

    const stats = {
      totalEmployees: {
        value: String(totalEmployees),
        subtext: totalEmployees > 0 ? `${activeEmployees} active employees` : 'No employees yet'
      },
      branches: {
        value: String(departments.length || 0),
        subtext: departments.length > 0 ? departments.slice(0, 3).join(', ') : 'No departments'
      },
      attendanceRate: {
        value: `${attendanceRate}%`,
        subtext: totalEmployees > 0
          ? `${presentCount} present / ${totalEmployees} tracked`
          : 'No attendance data'
      },
      pendingLeaves: {
        value: String(pendingLeaves),
        subtext: pendingLeaves > 0 ? 'Requires review' : 'No pending leave requests'
      },
      activeJobs: {
        value: String(activeEmployees),
        subtext: activeEmployees > 0 ? 'Active employees' : 'No active employees'
      },
      totalCandidates: {
        value: String(inactiveEmployees),
        subtext: inactiveEmployees > 0 ? 'Inactive employees' : 'No inactive employees'
      },
      realtimeSummary: {
        value: `${activeEmployees}/${totalEmployees}`,
        subtext: `${absentCount} absent records • ${presentCount} present/late`
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error.message);
    res.json(fallbackStats);
  }
});

module.exports = router;