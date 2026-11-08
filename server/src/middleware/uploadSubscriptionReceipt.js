const multer = require("multer");
const path = require("path");
const fs = require("fs");


// ==========================================
// RECEIPT UPLOAD DIRECTORY
// ==========================================

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "subscription-receipts"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}


// ==========================================
// STORAGE
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension =
      path.extname(file.originalname).toLowerCase();

    const uniqueName =
      `receipt-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

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

  const extension =
    path.extname(file.originalname).toLowerCase();

  const validMimeType =
    allowedMimeTypes.includes(file.mimetype);

  const validExtension =
    allowedExtensions.includes(extension);

  if (validMimeType && validExtension) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, JPEG, PNG, and PDF payment receipts are allowed."
    ),
    false
  );
};


// ==========================================
// MULTER CONFIGURATION
// ==========================================

const uploadSubscriptionReceipt =
  multer({
    storage,
    fileFilter,

    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });


module.exports = uploadSubscriptionReceipt;