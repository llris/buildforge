const prisma = require('../utils/prisma');

const createReview = async (data) => {
  return await prisma.review.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
};

const findReviewById = async (id) => {
  return await prisma.review.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          images: true,
        },
      },
    },
  });
};

const findUserReviewForProduct = async (userId, productId) => {
  return await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });
};

const findReviewsByProductId = async (productId) => {
  return await prisma.review.findMany({
    where: {
      productId,
      isApproved: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findReviewsByUserId = async (userId) => {
  return await prisma.review.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          images: true,
          price: true,
          discountPrice: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const updateReview = async (id, data) => {
  return await prisma.review.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
};

const deleteReview = async (id) => {
  return await prisma.review.delete({
    where: { id },
  });
};

const aggregateProductRatings = async (productId) => {
  const agg = await prisma.review.aggregate({
    where: {
      productId,
      isApproved: true,
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  const avgRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0;
  const ratingCount = agg._count.rating || 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating,
      ratingCount,
    },
  });

  return { avgRating, ratingCount };
};

module.exports = {
  createReview,
  findReviewById,
  findUserReviewForProduct,
  findReviewsByProductId,
  findReviewsByUserId,
  updateReview,
  deleteReview,
  aggregateProductRatings,
};
