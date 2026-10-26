const express = require("express");

const {
  register,
  login,
  logout,
  getCurrentUser,
  changeTemporaryPassword,
  //added by abilash
  updateMyProfile,
  //ended by abilash
} = require("../controllers/authController");

const authenticate = require("../middleware/authenticate");

const router = express.Router();


// Public routes
router.post("/register", register);
router.post("/login", login);


// Protected routes
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getCurrentUser);

//added by abilash
// FR-169: Update logged-in Admin's own basic profile
router.put("/me", authenticate, updateMyProfile);
//ended by abilash



router.put("/change-temporary-password", authenticate, changeTemporaryPassword);


module.exports = router;