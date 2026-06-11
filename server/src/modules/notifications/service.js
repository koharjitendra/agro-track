import Notification from '../../models/Notification.model.js';
import { emitToUser } from '../../utils/socket.js';

/**
 * Create a notification and emit it in real-time to the user's socket room.
 */
export const createAndEmit = async ({ userId, type, title, message, relatedId = null }) => {
  const notif = await Notification.create({
    userId,
    type,
    title,
    message,
    relatedId,
    read: false,
  });

  // Emit real-time event to the user's room
  emitToUser(userId.toString(), 'notification:new', {
    notification: notif.toJSON(),
  });

  // Also emit updated unread count
  const unreadCount = await Notification.countDocuments({ userId, read: false });
  emitToUser(userId.toString(), 'notification:unread_count', { count: unreadCount });

  return notif;
};

export const getNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ userId }),
  ]);
  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, read: false });
};

export const markAsRead = async (id, userId) => {
  const notif = await Notification.findOne({ _id: id, userId });
  if (!notif) {
    const err = new Error('Notification not found.');
    err.statusCode = 404;
    throw err;
  }
  notif.read = true;
  await notif.save();

  // Update unread count in real-time
  const unreadCount = await Notification.countDocuments({ userId, read: false });
  emitToUser(userId.toString(), 'notification:unread_count', { count: unreadCount });

  return notif.toJSON();
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
  emitToUser(userId.toString(), 'notification:unread_count', { count: 0 });
  return { success: true };
};
