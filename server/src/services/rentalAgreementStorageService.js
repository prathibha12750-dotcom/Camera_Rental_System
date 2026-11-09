
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

// ============================================================
// PRIVATE STORAGE CONFIGURATION
// ============================================================

// Resolves to:
// server/storage/rental-agreements/generated
const STORAGE_ROOT = path.resolve(
  __dirname,
  "../../storage/rental-agreements/generated"
);

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB

// ============================================================
// SAVE GENERATED RENTAL AGREEMENT PDF
// ============================================================

const saveGeneratedAgreementPdf = async ({
  pdfBuffer,
  agreementId,
  uploadedBy,
}) => {
  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new Error("A valid PDF buffer is required.");
  }

  if (pdfBuffer.length > MAX_PDF_SIZE) {
    throw new Error("Rental agreement PDF exceeds 10 MB.");
  }

  if (pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Invalid PDF file format.");
  }

  const id = String(agreementId ?? "");
  const userId = String(uploadedBy ?? "");

  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new Error("Invalid agreement ID.");
  }

  if (!/^[a-fA-F0-9]{24}$/.test(userId)) {
    throw new Error("Invalid staff user ID.");
  }

  const sha256 = crypto
    .createHash("sha256")
    .update(pdfBuffer)
    .digest("hex");

  const randomId = crypto.randomUUID();

  const filename = `${id}-${randomId}.pdf`;

  // The storage key is relative to the private storage root.
  const storageKey = filename;

  const filePath = path.join(STORAGE_ROOT, filename);

  await fs.mkdir(STORAGE_ROOT, {
    recursive: true,
  });

  // wx prevents overwriting an existing file.
  await fs.writeFile(filePath, pdfBuffer, {
    flag: "wx",
    mode: 0o600,
  });

  return {
    storageKey,
    originalName: `SCR-Rental-Agreement-${id}.pdf`,
    mimeType: "application/pdf",
    sha256,
    uploadedBy: userId,
    uploadedAt: new Date(),
  };
};

// ============================================================
// READ GENERATED PDF
// ============================================================

const readGeneratedAgreementPdf = async (storageKey) => {
  if (
    typeof storageKey !== "string" ||
    !/^[a-fA-F0-9]{24}-[a-fA-F0-9-]{36}\.pdf$/.test(storageKey)
  ) {
    throw new Error("Invalid PDF storage key.");
  }

  const filePath = path.join(STORAGE_ROOT, storageKey);

  const buffer = await fs.readFile(filePath);

  const actualHash = crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");

  return {
    buffer,
    sha256: actualHash,
  };
};

// ============================================================
// DELETE GENERATED PDF
// ============================================================

const deleteGeneratedAgreementPdf = async (storageKey) => {
  if (
    typeof storageKey !== "string" ||
    !/^[a-fA-F0-9]{24}-[a-fA-F0-9-]{36}\.pdf$/.test(storageKey)
  ) {
    throw new Error("Invalid PDF storage key.");
  }

  const filePath = path.join(STORAGE_ROOT, storageKey);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

module.exports = {
  saveGeneratedAgreementPdf,
  readGeneratedAgreementPdf,
  deleteGeneratedAgreementPdf,
};
