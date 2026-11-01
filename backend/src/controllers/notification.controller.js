import Notification from '../models/notification.model.js';

// Helper to notify client via socket of unread count change
const emitUnreadChange = (req) => {
  try {
    const io = req.app.get('io');
    if (io && req.user?._id) {
      io.to(req.user._id.toString()).emit('unread_notification_count_changed');
    }
  } catch (err) {
    console.error("Socket emit notification change error:", err);
  }
};

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
    emitUnreadChange(req);
    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) { next(error); }
};

// @desc    Mark single notification as read
// @route   PUT /api/v1/notifications/:id/read
export const markSingleAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    emitUnreadChange(req);
    res.status(200).json({ success: true, data: notification });
  } catch (error) { next(error); }
};

// @desc    Delete single notification
// @route   DELETE /api/v1/notifications/:id
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    emitUnreadChange(req);
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) { next(error); }
};

// @desc    Clear all notifications for user
// @route   DELETE /api/v1/notifications
export const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    emitUnreadChange(req);
    res.status(200).json({ success: true, message: "All notifications cleared" });
  } catch (error) { next(error); }
};
