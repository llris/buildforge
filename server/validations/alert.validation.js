const { z } = require('zod');

const createAlertSchema = {
  body: z.object({
    productId: z.string().uuid('Invalid product ID format'),
    targetPrice: z.number().positive('Target price must be a positive number'),
  }),
};

const deleteAlertSchema = {
  params: z.object({
    id: z.string().uuid('Invalid alert ID format'),
  }),
};

module.exports = {
  createAlertSchema,
  deleteAlertSchema,
};
