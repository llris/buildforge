const { z } = require('zod');

const createAddressSchema = z.object({
  body: z.object({
    street: z.string().min(3, 'Street is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State/Province is required'),
    zip: z.string().min(2, 'Zip/Postal code is required'),
    country: z.string().min(2, 'Country is required'),
    isDefault: z.boolean().optional().default(false),
  }),
});

const addressIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid address ID'),
  }),
});

const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid address ID'),
  }),
  body: z.object({
    street: z.string().min(3, 'Street is required').optional(),
    city: z.string().min(2, 'City is required').optional(),
    state: z.string().min(2, 'State/Province is required').optional(),
    zip: z.string().min(2, 'Zip/Postal code is required').optional(),
    country: z.string().min(2, 'Country is required').optional(),
    isDefault: z.boolean().optional(),
  }),
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
};
