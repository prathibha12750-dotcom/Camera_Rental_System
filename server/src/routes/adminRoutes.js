const express = require("express");

const {
  createPhotographer,
  getPhotographerApplications,
  getPhotographerApplicationById,
  reviewPhotographerApplication,
} = require("../controllers/adminController");

const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();


// ==========================================
// ADMIN TEST ROUTE
// ==========================================

router.get(
  "/test",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Staff/Admin authorization successful",
      user: req.user,
    });
  }
);


// ==========================================
// CREATE PHOTOGRAPHER
// ==========================================

router.post(
  "/photographers",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  createPhotographer
);


// ==========================================
// PHOTOGRAPHER APPLICATIONS
// ==========================================

router.get(
  "/photographer-applications",
  authenticate,
  authorizeRoles(
    "STAFF_ADMIN"
  ),
  getPhotographerApplications
);


router.get(
  "/photographer-applications/:id",
  authenticate,
  authorizeRoles(
    "STAFF_ADMIN"
  ),
  getPhotographerApplicationById
);


router.patch(
  "/photographer-applications/:id/status",
  authenticate,
  authorizeRoles(
    "STAFF_ADMIN"
  ),
  reviewPhotographerApplication
);


module.exports = router;