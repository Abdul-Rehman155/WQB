const express = require('express');
const router = express.Router();
const Circle = require('../Model/circleSchema');

// 1. Saare circles (districts) get karne ke liye
router.get('/circle-types', async (req, res) => {
  try {
    const data = await Circle.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Naya circle add karne ke liye (Admin ke liye)
router.post('/circle-types', async (req, res) => {
  try {
    const newCircle = new Circle({ name: req.body.name });
    await newCircle.save();
    res.status(201).json(newCircle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. Delete karne ke liye
router.delete('/circle-types/:id', async (req, res) => {
  try {
    await Circle.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;