const User = require("../models/User");
const Payment = require("../models/payment");

// ================================
// ADMIN DASHBOARD STATISTICS
// GET /api/admin/dashboard
// ================================

const getDashboardStats = async (req, res, next) => {
    try {
        // -------------------------------
        // 1. Total customers
        // -------------------------------

        const totalCustomers = await User.countDocuments({
            role: "CUSTOMER",
        });

        // -------------------------------
        // 2. Total photographers
        // -------------------------------

        const totalPhotographers = await User.countDocuments({
            role: "PHOTOGRAPHER",
        });

        // -------------------------------
        // 3. Total payments
        // -------------------------------

        const totalPayments = await Payment.countDocuments({
            paymentStatus: "COMPLETED",
        });

        // -------------------------------
        // 4. Monthly revenue
        // -------------------------------

        const now = new Date();

        const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
            0,
            0,
            0,
            0
        );

        const endOfMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
        );

        const revenueResult = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: "COMPLETED",
                    paymentDate: {
                        $gte: startOfMonth,
                        $lte: endOfMonth,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$amount",
                    },
                },
            },
        ]);

        const monthlyRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        // --------------------------------
        // 5. Return dashboard statistics
        // --------------------------------

        return res.status(200).json({
            success: true,
            message: "Dashboard statistics retrieved successfully",
            data: {
                totalCustomers,
                totalPhotographers,
                totalPayments,
                monthlyRevenue,

                //These will be added after member 1,2 finishes
                totalEquipment: null,
                activeRentals: null,
                overdueRentals: null,
                upcomingPhotographerBookings: null,
            
            }
        });

    }catch(error){
        next(error)
    }
}

module.exports = {
    getDashboardStats,
};