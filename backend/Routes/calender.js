const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// MongoDB Event Schema & Model inside the routes or standard model folder
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employeeName: { type: String },
  employeeCode: { type: String },
  branch: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  category: { type: String, enum: ['Meeting', 'Holiday', 'Leave', 'Event'], default: 'Event' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  days: { type: Number, default: 1 }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

// A. Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: "Events fetch karne me error aaya", error: err.message });
  }
});

// B. Create a new event
router.post('/', async (req, res) => {
  try {
    const { title, description, startDate, endDate, allDay, category, days, status } = req.body;

    const normalizedStartDate = startDate ? new Date(startDate) : new Date();
    const normalizedEndDate = endDate ? new Date(endDate) : normalizedStartDate;

    const newEvent = new Event({
      title,
      description,
      employeeId: req.body.employeeId || null,
      employeeName: req.body.employeeName || '',
      employeeCode: req.body.employeeCode || '',
      branch: req.body.branch || '',
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      allDay: Boolean(allDay),
      category: category || 'Event',
      status: status || 'Pending',
      days: Number(days) || 1
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(400).json({ message: "Event create nahi ho paya", error: err.message });
  }
});

// C. Update an event
router.put('/:id', async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updatedEvent) return res.status(404).json({ message: "Event nahi mila" });
    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(400).json({ message: "Update karne me error aaya", error: err.message });
  }
});

// D. Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ message: "Event nahi mila" });
    res.status(200).json({ message: "Event successfully delete ho gaya" });
  } catch (err) {
    res.status(500).json({ message: "Delete karne me error aaya", error: err.message });
  }
});

module.exports = router;