const express = require('express');
const router = express.Router();
const Department = require('../Model/departmenSchema');

// GET all departments
router.get('/', async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json(departments);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST new department
router.post('/', async (req, res) => {
    try {
        const newDept = new Department({ name: req.body.name });
        await newDept.save();
        res.status(201).json(newDept);
    } catch (err) { res.status(400).json({ message: "Exists already" }); }
});

// DELETE department
router.delete('/:id', async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;