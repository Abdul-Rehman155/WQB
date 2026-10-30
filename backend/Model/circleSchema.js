const mongoose = require('mongoose');

const CircleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true } // Example: "Fatehabad"
});

module.exports = mongoose.model('Circle', CircleSchema);