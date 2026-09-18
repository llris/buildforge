const { ValidationError, NotFoundError } = require('../utils/AppError');
const prisma = require('../utils/prisma');

const ALLOWED_TRANSITIONS = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['RETURNED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

/**
 * Checks if a transition from currentStatus to targetStatus is valid.
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {boolean}
 */
const canTransition = (currentStatus, targetStatus) => {
  if (!currentStatus || !targetStatus) return false;
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
};

/**
 * Validates transition and throws ValidationError if illegal.
 * @param {string} currentStatus
 * @param {string} targetStatus
 */
const validateTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) return;
  if (!canTransition(currentStatus, targetStatus)) {
    throw new ValidationError(
      `Illegal order status transition from ${currentStatus} to ${targetStatus}`
    );
  }
};

/**
 * Transitions an order to a targetStatus and writes an OrderStatusHistory record.
 * Must be executable inside an existing Prisma transaction or with default prisma.
 * @param {object} tx - Prisma client or transaction instance
 * @param {string} orderId
 * @param {string} targetStatus
 * @param {string} [comment]
 * @returns {Promise<object>} updated order
 */
const transitionOrder = async (tx, orderId, targetStatus, comment = null) => {
  const db = tx || prisma;

  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError(`Order with ID ${orderId} not found`);
  }

  validateTransition(order.status, targetStatus);

  if (order.status === targetStatus) {
    return order;
  }

  const statusTitles = {
    PAID: 'Payment Confirmed',
    PROCESSING: 'Order Processing',
    SHIPPED: 'Order Shipped',
    DELIVERED: 'Order Delivered',
    CANCELLED: 'Order Cancelled',
    RETURNED: 'Return Received',
    REFUNDED: 'Order Refunded',
  };

  const title = statusTitles[targetStatus] || `Order ${targetStatus}`;
  const body = comment || `Your order #${order.id.slice(0, 8).toUpperCase()} status is now ${targetStatus}.`;

  const promises = [
    db.order.update({
      where: { id: orderId },
      data: { status: targetStatus },
    }),
    db.orderStatusHistory.create({
      data: {
        orderId,
        status: targetStatus,
        comment: comment || `Status changed from ${order.status} to ${targetStatus}`,
      },
    }),
  ];

  if (order.userId && db.notification?.create) {
    promises.push(
      db.notification.create({
        data: {
          userId: order.userId,
          type: 'ORDER_STATUS',
          title,
          body,
        },
      })
    );
  }

  const [updatedOrder] = await Promise.all(promises);

  return updatedOrder;
};

module.exports = {
  ALLOWED_TRANSITIONS,
  canTransition,
  validateTransition,
  transitionOrder,
};
