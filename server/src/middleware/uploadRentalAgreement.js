
const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs/promises");
const crypto = require("node:crypto");

// ============================================================
// PRIVATE SIGNED AGREEMENT STORAGE
// ============================================================

const uploadDirectory = path.resolve(
  __dirname,
  "../../storage/rental-agreements/signed"
);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

// ============================================================
// FILE TYPE VALIDATION
// ============================================================

const hasValidSignature = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer)) {
    return false;
  }

  if (mimeType === "application/pdf") {
    return (
      buffer.length >= 5 &&
      buffer.subarray(0, 5).toString("ascii") === "%PDF-"
    );
  }

  if (mimeType === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([
          0x89, 0x50, 0x4e, 0x47,
          0x0d, 0x0a, 0x1a, 0x0a,
        ])
      )
    );
  }

  return false;
};

// ============================================================
// MULTER STORAGE
// ============================================================

// Keep uploads in memory until their file signature is checked.
// Only validated files will be written to private disk storage.

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 5,
    parts: 6,
  },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    ).toLowerCase();

    if (
      !Object.hasOwn(allowedTypes, extension) ||
      allowedTypes[extension] !== file.mimetype
    ) {
      return cb(
        new Error(
          "Only valid PDF, JPG, JPEG and PNG signed agreements are allowed."
        )
      );
    }

    cb(null, true);
  },
}).single("signedDocument");

// ============================================================
// UPLOAD AND VALIDATE SIGNED AGREEMENT
// ============================================================

const uploadRentalAgreement = (req, res, next) => {
  upload(req, res, async (error) => {
    if (error) {
      return res.status(
        error instanceof multer.MulterError ? 400 : 415
      ).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Signed agreement must not exceed 5 MB."
            : error.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A signed agreement file is required.",
      });
    }

    if (
      !hasValidSignature(
        req.file.buffer,
        req.file.mimetype
      )
    ) {
      return res.status(415).json({
        success: false,
        message: "File content does not match an allowed document type.",
      });
    }

    const extension = path.extname(
      req.file.originalname
    ).toLowerCase();

    const filename =
      `${crypto.randomUUID()}${extension}`;

    const filePath = path.join(
      uploadDirectory,
      filename
    );

    try {
      await fs.mkdir(uploadDirectory, {
        recursive: true,
      });

      await fs.writeFile(
        filePath,
        req.file.buffer,
        {
          flag: "wx",
          mode: 0o600,
        }
      );

      const sha256 = crypto
        .createHash("sha256")
        .update(req.file.buffer)
        .digest("hex");

      // Remove the buffer after writing to avoid retaining
      // unnecessary file data in request memory.
      delete req.file.buffer;

      req.signedAgreementFile = {
        storageKey: filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sha256,
        uploadedBy: req.user.userId,
        uploadedAt: new Date(),
        absolutePath: filePath,
      };

      return next();
    } catch (storageError) {
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error(
            "Signed agreement upload cleanup failed:",
            cleanupError
          );
        }
      }

      return next(storageError);
    }
  });
};

module.exports = uploadRentalAgreement;
