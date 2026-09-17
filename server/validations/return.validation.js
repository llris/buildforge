const { z } = require('zod');

const createReturnSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid('Invalid product ID'),
          qty: z.number().int().min(1, 'Quantity must be at least 1'),
          reason: z.string().optional(),
        })
      )
      .min(1, 'At least one item must be selected for return'),
    reason: z.string().min(5, 'Please provide a reason of at least 5 characters').max(1000),
  }),
});

module.exports = {
  createReturnSchema,
};
