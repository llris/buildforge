const prisma = require('../utils/prisma');

const createNotification = async (tx, { userId, type, title, body }) => {
  const db = tx || prisma;
  return db.notification.create({
    data: {
      userId,
      type,
      title,
      body,
    },
  });
};

const findUserNotifications = async (userId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const [total, unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    notifications,
    unreadCount,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const markAsRead = async (userId, notificationId) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
};

const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

module.exports = {
  createNotification,
  findUserNotifications,
  markAsRead,
  markAllAsRead,
};
