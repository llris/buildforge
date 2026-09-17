const crypto = require('crypto');
const Razorpay = require('razorpay');
const prisma = require('../utils/prisma');
const { env } = require('../config/env');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../utils/AppError');
const orderStateMachine = require('./orderStateMachine.service');
const mailService = require('./mail');
const cartRepo = require('../repositories/cart.repository');
const couponRepo = require('../repositories/coupon.repository');
const shippingRepo = require('../repositories/shipping.repository');
const addressRepo = require('../repositories/address.repository');
const reservationRepo = require('../repositories/reservation.repository');
const paymentRepo = require('../repositories/payment.repository');
const orderRepo = require('../repositories/order.repository');
const productRepo = require('../repositories/product.repository');

// Razorpay client instance
let razorpayClient = null;
const getRazorpayClient = () => {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
};

/**
 * Creates an order & Razorpay checkout session with stock reservation in a single transaction.
 */
const checkout = async (userId, { addressId, newAddress, shippingZoneId, couponCode, idempotencyKey }) => {
  // Check for existing order with same idempotencyKey
  if (idempotencyKey) {
    const existingOrder = await orderRepo.findOrderByIdempotencyKey(prisma, idempotencyKey);
    if (existingOrder) {
      if (existingOrder.userId !== userId) {
        throw new ValidationError('Idempotency key conflict');
      }
      return {
        orderId: existingOrder.id,
        razorpayOrderId: existingOrder.payment?.razorpayOrderId,
        amount: existingOrder.totalAmount,
        currency: 'USD',
        keyId: env.RAZORPAY_KEY_ID,
        subtotal: existingOrder.subtotal,
        taxAmount: existingOrder.taxAmount,
        shippingFee: existingOrder.shippingFee,
        discountAmount: existingOrder.discountAmount,
        total: existingOrder.totalAmount,
      };
    }
  }

  // 1. Fetch user's cart
  const cart = await cartRepo.findCartByUserId(userId);
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new ValidationError('Your cart is empty');
  }

  // 2. Resolve Shipping Address
  let shippingAddressSnapshot = null;
  if (addressId) {
    const addr = await addressRepo.findAddressById(addressId);
    if (!addr || addr.userId !== userId) {
      throw new NotFoundError('Selected delivery address not found');
    }
    shippingAddressSnapshot = {
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
    };
  } else if (newAddress) {
    shippingAddressSnapshot = newAddress;
    // Persist new address for user
    await addressRepo.createAddress({
      ...newAddress,
      userId,
      isDefault: false,
    });
  } else {
    // Default to user's default address
    const addresses = await addressRepo.findAddressesByUserId(userId);
    if (addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      shippingAddressSnapshot = {
        street: defaultAddr.street,
        city: defaultAddr.city,
        state: defaultAddr.state,
        zip: defaultAddr.zip,
        country: defaultAddr.country,
      };
    } else {
      throw new ValidationError('Delivery address is required');
    }
  }

  // 3. Resolve Shipping Method & Fee
  let shippingFee = 15.0; // Default base fee
  if (shippingZoneId) {
    const zone = await shippingRepo.findShippingZoneById(shippingZoneId);
    if (zone) {
      shippingFee = zone.fee;
    }
  } else {
    // Attempt region match
    const zone = await shippingRepo.findShippingZoneByRegion(shippingAddressSnapshot.country);
    if (zone) shippingFee = zone.fee;
  }

  // 4. Compute Financials Server-Side
  let subtotal = 0;
  cart.items.forEach((item) => {
    const unitPrice = item.product.discountPrice ?? item.product.price;
    subtotal += unitPrice * item.qty;
  });
  subtotal = Math.round(subtotal * 100) / 100;

  // Validate & Compute Coupon Discount
  let discountAmount = 0;
  let validatedCoupon = null;
  if (couponCode) {
    const coupon = await couponRepo.findByCode(couponCode.trim());
    if (
      coupon &&
      coupon.isActive &&
      (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) &&
      (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
      (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount)
    ) {
      validatedCoupon = coupon;
      discountAmount = (subtotal * coupon.discountPercent) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
      discountAmount = Math.round(discountAmount * 100) / 100;
    }
  }

  // Tax calculation
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  let taxRatePercent = 7.5; // Default standard tax rate
  const taxRule = await shippingRepo.findTaxRuleByRegion(shippingAddressSnapshot.country);
  if (taxRule) {
    taxRatePercent = taxRule.ratePercent;
  }
  const taxAmount = Math.round(((discountedSubtotal * taxRatePercent) / 100) * 100) / 100;
  const totalAmount = Math.round((discountedSubtotal + taxAmount + shippingFee) * 100) / 100;

  // 5. Execute in Single Database Transaction with 20s timeout
  const result = await prisma.$transaction(
    async (tx) => {
      // a. Validate stock and reserve for each item
    const reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min TTL

    for (const item of cart.items) {
      const inventory = await productRepo.findInventoryByProductId(item.productId, tx);

      const stockQty = inventory?.stockQty || 0;
      const reservedQty = inventory?.reservedQty || 0;
      const available = Math.max(0, stockQty - reservedQty);

      if (item.qty > available) {
        throw new ValidationError(
          `Insufficient stock for "${item.product.name}". Available: ${available}, requested: ${item.qty}`
        );
      }

      // Increment inventory reservedQty
      await productRepo.updateInventory(
        item.productId,
        { reservedQty: { increment: item.qty } },
        tx
      );
    }

    // b. Create Order (status PENDING)
    const order = await orderRepo.createOrder(tx, {
      userId,
      status: 'PENDING',
      subtotal,
      discountAmount,
      taxAmount,
      shippingFee,
      totalAmount,
      shippingAddress: shippingAddressSnapshot,
      idempotencyKey,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          priceSnapshot: item.product.discountPrice ?? item.product.price,
        })),
      },
      statusHistory: {
        create: {
          status: 'PENDING',
          comment: 'Order created, awaiting payment',
        },
      },
    });

    // c. Create StockReservation records
    for (const item of cart.items) {
      await reservationRepo.createReservation(tx, {
        productId: item.productId,
        qty: item.qty,
        orderId: order.id,
        expiresAt: reservationExpiresAt,
      });
    }

    // d. Create Razorpay order
    const rzp = getRazorpayClient();
    const rzpOrder = await rzp.orders.create({
      amount: Math.round(totalAmount * 100), // In smallest currency unit (cents/paise)
      currency: 'USD',
      receipt: order.id,
      notes: {
        orderId: order.id,
        userId,
      },
    });

    // e. Create Payment record
    await paymentRepo.createPayment(tx, {
      orderId: order.id,
      amount: totalAmount,
      provider: 'RAZORPAY',
      status: 'PENDING',
      razorpayOrderId: rzpOrder.id,
    });

      return {
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: totalAmount,
        currency: rzpOrder.currency || 'USD',
        keyId: env.RAZORPAY_KEY_ID,
        subtotal,
        taxAmount,
        shippingFee,
        discountAmount,
        total: totalAmount,
      };
    },
    { maxWait: 10000, timeout: 20000 }
  );

  return result;
};

/**
 * Verifies Razorpay payment signature and completes the order in a transaction.
 */
const verifyPayment = async (userId, { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  // 1. Verify Razorpay HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new ValidationError('Invalid payment signature');
  }

  // 2. Process Order Completion in a Transaction
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const order = await orderRepo.findOrderById(tx, orderId);

    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found`);
    }

    // Idempotent return if already paid
    if (order.status === 'PAID') {
      return order;
    }

    if (order.status === 'CANCELLED') {
      throw new ValidationError('Cannot pay for a cancelled order');
    }

    // a. Transition Order status PENDING -> PAID (records OrderStatusHistory)
    await orderStateMachine.transitionOrder(tx, order.id, 'PAID', 'Payment verified successfully');

    // b. Update Payment record
    await paymentRepo.updatePayment(tx, order.id, {
      status: 'COMPLETED',
      transactionId: razorpayPaymentId,
      razorpayPaymentId,
      razorpaySignature,
    });

    // c. Fulfill stock reservations & decrement stockQty / reservedQty
    for (const item of order.items) {
      await productRepo.updateInventory(
        item.productId,
        {
          stockQty: { decrement: item.qty },
          reservedQty: { decrement: item.qty },
        },
        tx
      );
    }

    await reservationRepo.releaseReservationsForOrder(tx, order.id, 'FULFILLED');

    // d. Clear user's cart
    await cartRepo.clearCart(order.userId, tx);

    return await orderRepo.findOrderById(tx, orderId);
  }, { maxWait: 10000, timeout: 20000 });

  // 3. Send Order Confirmation Email (non-blocking)
  if (updatedOrder && updatedOrder.user?.email) {
    mailService
      .sendMail({
        to: updatedOrder.user.email,
        subject: `Order Confirmed: #${updatedOrder.id.slice(0, 8).toUpperCase()}`,
        template: 'orderConfirmation',
        data: {
          orderId: updatedOrder.id,
          totalAmount: updatedOrder.totalAmount,
          items: updatedOrder.items,
          shippingAddress: updatedOrder.shippingAddress,
        },
      })
      .catch((err) => console.error('Failed to send order email:', err));
  }

  return updatedOrder;
};

/**
 * Handles Razorpay webhook events idempotently.
 */
const handleRazorpayWebhook = async (rawBody, signature) => {
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET;

  if (signature && webhookSecret) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new ValidationError('Invalid webhook signature');
    }
  }

  const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  const event = payload.event;

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;

    if (razorpayOrderId) {
      const payment = await paymentRepo.findPaymentByRazorpayOrderId(prisma, razorpayOrderId);
      if (payment && payment.order && payment.order.status === 'PENDING') {
        await prisma.$transaction(async (tx) => {
          await orderStateMachine.transitionOrder(
            tx,
            payment.order.id,
            'PAID',
            `Paid via Webhook (${event})`
          );

          await paymentRepo.updatePayment(tx, payment.order.id, {
            status: 'COMPLETED',
            transactionId: razorpayPaymentId || payment.transactionId,
            razorpayPaymentId: razorpayPaymentId || payment.razorpayPaymentId,
          });

          // Decrement inventory
          const order = await orderRepo.findOrderById(tx, payment.order.id);
          for (const item of (order?.items || [])) {
            await productRepo.updateInventory(
              item.productId,
              {
                stockQty: { decrement: item.qty },
                reservedQty: { decrement: item.qty },
              },
              tx
            );
          }

          await reservationRepo.releaseReservationsForOrder(tx, payment.order.id, 'FULFILLED');

          // Clear cart
          await cartRepo.clearCart(payment.order.userId, tx);
        });
      }
    }
  }

  return { received: true };
};

/**
 * Cancels an order and restocks/releases inventory in a transaction.
 */
const cancelOrder = async (userId, orderId, reason = 'Cancelled by customer') => {
  return await prisma.$transaction(async (tx) => {
    const order = await orderRepo.findOrderById(tx, orderId);

    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found`);
    }

    if (order.userId !== userId && order.user?.role !== 'ADMIN') {
      throw new UnauthorizedError('Unauthorized to cancel this order');
    }

    if (!['PENDING', 'PAID', 'PROCESSING'].includes(order.status)) {
      throw new ValidationError(`Cannot cancel order in ${order.status} status`);
    }

    const previousStatus = order.status;

    // Transition to CANCELLED via State Machine
    await orderStateMachine.transitionOrder(tx, order.id, 'CANCELLED', reason);

    if (previousStatus === 'PENDING') {
      // Release stock reservations
      for (const item of order.items) {
        await productRepo.updateInventory(
          item.productId,
          {
            reservedQty: { decrement: item.qty },
          },
          tx
        );
      }
      await reservationRepo.releaseReservationsForOrder(tx, order.id, 'CANCELLED');
    } else if (previousStatus === 'PAID' || previousStatus === 'PROCESSING') {
      // Restock inventory
      for (const item of order.items) {
        await productRepo.updateInventory(
          item.productId,
          {
            stockQty: { increment: item.qty },
          },
          tx
        );
      }
    }

    return await orderRepo.findOrderById(tx, orderId);
  }, { maxWait: 10000, timeout: 20000 });
};

/**
 * Cleanup expired stock reservations (>15 min) and cancel abandoned orders.
 */
const cleanupExpiredReservations = async () => {
  const expired = await reservationRepo.findExpiredReservations();
  if (expired.length === 0) return { cleanedCount: 0 };

  let count = 0;
  for (const res of expired) {
    await prisma.$transaction(async (tx) => {
      // Release reservation
      await productRepo.updateInventory(
        res.productId,
        {
          reservedQty: { decrement: res.qty },
        },
        tx
      );

      await tx.stockReservation.update({
        where: { id: res.id },
        data: { status: 'EXPIRED' },
      });

      // If order is still pending, cancel it
      if (res.orderId) {
        const order = await orderRepo.findOrderById(tx, res.orderId);
        if (order && order.status === 'PENDING') {
          await orderStateMachine.transitionOrder(
            tx,
            order.id,
            'CANCELLED',
            'Stock reservation expired'
          );
        }
      }
    });
    count++;
  }

  return { cleanedCount: count };
};

const getOrderById = async (userId, orderId) => {
  const order = await orderRepo.findOrderById(prisma, orderId);
  if (!order) {
    throw new NotFoundError(`Order ${orderId} not found`);
  }
  if (order.userId !== userId) {
    throw new UnauthorizedError('Unauthorized to view this order');
  }
  return order;
};

const getUserOrders = async (userId, options = {}) => {
  const page = options.page ? parseInt(options.page, 10) : 1;
  const limit = options.limit ? parseInt(options.limit, 10) : 10;
  return await orderRepo.findOrdersByUserIdPaginated(userId, { page, limit });
};

module.exports = {
  checkout,
  verifyPayment,
  handleRazorpayWebhook,
  cancelOrder,
  cleanupExpiredReservations,
  getOrderById,
  getUserOrders,
  getRazorpayClient,
};
