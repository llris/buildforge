const prisma = require('../utils/prisma');
const { NotFoundError, ValidationError } = require('../utils/AppError');
const auditService = require('./audit.service');

const getInventory = async ({
  page = 1,
  limit = 20,
  search = '',
  lowStockOnly = false,
}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (search) {
    where.product = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  // If low stock only requested, we can filter using raw SQL or by fetching records
  // For Neon / PostgreSQL, prisma supports raw or filtering stockQty <= 5
  if (lowStockOnly === true || lowStockOnly === 'true') {
    where.stockQty = { lte: 5 };
  }

  const [total, items] = await Promise.all([
    prisma.inventory.count({ where }),
    prisma.inventory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { stockQty: 'asc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            slug: true,
            price: true,
            images: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const inventoryWithStatus = items.map((inv) => ({
    ...inv,
    isLowStock: inv.stockQty <= inv.lowStockThreshold,
  }));

  return {
    items: inventoryWithStatus,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const adjustStock = async (actorId, productId, data) => {
  const { stockQty, adjustment, lowStockThreshold, reason } = data;

  if (!reason || !reason.trim()) {
    throw new ValidationError('A reason note is mandatory for inventory stock adjustments');
  }

  let inventory = await prisma.inventory.findUnique({
    where: { productId },
    include: { product: true },
  });

  if (!inventory) {
    // If inventory doesn't exist, create it
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundError(`Product with ID "${productId}" not found`);
    }
    inventory = await prisma.inventory.create({
      data: { productId, stockQty: 0, lowStockThreshold: 5 },
      include: { product: true },
    });
  }

  let newStockQty = inventory.stockQty;
  if (stockQty !== undefined) {
    newStockQty = Number(stockQty);
  } else if (adjustment !== undefined) {
    newStockQty = Math.max(0, inventory.stockQty + Number(adjustment));
  }

  if (isNaN(newStockQty) || newStockQty < 0) {
    throw new ValidationError('Stock quantity must be a non-negative number');
  }

  const newThreshold = lowStockThreshold !== undefined ? Number(lowStockThreshold) : inventory.lowStockThreshold;

  const updatedInventory = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventory.update({
      where: { productId },
      data: {
        stockQty: newStockQty,
        lowStockThreshold: newThreshold,
      },
      include: { product: true },
    });

    await auditService.recordAuditLog({
      actorId,
      action: 'ADJUST_STOCK',
      entityType: 'Inventory',
      entityId: updated.id,
      before: {
        productId,
        productName: inventory.product?.name,
        stockQty: inventory.stockQty,
        lowStockThreshold: inventory.lowStockThreshold,
      },
      after: {
        productId,
        productName: updated.product?.name,
        stockQty: updated.stockQty,
        lowStockThreshold: updated.lowStockThreshold,
        reason: reason.trim(),
      },
      tx,
    });

    return updated;
  });

  return updatedInventory;
};

module.exports = {
  getInventory,
  adjustStock,
};
