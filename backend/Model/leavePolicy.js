const mongoose = require("mongoose");

const leavePolicySchema = new mongoose.Schema({
  policyName: {
    type: String,
    required: [true, "Policy name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  leaveType: {
    type: String,
    required: [true, "Leave type is required"],
    trim: true,
  },
  annualAccrual: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  carryForwardLimit: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  minDaysPerApplication: {
    type: Number,
    required: true,
    min: 0.5,
    default: 1,
  },
  maxDaysPerApplication: {
    type: Number,
    required: true,
    min: 0.5,
    default: 1,
  },
  requiresApproval: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
}, { timestamps: true });

leavePolicySchema.pre("validate", function () {
  if (this.maxDaysPerApplication < this.minDaysPerApplication) {
    this.invalidate("maxDaysPerApplication", "Maximum days must be greater than or equal to minimum days");
  }
});

module.exports = mongoose.model("LeavePolicy", leavePolicySchema);
