const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const returnController = require('../controllers/return.controller');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { orderLimiter } = require('../middleware/rateLimiter');
const {
  checkoutSchema,
  verifyPaymentSchema,
  cancelOrderSchema,
  orderIdParamSchema,
  paginationQuerySchema,
} = require('../validations/order.validation');
const { createReturnSchema } = require('../validations/return.validation');

// Webhook endpoint (Public, signature verified inside handler)
router.post('/webhooks/razorpay', orderController.handleRazorpayWebhook);
router.post('/webhook', orderController.handleRazorpayWebhook);

// Protected routes
router.use(requireAuth);
router.get('/', validate(paginationQuerySchema), orderController.getUserOrders);
router.post('/checkout', orderLimiter, validate(checkoutSchema), orderController.checkout);
router.post('/verify-payment', validate(verifyPaymentSchema), orderController.verifyPayment);
router.get('/:id', validate(orderIdParamSchema), orderController.getOrderById);
router.post('/:id/cancel', validate(cancelOrderSchema), orderController.cancelOrder);
router.post('/:id/returns', validate(createReturnSchema), returnController.createReturn);

module.exports = router;
