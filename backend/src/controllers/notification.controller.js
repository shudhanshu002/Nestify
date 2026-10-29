import Notification from '../models/notification.model.js';

// @desc    Get count of unread notifications
// @route   GET /api/v1/notifications/unread-count
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });
    res.status(200).json({ success: true, count });
  } catch (error) { next(error); }
};

// @desc    Get all notifications for logged-in user
// @route   GET /api/v1/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt');
    res.status(200).json({ success: true, data: notifications });
  } catch (error) { next(error); }
};

// @desc    Mark all as read
// @route   PUT /api/v1/notifications/mark-read
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) { next(error); }
};