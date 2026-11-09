
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

router.get("/", getAllEquipment);
router.get("/:id", getEquipmentById);
router.post(
  "/",
  authenticate,
  authorizeRoles("STAFF_ADMIN", "CLERK"),
  createEquipment
);

// ==========================================
// UPDATE EQUIPMENT - ADMIN AND CLERK
// ==========================================
router.put(
  "/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN", "CLERK"),
  updateEquipment
);

// ==========================================
// DELETE EQUIPMENT - STAFF ADMIN ONLY
// ==========================================
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  deleteEquipment
);

module.exports = router;
