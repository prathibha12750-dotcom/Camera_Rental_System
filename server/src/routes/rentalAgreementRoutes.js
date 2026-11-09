
const express = require("express");

// Reuse the existing authentication middleware.
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");
const uploadRentalAgreement = require("../middleware/uploadRentalAgreement");

// Rental agreement controller.
const {
  getRentalAgreement,
  saveHandoverInspection,
  generateAgreement,
  generateReturnAcknowledgement,
  downloadReturnAcknowledgement,
  uploadSignedHandover,
  verifySignedHandover,
  uploadSignedReturn,
  verifySignedReturn,
  downloadGeneratedHandoverAgreement,
  downloadSignedHandover,
  downloadSignedReturn,
} = require("../controllers/rentalAgreementController");

const router = express.Router();

// ============================================================
// ALL RENTAL AGREEMENT ROUTES REQUIRE AUTHENTICATION
// ============================================================

router.use(authenticate);

// ============================================================
// GET RENTAL AGREEMENT DETAILS
// CLERK / STAFF ADMIN
// ============================================================

router.get(
  "/:rentalId",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getRentalAgreement
);
// ============================================================
// SAVE HANDOVER INSPECTION
// STAFF ADMIN ONLY
// ============================================================

router.patch(
  "/:rentalId/handover-inspection",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  saveHandoverInspection
);

// Generate the two-page rental agreement PDF.
router.post(
  "/:rentalId/generate",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  generateAgreement
);

// ============================================================
// DOWNLOAD GENERATED HANDOVER AGREEMENT
// CLERK / STAFF ADMIN
// ============================================================

router.get(
  "/:rentalId/handover/download",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  downloadGeneratedHandoverAgreement
);

// ============================================================
// DOWNLOAD SIGNED HANDOVER DOCUMENT
// CLERK / STAFF ADMIN
// ============================================================

router.get(
  "/:rentalId/handover-document/download",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  downloadSignedHandover
);

 // ============================================================
 // GENERATE RETURN ACKNOWLEDGEMENT PDF
 // LEGACY WORKFLOW
 // ============================================================

router.post(
  "/:id/return-acknowledgement/generate",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  generateReturnAcknowledgement
);

// ============================================================
// DOWNLOAD GENERATED RETURN ACKNOWLEDGEMENT PDF
// LEGACY WORKFLOW
// ============================================================

router.get(
  "/:id/return-acknowledgement/download",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  downloadReturnAcknowledgement
);

// ============================================================
// UPLOAD SIGNED HANDOVER DOCUMENT
// STAFF ADMIN ONLY
// ============================================================

router.post(
  "/:rentalId/handover-document",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  uploadRentalAgreement,
  uploadSignedHandover
);

// ============================================================
// DOWNLOAD SIGNED RETURN ACKNOWLEDGEMENT
// CLERK / STAFF ADMIN
// ============================================================

router.get(
  "/:rentalId/return-document/download",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  downloadSignedReturn
);

// ============================================================
// VERIFY SIGNED HANDOVER DOCUMENT
// CLERK OR STAFF ADMIN
// ============================================================

router.patch(
  "/:rentalId/verify-handover",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  verifySignedHandover
);

// ============================================================
// UPLOAD SIGNED RETURN ACKNOWLEDGEMENT
// CLERK / STAFF ADMIN
// ============================================================

router.post(
  "/:rentalId/return-document",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  uploadRentalAgreement,
  uploadSignedReturn
);

// ============================================================
// VERIFY SIGNED RETURN ACKNOWLEDGEMENT
// CLERK / STAFF ADMIN
// ============================================================

router.patch(
  "/:rentalId/verify-return",
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  verifySignedReturn
);

module.exports = router;
