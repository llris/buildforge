const alertService = require('../services/alert.service');
const { sendSuccess } = require('../utils/response');

const createAlert = async (req, res, next) => {
  try {
    const { productId, targetPrice } = req.body;
    const alert = await alertService.createAlert(req.user.id, productId, targetPrice);
    return sendSuccess(res, alert, 201);
  } catch (error) {
    next(error);
  }
};

const getAlerts = async (req, res, next) => {
  try {
    const alerts = await alertService.getAlerts(req.user.id);
    return sendSuccess(res, alerts);
  } catch (error) {
    next(error);
  }
};

const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alerts = await alertService.deleteAlert(req.user.id, id);
    return sendSuccess(res, alerts);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAlert,
  getAlerts,
  deleteAlert,
};
