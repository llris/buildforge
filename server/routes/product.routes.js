const express = require('express');
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const qaController = require('../controllers/qa.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createReviewSchema } = require('../validations/review.validation');
const { createQuestionSchema } = require('../validations/qa.validation');

const router = express.Router();

router.get('/', productController.getProducts);
router.post('/compare', productController.compareProducts);
router.get('/:slug', productController.getProductBySlug);

// Product Reviews
router.get('/:id/reviews', optionalAuth, reviewController.getProductReviews);
router.post('/:id/reviews', requireAuth, validate(createReviewSchema), reviewController.createReview);

// Product Q&A
router.get('/:id/questions', qaController.getProductQuestions);
router.post('/:id/questions', requireAuth, validate(createQuestionSchema), qaController.createQuestion);

module.exports = router;
