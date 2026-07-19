const healthService = require('../services/health.service');
const { sendSuccess } = require('../utils/response');

const getHealth = (req, res) => {
  return sendSuccess(res, { status: 'ok', message: 'BuildForge API is running' });
};

const getReady = async (req, res, next) => {
  try {
    const isDbConnected = await healthService.checkDatabaseConnection();
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database connection failed',
        },
      });
    }
    return sendSuccess(res, { status: 'ready' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getReady,
};
