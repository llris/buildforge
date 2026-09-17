const prisma = require('../utils/prisma');

const createReservation = async (tx, { productId, qty, orderId, expiresAt }) => {
  const db = tx || prisma;
  return await db.stockReservation.create({
    data: {
      productId,
      qty,
      orderId,
      expiresAt,
      status: 'ACTIVE',
    },
  });
};

const findReservationsByOrderId = async (tx, orderId) => {
  const db = tx || prisma;
  return await db.stockReservation.findMany({
    where: { orderId, status: 'ACTIVE' },
  });
};

const releaseReservationsForOrder = async (tx, orderId, newStatus = 'RELEASED') => {
  const db = tx || prisma;
  return await db.stockReservation.updateMany({
    where: { orderId, status: 'ACTIVE' },
    data: { status: newStatus },
  });
};

const findExpiredReservations = async () => {
  return await prisma.stockReservation.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: new Date() },
    },
  });
};

module.exports = {
  createReservation,
  findReservationsByOrderId,
  releaseReservationsForOrder,
  findExpiredReservations,
};
