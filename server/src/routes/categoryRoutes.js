const express = require("express");

const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

router.get("/", authenticate, getAllCategories);

router.post(
  "/",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  createCategory
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  updateCategory
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  deleteCategory
);

module.exports = router;