import * as notifService from './service.js';
import { success } from '../../utils/apiResponse.js';

export const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const result = await notifService.getNotifications(req.user.id, page, limit);
    return success(res, result, 'Notifications fetched successfully');
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notifService.getUnreadCount(req.user.id);
    return success(res, { count }, 'Unread count fetched');
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notif = await notifService.markAsRead(req.params.id, req.user.id);
    return success(res, notif, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notifService.markAllAsRead(req.user.id);
    return success(res, result, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};
