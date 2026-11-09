
const {
  getBankDetails,
} = require("../config/bankDetails");

// ==========================================
// GET BUSINESS BANK TRANSFER DETAILS
// ==========================================
// GET /api/payment-instructions/bank
// ==========================================

const getBusinessBankDetails = (req, res, next) => {
  try {
    const bankDetails = getBankDetails();

    if (!bankDetails) {
      return res.status(503).json({
        success: false,
        message:
          "Bank transfer details are currently unavailable. Please contact the business.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bank transfer details retrieved successfully.",
      data: {
        bankDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBusinessBankDetails,
};
