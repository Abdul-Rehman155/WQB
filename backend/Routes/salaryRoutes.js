const express = require('express');
const router = express.Router();
const SalaryComponent = require('../Model/salarySchema');

// 1. GET ALL COMPONENTS
router.get('/', async (req, res) => {
    try {
        const components = await SalaryComponent.find().sort({ createdAt: -1 });
        res.json(components);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. ADD NEW COMPONENT
router.post('/', async (req, res) => {
    const component = new SalaryComponent({
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        calculationType: req.body.calculationType,
        value: req.body.value
    });

    try {
        const newComponent = await component.save();
        res.status(201).json(newComponent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// edit route for updating a salary component
router.put("/:id", async (req, res) => {
  try {
    const updatedComponent = await SalaryComponent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // updated data return karega
    );

    if (!updatedComponent) {
      return res.status(404).json({ message: "Salary component not found" });
    }

    res.status(200).json(updatedComponent);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 3. DELETE COMPONENT
router.delete('/:id', async (req, res) => {
    try {
        await SalaryComponent.findByIdAndDelete(req.params.id);
        res.json({ message: "Component Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;