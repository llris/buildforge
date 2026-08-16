const { z } = require('zod');

const addItemSchema = {
  body: z.object({
    productId: z.string().uuid('Invalid product ID format'),
    qty: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  }),
};

const updateItemSchema = {
  params: z.object({
    id: z.string().uuid('Invalid cart item ID format'),
  }),
  body: z.object({
    qty: z.number().int().min(1, 'Quantity must be at least 1'),
  }),
};

const deleteItemSchema = {
  params: z.object({
    id: z.string().uuid('Invalid cart item ID format'),
  }),
};

const mergeCartSchema = {
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string().uuid('Invalid product ID format'),
        qty: z.number().int().min(1, 'Quantity must be at least 1'),
      })
    ),
  }),
};

const applyCouponSchema = {
  body: z.object({
    code: z.string().trim().min(1, 'Coupon code is required'),
    subtotal: z.number().nonnegative().optional(),
  }),
};

module.exports = {
  addItemSchema,
  updateItemSchema,
  deleteItemSchema,
  mergeCartSchema,
  applyCouponSchema,
};
