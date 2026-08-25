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

//-----------------------------------
//EXPORT
//-----------------------------------

module.exports = {
    createInvoice,
};