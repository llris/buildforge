const productRepository = require('../repositories/product.repository');
const { NotFoundError } = require('../utils/AppError');

const getProducts = async ({
  search,
  category,
  brand,
  minPrice,
  maxPrice,
  inStock,
  specs,
  sort,
  page = 1,
  limit = 20,
}) => {
  const where = { isActive: true };

  // Search
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Exact matches
  if (category) {
    // Note: Assuming category here is category.slug. We can filter by relation.
    where.category = { slug: category };
  }
  if (brand) {
    const brands = brand.split(',').map(b => b.trim());
    where.brand = { in: brands };
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = parseFloat(minPrice);
    if (maxPrice !== undefined) where.price.lte = parseFloat(maxPrice);
  }

  // In-stock only
  if (inStock === 'true') {
    where.inventory = {
      stockQty: { gt: 0 }
    };
  }

  // Specs JSONB filtering
  if (specs) {
    try {
      const parsedSpecs = JSON.parse(specs);
      const specConditions = [];
      
      for (const [key, value] of Object.entries(parsedSpecs)) {
        if (value) {
          specConditions.push({
            specs: {
              path: [key],
              equals: value
            }
          });
        }
      }

      if (specConditions.length > 0) {
        if (!where.AND) where.AND = [];
        where.AND.push(...specConditions);
      }
    } catch (err) {
      // If JSON is invalid, ignore or log
      console.warn('Failed to parse specs query param:', specs);
    }
  }

  // Sorting
  let orderBy = { createdAt: 'desc' }; // default newest
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  else if (sort === 'price_desc') orderBy = { price: 'desc' };
  else if (sort === 'rating') orderBy = { avgRating: 'desc' };
  // Popularity could be based on orderItems, but we'll fallback to rating for now if not defined explicitly

  const skip = (page - 1) * limit;

  const { items, totalItems } = await productRepository.findManyWithFilters({
    where,
    orderBy,
    skip,
    take: parseInt(limit, 10),
  });

  return {
    items,
    meta: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page, 10),
      limit: parseInt(limit, 10),
    }
  };
};

const getProductBySlug = async (slug) => {
  const product = await productRepository.findBySlugWithDetails(slug);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const relatedProducts = await productRepository.findRelatedProducts(product.categoryId, product.id);

  return {
    ...product,
    relatedProducts
  };
};

const compareProducts = async (productIds) => {
  const products = await productRepository.findManyByIds(productIds);
  return products;
};

module.exports = {
  getProducts,
  getProductBySlug,
  compareProducts,
};
