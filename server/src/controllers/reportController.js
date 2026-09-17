const payment = require("../models/payment");
const Payment = require("../models/payment");

// =====================================
// DAILY REVENUE REPORT
// GET /api/admin/reports/revenue/daily
// =====================================

const getDailyRevenue = async (req, res, next) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const result = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: "COMPLETED",
                    paymentDate: {
                        $gte: startOfDay,
                        $lte: endOfDay,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$amount",
                    },
                    paymentCount: {
                        $sum: 1,
                    },
                },
            },
        ]);

        const report = result[0] || {
            totalRevenue: 0,
            paymentCount: 0,
        };

        return res.status(200).json({
            success: true, 
            message: "daily revenue retrieved successfully",
            data: {
                date: startOfDay,
                totalRevenue: report.totalRevenue,
                paymentCount: report.paymentCount,
            },
        });

    }catch(error){
        next(error);
    }
};


// ========================================
// MONTHLY REVENUE REPORT
// GET /api/admin/reports/revenue/monthly
// ========================================

const getMonthlyRevenue = async (req, res, next) => {
    try{
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

        const result = await Payment.aggregate([
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
                    paymentCount: {
                        $sum: 1,
                    },
                },
            },
        ]);

        const report = result[0] || {
            totalRevenue: 0,
            paymentCount: 0,
        };

        return res.status(200).json({
            success: true,
            message: "Monthly revenue retrieved successfully",
            data: {
                month: startOfMonth,
                totalRevenue: report.totalRevenue,
                paymentCount: report.paymentCount,
            },
        });
    }catch(error){
        next(error);
    }
}

module.exports = {
    getDailyRevenue,
    getMonthlyRevenue
};