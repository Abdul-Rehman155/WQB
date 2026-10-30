const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    // Basic Information
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },

    // Employee Details
    jobTitle: { type: String, required: true },
    department: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    status: { type: String, default: "Active", enum: ["Active", "Inactive"] },
    employeeType: { type: String, required: true },
    officeType: { type: String, required: true },
    circle: { type: String, required: true },
    headOffice: { type: String },
    cuty: { type: String },
    baseSalary: { type: Number, default: 30000 },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    
    // --- File Paths ---
    image: { type: String },
    aadhaarFile: { type: String }, // आधार फाइल का पाथ
    panFile: { type: String },     // पैन फाइल का पाथ
    marksheetFile: { type: String }, // मार्कशीट फाइल का पाथ
    marksheetType: { type: String }, // 10th, 12th, etc.

    // Contact Information
    address: { type: String, required: true },
    emergencyContactName: { type: String, required: true },
    emergencyContactPhone: { type: String, required: true },

    // Banking Information
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },

    // Document Numbers
    aadharNumber: { type: String, required: true },
    panNumber: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee", EmployeeSchema);