const buildsService = require('../services/builds.service');
const { sendSuccess } = require('../utils/response');

const createBuild = async (req, res, next) => {
  try {
    const data = await buildsService.createBuild(req.user.id, req.body);
    return sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
};

const getMyBuilds = async (req, res, next) => {
  try {
    const data = await buildsService.getMyBuilds(req.user.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const getBuild = async (req, res, next) => {
  try {
    const data = await buildsService.getBuildById(req.user.id, req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const updateBuild = async (req, res, next) => {
  try {
    const data = await buildsService.updateBuild(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const deleteBuild = async (req, res, next) => {
  try {
    const data = await buildsService.deleteBuild(req.user.id, req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const shareBuild = async (req, res, next) => {
  try {
    const data = await buildsService.shareBuild(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
};

const getSharedBuild = async (req, res, next) => {
  try {
    const data = await buildsService.getSharedBuild(req.params.shareId);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const getGalleryBuilds = async (req, res, next) => {
  try {
    const data = await buildsService.getGalleryBuilds(req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const cloneSharedBuild = async (req, res, next) => {
  try {
    const data = await buildsService.cloneSharedBuild(req.user.id, req.params.shareId);
    return sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBuild,
  getMyBuilds,
  getBuild,
  updateBuild,
  deleteBuild,
  shareBuild,
  getSharedBuild,
  getGalleryBuilds,
  cloneSharedBuild,
};
