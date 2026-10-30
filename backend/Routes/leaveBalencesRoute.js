const express = require("express");
const router = express.Router();
const LeaveBalance = require("../Model/LeaveBalance");
const Employee = require("../Model/employeeSchema");

// 1. READ: Get all balances with Auto-Initialization
router.get("/leave-balances", async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ message: "Year is required" });

    const employees = await Employee.find();
    
    const results = await Promise.all(employees.map(async (emp) => {
      let balance = await LeaveBalance.findOne({ employeeId: emp._id, year: year });

      // अगर डेटाबेस में नहीं है, तो डिफ़ॉल्ट भेजें (लेकिन सेव नहीं करेंगे जब तक अपडेट न हो)
      if (!balance) {
        return {
          employeeId: emp._id,
          name: emp.name,
          empId: emp.employeeId,
          image: emp.image,
          year: year,
          leaves: [
            { type: "Annual Leave", total: 23, used: 0, available: 23 },
            { type: "Sick Leave", total: 10, used: 0, available: 10 },
            { type: "Emergency Leave", total: 5, used: 0, available: 5 },
            { type: "Compensatory Leave", total: 12, used: 0, available: 12 }
          ]
        };
      }
      
      return {
        ...balance._doc,
        name: emp.name,
        empId: emp.employeeId,
        image: emp.image
      };
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. UPDATE/UPSERT: बैलेंस अपडेट करने के लिए (या नया बनाने के लिए)
router.put("/leave-balances/update", async (req, res) => {
  try {
    const { employeeId, year, leaves } = req.body;

    // Upsert logic: अगर है तो अपडेट करो, नहीं तो बनाओ
    const updatedBalance = await LeaveBalance.findOneAndUpdate(
      { employeeId, year },
      { $set: { leaves } },
      { upsert: true, new: true }
    );

    res.json({ message: "Balance updated successfully", updatedBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. DELETE: बैलेंस रिसेट करने के लिए
router.delete("/leave-balances/reset", async (req, res) => {
  try {
    const { employeeId, year } = req.body;
    await LeaveBalance.findOneAndDelete({ employeeId, year });
    res.json({ message: "Balance reset to default" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;