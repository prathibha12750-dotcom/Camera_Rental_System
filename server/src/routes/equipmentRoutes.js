
const express = require("express");

const {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
} = require("../controllers/equipmentController");

const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

// ==========================================
// GET ALL EQUIPMENT
// AUTHENTICATED USERS
// ==========================================

router.get(
  "/",
  authenticate,
  getAllEquipment
);

// ==========================================
// GET ONE EQUIPMENT
// AUTHENTICATED USERS
// ==========================================

router.get(
  "/:id",
  authenticate,
  getEquipmentById
);

// ==========================================
// CREATE EQUIPMENT
// ADMIN AND CLERK
// ==========================================

router.post(
  "/",
  authenticate,
  authorizeRoles("STAFF_ADMIN", "CLERK"),
  createEquipment
);

// ==========================================
// UPDATE EQUIPMENT
// ADMIN AND CLERK
// ==========================================

router.put(
  "/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN", "CLERK"),
  updateEquipment
);

// ==========================================
// DELETE EQUIPMENT
// ADMIN ONLY
// ==========================================

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  deleteEquipment
);

module.exports = router;
