const notificationRepository = require('../repositories/notification.repository');
const logger = require('../utils/logger');

const notifyUser = async ({ userId, type, title, body, tx = null }) => {
  try {
    if (!userId) return null;
    return await notificationRepository.createNotification(tx, {
      userId,
      type,
      title,
      body,
    });
  } catch (error) {
    logger.error(`Failed to create notification for user ${userId}: ${error.message}`);
    return null;
  }
};

const getUserNotifications = async (userId, queryParams) => {
  return notificationRepository.findUserNotifications(userId, queryParams);
};

const markAsRead = async (userId, notificationId) => {
  return notificationRepository.markAsRead(userId, notificationId);
};

const markAllAsRead = async (userId) => {
  return notificationRepository.markAllAsRead(userId);
};

module.exports = {
  notifyUser,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
