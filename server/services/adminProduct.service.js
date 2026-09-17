const prisma = require('../utils/prisma');
const { NotFoundError, ConflictError } = require('../utils/AppError');
const auditService = require('./audit.service');

const getProducts = async ({
  page = 1,
  limit = 10,
  search = '',
  categoryId,
  isActive,
  sortBy = 'createdAt',
  order = 'desc',
}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (isActive !== undefined && isActive !== '') {
    where.isActive = isActive === 'true' || isActive === true;
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        inventory: { select: { stockQty: true, reservedQty: true, lowStockThreshold: true } },
      },
    }),
  ]);

  return {
    products,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const createProduct = async (actorId, data) => {
  const {
    name,
    slug,
    brand,
    price,
    discountPrice,
    categoryId,
    specs = {},
    images = [],
    isActive = true,
    stockQty = 0,
    lowStockThreshold = 5,
  } = data;

  const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const existing = await prisma.product.findUnique({ where: { slug: generatedSlug } });
  if (existing) {
    throw new ConflictError(`A product with slug "${generatedSlug}" already exists`);
  }

  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        name,
        slug: generatedSlug,
        brand,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        categoryId,
        specs,
        images: Array.isArray(images) ? images : [],
        isActive,
      },
    });

    await tx.inventory.create({
      data: {
        productId: newProduct.id,
        stockQty: Number(stockQty) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
      },
    });

    await auditService.recordAuditLog({
      actorId,
      action: 'CREATE_PRODUCT',
      entityType: 'Product',
      entityId: newProduct.id,
      before: null,
      after: newProduct,
      tx,
    });

    return newProduct;
  });

  return product;
};

const updateProduct = async (actorId, id, data) => {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { inventory: true },
  });

  if (!existing) {
    throw new NotFoundError(`Product with ID "${id}" not found`);
  }

  const updatedProduct = await prisma.$transaction(async (tx) => {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.discountPrice !== undefined) {
      updateData.discountPrice = data.discountPrice ? Number(data.discountPrice) : null;
    }
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.specs !== undefined) updateData.specs = data.specs;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const prod = await tx.product.update({
      where: { id },
      data: updateData,
    });

    await auditService.recordAuditLog({
      actorId,
      action: 'UPDATE_PRODUCT',
      entityType: 'Product',
      entityId: id,
      before: existing,
      after: prod,
      tx,
    });

    return prod;
  });

  return updatedProduct;
};

const toggleProductStatus = async (actorId, id) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Product with ID "${id}" not found`);
  }

  const newStatus = !existing.isActive;

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: { isActive: newStatus },
    });

    await auditService.recordAuditLog({
      actorId,
      action: 'TOGGLE_PRODUCT_STATUS',
      entityType: 'Product',
      entityId: id,
      before: { isActive: existing.isActive },
      after: { isActive: newStatus },
      tx,
    });

    return updated;
  });

  return product;
};

const deleteProduct = async (actorId, id) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Product with ID "${id}" not found`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.delete({ where: { id } });

    await auditService.recordAuditLog({
      actorId,
      action: 'DELETE_PRODUCT',
      entityType: 'Product',
      entityId: id,
      before: existing,
      after: null,
      tx,
    });
  });

  return { message: 'Product deleted successfully' };
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
};
