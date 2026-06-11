const Notification = require('../models/Notification');
const { asyncHandler } = require('../utils/errors');

const createNotification = async (userId, type, title, message, data) => {
  try {
    return await Notification.create({ user: userId, type, title, message, data });
  } catch (e) {
    console.error('Notification error:', e.message);
  }
};

exports.getUserNotifications = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false })
  ]);
  res.json({ success: true, notifications, total, unreadCount, page, pages: Math.ceil(total / limit) });
};

exports.markRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, notification });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All marked as read' });
};

exports.getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, count });
};

exports.createNotification = createNotification;

// Wrap all exports with asyncHandler to catch promise rejections
Object.keys(module.exports).forEach(key => {
  if (typeof module.exports[key] === 'function') {
    module.exports[key] = asyncHandler(module.exports[key]);
  }
});
