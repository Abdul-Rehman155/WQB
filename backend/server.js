require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const calendarRoutes = require("./Routes/calender");
const employee = require("./Routes/employeeRoute");
const dashboard = require("./Routes/dashboardRoute");
const attendanceRoutes = require("./Routes/attendenceRoute");
const categoriesRoute = require("./Routes/categoriesRoute");
const departmenRoute = require("./Routes/departmentRoute");
const employeeType = require("./Routes/employeeTypeRoute");
const officeType = require("./Routes/officeTypeRoute");
const headeOffice = require("./Routes/circleRoute");
const payrollSchema = require("./Routes/payrolleRoute");
const salaryRoute= require("./Routes/salaryRoutes");
const authRoute = require("./Routes/authRoute");
const leaveTypeRoute = require("./Routes/leaveTypeRpute");
const leavePolicyRoute = require("./Routes/leavePolicyRoute");
const app = express();
const path = require("path");

// --- CORS Configuration ---
// Allow local dev ports (5173 and 5174) and an optional CLIENT_URL from env
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }),
);

// Body parser middleware
app.use(express.json());

// --- Database Connection ---
const mongoUri = process.env.MONGODB_URI;

if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("MongoDB successfully connected! 🚀"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
  console.warn("MONGODB_URI not set. Running without database connection for local development.");
}

// --- API Router Mounting ---
app.use("/api/events", calendarRoutes);
app.use("/api/employees", employee);
app.use("/api/employee", employee);
app.use("/api", attendanceRoutes);
app.use("/api", dashboard);
app.use("/api/categories", categoriesRoute);
app.use("/api/departments", departmenRoute);
app.use("/api/employee-types", employeeType);
app.use("/api/office-types", officeType);
app.use("/api", headeOffice);
app.use("/api", payrollSchema);
app.use("/api/auth", authRoute);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/salary-components", salaryRoute);
app.use("/api/leave-types", leaveTypeRoute);
app.use("/api/leaves", leaveTypeRoute);
app.use("/api/leave-policies", leavePolicyRoute);

// Home Route
app.get("/", (req, res) => {
  res.send("Welcome to the Home Route!");
});

// Start listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running smoothly on port ${PORT}`);
});
