
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

// ============================================================
// PRIVATE RETURN PDF STORAGE
// ============================================================

const STORAGE_ROOT = path.resolve(
  __dirname,
  "../../storage/rental-agreements/returns"
);

const MAX_PDF_SIZE = 10 * 1024 * 1024;

const STORAGE_KEY_PATTERN =
  /^[a-fA-F0-9]{24}-[a-fA-F0-9-]{36}\.pdf$/;

// ============================================================
// SAVE GENERATED RETURN ACKNOWLEDGEMENT PDF
// ============================================================

const saveGeneratedReturnPdf = async ({
  pdfBuffer,
  agreementId,
  uploadedBy,
}) => {
  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new Error("A valid return PDF buffer is required.");
  }

  if (pdfBuffer.length > MAX_PDF_SIZE) {
    throw new Error("Return acknowledgement PDF exceeds 10 MB.");
  }

  if (pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Invalid return PDF file format.");
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

  const filename = `${id}-${crypto.randomUUID()}.pdf`;

  const filePath = path.join(STORAGE_ROOT, filename);

  await fs.mkdir(STORAGE_ROOT, {
    recursive: true,
  });

  await fs.writeFile(filePath, pdfBuffer, {
    flag: "wx",
    mode: 0o600,
  });

  return {
    storageKey: filename,
    originalName: `SCR-Return-Acknowledgement-${id}.pdf`,
    mimeType: "application/pdf",
    sha256,
    uploadedBy: userId,
    uploadedAt: new Date(),
  };
};

// ============================================================
// READ GENERATED RETURN PDF
// ============================================================

const readGeneratedReturnPdf = async (storageKey) => {
  if (
    typeof storageKey !== "string" ||
    !STORAGE_KEY_PATTERN.test(storageKey)
  ) {
    throw new Error("Invalid return PDF storage key.");
  }

  const filePath = path.join(STORAGE_ROOT, storageKey);

  const buffer = await fs.readFile(filePath);

  const sha256 = crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");

  return {
    buffer,
    sha256,
  };
};

// ============================================================
// DELETE GENERATED RETURN PDF
// ============================================================

const deleteGeneratedReturnPdf = async (storageKey) => {
  if (
    typeof storageKey !== "string" ||
    !STORAGE_KEY_PATTERN.test(storageKey)
  ) {
    throw new Error("Invalid return PDF storage key.");
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
  saveGeneratedReturnPdf,
  readGeneratedReturnPdf,
  deleteGeneratedReturnPdf,
};
