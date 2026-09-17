const prisma = require('../utils/prisma');
const reviewRepo = require('../repositories/review.repository');
const { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError } = require('../utils/AppError');

/**
 * Checks whether a user has purchased and received (DELIVERED) a product.
 */
const checkUserDeliveredPurchase = async (userId, productId) => {
  if (!userId || !productId) return false;
  const item = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        status: 'DELIVERED',
      },
    },
  });
  return !!item;
};

/**
 * Submits a new review for a product (verified purchase only).
 */
const createReview = async (userId, productId, data) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new NotFoundError(`Product ${productId} not found`);
  }

  // 1. Verify that user has a DELIVERED order with this product
  const hasDelivered = await checkUserDeliveredPurchase(userId, productId);
  if (!hasDelivered) {
    throw new ForbiddenError('Only verified buyers with a delivered order can review this product');
  }

  // 2. Check if user already reviewed this product
  const existing = await reviewRepo.findUserReviewForProduct(userId, productId);
  if (existing) {
    throw new ValidationError('You have already submitted a review for this product');
  }

  // 3. Create review
  const review = await reviewRepo.createReview({
    userId,
    productId,
    rating: data.rating,
    title: data.title || null,
    comment: data.comment || null,
    isVerifiedPurchase: true,
    isApproved: true,
  });

  // 4. Recompute product rating statistics
  await reviewRepo.aggregateProductRatings(productId);

  return review;
};

/**
 * Updates an existing review owned by the user.
 */
const updateReview = async (userId, reviewId, data) => {
  const review = await reviewRepo.findReviewById(reviewId);
  if (!review) {
    throw new NotFoundError(`Review ${reviewId} not found`);
  }

  if (review.userId !== userId) {
    throw new UnauthorizedError('You are not authorized to edit this review');
  }

  const updateData = {};
  if (data.rating !== undefined) updateData.rating = data.rating;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.comment !== undefined) updateData.comment = data.comment;

  const updated = await reviewRepo.updateReview(reviewId, updateData);

  // Recompute product ratings
  await reviewRepo.aggregateProductRatings(review.productId);

  return updated;
};

/**
 * Deletes a review owned by the user.
 */
const deleteReview = async (userId, reviewId, userRole = 'CUSTOMER') => {
  const review = await reviewRepo.findReviewById(reviewId);
  if (!review) {
    throw new NotFoundError(`Review ${reviewId} not found`);
  }

  if (review.userId !== userId && userRole !== 'ADMIN') {
    throw new UnauthorizedError('You are not authorized to delete this review');
  }

  await reviewRepo.deleteReview(reviewId);

  // Recompute product ratings
  await reviewRepo.aggregateProductRatings(review.productId);

  return { message: 'Review deleted successfully' };
};

/**
 * Fetches all reviews and statistical breakdown for a product.
 */
const getProductReviews = async (productId, currentUserId = null) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, avgRating: true, ratingCount: true },
  });

  if (!product) {
    throw new NotFoundError(`Product ${productId} not found`);
  }

  const reviews = await reviewRepo.findReviewsByProductId(productId);

  // Calculate star distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    if (distribution[r.rating] !== undefined) {
      distribution[r.rating]++;
    }
  }

  const totalReviews = reviews.length;
  const distributionPercentages = {
    1: totalReviews > 0 ? Math.round((distribution[1] / totalReviews) * 100) : 0,
    2: totalReviews > 0 ? Math.round((distribution[2] / totalReviews) * 100) : 0,
    3: totalReviews > 0 ? Math.round((distribution[3] / totalReviews) * 100) : 0,
    4: totalReviews > 0 ? Math.round((distribution[4] / totalReviews) * 100) : 0,
    5: totalReviews > 0 ? Math.round((distribution[5] / totalReviews) * 100) : 0,
  };

  let userEligibility = {
    canReview: false,
    hasPurchased: false,
    hasReviewed: false,
    existingReview: null,
  };

  if (currentUserId) {
    const hasPurchased = await checkUserDeliveredPurchase(currentUserId, productId);
    const existingReview = await reviewRepo.findUserReviewForProduct(currentUserId, productId);
    userEligibility = {
      canReview: hasPurchased && !existingReview,
      hasPurchased,
      hasReviewed: !!existingReview,
      existingReview,
    };
  }

  return {
    reviews,
    summary: {
      avgRating: product.avgRating,
      ratingCount: product.ratingCount,
      distribution,
      distributionPercentages,
    },
    userEligibility,
  };
};

/**
 * Fetches all reviews submitted by the logged-in user.
 */
const getUserReviews = async (userId) => {
  return await reviewRepo.findReviewsByUserId(userId);
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getUserReviews,
  checkUserDeliveredPurchase,
};
