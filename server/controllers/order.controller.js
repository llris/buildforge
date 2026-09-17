const orderService = require('../services/order.service');
const { sendSuccess } = require('../utils/response');

const checkout = async (req, res, next) => {
  try {
    const key = req.headers['idempotency-key'] || req.body.idempotencyKey;
    const checkoutResult = await orderService.checkout(req.user.id, {
      ...req.body,
      idempotencyKey: key,
    });
    return sendSuccess(res, checkoutResult, 201);
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const order = await orderService.verifyPayment(req.user.id, req.body);
    return sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
};

const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await orderService.handleRazorpayWebhook(req.body, signature);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getUserOrders(req.user.id, req.query);
    return sendSuccess(res, orders);
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.user.id, req.params.id);
    return sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const reason = req.body?.reason || 'Cancelled by customer';
    const order = await orderService.cancelOrder(req.user.id, req.params.id, reason);
    return sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkout,
  verifyPayment,
  handleRazorpayWebhook,
  getUserOrders,
  getOrderById,
  cancelOrder,
};
