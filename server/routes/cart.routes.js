const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  addItemSchema,
  updateItemSchema,
  deleteItemSchema,
  mergeCartSchema,
  applyCouponSchema,
} = require('../validations/cart.validation');

// Coupon validation (supports guest or authenticated)
router.post('/apply-coupon', validate(applyCouponSchema), cartController.applyCoupon);

// Authenticated Cart Operations
router.get('/', requireAuth, cartController.getCart);
router.post('/items', requireAuth, validate(addItemSchema), cartController.addItem);
router.patch('/items/:id', requireAuth, validate(updateItemSchema), cartController.updateItem);
router.delete('/items/:id', requireAuth, validate(deleteItemSchema), cartController.removeItem);
router.delete('/', requireAuth, cartController.clearCart);
router.post('/merge', requireAuth, validate(mergeCartSchema), cartController.mergeCart);

module.exports = router;
