const prisma = require('../utils/prisma');
const returnRepo = require('../repositories/return.repository');
const orderRepo = require('../repositories/order.repository');
const { NotFoundError, ValidationError, UnauthorizedError } = require('../utils/AppError');

const RETURN_WINDOW_DAYS = 7;
const RETURN_WINDOW_MS = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Creates a new return request for a delivered order within 7 days.
 */
const createReturn = async (userId, orderId, { items, reason }) => {
  const order = await orderRepo.findOrderById(prisma, orderId);
  if (!order) {
    throw new NotFoundError(`Order ${orderId} not found`);
  }

  if (order.userId !== userId) {
    throw new UnauthorizedError('Unauthorized to request return for this order');
  }

  if (order.status !== 'DELIVERED') {
    throw new ValidationError(`Returns are only allowed for DELIVERED orders. Current status: ${order.status}`);
  }

  // 1. Calculate delivery date from status history or updatedAt
  const deliveredHistory = order.statusHistory?.find((h) => h.status === 'DELIVERED');
  const deliveredAt = deliveredHistory ? new Date(deliveredHistory.createdAt) : new Date(order.updatedAt);
  const now = new Date();

  if (now.getTime() - deliveredAt.getTime() > RETURN_WINDOW_MS) {
    throw new ValidationError(`Return window expired. Returns must be requested within ${RETURN_WINDOW_DAYS} days of delivery.`);
  }

  // 2. Validate returned items against order items
  const orderItemMap = new Map();
  for (const item of order.items) {
    orderItemMap.set(item.productId, item.qty);
  }

  const validatedItems = [];
  for (const retItem of items) {
    const purchasedQty = orderItemMap.get(retItem.productId);
    if (!purchasedQty) {
      throw new ValidationError(`Product ${retItem.productId} was not part of this order`);
    }
    if (retItem.qty > purchasedQty) {
      throw new ValidationError(`Cannot return ${retItem.qty} units of product ${retItem.productId}. Only ${purchasedQty} purchased.`);
    }

    const orderProduct = order.items.find((i) => i.productId === retItem.productId)?.product;

    validatedItems.push({
      productId: retItem.productId,
      name: orderProduct?.name || 'Product',
      slug: orderProduct?.slug || '',
      brand: orderProduct?.brand || '',
      image: orderProduct?.images?.[0] || '',
      qty: retItem.qty,
      reason: retItem.reason || reason,
    });
  }

  // 3. Create Return record with status REQUESTED
  return await returnRepo.createReturn({
    orderId,
    items: validatedItems,
    reason,
    status: 'REQUESTED',
  });
};

/**
 * Fetches all return requests for the authenticated user.
 */
const getUserReturns = async (userId) => {
  return await returnRepo.findReturnsByUserId(userId);
};

module.exports = {
  createReturn,
  getUserReturns,
  RETURN_WINDOW_DAYS,
  RETURN_WINDOW_MS,
};
