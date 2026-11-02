
const express = require("express");

const {
  getBusinessBankDetails,
} = require("../controllers/bankDetailsController");

const router = express.Router();

// Public read-only payment instructions.
// This endpoint exposes only business bank
// details intended for customer payments.

router.get("/bank", getBusinessBankDetails);

module.exports = router;
