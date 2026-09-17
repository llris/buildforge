const prisma = require('../utils/prisma');
const { NotFoundError, ValidationError } = require('../utils/AppError');
const auditService = require('./audit.service');

const getUsers = async ({
  page = 1,
  limit = 20,
  search = '',
  role,
  isActive,
}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) where.role = role;
  if (isActive !== undefined && isActive !== '') {
    where.isActive = isActive === 'true' || isActive === true;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        termsVersion: true,
        termsAcceptedAt: true,
        createdAt: true,
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    }),
  ]);

  return {
    users,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const changeUserRole = async (actorId, targetUserId, newRole) => {
  const validRoles = ['CUSTOMER', 'ADMIN', 'SUPPORT'];
  if (!validRoles.includes(newRole)) {
    throw new ValidationError(`Invalid role: ${newRole}. Must be one of: ${validRoles.join(', ')}`);
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new NotFoundError(`User with ID "${targetUserId}" not found`);
  }

  // 1. Prevent self-demotion
  if (actorId === targetUserId && newRole !== 'ADMIN') {
    throw new ValidationError('Security policy violation: You cannot demote your own account from the ADMIN role');
  }

  // 2. Prevent demoting the last remaining ADMIN
  if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
    const activeAdminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true },
    });
    if (activeAdminCount <= 1) {
      throw new ValidationError('Security lockout protection: Cannot demote the last remaining active ADMIN account in the system');
    }
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await auditService.recordAuditLog({
      actorId,
      action: 'CHANGE_USER_ROLE',
      entityType: 'User',
      entityId: targetUserId,
      before: { role: targetUser.role },
      after: { role: newRole },
      tx,
    });

    return updated;
  });

  return updatedUser;
};

const toggleUserStatus = async (actorId, targetUserId) => {
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new NotFoundError(`User with ID "${targetUserId}" not found`);
  }

  // If currently active, we are deactivating
  if (targetUser.isActive) {
    // 1. Prevent self-deactivation
    if (actorId === targetUserId) {
      throw new ValidationError('Security policy violation: You cannot deactivate your own account');
    }

    // 2. Prevent deactivating last remaining admin
    if (targetUser.role === 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdminCount <= 1) {
        throw new ValidationError('Security lockout protection: Cannot deactivate the last remaining active ADMIN account in the system');
      }
    }
  }

  const newStatus = !targetUser.isActive;

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: targetUserId },
      data: { isActive: newStatus },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await auditService.recordAuditLog({
      actorId,
      action: 'TOGGLE_USER_STATUS',
      entityType: 'User',
      entityId: targetUserId,
      before: { isActive: targetUser.isActive },
      after: { isActive: newStatus },
      tx,
    });

    return updated;
  });

  return updatedUser;
};

module.exports = {
  getUsers,
  changeUserRole,
  toggleUserStatus,
};
