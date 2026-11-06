const express = require("express");
const LeavePolicy = require("../Model/leavePolicy");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, status, leaveType } = req.query;
    const query = {};

    if (search) query.policyName = { $regex: search.trim(), $options: "i" };
    if (status && status !== "All") query.status = status;
    if (leaveType && leaveType !== "All") query.leaveType = leaveType;

    const policies = await LeavePolicy.find(query).sort({ createdAt: -1 });
    res.json(policies);
  } catch (error) {
    console.error("GET /api/leave-policies error:", error);
    res.status(500).json({ message: "Error fetching leave policies", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const policy = await LeavePolicy.create(req.body);
    res.status(201).json(policy);
  } catch (error) {
    console.error("POST /api/leave-policies error:", error);
    res.status(400).json({ message: "Error creating leave policy", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const policy = await LeavePolicy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!policy) return res.status(404).json({ message: "Leave policy not found" });
    res.json(policy);
  } catch (error) {
    console.error("PUT /api/leave-policies/:id error:", error);
    res.status(400).json({ message: "Error updating leave policy", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const policy = await LeavePolicy.findByIdAndDelete(req.params.id);
    if (!policy) return res.status(404).json({ message: "Leave policy not found" });
    res.json({ message: "Leave policy deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting leave policy", error: error.message });
  }
});

module.exports = router;
