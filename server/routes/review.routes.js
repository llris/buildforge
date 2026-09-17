const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
  productIdParamSchema,
} = require('../validations/review.validation');

// Authenticated user's own reviews
router.get('/me', requireAuth, reviewController.getUserReviews);

// Modify user's review
router.patch('/:id', requireAuth, validate(updateReviewSchema), reviewController.updateReview);
router.delete('/:id', requireAuth, validate(reviewIdParamSchema), reviewController.deleteReview);

module.exports = router;
