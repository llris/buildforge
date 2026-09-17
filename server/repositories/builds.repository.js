const prisma = require('../utils/prisma');

const createBuild = async (data) => {
  return prisma.savedBuild.create({
    data,
    include: {
      shares: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

const findBuildById = async (id) => {
  return prisma.savedBuild.findUnique({
    where: { id },
    include: {
      shares: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

const findBuildsByUserId = async (userId) => {
  return prisma.savedBuild.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      shares: true,
    },
  });
};

const updateBuild = async (id, data) => {
  return prisma.savedBuild.update({
    where: { id },
    data,
    include: {
      shares: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

const deleteBuild = async (id) => {
  return prisma.savedBuild.delete({
    where: { id },
  });
};

const findShareByShareId = async (shareId) => {
  return prisma.buildShare.findUnique({
    where: { shareId },
    include: {
      build: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
};

const findShareByBuildId = async (buildId) => {
  return prisma.buildShare.findFirst({
    where: { buildId },
  });
};

const upsertShare = async (buildId, data) => {
  const existing = await findShareByBuildId(buildId);
  if (existing) {
    return prisma.buildShare.update({
      where: { id: existing.id },
      data,
      include: {
        build: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
  }

  return prisma.buildShare.create({
    data: {
      buildId,
      ...data,
    },
    include: {
      build: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
};

const incrementShareViewCount = async (shareId) => {
  return prisma.buildShare.update({
    where: { shareId },
    data: {
      viewCount: { increment: 1 },
    },
  });
};

const findGalleryShares = async ({ skip = 0, take = 12, where = {}, orderBy = { createdAt: 'desc' } }) => {
  return prisma.buildShare.findMany({
    where,
    skip,
    take,
    orderBy,
    include: {
      build: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
};

const countGalleryShares = async (where = {}) => {
  return prisma.buildShare.count({ where });
};

module.exports = {
  createBuild,
  findBuildById,
  findBuildsByUserId,
  updateBuild,
  deleteBuild,
  findShareByShareId,
  findShareByBuildId,
  upsertShare,
  incrementShareViewCount,
  findGalleryShares,
  countGalleryShares,
};
