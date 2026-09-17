const crypto = require('crypto');
const prisma = require('../utils/prisma');
const buildsRepo = require('../repositories/builds.repository');
const { validateBuild } = require('./advisor/compatibility.service');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/AppError');
const { env } = require('../config/env');

const createBuild = async (userId, data) => {
  const { name, description, useCase = 'GAMING', components = {}, totalPrice = 0, buildScore } = data;

  if (!name || !name.trim()) {
    throw new ValidationError('Build name is required');
  }

  return buildsRepo.createBuild({
    userId,
    name: name.trim(),
    description: description ? description.trim() : null,
    useCase: useCase || 'GAMING',
    components,
    totalPrice: Number(totalPrice) || 0,
    buildScore: buildScore !== undefined ? Number(buildScore) : null,
  });
};

const getMyBuilds = async (userId) => {
  return buildsRepo.findBuildsByUserId(userId);
};

const getBuildById = async (userId, id) => {
  const build = await buildsRepo.findBuildById(id);
  if (!build) {
    throw new NotFoundError(`Build with ID "${id}" not found`);
  }

  if (build.userId !== userId) {
    throw new ForbiddenError('You do not have permission to access this build');
  }

  return build;
};

const updateBuild = async (userId, id, data) => {
  const existing = await buildsRepo.findBuildById(id);
  if (!existing) {
    throw new NotFoundError(`Build with ID "${id}" not found`);
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError('You do not have permission to modify this build');
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
  if (data.useCase !== undefined) updateData.useCase = data.useCase;
  if (data.components !== undefined) updateData.components = data.components;
  if (data.totalPrice !== undefined) updateData.totalPrice = Number(data.totalPrice);
  if (data.buildScore !== undefined) updateData.buildScore = data.buildScore !== null ? Number(data.buildScore) : null;

  return buildsRepo.updateBuild(id, updateData);
};

const deleteBuild = async (userId, id) => {
  const existing = await buildsRepo.findBuildById(id);
  if (!existing) {
    throw new NotFoundError(`Build with ID "${id}" not found`);
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError('You do not have permission to delete this build');
  }

  await buildsRepo.deleteBuild(id);
  return { message: 'Build deleted successfully' };
};

const shareBuild = async (userId, buildId, data = {}) => {
  const build = await buildsRepo.findBuildById(buildId);
  if (!build) {
    throw new NotFoundError(`Build with ID "${buildId}" not found`);
  }

  if (build.userId !== userId) {
    throw new ForbiddenError('You can only publish or share your own builds');
  }

  const existingShare = await buildsRepo.findShareByBuildId(buildId);
  const shareId = existingShare?.shareId || `bf_${crypto.randomBytes(4).toString('hex')}`;
  const isPublic = data.isPublic !== undefined ? Boolean(data.isPublic) : true;

  // Optional updates to build metadata (useCase / description)
  if (data.useCase || data.description) {
    await buildsRepo.updateBuild(buildId, {
      useCase: data.useCase || build.useCase,
      description: data.description !== undefined ? data.description : build.description,
    });
  }

  const shareRecord = await buildsRepo.upsertShare(buildId, {
    shareId,
    isPublic,
    ogTitle: data.ogTitle || `${build.name} | Custom PC Build on BuildForge`,
    ogDescription: data.ogDescription || build.description || `Check out this custom ${build.useCase || 'PC'} build with dynamic compatibility validation on BuildForge.`,
    ogImage: data.ogImage || null,
  });

  const clientBaseUrl = env.CLIENT_URL || 'http://localhost:5173';
  const shareUrl = `${clientBaseUrl}/builds/${shareRecord.shareId}`;

  return {
    shareId: shareRecord.shareId,
    shareUrl,
    isPublic: shareRecord.isPublic,
    viewCount: shareRecord.viewCount,
    ogTitle: shareRecord.ogTitle,
    ogDescription: shareRecord.ogDescription,
  };
};

const getSharedBuild = async (shareId) => {
  const share = await buildsRepo.findShareByShareId(shareId);
  if (!share || !share.isPublic) {
    throw new NotFoundError('Shared build configuration not found or is private');
  }

  // Atomically increment view count (fire and forget / non-blocking)
  buildsRepo.incrementShareViewCount(shareId).catch(() => {});

  const build = share.build;
  const rawComponents = build.components || {};

  // Extract all product IDs
  const productIds = [];
  const addId = (val) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach((v) => {
        if (typeof v === 'string') productIds.push(v);
        else if (v?.id) productIds.push(v.id);
      });
    } else if (typeof val === 'string') {
      productIds.push(val);
    } else if (val?.id) {
      productIds.push(val.id);
    }
  };

  Object.values(rawComponents).forEach(addId);

  // Fetch product models
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      category: { select: { name: true, slug: true } },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Populate build structure
  const resolveProduct = (val) => {
    if (!val) return null;
    const id = typeof val === 'string' ? val : val.id;
    return productMap.get(id) || null;
  };

  const resolveProductList = (val) => {
    if (!val) return [];
    const list = Array.isArray(val) ? val : [val];
    return list.map((item) => resolveProduct(item)).filter(Boolean);
  };

  const populatedBuild = {
    cpu: resolveProduct(rawComponents.cpu),
    motherboard: resolveProduct(rawComponents.motherboard),
    ram: resolveProductList(rawComponents.ram),
    gpu: resolveProduct(rawComponents.gpu),
    case: resolveProduct(rawComponents.case || rawComponents.pcCase),
    psu: resolveProduct(rawComponents.psu),
    storage: resolveProductList(rawComponents.storage),
    cooler: resolveProduct(rawComponents.cooler),
  };

  // Run pure compatibility advisor validation
  const validation = validateBuild(populatedBuild);

  // Recalculate real-time pricing
  let calculatedTotalPrice = 0;
  Object.values(populatedBuild).forEach((item) => {
    if (!item) return;
    if (Array.isArray(item)) {
      item.forEach((i) => {
        calculatedTotalPrice += i.discountPrice || i.price || 0;
      });
    } else {
      calculatedTotalPrice += item.discountPrice || item.price || 0;
    }
  });

  return {
    shareId: share.shareId,
    buildId: build.id,
    name: build.name,
    description: build.description,
    useCase: build.useCase || 'GAMING',
    buildScore: build.buildScore,
    totalPrice: calculatedTotalPrice || build.totalPrice,
    createdAt: build.createdAt,
    viewCount: share.viewCount + 1,
    creator: {
      id: build.user?.id,
      name: build.user?.name || 'BuildForge Architect',
    },
    components: populatedBuild,
    validation,
    ogTitle: share.ogTitle || `${build.name} | Custom PC Build`,
    ogDescription: share.ogDescription || build.description || `Explore this custom PC build on BuildForge`,
    ogImage: share.ogImage || populatedBuild.gpu?.images?.[0] || populatedBuild.case?.images?.[0] || null,
  };
};

const getGalleryBuilds = async ({
  page = 1,
  limit = 12,
  useCase,
  minBudget,
  maxBudget,
  search = '',
  sortBy = 'views',
}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {
    isPublic: true,
  };

  const buildWhere = {};

  if (useCase && useCase.toUpperCase() !== 'ALL') {
    buildWhere.useCase = { equals: useCase.toUpperCase() };
  }

  if (minBudget || maxBudget) {
    buildWhere.totalPrice = {};
    if (minBudget) buildWhere.totalPrice.gte = Number(minBudget);
    if (maxBudget) buildWhere.totalPrice.lte = Number(maxBudget);
  }

  if (search && search.trim()) {
    buildWhere.OR = [
      { name: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  if (Object.keys(buildWhere).length > 0) {
    where.build = buildWhere;
  }

  let orderBy = { viewCount: 'desc' };
  if (sortBy === 'newest') {
    orderBy = { createdAt: 'desc' };
  } else if (sortBy === 'price_asc') {
    orderBy = { build: { totalPrice: 'asc' } };
  } else if (sortBy === 'price_desc') {
    orderBy = { build: { totalPrice: 'desc' } };
  }

  const [total, shares] = await Promise.all([
    buildsRepo.countGalleryShares(where),
    buildsRepo.findGalleryShares({
      skip,
      take: Number(limit),
      where,
      orderBy,
    }),
  ]);

  // Extract key component IDs for preview highlights (CPU & GPU)
  const allKeyProductIds = new Set();
  shares.forEach((s) => {
    const comps = s.build?.components || {};
    if (typeof comps.cpu === 'string') allKeyProductIds.add(comps.cpu);
    if (typeof comps.gpu === 'string') allKeyProductIds.add(comps.gpu);
  });

  const previewProducts = await prisma.product.findMany({
    where: { id: { in: Array.from(allKeyProductIds) } },
    select: { id: true, name: true, brand: true, images: true },
  });

  const previewMap = new Map(previewProducts.map((p) => [p.id, p]));

  const galleryList = shares.map((s) => {
    const b = s.build;
    const comps = b.components || {};
    const cpuId = typeof comps.cpu === 'string' ? comps.cpu : comps.cpu?.id;
    const gpuId = typeof comps.gpu === 'string' ? comps.gpu : comps.gpu?.id;

    return {
      shareId: s.shareId,
      buildId: b.id,
      name: b.name,
      description: b.description,
      useCase: b.useCase || 'GAMING',
      totalPrice: b.totalPrice,
      viewCount: s.viewCount,
      buildScore: b.buildScore,
      createdAt: s.createdAt,
      creator: {
        name: b.user?.name || 'Architect',
      },
      cpu: previewMap.get(cpuId) || null,
      gpu: previewMap.get(gpuId) || null,
      componentCount: Object.keys(comps).filter((k) => comps[k]).length,
    };
  });

  return {
    builds: galleryList,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

const cloneSharedBuild = async (userId, shareId) => {
  const share = await buildsRepo.findShareByShareId(shareId);
  if (!share || !share.isPublic) {
    throw new NotFoundError('Shared build not found or is private');
  }

  const originalBuild = share.build;

  const cloned = await buildsRepo.createBuild({
    userId,
    name: `Copy of ${originalBuild.name}`,
    description: originalBuild.description,
    useCase: originalBuild.useCase,
    components: originalBuild.components,
    totalPrice: originalBuild.totalPrice,
    buildScore: originalBuild.buildScore,
  });

  return cloned;
};

module.exports = {
  createBuild,
  getMyBuilds,
  getBuildById,
  updateBuild,
  deleteBuild,
  shareBuild,
  getSharedBuild,
  getGalleryBuilds,
  cloneSharedBuild,
};
