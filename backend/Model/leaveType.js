const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Leave type name is required'],
        trim: true,
        unique: true // Unique rakna achha hai taaki same naam ke 2 leave type na bane
    },
    description: {
        type: String,
        trim: true,
    },
    maxDays: {
        type: Number,
        required: [true, "Maximum days is required"],
        default: 0,
    },
    color: {
        type: String,
        default: "#3B82F6", // Default blue rakha hai jo modern dikhta hai
    },
    isPaid: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        // Frontend mein 'Active'/'Inactive' hai, isliye yahan bhi wahi rakhein
        enum: ["Active", "Inactive"], 
        default: "Active",
    }
}, { timestamps: true });

module.exports = mongoose.model('LeaveType', leaveTypeSchema);