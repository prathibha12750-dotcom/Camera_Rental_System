const Notification = require("../models/notification");
const User = require("../models/User");

// ---------------------------------
// create a notification
// POST /api/admin/notifications
// ---------------------------------

const createNotification = async (req, res, next) => {
    try{
        const {recipient, title, message, type} = req.body;

        // --------------------------------------
        // 1. Validate required fields
        // --------------------------------------

        if(!recipient || !title || !message || !type){
            return res.status(400).json({
                success: false,
                message: "Recipient, title, message and type are required"
            })
        }

        // --------------------------------------
        // 2. Check recipient
        // --------------------------------------

        const user = await User.findById(recipient);

        if(!user){
            return res.status(404).json({
                success: false,
                message: "Recipient user not found"
            });
        }

        // ---------------------------------------
        // 3. Crete notification
        // ---------------------------------------

        const notification = await Notification.create({
            recipient: user._id,
            title,
            message,
            type
        });

        // ----------------------------------------
        // 4. Return response
        // ----------------------------------------

        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data : {
                notification,
            }
        });
        
    } catch(error){
        next(error);
    }
};


// ----------------------------------------------
// Get notification by userID
// GET /api/admin/notification/user/:userId
// ----------------------------------------------

const getNotificationByUser = async (req, res, next) => {
    try{
        const {userId} = req.params;
        
        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const notification = await Notification.find({
            recipient: userId,
        }).populate("recipient","name email role").sort({createdAt: -1})

        return res.status(200).json({
            success: true,
            message: "Notificaion retrieved successfully",
            data: {
                notification,
            }
        })
    }catch(error){
        next(error);
    }
}

// ----------------------------------------------------
// MARK NOTIFICATION AS READ
// PATCH /api/admin/notification/:notificationId/read
// ----------------------------------------------------

const markNotificationAsRead = async (req, res, next) => {
    try {
        const {notificationId} = req.params;

        const notification = await Notification.findById(notificationId);

        if(!notification){
            return res.status(404).json({
                success: false,
                message: "Noification not found",
            });
        }

        notification.isRead = true;

        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: {
                notification,
            },
        });
    } catch(error){
        next(error);
    }
}

module.exports = {
    createNotification,
    getNotificationByUser,
    markNotificationAsRead,
};