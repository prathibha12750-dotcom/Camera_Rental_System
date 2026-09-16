const express = require("express");

const {
  register,
  login,
  logout,
  getCurrentUser,
  changeTemporaryPassword,
} = require("../controllers/authController");

const authenticate = require("../middleware/authenticate");

const router = express.Router();


// Public routes
router.post("/register", register);
router.post("/login", login);


// Protected routes
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getCurrentUser);


router.put("/change-temporary-password", authenticate, changeTemporaryPassword);


module.exports = router;