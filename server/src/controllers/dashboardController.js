const User = require("../models/User");
const Payment = require("../models/payment");
const Equipment = require("../models/Equipment");
const Rental = require("../models/Rental");
const Booking = require("../models/Booking");

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

        const totalEquipment = await Equipment.countDocuments();

        const activeRentals = await Rental.countDocuments({
            status: "ACTIVE",
        });


        //added by abilash
        // Count overdue equipment returns only.
        // Confirmed but unissued rentals are excluded.
        const overdueRentals = await Rental.countDocuments({
            status: "ACTIVE",
            endDate: { $lt: new Date() },
            returnedAt: null,
        });
        //ended by abilash


        const upcomingPhotographerBookings = await Booking.countDocuments({
            date: { $gte: new Date() },
            status: { $in: ["REQUESTED", "CONFIRMED"] },
        });

        // Total clerks
        const totalClerks = await User.countDocuments({
            role: "CLERK",
        });

        // Available equipment
        const availableEquipment = await Equipment.countDocuments({
            status: "AVAILABLE",
        });

        // Damaged equipment
        const damagedEquipment = await Equipment.countDocuments({
            status: "DAMAGED",
        });

        // Equipment under maintenance
        const equipmentUnderMaintenance =
            await Equipment.countDocuments({
                status: "MAINTENANCE",
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
                totalClerks,

                totalEquipment,
                availableEquipment,
                damagedEquipment,
                equipmentUnderMaintenance,

                activeRentals,
                overdueRentals,
                upcomingPhotographerBookings,

                totalPayments,
                monthlyRevenue,
            
            }
        });

    }catch(error){
        next(error)
    }
}

module.exports = {
    getDashboardStats,
};