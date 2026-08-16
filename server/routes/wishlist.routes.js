const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  addItemSchema,
  deleteItemSchema,
  moveToCartSchema,
} = require('../validations/wishlist.validation');

router.use(requireAuth);

router.get('/', wishlistController.getWishlist);
router.post('/items', validate(addItemSchema), wishlistController.addItem);
router.delete('/items/:id', validate(deleteItemSchema), wishlistController.removeItem);
router.post('/items/:id/move-to-cart', validate(moveToCartSchema), wishlistController.moveToCart);

module.exports = router;
