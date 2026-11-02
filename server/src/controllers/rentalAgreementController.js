const mongoose = require("mongoose");

const Rental = require("../models/Rental");
const RentalAgreement = require("../models/RentalAgreement");
const fs = require("node:fs/promises");

const {
  generateRentalAgreementPdf,
} = require("../services/rentalAgreementPdfService");

// ============================================================
// RETURN ACKNOWLEDGEMENT PDF GENERATION
// ============================================================

const {
  generateRentalReturnPdf,
} = require("../services/rentalReturnPdfService");

const {
  saveGeneratedReturnPdf,
  readGeneratedReturnPdf,
  deleteGeneratedReturnPdf,
} = require("../services/rentalReturnPdfStorageService");

const {
  saveGeneratedAgreementPdf,
  readGeneratedAgreementPdf,
  deleteGeneratedAgreementPdf,
} = require("../services/rentalAgreementStorageService");

const {
  verifySignedAgreementDocument,
  readSignedAgreementDocument,
} = require("../services/rentalAgreementSignedStorageService");

// ============================================================
// SHARED ERROR HANDLER
// ============================================================

const handleAgreementError = (error, res, next) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid reference ID",
    });
  }

  if (
    error.code === 112 ||
    error.codeName === "WriteConflict" ||
    error.hasErrorLabel?.("TransientTransactionError")
  ) {
    return res.status(409).json({
      success: false,
      message: "Agreement was modified concurrently. Please refresh and retry.",
    });
  }

  return next(error);
};

// ============================================================
// SAVE HANDOVER INSPECTION - STAFF ADMIN
// ============================================================

const saveHandoverInspection = async (req, res, next) => {
  try {
    if (!["CLERK", "STAFF_ADMIN"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Only clerks and staff administrators can perform this action",
      });
    }

    const { rentalId } = req.params;

    if (!mongoose.isValidObjectId(rentalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID",
      });
    }

    const {
      condition,
      accessories,
      damageDescription,
      notes,
      specialNotes,
    } = req.body ?? {};

    const allowedConditions = [
      "EXCELLENT",
      "GOOD",
      "FAIR",
      "DAMAGED",
    ];

    if (!allowedConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment condition.",
      });
    }

    if (!Array.isArray(accessories) || accessories.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Accessories must be an array containing at most 30 items.",
      });
    }

    const cleanAccessories = [];
    const accessoryNames = new Set();

    for (const accessory of accessories) {
      if (
        !accessory ||
        typeof accessory !== "object" ||
        Array.isArray(accessory) ||
        typeof accessory.name !== "string" ||
        !accessory.name.trim() ||
        accessory.name.trim().length > 150 ||
        !Number.isSafeInteger(accessory.quantity) ||
        accessory.quantity < 1 ||
        (
        accessory.condition !== undefined &&
        accessory.condition !== null &&
        accessory.condition !== "" &&
        !allowedConditions.includes(accessory.condition)
        ) ||
        typeof (accessory.notes ?? "") !== "string" ||
        (accessory.notes ?? "").trim().length > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid accessory details.",
        });
      }

      // ====================================================
      // PREVENT DUPLICATE ACCESSORY NAMES
      // ====================================================

      const cleanedName = accessory.name.trim();

      // Ignore case and repeated spaces when comparing names.
      const normalizedName = cleanedName
        .replace(/\s+/g, " ")
        .toLowerCase();

      if (accessoryNames.has(normalizedName)) {
        return res.status(400).json({
          success: false,
          message:
            `Duplicate accessory "${cleanedName}" detected. ` +
            "Each accessory name must be unique. " +
            "Combine identical accessories into one entry " +
            "with the correct quantity.",
        });
      }

      accessoryNames.add(normalizedName);

      // ====================================================
      // SAVE VALIDATED ACCESSORY
      // ====================================================

      cleanAccessories.push({
        name: cleanedName,
        quantity: accessory.quantity,
        condition:
          accessory.condition === undefined ||
          accessory.condition === null ||
          accessory.condition === ""
            ? null
            : accessory.condition,
        notes: (accessory.notes ?? "").trim(),
      });
    }

    const validateText = (value, maxLength) =>
      typeof value === "string" &&
      value.trim().length <= maxLength;

    if (
      !validateText(damageDescription ?? "", 2000) ||
      !validateText(notes ?? "", 2000) ||
      !validateText(specialNotes ?? "", 2000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection notes or text length.",
      });
    }

    const cleanDamageDescription = (damageDescription ?? "").trim();
    const cleanNotes = (notes ?? "").trim();
    const cleanSpecialNotes = (specialNotes ?? "").trim();

    if (condition === "DAMAGED" && !cleanDamageDescription) {
      return res.status(400).json({
        success: false,
        message: "Describe existing damage when the equipment condition is DAMAGED.",
      });
    }

    const session = await mongoose.startSession();

    let result;

    try {
      result = await session.withTransaction(async () => {
        const rental = await Rental.findById(rentalId).session(session);

        if (!rental) {
          const error = new Error("Rental not found");
          error.statusCode = 404;
          throw error;
        }

        if (rental.status !== "CONFIRMED") {
          const error = new Error(
            "Handover inspection is only allowed for confirmed rentals."
          );
          error.statusCode = 409;
          throw error;
        }

        const agreement = await RentalAgreement.findOne({
          rental: rental._id,
        }).session(session);

        if (!agreement) {
          const error = new Error("Rental agreement not found");
          error.statusCode = 404;
          throw error;
        }

        if (agreement.status !== "DRAFT") {
          const error = new Error(
            "This agreement has already been generated or signed."
          );
          error.statusCode = 409;
          throw error;
        }

        const inspection = {
          condition,
          accessories: cleanAccessories,
          damageDescription: cleanDamageDescription,
          notes: cleanNotes,
          inspectedBy: req.user.userId,
          inspectedAt: new Date(),
        };

        const updatedAgreement =
          await RentalAgreement.findOneAndUpdate(
            {
              _id: agreement._id,
              status: "DRAFT",
              __v: agreement.__v,
              generatedAt: null,
              generatedPdf: null,
            },
            {
              $set: {
                handoverInspection: inspection,
                specialNotes: cleanSpecialNotes,
              },
              $inc: { __v: 1 },
            },
            {
              new: true,
              runValidators: true,
              session,
            }
          );

        if (!updatedAgreement) {
          const error = new Error(
            "Agreement changed. Refresh and try again."
          );
          error.statusCode = 409;
          throw error;
        }

        return updatedAgreement;
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      success: true,
      message: "Handover inspection saved successfully.",
      data: {
        agreement: result,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return handleAgreementError(error, res, next);
  }
};

const generateAgreement = async (req, res, next) => {
  let storageKey = null;

  try {
    if (!["CLERK", "STAFF_ADMIN"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Only clerks and staff administrators can perform this action",
      });
    }

    const { rentalId } = req.params;

    if (!mongoose.isValidObjectId(rentalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID.",
      });
    }

    const rental = await Rental.findById(rentalId);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found.",
      });
    }

    if (rental.status !== "CONFIRMED") {
      return res.status(409).json({
        success: false,
        message: "Only confirmed rentals can have their agreement generated.",
      });
    }

    const agreement = await RentalAgreement.findOne({
      rental: rentalId,
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Rental agreement not found.",
      });
    }

    if (agreement.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "This agreement has already been generated or signed.",
      });
    }

    if (
      !agreement.handoverInspection?.condition ||
      !agreement.handoverInspection?.inspectedAt
    ) {
      return res.status(409).json({
        success: false,
        message: "Complete the handover inspection before generating the agreement.",
      });
    }

    // Preserve the exact version used to generate the PDF.
    const expectedVersion = agreement.__v;

    // The existing PDF service generates a two-page PDF Buffer.
    const pdfBuffer = await generateRentalAgreementPdf(
      agreement.toObject()
    );

    const metadata = await saveGeneratedAgreementPdf({
      pdfBuffer,
      agreementId: agreement._id,
      uploadedBy: req.user.userId,
    });

    storageKey = metadata.storageKey;

    // Atomic conditional update prevents overwriting a changed agreement.
    const updatedAgreement =
      await RentalAgreement.findOneAndUpdate(
        {
          _id: agreement._id,
          status: "DRAFT",
          __v: expectedVersion,
          generatedAt: null,
          generatedPdf: null,
        },
        {
          $set: {
            status: "GENERATED",
            generatedAt: new Date(),
            generatedBy: req.user.userId,
            generatedPdf: metadata,
          },
          $inc: {
            __v: 1,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedAgreement) {
      await deleteGeneratedAgreementPdf(storageKey);
      storageKey = null;

      return res.status(409).json({
        success: false,
        message: "Agreement changed during PDF generation. Please retry.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rental agreement PDF generated successfully.",
      data: {
        agreementId: updatedAgreement._id,
        agreementNumber: updatedAgreement.agreementNumber,
        status: updatedAgreement.status,
        generatedAt: updatedAgreement.generatedAt,
        generatedPdf: updatedAgreement.generatedPdf,
      },
    });
  } catch (error) {
    // Remove a file if generation failed before the DB update.
    if (storageKey) {
      try {
        await deleteGeneratedAgreementPdf(storageKey);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up generated agreement PDF:",
          cleanupError
        );
      }
    }

    if (
      error.message?.includes("page space") ||
      error.message?.includes("content is too long") ||
      error.message?.includes("pages instead of") ||
      error.message?.includes("exceed available PDF space") ||
      error.message?.includes("available limit")
    ) {
      return res.status(422).json({
        success: false,
        message:
          "Agreement content does not fit the two-page PDF layout. Review the inspection details before generating.",
      });
    }

    return handleAgreementError(error, res, next);
  }
};

 // ============================================================
 // DOWNLOAD GENERATED HANDOVER AGREEMENT PDF
 // CLERK / STAFF ADMIN
 // ============================================================

const downloadGeneratedHandoverAgreement = async (req, res, next) => {
  try {
    const { rentalId } = req.params;

    if (!mongoose.isValidObjectId(rentalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID.",
      });
    }

    const agreement = await RentalAgreement.findOne({
      rental: rentalId,
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Rental agreement not found.",
      });
    }

    const generatedPdf = agreement.generatedPdf;

    if (!generatedPdf?.storageKey || !generatedPdf?.sha256) {
      return res.status(404).json({
        success: false,
        message: "Generated handover agreement PDF is not available.",
      });
    }

    const { buffer, sha256 } = await readGeneratedAgreementPdf(
      generatedPdf.storageKey
    );

    if (
      sha256.toLowerCase() !==
      generatedPdf.sha256.toLowerCase()
    ) {
      return res.status(409).json({
        success: false,
        message: "Handover agreement PDF failed integrity verification.",
      });
    }

    const filename = `SCR-Handover-Agreement-${agreement._id}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });

    return res.status(200).send(buffer);
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "Stored handover agreement PDF was not found.",
      });
    }

    return handleAgreementError(error, res, next);
  }
};

const uploadSignedHandover = async (req, res, next) => {
  const uploadedFile = req.signedAgreementFile;

  const cleanupUpload = async () => {
    if (!uploadedFile?.absolutePath) return;

    try {
      await fs.unlink(uploadedFile.absolutePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(
          "Failed to clean up signed handover document:",
          error
        );
      }
    }
  };

  const rejectUpload = async (status, message) => {
    await cleanupUpload();

    return res.status(status).json({
      success: false,
      message,
    });
  };

  try {
    if (!["CLERK", "STAFF_ADMIN"].includes(req.user?.role)) {
    return rejectUpload(
        403,
        "Only clerks and staff administrators can upload signed handover documents."
    );
    }

    const { rentalId } = req.params;

    if (!mongoose.isValidObjectId(rentalId)) {
      return rejectUpload(400, "Invalid rental ID.");
    }

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "Signed handover document is required.",
      });
    }

    const rental = await Rental.findById(rentalId);

    if (!rental) {
      return rejectUpload(404, "Rental not found.");
    }

    if (rental.status !== "CONFIRMED") {
      return rejectUpload(
        409,
        "Signed handover upload is only allowed for confirmed rentals."
      );
    }

    const agreement = await RentalAgreement.findOne({
      rental: rentalId,
    });

    if (!agreement) {
      return rejectUpload(404, "Rental agreement not found.");
    }

    if (
      agreement.status !== "GENERATED" ||
      !agreement.generatedPdf ||
      !agreement.generatedAt
    ) {
      return rejectUpload(
        409,
        "Generate the rental agreement before uploading its signed handover document."
      );
    }

    if (agreement.signedHandoverDocument) {
      return rejectUpload(
        409,
        "A signed handover document has already been uploaded."
      );
    }

    // Store only the metadata fields defined by the schema.
    // The absolute filesystem path must never be stored in MongoDB.
    const documentMetadata = {
      storageKey: uploadedFile.storageKey,
      originalName: uploadedFile.originalName,
      mimeType: uploadedFile.mimeType,
      sha256: uploadedFile.sha256,
      uploadedBy: uploadedFile.uploadedBy,
      uploadedAt: uploadedFile.uploadedAt,
    };

    // Atomic update prevents two simultaneous uploads
    // from replacing each other's document metadata.
    const updatedAgreement =
      await RentalAgreement.findOneAndUpdate(
        {
          _id: agreement._id,
          status: "GENERATED",
          signedHandoverDocument: null,
          handoverVerifiedAt: null,
          __v: agreement.__v,
        },
        {
          $set: {
            signedHandoverDocument: documentMetadata,
          },
          $inc: {
            __v: 1,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedAgreement) {
      return rejectUpload(
        409,
        "Agreement changed during upload. Refresh and try again."
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Signed handover document uploaded successfully. Staff verification is still required.",
      data: {
        agreementId: updatedAgreement._id,
        agreementNumber: updatedAgreement.agreementNumber,
        status: updatedAgreement.status,
        signedHandoverDocument:
          updatedAgreement.signedHandoverDocument,
        handoverVerifiedAt:
          updatedAgreement.handoverVerifiedAt,
      },
    });
  } catch (error) {
    await cleanupUpload();
    return handleAgreementError(error, res, next);
  }
};

 // ============================================================
 // DOWNLOAD SIGNED HANDOVER DOCUMENT
 // CLERK / STAFF ADMIN
 // ============================================================

const downloadSignedHandover = async (req, res, next) => {
  try {
    const { rentalId } = req.params;

    if (!mongoose.isValidObjectId(rentalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID.",
      });
    }

    const agreement = await RentalAgreement.findOne({
      rental: rentalId,
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Rental agreement not found.",
      });
    }

    const documentMetadata = agreement.signedHandoverDocument;

    if (!documentMetadata?.storageKey) {
      return res.status(404).json({
        success: false,
        message: "Signed handover document is not available.",
      });
    }

    const { buffer } = await readSignedAgreementDocument(
      documentMetadata
    );

    const allowedMimeTypes = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
    };

    const mimeType = documentMetadata.mimeType;
    const extension = allowedMimeTypes[mimeType];

    if (!extension) {
      return res.status(409).json({
        success: false,
        message: "Unsupported signed handover document type.",
      });
    }

    const filename =
      `SCR-Signed-Handover-${agreement._id}.${extension}`;

    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });

    return res.status(200).send(buffer);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return handleAgreementError(error, res, next);
  }
};

const verifySignedHandover = async (req, res, next) => {
  try {
    const { rentalId } = req.params;

    // ========================================================
    // REQUIRE EXPLICIT STAFF REVIEW CONFIRMATION
    // ========================================================

    if (req.body?.confirmReviewed !== true) {
    return res.status(400).json({
        success: false,
        message:
        "Staff must confirm that the signed handover document has been reviewed.",
    });
    }

    // ========================================================
    // ROLE VALIDATION
    // ========================================================

    if (
      !["CLERK", "STAFF_ADMIN"].includes(req.user?.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only clerks and staff administrators can verify signed handover documents.",
      });
    }

    // ========================================================
    // RENTAL VALIDATION
    // ========================================================

    if (!mongoose.isValidObjectId(rentalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID.",
      });
    }

    const rental = await Rental.findById(rentalId);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found.",
      });
    }

    if (rental.status !== "CONFIRMED") {
      return res.status(409).json({
        success: false,
        message:
          "Handover verification is only allowed for confirmed rentals.",
      });
    }

    // ========================================================
    // AGREEMENT VALIDATION
    // ========================================================

    const agreement = await RentalAgreement.findOne({
      rental: rentalId,
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Rental agreement not found.",
      });
    }

    if (agreement.status !== "GENERATED") {
      return res.status(409).json({
        success: false,
        message:
          "Only generated agreements can undergo handover verification.",
      });
    }

    if (!agreement.generatedPdf) {
      return res.status(409).json({
        success: false,
        message:
          "The generated rental agreement PDF is missing.",
      });
    }

    if (!agreement.signedHandoverDocument) {
      return res.status(409).json({
        success: false,
        message:
          "Upload the signed handover document before verification.",
      });
    }

    if (
      agreement.handoverVerifiedAt ||
      agreement.handoverVerifiedBy
    ) {
      return res.status(409).json({
        success: false,
        message:
          "The signed handover document has already been verified.",
      });
    }

    // ========================================================
    // DOCUMENT INTEGRITY VERIFICATION
    // ========================================================

    await verifySignedAgreementDocument(
      agreement.signedHandoverDocument
    );

    // ========================================================
    // ATOMIC STATUS UPDATE
    // ========================================================

    const verifiedAt = new Date();

    const updatedAgreement =
      await RentalAgreement.findOneAndUpdate(
        {
          _id: agreement._id,
          status: "GENERATED",
          signedHandoverDocument: { $ne: null },
          handoverVerifiedAt: null,
          handoverVerifiedBy: null,
          __v: agreement.__v,
        },
        {
          $set: {
            status: "HANDOVER_SIGNED",
            handoverVerifiedAt: verifiedAt,
            handoverVerifiedBy: req.user.userId,
          },
          $inc: {
            __v: 1,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedAgreement) {
      return res.status(409).json({
        success: false,
        message:
          "Agreement changed during verification. Refresh and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Signed handover document verified successfully.",
      data: {
        agreementId: updatedAgreement._id,
        agreementNumber:
          updatedAgreement.agreementNumber,
        status: updatedAgreement.status,
        handoverVerifiedAt:
          updatedAgreement.handoverVerifiedAt,
        handoverVerifiedBy:
          updatedAgreement.handoverVerifiedBy,
      },
    });
  } catch (error) {
    return handleAgreementError(error, res, next);
  }
};

const uploadSignedReturn = async (req, res, next) => {
  const uploadedFile = req.signedAgreementFile;

  const cleanupUpload = async () => {
    if (!uploadedFile?.absolutePath) return;

    try {
      await fs.unlink(uploadedFile.absolutePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(
          "Failed to clean up signed return document:",
          error
        );
      }
    }
  };

  const rejectUpload = async (status, message) => {
    await cleanupUpload();

    return res.status(status).json({
      success: false,
      message,
    });
  };

  try {
    // ========================================================
    // AUTHORIZATION
    // ========================================================

    if (
      !["CLERK", "STAFF_ADMIN"].includes(req.user?.role)
    ) {
      return rejectUpload(
        403,
        "Only clerks and staff administrators can upload signed return documents."
      );
    }

    const { rentalId } = req.params;

    if (!mongoose.isValidObjectId(rentalId)) {
      return rejectUpload(400, "Invalid rental ID.");
    }

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "Signed return document is required.",
      });
    }

    // ========================================================
    // VALIDATE RENTAL
    // ========================================================

    const rental = await Rental.findById(rentalId);

    if (!rental) {
      return rejectUpload(404, "Rental not found.");
    }

    if (rental.status !== "RETURNED") {
      return rejectUpload(
        409,
        "Signed return documents can only be uploaded after equipment has been returned."
      );
    }

    // ========================================================
    // VALIDATE AGREEMENT
    // ========================================================

    const agreement = await RentalAgreement.findOne({
      rental: rentalId,
    });

    if (!agreement) {
      return rejectUpload(404, "Rental agreement not found.");
    }

    if (agreement.status !== "HANDOVER_SIGNED") {
      return rejectUpload(
        409,
        "The rental agreement must have a verified handover before uploading a signed return document."
      );
    }

    if (
    !agreement.signedHandoverDocument?.storageKey ||
    !agreement.handoverVerifiedAt ||
    !agreement.handoverVerifiedBy
    ) {
    return rejectUpload(
        409,
        "The signed handover document must be uploaded " +
        "and verified before uploading the signed return document."
    );
    }

    if (
    !agreement.generatedPdf?.storageKey ||
    !agreement.generatedPdf?.sha256 ||
    !agreement.generatedAt
    ) {
    return rejectUpload(
        409,
        "The original two-page rental agreement must exist " +
        "before uploading the signed return document."
    );
    }

    if (
      !agreement.returnRecord ||
      !agreement.returnInspection?.inspectedAt ||
      !agreement.returnInspection?.inspectedBy
    ) {
      return rejectUpload(
        409,
        "Return inspection must be recorded before uploading the signed return document."
      );
    }

    if (agreement.signedReturnDocument) {
      return rejectUpload(
        409,
        "A signed return document has already been uploaded."
      );
    }
    
    // ========================================================
    // PREVENT REUSING THE SAME SIGNED DOCUMENT
    // ========================================================

    const handoverDocumentHash =
    agreement.signedHandoverDocument?.sha256;

    const returnDocumentHash = uploadedFile.sha256;

    if (!handoverDocumentHash || !returnDocumentHash) {
    return rejectUpload(
        400,
        "Document integrity verification failed. " +
        "Both signed documents must have valid SHA-256 hashes."
    );
    }

    if (
    handoverDocumentHash.toLowerCase() ===
    returnDocumentHash.toLowerCase()
    ) {
    return rejectUpload(
        409,
        "The uploaded return document is identical to the " +
        "signed handover document. Please upload the " +
        "completed two-page agreement containing the " +
        "return inspection details and signatures."
    );
    }
    // ========================================================
    // PREPARE DOCUMENT METADATA
    // ========================================================

    const documentMetadata = {
      storageKey: uploadedFile.storageKey,
      originalName: uploadedFile.originalName,
      mimeType: uploadedFile.mimeType,
      sha256: uploadedFile.sha256,
      uploadedBy: uploadedFile.uploadedBy,
      uploadedAt: uploadedFile.uploadedAt,
    };

    // ========================================================
    // ATOMIC DATABASE UPDATE
    // ========================================================

    const updatedAgreement =
      await RentalAgreement.findOneAndUpdate(
        {
          _id: agreement._id,
          status: "HANDOVER_SIGNED",
          signedReturnDocument: null,
          returnVerifiedAt: null,
          __v: agreement.__v,
        },
        {
          $set: {
            signedReturnDocument: documentMetadata,
          },
          $inc: {
            __v: 1,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedAgreement) {
      return rejectUpload(
        409,
        "Agreement changed during upload. Refresh and try again."
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Signed return document uploaded successfully. Staff verification is still required.",
      data: {
        agreementId: updatedAgreement._id,
        agreementNumber:
          updatedAgreement.agreementNumber,
        status: updatedAgreement.status,
        signedReturnDocument:
          updatedAgreement.signedReturnDocument,
        returnVerifiedAt:
          updatedAgreement.returnVerifiedAt,
      },
    });
  } catch (error) {
    await cleanupUpload();
    return handleAgreementError(error, res, next);
  }
};

 // ============================================================
 // DOWNLOAD SIGNED RETURN ACKNOWLEDGEMENT
 // CLERK / STAFF ADMIN
 // ============================================================

const downloadSignedReturn = async (req, res, next) => {
  try {
    const { rentalId } = req.params;

    // ========================================================
    // VALIDATE RENTAL ID
    // ========================================================

    if (!mongoose.isValidObjectId(rentalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID.",
      });
    }

    // ========================================================
    // FIND AGREEMENT
    // ========================================================

    const agreement = await RentalAgreement.findOne({
      rental: rentalId,
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Rental agreement not found.",
      });
    }

    // ========================================================
    // CHECK SIGNED RETURN DOCUMENT
    // ========================================================

    const documentMetadata = agreement.signedReturnDocument;

    if (!documentMetadata?.storageKey) {
      return res.status(404).json({
        success: false,
        message: "Signed return acknowledgement is not available.",
      });
    }

    // ========================================================
    // VALIDATE DOCUMENT TYPE
    // ========================================================

    const allowedMimeTypes = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
    };

    const mimeType = documentMetadata.mimeType;
    const extension = allowedMimeTypes[mimeType];

    if (!extension) {
      return res.status(409).json({
        success: false,
        message: "Unsupported signed return document type.",
      });
    }

    // ========================================================
    // READ DOCUMENT AND VERIFY SHA-256 INTEGRITY
    // ========================================================

    const { buffer } = await readSignedAgreementDocument(
      documentMetadata
    );

    // ========================================================
    // SEND ORIGINAL DOCUMENT
    // ========================================================

    const filename =
      `SCR-Signed-Return-${agreement._id}.${extension}`;

    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });

    return res.status(200).send(buffer);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return handleAgreementError(error, res, next);
  }
};

const verifySignedReturn = async (req, res, next) => {
  try {
    const { rentalId } = req.params;

    // ========================================================
    // AUTHORIZATION
    // ========================================================

    if (
      !["CLERK", "STAFF_ADMIN"].includes(req.user?.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only clerks and staff administrators can verify signed return documents.",
      });
    }

    if (!mongoose.isValidObjectId(rentalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID.",
      });
    }

    // Require an explicit staff acknowledgement.
    if (req.body?.confirmReviewed !== true) {
      return res.status(400).json({
        success: false,
        message:
          "Staff must confirm that the signed return acknowledgement has been reviewed.",
      });
    }

    // ========================================================
    // VALIDATE RENTAL
    // ========================================================

    const rental = await Rental.findById(rentalId);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found.",
      });
    }

    if (rental.status !== "RETURNED") {
      return res.status(409).json({
        success: false,
        message:
          "Return verification is only allowed after equipment has been returned.",
      });
    }

    // ========================================================
    // VALIDATE AGREEMENT
    // ========================================================

    const agreement = await RentalAgreement.findOne({
      rental: rentalId,
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Rental agreement not found.",
      });
    }

    if (agreement.status !== "HANDOVER_SIGNED") {
      return res.status(409).json({
        success: false,
        message:
          "Only agreements with a verified handover can undergo return verification.",
      });
    }

    if (
    !agreement.generatedPdf?.storageKey ||
    !agreement.generatedPdf?.sha256 ||
    !agreement.generatedAt
    ) {
    return res.status(409).json({
        success: false,
        message:
        "The original two-page rental agreement is missing. " +
        "Return verification cannot continue.",
    });
    }

    if (
    !agreement.signedHandoverDocument?.storageKey ||
    !agreement.handoverVerifiedAt ||
    !agreement.handoverVerifiedBy
    ) {
    return res.status(409).json({
        success: false,
        message:
        "The original handover agreement must be signed " +
        "and verified before return verification.",
    });
    }

    if (
      !agreement.returnRecord ||
      !agreement.returnInspection?.condition ||
      !agreement.returnInspection?.inspectedAt ||
      !agreement.returnInspection?.inspectedBy
    ) {
      return res.status(409).json({
        success: false,
        message:
          "The equipment return inspection is incomplete.",
      });
    }

    if (!agreement.signedReturnDocument) {
      return res.status(409).json({
        success: false,
        message:
          "Upload the signed return acknowledgement before verification.",
      });
    }

    if (
      agreement.returnVerifiedAt ||
      agreement.returnVerifiedBy
    ) {
      return res.status(409).json({
        success: false,
        message:
          "The signed return acknowledgement has already been verified.",
      });
    }

    // ========================================================
    // VERIFY DOCUMENT INTEGRITY
    // ========================================================

    await verifySignedAgreementDocument(
      agreement.signedReturnDocument
    );

    // ========================================================
    // ATOMIC AGREEMENT UPDATE
    // ========================================================

    const verifiedAt = new Date();

    const updatedAgreement =
      await RentalAgreement.findOneAndUpdate(
        {
          _id: agreement._id,
          status: "HANDOVER_SIGNED",
          returnRecord: agreement.returnRecord,
          signedReturnDocument: { $ne: null },
          returnVerifiedAt: null,
          returnVerifiedBy: null,
          __v: agreement.__v,
        },
        {
          $set: {
            status: "RETURN_SIGNED",
            returnVerifiedAt: verifiedAt,
            returnVerifiedBy: req.user.userId,
          },
          $inc: {
            __v: 1,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedAgreement) {
      return res.status(409).json({
        success: false,
        message:
          "Agreement changed during verification. Refresh and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Signed return acknowledgement verified successfully.",
      data: {
        agreementId: updatedAgreement._id,
        agreementNumber:
          updatedAgreement.agreementNumber,
        status: updatedAgreement.status,
        returnVerifiedAt:
          updatedAgreement.returnVerifiedAt,
        returnVerifiedBy:
          updatedAgreement.returnVerifiedBy,
      },
    });
  } catch (error) {
    return handleAgreementError(error, res, next);
  }
};

// ============================================================
// GET RENTAL AGREEMENT DETAILS
// CLERK / STAFF ADMIN
// ============================================================

const getRentalAgreement = async (req, res, next) => {
  try {
    const { rentalId } = req.params;

    if (!mongoose.isValidObjectId(rentalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID.",
      });
    }

    const rental = await Rental.findById(rentalId)
      .select("_id status");

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found.",
      });
    }

    const agreement = await RentalAgreement.findOne({
      rental: rentalId,
    })
      .select(
        "-generatedPdf.storageKey " +
        "-generatedPdf.sha256 " +
        "-signedHandoverDocument.storageKey " +
        "-signedHandoverDocument.sha256 " +
        "-signedReturnDocument.storageKey " +
        "-signedReturnDocument.sha256"
      )
      .lean();

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Rental agreement not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        agreement,
        rentalStatus: rental.status,
      },
    });
  } catch (error) {
    return handleAgreementError(error, res, next);
  }
};


 // ============================================================
 // GENERATE RETURN ACKNOWLEDGEMENT PDF
 // STAFF ADMIN / CLERK
 // ============================================================

const generateReturnAcknowledgement = async (req, res, next) => {
  let savedPdf = null;
  let databaseUpdated = false;

  try {
    const { id } = req.params;

    // Auth middleware stores the user ID in req.user.userId.
    const staffUserId = req.user?.userId;

    if (!mongoose.isValidObjectId(staffUserId)) {
      return res.status(401).json({
        success: false,
        message: "Authenticated staff user ID is invalid.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID.",
      });
    }

    const rental = await Rental.findById(id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found.",
      });
    }

    if (rental.status !== "RETURNED") {
      return res.status(409).json({
        success: false,
        message:
          "Equipment must be returned before generating the return acknowledgement.",
      });
    }

    const agreement = await RentalAgreement.findOne({
      rental: rental._id,
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Rental agreement not found.",
      });
    }

    if (agreement.status !== "HANDOVER_SIGNED") {
      return res.status(409).json({
        success: false,
        message:
          "A verified handover agreement is required.",
      });
    }

    if (
      !agreement.returnRecord ||
      !agreement.returnInspection?.condition ||
      !agreement.returnInspection?.inspectedAt
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Complete the return inspection before generating the acknowledgement.",
      });
    }

    if (agreement.generatedReturnPdf?.storageKey) {
      return res.status(409).json({
        success: false,
        message:
          "Return acknowledgement has already been generated.",
      });
    }

    if (agreement.signedReturnDocument?.storageKey) {
      return res.status(409).json({
        success: false,
        message:
          "A signed return document has already been uploaded.",
      });
    }

    const pdfBuffer = await generateRentalReturnPdf(agreement);

    savedPdf = await saveGeneratedReturnPdf({
    pdfBuffer,
    agreementId: agreement._id,
    uploadedBy: staffUserId,
    });

    const updatedAgreement =
      await RentalAgreement.findOneAndUpdate(
        {
          _id: agreement._id,
          rental: rental._id,
          status: "HANDOVER_SIGNED",
          generatedReturnPdf: null,
          signedReturnDocument: null,
          returnRecord: agreement.returnRecord,
          "returnInspection.inspectedAt":
            agreement.returnInspection.inspectedAt,
        },
        {
          $set: {
            generatedReturnPdf: savedPdf,
            generatedReturnAt: new Date(),
            generatedReturnBy: staffUserId,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedAgreement) {
      await deleteGeneratedReturnPdf(savedPdf.storageKey);
      savedPdf = null;

      return res.status(409).json({
        success: false,
        message:
          "Agreement changed during generation or a return PDF already exists. Refresh and try again.",
      });
    }

    databaseUpdated = true;

    return res.status(200).json({
      success: true,
      message: "Return acknowledgement generated successfully.",
      data: {
        agreementId: updatedAgreement._id,
        agreementNumber: updatedAgreement.agreementNumber,
        generatedReturnAt: updatedAgreement.generatedReturnAt,
        originalName:
          updatedAgreement.generatedReturnPdf.originalName,
      },
    });
  } catch (error) {
    if (savedPdf && !databaseUpdated) {
      try {
        await deleteGeneratedReturnPdf(savedPdf.storageKey);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up return PDF:",
          cleanupError
        );
      }
    }

    next(error);
  }
};

 // ============================================================
 // DOWNLOAD GENERATED RETURN ACKNOWLEDGEMENT PDF
 // STAFF ADMIN / CLERK
 // ============================================================

const downloadReturnAcknowledgement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staffUserId = req.user?.userId;

    if (!mongoose.isValidObjectId(staffUserId)) {
    return res.status(401).json({
        success: false,
        message: "Authenticated staff user ID is invalid.",
    });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID.",
      });
    }

    const agreement = await RentalAgreement.findOne({
      rental: id,
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Rental agreement not found.",
      });
    }

    const generatedPdf = agreement.generatedReturnPdf;

    if (!generatedPdf?.storageKey) {
      return res.status(404).json({
        success: false,
        message:
          "Return acknowledgement PDF has not been generated.",
      });
    }

    const { buffer, sha256 } = await readGeneratedReturnPdf(
      generatedPdf.storageKey
    );

    // Verify that the stored file has not been modified.
    if (sha256 !== generatedPdf.sha256) {
      return res.status(409).json({
        success: false,
        message:
          "Return acknowledgement PDF failed integrity verification.",
      });
    }

    const filename =
      `SCR-Return-Acknowledgement-${agreement._id}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });

    return res.status(200).send(buffer);
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "Stored return acknowledgement PDF was not found.",
      });
    }

    next(error);
  }
};

module.exports = {
  saveHandoverInspection,
  generateAgreement,
  generateReturnAcknowledgement,
  downloadReturnAcknowledgement,
  uploadSignedHandover,
  verifySignedHandover,
  uploadSignedReturn,
  verifySignedReturn,
  getRentalAgreement,
  downloadGeneratedHandoverAgreement,
  downloadSignedHandover,
  downloadSignedReturn,
};
