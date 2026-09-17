const reviewService = require('../services/review.service');
const { sendSuccess } = require('../utils/response');

const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user.id, req.params.id, req.body);
    return sendSuccess(res, review, 201);
  } catch (err) {
    next(err);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(req.user.id, req.params.id, req.body);
    return sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(req.user.id, req.params.id, req.user.role);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

const getProductReviews = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id || null;
    const data = await reviewService.getProductReviews(req.params.id, currentUserId);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getUserReviews(req.user.id);
    return sendSuccess(res, reviews);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getUserReviews,
};
