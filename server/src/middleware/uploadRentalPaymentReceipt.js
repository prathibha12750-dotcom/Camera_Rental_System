const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// ==========================================
// RENTAL PAYMENT RECEIPT DIRECTORY
// ==========================================

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "rental-payment-receipts"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

// ==========================================
// STORAGE
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const uniqueName =
      `rental-payment-${crypto.randomUUID()}${extension}`;

    cb(null, uniqueName);
  },
});

// ==========================================
// ALLOWED FILE TYPES
// ==========================================

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ];

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extension)
  ) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, JPEG, PNG, and PDF payment receipts are allowed."
    )
  );
};

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const uploadRentalPaymentReceipt = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

const fsPromises = require("fs/promises");

const uploadSingleRentalReceipt = (req, res, next) => {
  uploadRentalPaymentReceipt.single("receipt")(
    req,
    res,
    async (error) => {
      if (error && req.file?.path) {
        try {
          await fsPromises.unlink(req.file.path);
        } catch (cleanupError) {
          console.error(
            "Failed to clean up receipt:",
            cleanupError
          );
        }
      }

      next(error);
    }
  );
};

module.exports = uploadSingleRentalReceipt;