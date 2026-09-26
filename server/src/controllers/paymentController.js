const Payment = require("../models/payment");
const Invoice = require("../models/invoice");
const User = require("../models/User");
const Notification = require("../models/notification");

const updateInvoicePaymentStatus = async (invoiceId) => {
    // Get invoice
    const invoice = await Invoice.findById(invoiceId);

    if(!invoice){
        throw new Error("Invoice not found");
    }

    //Get all completed payments for this invoice
    const payments = await Payment.find({
        invoice: invoiceId,
        paymentStatus: "COMPLETED",
    });

    //Calculate total paid amount
    const totalPaid = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
    );

    //Determine payment status
    let paymentStatus;

    if(totalPaid <= 0){
        paymentStatus = "PENDING";
    }else if(totalPaid < invoice.totalAmount){
        paymentStatus = "PARTIALLY_PAID";
    }else{
        paymentStatus = "PAID";
    }

    //update invoice
    invoice.paymentStatus = paymentStatus;

    await invoice.save();

    return {
        paymentStatus,
        totalPaid,
        totalAmount: invoice.totalAmount
    };

}




// =====================================
// CREATE PAYMENT
// POST /api/admin/payments
// =====================================

const createPayment = async (req, res, next) => {
    try {
        const {
            invoice,
            amount,
            paymentMethod,
            notes,
        } = req.body;

        // -----------------------------------
        // 1. Validate required fields
        // -----------------------------------

        if(!invoice){
            return res.status(400).json({
                success: false,
                message: "Invoice ID is required",
            });
        }

        if(amount === undefined || amount === null){
            return res.status(400).json({
                success: false,
                message: "Payment amount is required",
            });
        }

        if(amount <= 0){
            return res.status(400).json({
                success: false,
                message: "Payment amount must be greater than zero",
            });
        }

        if(!paymentMethod){
            return res.status(400).json({
                success: false,
                message: "Payment method is required",
            });
        }

        //---------------------------------------
        // 2. Find invoices
        //---------------------------------------

        const existingInvoice = await Invoice.findById(invoice);

        if(!existingInvoice){
            return res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }

        //---------------------------------------
        // 3. Find customer
        //---------------------------------------

        const customer = await User.findById(
            existingInvoice.customer
        );

        if(!customer){
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        //----------------------------------------
        // 4. Create payment
        //----------------------------------------

        const payment = await Payment.create({
            invoice: existingInvoice._id,
            customer: customer._id,
            amount,
            paymentMethod,
            notes,
        });

        //----------------------------------------
        // 5. Update invoice payment status
        //----------------------------------------

        await updateInvoicePaymentStatus(existingInvoice._id);

        //----------------------------------------
        // 6. Create payment notification
        //----------------------------------------

        await Notification.create({
            recipient: customer._id,
            title: "Payment Recorded",
            message: `A payment of LKR ${amount} has been recorded for your invoice ${existingInvoice.invoiceNumber}.`,
            type: "PAYMENT_RECORDED",
        });
        

        //----------------------------------------
        // 7. Return response
        //----------------------------------------

        return res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            data: {
                payment,
            },
        });
    } catch(error){
        next(error)
    }
}


// =======================================
// GET PAYMENTS FOR AN INVOICE
// GET /api/admin/payments/inovice/:invoiceId
// =======================================
        
const getPaymentsByInvoice = async (req, res, next) => {
    try {
        const {invoiceId} = req.params;

        const payments = await Payment.find({
            invoice: invoiceId,
        }).populate("customer", "name email").sort({createdAt: -1});

        return res.status(200).json({
            success: true,
            message: "Payments retrieved successfully",
            data: {
                payments,
            },
        });
    } catch(error){
        next(error);
    }
}

const getAllPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find()
            .populate("customer", "name email")
            .populate(
                "invoice",
                "invoiceNumber serviceDetails serviceAmount securityDeposit totalAmount paymentStatus"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "All payments retrieved successfully",
            data: {
                payments,
            },
        });
    } catch(error) {
        next(error);
    }
};

// =======================================
// GET MY PAYMENTS
// GET /api/customer/payments
// CUSTOMER ONLY
// =======================================

const getMyPayments = async (req, res, next) => {
    try {
        const customerId = req.user.userId;

        const payments = await Payment.find({
            customer: customerId,
        })
            .populate(
                "invoice",
                "invoiceNumber serviceDetails serviceAmount securityDeposit totalAmount paymentStatus"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Customer payment history retrieved successfully",
            data: {
                payments,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPayment,
    getPaymentsByInvoice,
    getAllPayments,
    getMyPayments,
};