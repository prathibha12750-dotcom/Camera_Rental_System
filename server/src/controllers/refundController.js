const Refund = require("../models/refund");
const Deposit = require("../models/deposit");
const Invoice = require("../models/invoice");

// =============================================
// RECORD SECURITY DEPOSIT REFUND
// POST /api/admin/refunds
// =============================================

const createRefund = async(req, res, next) => {
    try {
        const {
            deposit,
            amount,
            refundMethod,
            notes,
        } = req.body;

        // ----------------------------------------
        // 1. Validate require fields
        // ----------------------------------------

        if(!deposit){
            return res.status(400).json({
                success: false,
                message: "Deposit ID is required",
            });
        }

        if(amount === undefined || amount === null){
            return res.status(400).json({
                success: false,
                message: "Refund amount is required",
            });
        }

        if(amount <= 0){
            return res.status(400).json({
                success: false,
                message: "Refund amount must be greater that zero",
            });
        }

        if(!refundMethod){
            return res.status(400).json({
                success: false,
                message: "Refund method is required",
            });
        }

        // ----------------------------------------
        // 2. Find deposit
        // ----------------------------------------

        const existingDeposit = await Deposit.findById(deposit);

        if(!existingDeposit){
            return res.status(404).json({
                success: false,
                message: "Deposit not found",
            });
        }

        // ----------------------------------------
        // 3. Check deposit status
        // ----------------------------------------

        if(existingDeposit.status !== "HELD"){
            return res.status(400).json({
                success: false,
                message: "Only HELD deposits can be refunded",
            });
        }

        // ----------------------------------------
        // 4. Check refund amount
        // ----------------------------------------

        if(amount > existingDeposit.amount){
            return res.status(400).json({
                success: false,
                message: "Refund amount cannot exceed the deposit amount"
            });
        }

        // ----------------------------------------
        // 5. Find Invoice
        // ----------------------------------------

        const existingInvoice = await Invoice.findById(
            existingDeposit.invoice,
        );
        
        if(!existingInvoice){
            return res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }

        // ----------------------------------------
        // 6. Create refund record
        // ----------------------------------------

        const refund = await Refund.create({
            deposit: existingDeposit._id,
            invoice: existingInvoice._id,
            customer: existingDeposit.customer,
            amount,
            refundMethod,
            status: "COMPLETED",
            notes,
        });

        // --------------------------------------
        // 7. Update deposit status
        // --------------------------------------

        existingDeposit.status = "REFUNDED";

        await existingDeposit.save();

        

        // ----------------------------------------
        // 8. Return response
        // ----------------------------------------

        return res.status(201).json({
            success: true,
            message: "Security deposit refunded successfully",
            data: {
                refund,
            },
        })


    } catch(error){
        next(error);
    } 
}

// ===========================================
// GET REFUNDS FOR AN INVOICE
// GET /api/admin/refunds/invoice/:invoiceId
// ===========================================

const getRefundsByInvoice = async (req, res, next) => {
    try{
        const {invoiceId} = req.params;

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

module.exports = {
    createRefund,
    getRefundById,
    getRefundsByInvoice
};