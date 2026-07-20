const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require('zod');
const AppError = require('../utils/AppError');

const createBuildSchema = z.object({
  name: z.string().min(1, 'Build name is required'),
  components: z.record(z.any()), // e.g. { cpu: 'id', ram: ['id'] }
  totalPrice: z.number().min(0),
  buildScore: z.number().optional()
});

exports.createBuild = async (req, res, next) => {
  try {
    const validatedData = createBuildSchema.parse(req.body);
    const userId = req.user.id;

    const build = await prisma.savedBuild.create({
      data: {
        userId,
        name: validatedData.name,
        components: validatedData.components,
        totalPrice: validatedData.totalPrice,
        buildScore: validatedData.buildScore
      }
    });

    res.status(201).json({
      status: 'success',
      data: build
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyBuilds = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const builds = await prisma.savedBuild.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: builds
    });
  } catch (err) {
    next(err);
  }
};

exports.getBuild = async (req, res, next) => {
  try {
    const build = await prisma.savedBuild.findUnique({
      where: { id: req.params.id }
    });
    if (!build) return next(new AppError('Build not found', 404));
    
    // Check ownership if not public (sharing logic later)
    if (build.userId !== req.user.id) {
      return next(new AppError('Unauthorized', 403));
    }

    res.status(200).json({
      status: 'success',
      data: build
    });
  } catch (err) {
    next(err);
  }
};

exports.updateBuild = async (req, res, next) => {
  try {
    const { name } = req.body; // Just allowing rename for now
    if (!name) return next(new AppError('Name is required', 400));
    
    const build = await prisma.savedBuild.findUnique({ where: { id: req.params.id } });
    if (!build) return next(new AppError('Build not found', 404));
    if (build.userId !== req.user.id) return next(new AppError('Unauthorized', 403));

    const updated = await prisma.savedBuild.update({
      where: { id: req.params.id },
      data: { name }
    });

    res.status(200).json({
      status: 'success',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteBuild = async (req, res, next) => {
  try {
    const build = await prisma.savedBuild.findUnique({ where: { id: req.params.id } });
    if (!build) return next(new AppError('Build not found', 404));
    if (build.userId !== req.user.id) return next(new AppError('Unauthorized', 403));

    await prisma.savedBuild.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
