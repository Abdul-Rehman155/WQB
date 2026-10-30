const mongoose = require('mongoose');

const StatItemSchema = new mongoose.Schema({
  value: { type: String, default: "0" },
  subtext: { type: String, default: "" }
});

const DashboardSchema = new mongoose.Schema({
  totalEmployees: { type: StatItemSchema, default: () => ({ value: "150", subtext: "+12% this month" }) },
  branches: { type: StatItemSchema, default: () => ({ value: "4", subtext: "Across 3 cities" }) },
  attendanceRate: { type: StatItemSchema, default: () => ({ value: "94%", subtext: "Average this week" }) },
  pendingLeaves: { type: StatItemSchema, default: () => ({ value: "8", subtext: "" }) },
  activeJobs: { type: StatItemSchema, default: () => ({ value: "6", subtext: "" }) },
  totalCandidates: { type: StatItemSchema, default: () => ({ value: "42", subtext: "" }) },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DashboardStats', DashboardSchema);