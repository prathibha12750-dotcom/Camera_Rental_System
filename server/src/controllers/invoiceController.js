const Invoice = require("../models/invoice.js")

// ==================================
// CREATE INVOICE
// POST /api/admin/invoices
// ==================================

const createInvoice = async (req, res, next) => {
    try{
        const{
            customer,
            rental,
            booking,
            serviceDetails,
            serviceAmount,
            securityDeposit,
        } = req.body;

        //-----------------------------------
        //1. Validate required fields
        //-----------------------------------

        if(!customer){
            return res.status(400).json({
                success: false,
                message: "Customer is required",
            });
        }

        if(!serviceDetails){
            return res.status(400).json({
                success: false,
                message: "Service details are required",
            });
        }

        if(serviceAmount === undefined || serviceAmount === null){
            return res.status(400).json({
                success: false,
                message: "Service amount is required",
            });
        }

        //-----------------------------------
        //2. Validate amounts
        //-----------------------------------

        if (Number(serviceAmount) < 0){
            return res.status(400).json({
                success: false,
                message: "Service amount cannot be negative",
            });
        }

        if(securityDeposit !== undefined  && securityDeposit !== null && Number(securityDeposit)<0){
            return res.status(400).json({
                success: false,
                message: "Security deposit cannot be negative",
            });
        }

        //-----------------------------------
        //3. Calculate amounts
        //-----------------------------------

        const serviceAmountValue = Number(serviceAmount);
        const securityDepositValue = Number(securityDeposit || 0);

        const totalAmount = serviceAmountValue + securityDepositValue;

        //-----------------------------------
        //4. Generate invoice number
        //-----------------------------------

        const invoiceNumber = `INV-${Date.now()}`;

        //-----------------------------------
        //5. Create invoice
        //-----------------------------------

        const invoice = await Invoice.create({
            invoiceNumber,
            customer,
            rental: rental || null,
            booking: booking || null,
            serviceDetails: serviceDetails.trim(),
            serviceAmount: serviceAmountValue,
            securityDeposit: securityDepositValue,
            totalAmount,
            paymentStatus: "PENDING",
        });

        //-----------------------------------
        //6. Return response
        //-----------------------------------

        return res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            data: {
                invoice,
            },
        });
    }catch(error){
        next(error);
    }
}

// =================================
// GET ALL INVOICES
// GET /api/admin/invoices
// =================================

const getInvoices = async (req, res, next) => {
    try {
        const invoices = await Invoice.find().populate("customer","name email").sort({createdAt: -1});

        return res.status(200).json({
            success: true,
            message: "Invoices retrieved successfully",
            data: {
                invoices,
            }
        });
    } catch(error) {
        next(error);
    }
}


// ==================================
// GET SINGLE INVOICE
// GET /api/admin/invoices/:id
// ==================================

const getInvoiceById = async (req, res, next) => {
    try {
        const {id} = req.params;

        const invoice = await Invoice.findById(id).populate("customer", "name email");
        
        if(!invoice){
            return res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Invoice retrieved successfully",
            data: {
                invoice,
            },
        });
    } catch(error){
        next(error);
    }
};

// ==================================
// GET MY INVOICES
// GET /api/customer/invoices
// CUSTOMER ONLY
// ==================================

const getMyInvoices = async (req, res, next) => {
    try {
        const customerId = req.user.userId;

        const invoices = await Invoice.find({
            customer: customerId,
        })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Customer invoices retrieved successfully",
            data: {
                invoices,
            },
        });
    } catch (error) {
        next(error);
    }
};

//-----------------------------------
//EXPORT
//-----------------------------------

module.exports = {
    createInvoice,
    getInvoices,
    getInvoiceById,
    getMyInvoices,
};