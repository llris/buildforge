const prisma = require('../utils/prisma');
const { NotFoundError } = require('../utils/AppError');
const orderStateMachine = require('./orderStateMachine.service');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const { sendMail } = require('./mail');

const getOrders = async ({
  page = 1,
  limit = 20,
  status,
  search = '',
  startDate,
  endDate,
}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, images: true, slug: true } },
          },
        },
        payment: { select: { status: true, provider: true, transactionId: true } },
        returns: { select: { id: true, status: true } },
      },
    }),
  ]);

  return {
    orders,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const getOrderById = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, images: true, slug: true, brand: true } },
        },
      },
      payment: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      returns: {
        include: {
          order: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError(`Order with ID "${id}" not found`);
  }

  return order;
};

const advanceOrderStatus = async (actorId, orderId, { status: targetStatus, trackingNote, comment }) => {
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { product: true } },
      payment: true,
    },
  });

  if (!existingOrder) {
    throw new NotFoundError(`Order with ID "${orderId}" not found`);
  }

  const auditComment = comment || (trackingNote ? `Dispatched with note: ${trackingNote}` : `Advanced to ${targetStatus}`);

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await orderStateMachine.transitionOrder(tx, orderId, targetStatus, auditComment);

    await auditService.recordAuditLog({
      actorId,
      action: 'ADVANCE_ORDER_STATUS',
      entityType: 'Order',
      entityId: orderId,
      before: { status: existingOrder.status },
      after: { status: targetStatus, trackingNote, comment: auditComment },
      tx,
    });

    return updated;
  });

  // Notifications and emails (Asynchronous)
  if (targetStatus === 'SHIPPED') {
    await notificationService.notifyUser({
      userId: existingOrder.userId,
      type: 'ORDER_SHIPPED',
      title: 'Order Shipped!',
      body: `Your order #${orderId.slice(0, 8).toUpperCase()} has shipped. ${trackingNote ? `Tracking: ${trackingNote}` : ''}`,
    });

    sendMail({
      to: existingOrder.user.email,
      subject: `Your BuildForge Order #${orderId.slice(0, 8).toUpperCase()} Has Shipped`,
      template: 'shippingUpdate',
      data: {
        orderId,
        trackingNote,
        items: existingOrder.items,
      },
    }).catch(() => {});
  } else if (targetStatus === 'DELIVERED') {
    await notificationService.notifyUser({
      userId: existingOrder.userId,
      type: 'ORDER_DELIVERED',
      title: 'Order Delivered!',
      body: `Your order #${orderId.slice(0, 8).toUpperCase()} has been marked as delivered. Enjoy your hardware!`,
    });

    sendMail({
      to: existingOrder.user.email,
      subject: `Your BuildForge Order #${orderId.slice(0, 8).toUpperCase()} Has Been Delivered`,
      template: 'orderDelivered',
      data: {
        orderId,
        items: existingOrder.items,
      },
    }).catch(() => {});
  }

  return getOrderById(orderId);
};

module.exports = {
  getOrders,
  getOrderById,
  advanceOrderStatus,
};
