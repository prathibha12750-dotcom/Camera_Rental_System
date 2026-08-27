const Deposit = require("../models/deposit");
const Invoice = require("../models/invoice");
const User = require("../models/User");

// ==========================================
// RECORD SECURITY DEPOSIT
// POST /api/amin/deposits
// ==========================================

const createDeposit = async (req, res, next) => {
    try {
        const {
            invoice,
            amount,
        } = req.body;

        //--------------------------------------
        // 1. Validate required fields
        //--------------------------------------
        if(!invoice){
            return res.status(400).json({
                success: false,
                message: "Invoice ID is required",
            });
        }
        if(amount === undefined || amount === null){
            return res.status(400).json({
                success: false,
                message: "Deposit amount required"
            });
        }
        if(amount<=0){
            return res.status(400).json({
                success: false,
                message: "Deposit amount must be greater that zero"
            });
        }

        
        //--------------------------------------
        // 2. Find invoice
        //--------------------------------------
        const existingInvoice = await Invoice.findById(invoice);

        if(!existingInvoice){
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        
        //--------------------------------------
        // 3. Check security deposit requirment
        //--------------------------------------
        if(existingInvoice.securityDeposit <= 0){
            return res.status(400).json({
                success: false,
                message: "This invoice does not require a security deposit",
            });
        }

        
        //--------------------------------------
        // 4. Check deposit amount
        //--------------------------------------
        if(amount > existingInvoice.securityDeposit){
            return res.status(400).json({
                success: false,
                message: "Deposit amount cannot exceed the require security deposit",
            });
        }

        
        //--------------------------------------
        // 5. Find customer
        //--------------------------------------
        const customer = await User.findById(
            existingInvoice.customer
        ); 

        if (!customer){
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        
        //--------------------------------------
        // 6. Check existing active deposit
        //--------------------------------------
        const existingDeposit = await Deposit.findOne({
            invoice: existingInvoice._id,
            status: "HELD",
        });

        if(existingDeposit){
            return res.status(409).json({
                success: false,
                message: "Security deposit has already been recorded",
            });
        }

        
        //--------------------------------------
        // 7. Create deposit
        //--------------------------------------
        const deposit = await Deposit.create({
            invoice: existingInvoice._id,
            customer: customer._id,
            amount,
            status: "HELD",
        });

        
        //--------------------------------------
        // 8. Return response
        //--------------------------------------
        return res.status(201).json({
            success: true,
            message: "Security deposit recorded successfully",
            data: {
                deposit,
            },
        });

    } catch(error){
        next(error)
    }
}

    // =============================================
    // GET DEPOSITS FOR AN INVOICE
    // GET /api/admin/deposits/invoice/:invoiceId
    // =============================================

    const getDepositByInvoice = async (req, res, next) => {
        try{
            const {invoiceId} = req.params;

            const deposits = await Deposit.find({
                invoice: invoiceId,
            }).populate("customer", "name email").sort({createdAt: -1});

            return res.status(200).json({
                success: true,
                message: "Deposits retrieved successfully",
                data: {
                    deposits,
                }
             });
        }catch(error){
            next(error);
        }
    }

    // ============================================
    // GET SINGLE DEPOSIT
    // GET /api/admin.deposits/:depositId
    // ============================================

    const getDepositById = async (req, res, next) => {
        try{
            const {depositId} = req.params;

            const deposit = await Deposit.findById(depositId)
            .populate("customer", "name email")
            .populate("invoice", "invoiceNumber serviceDetails securityDeposit");

            if(!deposit){
                return res.status(404).json({
                    success: false,
                    message: "Deposit not found",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Deposit retrieved successfully",
                data: {
                    deposit,
                },
            });
        }catch(error){
            next(error);
        }
    }

module.exports = {
    createDeposit,
    getDepositByInvoice,
    getDepositById,
};