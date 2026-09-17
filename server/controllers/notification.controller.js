const notificationService = require('../services/notification.service');
const { formatResponse } = require('../utils/response');

const getNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await notificationService.getUserNotifications(req.user.id, { page, limit });
    res.json(formatResponse(true, result));
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(req.user.id, id);
    res.json(formatResponse(true, { message: 'Notification marked as read' }));
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json(formatResponse(true, { message: 'All notifications marked as read' }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
