const prisma = require('../utils/prisma');
const { NotFoundError, ConflictError } = require('../utils/AppError');
const auditService = require('./audit.service');

const getCoupons = async ({ page = 1, limit = 20, search = '' }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (search) {
    where.code = { contains: search, mode: 'insensitive' };
  }

  const [total, coupons] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    coupons,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const createCoupon = async (actorId, data) => {
  const {
    code,
    discountPercent,
    isActive = true,
    expiresAt,
    usageLimit,
    minOrderAmount = 0,
    maxDiscount,
  } = data;

  const normalizedCode = code.toUpperCase().trim();
  const existing = await prisma.coupon.findUnique({ where: { code: normalizedCode } });
  if (existing) {
    throw new ConflictError(`Coupon with code "${normalizedCode}" already exists`);
  }

  const coupon = await prisma.$transaction(async (tx) => {
    const created = await tx.coupon.create({
      data: {
        code: normalizedCode,
        discountPercent: Number(discountPercent),
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      },
    });

    await auditService.recordAuditLog({
      actorId,
      action: 'CREATE_COUPON',
      entityType: 'Coupon',
      entityId: created.id,
      before: null,
      after: created,
      tx,
    });

    return created;
  });

  return coupon;
};

const updateCoupon = async (actorId, id, data) => {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Coupon with ID "${id}" not found`);
  }

  const updateData = {};
  if (data.code !== undefined) updateData.code = data.code.toUpperCase().trim();
  if (data.discountPercent !== undefined) updateData.discountPercent = Number(data.discountPercent);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit ? Number(data.usageLimit) : null;
  if (data.minOrderAmount !== undefined) updateData.minOrderAmount = Number(data.minOrderAmount);
  if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount ? Number(data.maxDiscount) : null;

  const updatedCoupon = await prisma.$transaction(async (tx) => {
    const updated = await tx.coupon.update({
      where: { id },
      data: updateData,
    });

    await auditService.recordAuditLog({
      actorId,
      action: 'UPDATE_COUPON',
      entityType: 'Coupon',
      entityId: id,
      before: existing,
      after: updated,
      tx,
    });

    return updated;
  });

  return updatedCoupon;
};

const deleteCoupon = async (actorId, id) => {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Coupon with ID "${id}" not found`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.coupon.delete({ where: { id } });

    await auditService.recordAuditLog({
      actorId,
      action: 'DELETE_COUPON',
      entityType: 'Coupon',
      entityId: id,
      before: existing,
      after: null,
      tx,
    });
  });

  return { message: 'Coupon deleted successfully' };
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
