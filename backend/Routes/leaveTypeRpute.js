const express = require("express");
const router = express.Router();
const LeaveType = require("../Model/leaveType");

// GET /api/leaves
router.get("/", async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};

        if (search) {
            query.name = { $regex: search.trim(), $options: "i" };
        }
        if (status && status !== "All") {
            query.status = status;
        }

        const leaveTypes = await LeaveType.find(query).sort({ createdAt: -1 });
        
        // Return array cleanly
        return res.status(200).json(leaveTypes || []);
    } catch (error) {
        console.error("GET /api/leaves Error:", error);
        return res.status(500).json({ message: "Error fetching leaves", error: error.message });
    }
});

// POST /api/leaves
router.post("/", async (req, res) => {
    try {
        const leaveType = new LeaveType(req.body);
        const savedType = await leaveType.save();
        return res.status(201).json(savedType);
    } catch (error) {
        return res.status(500).json({ message: "Error creating leave type", error: error.message });
    }
});

// PUT /api/leaves/:id
router.put("/:id", async (req, res) => {
    try {
        const updateType = await LeaveType.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updateType) {
            return res.status(404).json({ message: "Leave type not found" });
        }
        return res.status(200).json(updateType);
    } catch (error) {
        return res.status(500).json({ message: "Error updating leave type", error: error.message });
    }
});

// DELETE /api/leaves/:id
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await LeaveType.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Leave type not found" });
        }
        return res.status(200).json({ message: "Leave Type Deleted Successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting leave type", error: error.message });
    }
});

module.exports = router;