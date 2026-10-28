
const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  submitContactInquiry,
} = require("../controllers/contactController");

const router = express.Router();

// ==========================================
// CONTACT FORM RATE LIMITER
// ==========================================

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many contact requests. Please try again in 15 minutes.",
  },
});

// ==========================================
// PUBLIC CONTACT ROUTE
// POST /api/contact
// ==========================================

router.post(
  "/",
  contactLimiter,
  express.json({ limit: "20kb" }),
  submitContactInquiry
);

module.exports = router;
