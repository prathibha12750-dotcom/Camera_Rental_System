const payment = require("../models/payment");
const Payment = require("../models/payment");
const Rental = require("../models/Rental");
const Equipment = require("../models/Equipment");
const Photographer = require("../models/Photographer");
const Booking = require("../models/Booking");

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

// ========================================
// Rental REPORT
// ========================================

const getRentalReport = async (req, res, next) => {
    try {
        const totalRentals = await Rental.countDocuments();

        const pendingRentals = await Rental.countDocuments({
            status: "PENDING",
        });

        const confirmedRentals = await Rental.countDocuments({
            status: "CONFIRMED",
        });

        const activeRentals = await Rental.countDocuments({
            status: "ACTIVE",
        });

        const returnedRentals = await Rental.countDocuments({
            status: "RETURNED",
        });

        const completedRentals = await Rental.countDocuments({
            status: "COMPLETED",
        });

        const rejectedRentals = await Rental.countDocuments({
            status: "REJECTED",
        });

        const cancelledRentals = await Rental.countDocuments({
            status: "CANCELLED",
        });

        const overdueRentals = await Rental.countDocuments({
            status: { $in: ["CONFIRMED", "ACTIVE"] },
            endDate: { $lt: new Date() },
        });

        return res.status(200).json({
            success: true,
            message: "Rental report retrieved successfully",
            data: {
                totalRentals,
                pendingRentals,
                confirmedRentals,
                activeRentals,
                returnedRentals,
                completedRentals,
                rejectedRentals,
                cancelledRentals,
                overdueRentals,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ========================================
// Equipment REPORT
// ========================================

const getEquipmentReport = async (req, res, next) => {
    try {
        const totalEquipment = await Equipment.countDocuments();

        const availableEquipment = await Equipment.countDocuments({
            status: "AVAILABLE",
        });

        const reservedEquipment = await Equipment.countDocuments({
            status: "RESERVED",
        });

        const rentedEquipment = await Equipment.countDocuments({
            status: "RENTED",
        });

        const equipmentUnderMaintenance = await Equipment.countDocuments({
            status: "MAINTENANCE",
        });

        const damagedEquipment = await Equipment.countDocuments({
            status: "DAMAGED",
        });

        const excellentCondition = await Equipment.countDocuments({
            condition: "EXCELLENT",
        });

        const goodCondition = await Equipment.countDocuments({
            condition: "GOOD",
        });

        const fairCondition = await Equipment.countDocuments({
            condition: "FAIR",
        });

        const damagedCondition = await Equipment.countDocuments({
            condition: "DAMAGED",
        });

        
        // ========================================
        // MOST RENTED EQUIPMENT REPORT
        // ========================================

        const mostRentedEquipment = await Rental.aggregate([
            {
                $match: {
                    status: {
                        $in: [
                            "CONFIRMED",
                            "ACTIVE",
                            "RETURNED",
                            "COMPLETED",
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: "$equipment",
                    rentalCount: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: Equipment.collection.name,
                    localField: "_id",
                    foreignField: "_id",
                    as: "equipmentDetails",
                },
            },
            {
                $unwind: "$equipmentDetails",
            },
            {
                $project: {
                    _id: 0,
                    equipmentId: "$_id",
                    equipmentName: "$equipmentDetails.name",
                    brand: "$equipmentDetails.brand",
                    model: "$equipmentDetails.model",
                    rentalCount: 1,
                },
            },
            {
                $sort: {
                    rentalCount: -1,
                    equipmentName: 1,
                },
            },
            {
                $limit: 10,
            },
        ]);


        // ========================================
        // EQUIPMENT BY CATEGORY REPORT
        // ========================================

        const equipmentByCategory = await Equipment.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalEquipment: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryDetails",
                },
            },
            {
                $unwind: {
                    path: "$categoryDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    categoryId: "$_id",
                    categoryName: {
                        $ifNull: [
                            "$categoryDetails.name",
                            "Unknown Category",
                        ],
                    },
                    totalEquipment: 1,
                },
            },
            {
                $sort: {
                    totalEquipment: -1,
                    categoryName: 1,
                },
            },
        ]);



        return res.status(200).json({
            success: true,
            message: "Equipment report retrieved successfully",
            data: {
                totalEquipment,
                availableEquipment,
                reservedEquipment,
                rentedEquipment,
                equipmentUnderMaintenance,
                damagedEquipment,
                excellentCondition,
                goodCondition,
                fairCondition,
                damagedCondition,
                mostRentedEquipment,
                equipmentByCategory,
            },
        });
    } catch (error) {
        next(error);
    }
};


const getPhotographerReport = async (req, res) => {
  try {
    const totalPhotographers = await Photographer.countDocuments();

    const totalBookings = await Booking.countDocuments();

    const requestedBookings = await Booking.countDocuments({
      status: "REQUESTED",
    });

    const confirmedBookings = await Booking.countDocuments({
      status: "CONFIRMED",
    });

    const completedBookings = await Booking.countDocuments({
      status: "COMPLETED",
    });

    const rejectedBookings = await Booking.countDocuments({
      status: "REJECTED",
    });

    const cancelledBookings = await Booking.countDocuments({
      status: "CANCELLED",
    });

    const upcomingBookings = await Booking.countDocuments({
      date: { $gte: new Date() },
      status: { $in: ["REQUESTED", "CONFIRMED"] },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalPhotographers,
        totalBookings,
        requestedBookings,
        confirmedBookings,
        completedBookings,
        rejectedBookings,
        cancelledBookings,
        upcomingBookings,
      },
    });
  } catch (error) {
    console.error("Error fetching photographer report:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch photographer report",
    });
  }
};


module.exports = {
    getDailyRevenue,
    getMonthlyRevenue,
    getRentalReport,
    getEquipmentReport,
    getPhotographerReport,
};
