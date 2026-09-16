const Notification =
  require("../models/Notification");


// ==========================================
// GET MY NOTIFICATIONS
// CUSTOMER OR PHOTOGRAPHER
// ==========================================

const getMyNotifications =
  async (req, res, next) => {
    try {
      const notifications =
        await Notification.find({
          user:
            req.user.userId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(50);

      const unreadCount =
        await Notification.countDocuments({
          user:
            req.user.userId,

          read: false,
        });

      return res
        .status(200)
        .json({
          success: true,

          data: {
            notifications,
            unreadCount,
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

const markNotificationAsRead =
  async (req, res, next) => {
    try {
      const notification =
        await Notification.findOne({
          _id:
            req.params.id,

          user:
            req.user.userId,
        });

      if (!notification) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Notification not found.",
          });
      }

      notification.read =
        true;

      await notification.save();

      return res
        .status(200)
        .json({
          success: true,

          data: {
            notification,
          },
        });
    } catch (error) {
      next(error);
    }
  };


module.exports = {
  getMyNotifications,
  markNotificationAsRead,
};