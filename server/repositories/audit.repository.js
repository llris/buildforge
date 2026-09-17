const prisma = require('../utils/prisma');

const createAuditLog = async (tx, { actorId, action, entityType, entityId, before, after }) => {
  const db = tx || prisma;
  return db.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId: String(entityId),
      before: before !== undefined ? before : null,
      after: after !== undefined ? after : null,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

const findAuditLogsPaginated = async ({
  page = 1,
  limit = 20,
  actorId,
  action,
  entityType,
  startDate,
  endDate,
}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (actorId) where.actorId = actorId;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (entityType) where.entityType = { equals: entityType, mode: 'insensitive' };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
  ]);

  return {
    logs,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

module.exports = {
  createAuditLog,
  findAuditLogsPaginated,
};
