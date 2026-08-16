const prisma = require('../utils/prisma');

const findAlertsByUserId = async (userId) => {
  return await prisma.priceAlert.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          inventory: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findAlert = async (userId, productId) => {
  return await prisma.priceAlert.findFirst({
    where: { userId, productId },
  });
};

const findAlertById = async (alertId) => {
  return await prisma.priceAlert.findUnique({
    where: { id: alertId },
  });
};

const createOrUpdateAlert = async (userId, productId, targetPrice) => {
  const existing = await findAlert(userId, productId);
  if (existing) {
    return await prisma.priceAlert.update({
      where: { id: existing.id },
      data: { targetPrice },
      include: {
        product: {
          include: {
            inventory: true,
          },
        },
      },
    });
  }

  return await prisma.priceAlert.create({
    data: {
      userId,
      productId,
      targetPrice,
    },
    include: {
      product: {
        include: {
          inventory: true,
        },
      },
    },
  });
};

const deleteAlert = async (alertId, userId) => {
  return await prisma.priceAlert.deleteMany({
    where: { id: alertId, userId },
  });
};

const deleteAlertByProduct = async (userId, productId) => {
  return await prisma.priceAlert.deleteMany({
    where: { userId, productId },
  });
};

module.exports = {
  findAlertsByUserId,
  findAlert,
  findAlertById,
  createOrUpdateAlert,
  deleteAlert,
  deleteAlertByProduct,
};
