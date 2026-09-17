
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
// ==========================================

router.get(
  "/",
  authenticate,
  getAllEquipment
);


// ==========================================
// GET ONE EQUIPMENT
// ==========================================

router.get(
  "/:id",
  authenticate,
  getEquipmentById
);


// ==========================================
// CREATE EQUIPMENT
// STAFF ADMIN ONLY
// ==========================================

router.post(
  "/",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  createEquipment
);


// ==========================================
// UPDATE EQUIPMENT
// STAFF ADMIN ONLY
// ==========================================

router.put(
  "/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  updateEquipment
);


// ==========================================
// DELETE EQUIPMENT
// STAFF ADMIN ONLY
// ==========================================

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  deleteEquipment
);


module.exports = router;