const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

// SECURITY MIDDLEWARE

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5174",
    credentials: true,
  })
);


// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json());


// ==========================================
// RATE LIMITING
// ==========================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many authentication requests. Please try again later.",
  },
});


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Camera Rental API is running",
  });
});


// ==========================================
// ROUTES
// ==========================================

app.use("/api/auth", authLimiter, authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/customer", customerRoutes);


// ==========================================
// ERROR HANDLER
// ==========================================

app.use(errorHandler);


module.exports = app;