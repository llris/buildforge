const Razorpay = require('razorpay');
const prisma = require('../utils/prisma');
const { env } = require('../config/env');
const { NotFoundError, ValidationError } = require('../utils/AppError');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const { sendMail } = require('./mail');
const logger = require('../utils/logger');

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

const getReturns = async ({ page = 1, limit = 20, status }) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;

  const [total, returns] = await Promise.all([
    prisma.return.count({ where }),
    prisma.return.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            payment: { select: { status: true, provider: true, transactionId: true, razorpayPaymentId: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, images: true, slug: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    returns,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const approveReturn = async (actorId, returnId) => {
  const ret = await prisma.return.findUnique({
    where: { id: returnId },
    include: {
      order: {
        include: {
          user: true,
          payment: true,
          items: true,
        },
      },
    },
  });

  if (!ret) {
    throw new NotFoundError(`Return request #${returnId} not found`);
  }

  if (ret.status !== 'REQUESTED') {
    throw new ValidationError(`Return is already in ${ret.status} status and cannot be approved`);
  }

  const order = ret.order;
  const paymentId = order.payment?.razorpayPaymentId || order.payment?.transactionId;

  // Defensive Razorpay refund processing
  let refundId = null;
  let gatewayStatus = 'MOCK_OR_TEST_MODE';
  let gatewayNote = 'Processed in test mode';

  if (paymentId && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    try {
      const rzp = getRazorpayClient();
      const refundResponse = await rzp.payments.refund(paymentId, {
        amount: Math.round((order.totalAmount || 0) * 100),
      });
      refundId = refundResponse.id;
      gatewayStatus = 'SUCCESS';
      gatewayNote = `Refund issued successfully via Razorpay (ID: ${refundId})`;
      logger.info(`Razorpay refund successful for order ${order.id}: ${refundId}`);
    } catch (err) {
      logger.warn(`Razorpay refund API call failed in test/dev mode: ${err.message}. Proceeding with return approval defensively.`);
      refundId = `FAILED_GATEWAY_${Date.now()}`;
      gatewayStatus = 'GATEWAY_ERROR';
      gatewayNote = `Gateway refund attempt failed (${err.message}). Store credit or manual ledger adjustment required.`;
    }
  } else {
    refundId = `MANUAL_REFUND_${Date.now()}`;
    gatewayNote = 'No external payment ID on file. Recorded as manual refund.';
  }

  // Atomic database transaction: Restock + Update Return + Update Order + Audit Log
  const result = await prisma.$transaction(async (tx) => {
    // 1. Restock inventory for items in this return
    const returnItems = Array.isArray(ret.items) ? ret.items : [];
    for (const rItem of returnItems) {
      const orderItem = order.items.find((oi) => oi.id === rItem.orderItemId);
      if (orderItem && orderItem.productId) {
        await tx.inventory.updateMany({
          where: { productId: orderItem.productId },
          data: {
            stockQty: { increment: Number(rItem.qty) || 1 },
          },
        });
      }
    }

    // 2. Update Return status to REFUNDED
    const updatedReturn = await tx.return.update({
      where: { id: returnId },
      data: {
        status: 'REFUNDED',
        refundId,
      },
    });

    // 3. Update Order status to REFUNDED and add history
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'REFUNDED' },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'REFUNDED',
        comment: `Return RMA #${returnId.slice(0, 8).toUpperCase()} approved. Restocked items. ${gatewayNote}`,
      },
    });

    // 4. Record Audit Log
    await auditService.recordAuditLog({
      actorId,
      action: 'APPROVE_RETURN',
      entityType: 'Return',
      entityId: returnId,
      before: { status: ret.status, orderStatus: order.status },
      after: {
        status: 'REFUNDED',
        orderStatus: 'REFUNDED',
        refundId,
        gatewayStatus,
        gatewayNote,
      },
      tx,
    });

    return updatedReturn;
  });

  // Asynchronous user notification & email
  notificationService.notifyUser({
    userId: order.userId,
    type: 'RETURN_APPROVED',
    title: 'Return Request Approved',
    body: `Your return request for Order #${order.id.slice(0, 8).toUpperCase()} has been approved and marked as refunded.`,
  }).catch(() => {});

  sendMail({
    to: order.user.email,
    subject: `Return Approved & Refund Processed - Order #${order.id.slice(0, 8).toUpperCase()}`,
    template: 'returnApproved',
    data: {
      returnId,
      orderId: order.id,
      refundAmount: order.totalAmount,
    },
  }).catch(() => {});

  return {
    ...result,
    gatewayStatus,
    gatewayNote,
  };
};

const rejectReturn = async (actorId, returnId, { reason }) => {
  if (!reason || !reason.trim()) {
    throw new ValidationError('A reason is required to reject a return request');
  }

  const ret = await prisma.return.findUnique({
    where: { id: returnId },
    include: {
      order: {
        include: { user: true },
      },
    },
  });

  if (!ret) {
    throw new NotFoundError(`Return request #${returnId} not found`);
  }

  if (ret.status !== 'REQUESTED') {
    throw new ValidationError(`Return is already in ${ret.status} status and cannot be rejected`);
  }

  const updatedReturn = await prisma.$transaction(async (tx) => {
    const updated = await tx.return.update({
      where: { id: returnId },
      data: { status: 'REJECTED' },
    });

    await auditService.recordAuditLog({
      actorId,
      action: 'REJECT_RETURN',
      entityType: 'Return',
      entityId: returnId,
      before: { status: ret.status },
      after: { status: 'REJECTED', reason: reason.trim() },
      tx,
    });

    return updated;
  });

  // Notify user
  notificationService.notifyUser({
    userId: ret.order.userId,
    type: 'RETURN_REJECTED',
    title: 'Return Request Update',
    body: `Your return request for Order #${ret.orderId.slice(0, 8).toUpperCase()} was not approved: ${reason.trim()}`,
  }).catch(() => {});

  sendMail({
    to: ret.order.user.email,
    subject: `Update regarding Return RMA #${returnId.slice(0, 8).toUpperCase()}`,
    template: 'returnRejected',
    data: {
      returnId,
      orderId: ret.orderId,
      reason: reason.trim(),
    },
  }).catch(() => {});

  return updatedReturn;
};

module.exports = {
  getReturns,
  approveReturn,
  rejectReturn,
};
