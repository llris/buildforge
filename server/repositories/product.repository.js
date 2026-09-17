const prisma = require('../utils/prisma');

const findManyWithFilters = async ({ where, orderBy, skip, take }) => {
  const [items, totalItems] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        inventory: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, totalItems };
};

const findBySlugWithDetails = async (slug) => {
  return await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      inventory: true,
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      },
    },
  });
};

const findManyByIds = async (ids) => {
  return await prisma.product.findMany({
    where: { id: { in: ids } },
    include: {
      category: true,
      inventory: true,
    },
  });
};

const findRelatedProducts = async (categoryId, excludeProductId) => {
  return await prisma.product.findMany({
    where: {
      categoryId,
      id: { not: excludeProductId },
      isActive: true,
    },
    take: 4,
    include: {
      inventory: true,
    },
  });
};

const findByIdWithInventory = async (id, tx = null) => {
  const db = tx || prisma;
  return await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      inventory: true,
    },
  });
};

const findInventoryByProductId = async (productId, tx = null) => {
  const db = tx || prisma;
  return await db.inventory.findUnique({
    where: { productId },
  });
};

const updateInventory = async (productId, data, tx = null) => {
  const db = tx || prisma;
  return await db.inventory.update({
    where: { productId },
    data,
  });
};

module.exports = {
  findManyWithFilters,
  findBySlugWithDetails,
  findManyByIds,
  findRelatedProducts,
  findByIdWithInventory,
  findInventoryByProductId,
  updateInventory,
};
