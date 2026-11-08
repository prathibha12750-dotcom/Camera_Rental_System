
const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  console.error(err);

  // ==========================================
  // MULTER FILE UPLOAD ERRORS
  // ==========================================

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File size must not exceed 5 MB.",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field or too many files.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "File upload failed. Please check your file.",
    });
  }

  // ==========================================
  // UNSUPPORTED RECEIPT FILE TYPE
  // ==========================================

  if (
    err.message ===
    "Only JPG, JPEG, PNG, and PDF payment receipts are allowed."
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // ==========================================
  // MONGODB DUPLICATE KEY ERROR
  // ==========================================

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with the provided unique value already exists",
    });
  }

  // ==========================================
  // MONGOOSE VALIDATION ERROR
  // ==========================================

  if (err.name === "ValidationError") {
    const errors = {};

    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // ==========================================
  // OTHER ERRORS
  // ==========================================

  return res.status(err.statusCode || 500).json({
    success: false,
    message:
      err.statusCode && err.statusCode < 500
        ? err.message
        : "Internal server error",
  });
};

module.exports = errorHandler;
