
//added by abilash

const mongoose = require("mongoose");
const BillingReceipt = require("../models/billingReceipt");

// ==========================================
// FR-167: GET BILLING RECEIPT BY PAYMENT ID
// ==========================================

const getBillingReceiptByPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const receipt = await BillingReceipt.findOne({
      payment: paymentId,
    })
      .populate("invoice", "invoiceNumber serviceDetails")
      .populate("customer", "name email");

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Billing receipt not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { receipt },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBillingReceiptByPayment };

//ended by abilash
