
const path = require("node:path");
const fs = require("node:fs/promises");
const crypto = require("node:crypto");

// ============================================================
// PRIVATE SIGNED AGREEMENT DIRECTORY
// ============================================================

const signedDirectory = path.resolve(
  __dirname,
  "../../storage/rental-agreements/signed"
);

// Matches the filenames created by uploadRentalAgreement.js
const STORAGE_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|jpeg|png)$/i;

// ============================================================
// VALIDATE STORAGE KEY
// ============================================================

const resolveSignedDocumentPath = (storageKey) => {
  if (
    typeof storageKey !== "string" ||
    !STORAGE_KEY_PATTERN.test(storageKey)
  ) {
    const error = new Error(
      "Invalid signed agreement storage key."
    );
    error.statusCode = 400;
    throw error;
  }

  return path.join(signedDirectory, storageKey);
};

// ============================================================
// READ AND VERIFY SIGNED DOCUMENT
// ============================================================

const verifySignedAgreementDocument = async (
  documentMetadata
) => {
  if (
    !documentMetadata?.storageKey ||
    !documentMetadata?.sha256
  ) {
    const error = new Error(
      "Signed agreement document metadata is incomplete."
    );
    error.statusCode = 409;
    throw error;
  }

  const filePath = resolveSignedDocumentPath(
    documentMetadata.storageKey
  );

  let fileBuffer;

  try {
    fileBuffer = await fs.readFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      const notFoundError = new Error(
        "Signed agreement document was not found in private storage."
      );
      notFoundError.statusCode = 409;
      throw notFoundError;
    }

    throw error;
  }

  const calculatedHash = crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex");

  const expectedHash = documentMetadata.sha256;

  if (
    !/^[a-f0-9]{64}$/i.test(expectedHash) ||
    calculatedHash.toLowerCase() !==
      expectedHash.toLowerCase()
  ) {
    const error = new Error(
      "Signed agreement document integrity verification failed."
    );
    error.statusCode = 409;
    throw error;
  }

  return {
    verified: true,
    sha256: calculatedHash,
    size: fileBuffer.length,
  };
};

 // ============================================================
 // READ VERIFIED SIGNED AGREEMENT DOCUMENT
 // HANDOVER / RETURN
 // ============================================================

const readSignedAgreementDocument = async (documentMetadata) => {
  // Reuse the existing integrity verification.
  await verifySignedAgreementDocument(documentMetadata);

  const filePath = resolveSignedDocumentPath(
    documentMetadata.storageKey
  );

  const buffer = await fs.readFile(filePath);

  // Verify the exact bytes that will be returned.
  const actualHash = crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");

  if (
    actualHash.toLowerCase() !==
    documentMetadata.sha256.toLowerCase()
  ) {
    const error = new Error(
      "Signed agreement document integrity verification failed."
    );
    error.statusCode = 409;
    throw error;
  }

  return {
    buffer,
    mimeType: documentMetadata.mimeType,
    originalName: documentMetadata.originalName,
    sha256: actualHash,
  };
};

module.exports = {
  resolveSignedDocumentPath,
  verifySignedAgreementDocument,
  readSignedAgreementDocument,
};
