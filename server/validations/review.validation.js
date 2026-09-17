const { z } = require('zod');

const createReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5, 'Rating must be an integer between 1 and 5'),
    title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title cannot exceed 100 characters').optional().nullable(),
    comment: z.string().max(2000, 'Comment cannot exceed 2000 characters').optional().nullable(),
  }),
});

const updateReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid review ID'),
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5, 'Rating must be an integer between 1 and 5').optional(),
    title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title cannot exceed 100 characters').optional().nullable(),
    comment: z.string().max(2000, 'Comment cannot exceed 2000 characters').optional().nullable(),
  }),
});

const reviewIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid review ID'),
  }),
});

const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
  productIdParamSchema,
};
