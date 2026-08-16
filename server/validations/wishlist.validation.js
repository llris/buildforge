const { z } = require('zod');

const addItemSchema = {
  body: z.object({
    productId: z.string().uuid('Invalid product ID format'),
  }),
};

const deleteItemSchema = {
  params: z.object({
    id: z.string().uuid('Invalid wishlist item ID format'),
  }),
};

const moveToCartSchema = {
  params: z.object({
    id: z.string().uuid('Invalid wishlist item ID format'),
  }),
};

module.exports = {
  addItemSchema,
  deleteItemSchema,
  moveToCartSchema,
};
