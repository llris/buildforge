const { z } = require('zod');
const productService = require('../services/product.service');
const { sendSuccess } = require('../utils/response');

const getProductsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  inStock: z.string().optional(),
  specs: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const compareProductsSchema = z.object({
  productIds: z.array(z.string()).min(1).max(4),
});

const getProducts = async (req, res, next) => {
  try {
    const query = getProductsSchema.parse(req.query);
    const result = await productService.getProducts(query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug);
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
};

const compareProducts = async (req, res, next) => {
  try {
    const { productIds } = compareProductsSchema.parse(req.body);
    const products = await productService.compareProducts(productIds);
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  compareProducts,
};
