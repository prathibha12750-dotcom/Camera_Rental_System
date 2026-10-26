
const mongoose = require("mongoose");

const PhotographerNotification = require(
  "../models/photographerNotification"
);

const Notification = require("../models/notification");

// ==========================================
// GET MY NOTIFICATIONS
// CUSTOMER OR PHOTOGRAPHER
// ==========================================

const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Existing photographer booking notifications
    const photographerNotifications =
      await PhotographerNotification.find({
        user: userId,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    // Equipment rental and other generic notifications
    const genericNotifications = await Notification.find({
      recipient: userId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Normalize the read status and identify the source
    const bookingItems = photographerNotifications.map(
      (notification) => ({
        ...notification,
        source: "PHOTOGRAPHER",
        isRead: notification.read ?? false,
      })
    );

    const genericItems = genericNotifications.map(
      (notification) => ({
        ...notification,
        source: "GENERIC",
        isRead: notification.isRead ?? false,
      })
    );

    // Combine newest notifications first
    const notifications = [
      ...bookingItems,
      ...genericItems,
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
      .slice(0, 50);

    const [bookingUnreadCount, genericUnreadCount] =
      await Promise.all([
        PhotographerNotification.countDocuments({
          user: userId,
          read: false,
        }),
        Notification.countDocuments({
          recipient: userId,
          isRead: false,
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount:
          bookingUnreadCount + genericUnreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MARK NOTIFICATION AS READ
// CUSTOMER OR PHOTOGRAPHER
// ==========================================

const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    // First check existing photographer notifications
    const photographerNotification =
      await PhotographerNotification.findOne({
        _id: notificationId,
        user: userId,
      });

    if (photographerNotification) {
      if (!photographerNotification.read) {
        photographerNotification.read = true;
        await photographerNotification.save();
      }

      return res.status(200).json({
        success: true,
        message: "Notification marked as read.",
        data: {
          notification: photographerNotification,
        },
      });
    }

    // Then check generic rental notifications
    const genericNotification =
      await Notification.findOne({
        _id: notificationId,
        recipient: userId,
      });

    if (genericNotification) {
      if (!genericNotification.isRead) {
        genericNotification.isRead = true;
        await genericNotification.save();
      }

      return res.status(200).json({
        success: true,
        message: "Notification marked as read.",
        data: {
          notification: genericNotification,
        },
      });
    }

    return res.status(404).json({
      success: false,
      message: "Notification not found.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
};
