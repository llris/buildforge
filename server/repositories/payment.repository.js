const prisma = require('../utils/prisma');

const createPayment = async (tx, data) => {
  const db = tx || prisma;
  return await db.payment.create({
    data,
  });
};

const findPaymentByOrderId = async (tx, orderId) => {
  const db = tx || prisma;
  return await db.payment.findUnique({
    where: { orderId },
  });
};

const findPaymentByRazorpayOrderId = async (tx, razorpayOrderId) => {
  const db = tx || prisma;
  return await db.payment.findFirst({
    where: { razorpayOrderId },
    include: { order: true },
  });
};

const updatePayment = async (tx, orderId, data) => {
  const db = tx || prisma;
  return await db.payment.update({
    where: { orderId },
    data,
  });
};

module.exports = {
  createPayment,
  findPaymentByOrderId,
  findPaymentByRazorpayOrderId,
  updatePayment,
};
