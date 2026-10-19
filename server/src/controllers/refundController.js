const mongoose = require("mongoose");
const Refund = require("../models/refund");

// ==========================================
// CREATE REFUND - LEGACY ENDPOINT DISABLED
// POST /api/admin/refunds
// ==========================================

const createRefund = async (req, res) => {
  return res.status(409).json({
    success: false,
    message:
      "Direct refund creation is disabled. Refunds must use the verified settlement workflow with separate refund preparation and payout confirmation.",
  });
};


// ===========================================
// GET REFUNDS FOR AN INVOICE
// GET /api/admin/refunds/invoice/:invoiceId
// ===========================================

const getRefundsByInvoice = async (req, res, next) => {
    try{
        const {invoiceId} = req.params;
        
        if (!mongoose.isValidObjectId(invoiceId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice ID",
            });
        }

        const refunds = await Refund.find({
            invoice: invoiceId,
        })
        .populate("customer", "name email")
        .populate("deposit", "amount status depositDate")
        .populate("invoice", "invoiceNumber serviceDetails")
        .sort({createdAt: -1});

        return res.status(200).json({
            success: true,
            message: "refunds retrieved successfully",
            data: {
                refunds,
            },
        });
    }catch(error){
        next(error);
    }
}

// ===========================================
// GET SINGLE REFUND
// GET /api/admin/refunds/:refundId
// ===========================================

const getRefundById = async (req, res, next) => {
    try{
        const {refundId} = req.params;

        const refund = await Refund.findById(refundId)
            .populate("customer", "name email")
            .populate("deposit", "amount status depositDate")
            .populate("invoice", "invoiceNumber serviceDetails securityDeposit");

        if(!refund){
            return res.status(404).json({
                success: false,
                message: "Refund not found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Refund retrieved successfully",
            data: {
                refund,
            }
        })
    }catch(error){
        next(error);
    }
}

// ==========================================
// GET MY REFUNDS
// CUSTOMER ONLY - READ ONLY
// GET /api/customer/refunds
// ==========================================

const getMyRefunds = async (req, res, next) => {
  try {
    const customerId = req.user.userId;

    const refunds = await Refund.find({
      customer: customerId,
    })
      .populate(
        "invoice",
        "invoiceNumber rental securityDeposit"
      )
      .populate(
        "deposit",
        "amount status depositDate"
      )
      .select(
        "deposit invoice customer amount refundMethod " +
        "status notes refundDate confirmedAt " +
        "payoutReference createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Customer refunds retrieved successfully",
      data: {
        refunds,
        count: refunds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
    createRefund,
    getRefundById,
    getRefundsByInvoice,
    getMyRefunds,
};