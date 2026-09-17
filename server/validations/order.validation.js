const { z } = require('zod');

const checkoutSchema = z.object({
  body: z.object({
    addressId: z.string().uuid('Invalid delivery address ID').optional(),
    newAddress: z
      .object({
        street: z.string().min(3),
        city: z.string().min(2),
        state: z.string().min(2),
        zip: z.string().min(2),
        country: z.string().min(2),
      })
      .optional(),
    shippingZoneId: z.string().uuid('Invalid shipping method ID').optional(),
    couponCode: z.string().optional(),
    idempotencyKey: z.string().min(8, 'Idempotency key must be at least 8 characters'),
  }),
});

const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
    razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
  }),
});

const cancelOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    reason: z.string().optional().default('Cancelled by customer'),
  }).optional(),
});

const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }).optional(),
});

module.exports = {
  checkoutSchema,
  verifyPaymentSchema,
  cancelOrderSchema,
  orderIdParamSchema,
  paginationQuerySchema,
};
