require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const citizenRoutes = require("./routes/citizen");
const complaintRoutes = require("./routes/complaints");
const adminRoutes = require("./routes/admin");
const officerRoutes = require("./routes/officer");
const newsRoutes = require("./routes/news");
const iotRoutes = require("./routes/iot");
const notificationRoutes = require("./routes/notifications");
const feedbackRoutes = require("./routes/feedback");
const ensureSchema = require("./utils/schema");
const pool = require("./db");

const app = express();

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// ==================================================
// API ROUTES
// ==================================================

// Authentication
app.use("/api/auth", authRoutes);

// Citizen
app.use("/api/citizen", citizenRoutes);

// Complaints
app.use("/api/complaints", complaintRoutes);

// Admin
app.use("/api/admin", adminRoutes);

// Officer
app.use("/api/officer", officerRoutes);

app.use("/api/news", newsRoutes);
app.use("/api/iot", iotRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feedback", feedbackRoutes);
// ==================================================
// HOME
// ==================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CivicPulseAI Backend is running!",
  });
});

// ==================================================
// DATABASE TEST
// ==================================================

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time"
    );

    res.status(200).json({
      success: true,
      message: "Database connected successfully!",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error(
      "Database connection error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// ==================================================
// 404 HANDLER
// ==================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================

app.use((err, req, res, next) => {
  console.error("Global server error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// ==================================================
// SERVER
// ==================================================

const PORT = process.env.PORT || 5000;

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Officer API: http://localhost:${PORT}/api/officer`);
    });
  })
  .catch((error) => {
    console.error("Database schema initialization failed:", error.message);
    process.exit(1);
  });