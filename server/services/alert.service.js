const alertRepo = require('../repositories/alert.repository');
const productRepo = require('../repositories/product.repository');
const { NotFoundError, ValidationError } = require('../utils/AppError');

const createAlert = async (userId, productId, targetPrice) => {
  const product = await productRepo.findByIdWithInventory(productId);

  if (!product || !product.isActive) {
    throw new NotFoundError('Product not found or is inactive');
  }

  if (targetPrice <= 0) {
    throw new ValidationError('Target price must be greater than 0');
  }

  return await alertRepo.createOrUpdateAlert(userId, productId, targetPrice);
};

const getAlerts = async (userId) => {
  return await alertRepo.findAlertsByUserId(userId);
};

const deleteAlert = async (userId, alertId) => {
  // Could be alert.id or product.id
  const alertById = await alertRepo.findAlertById(alertId);
  if (alertById && alertById.userId === userId) {
    await alertRepo.deleteAlert(alertId, userId);
  } else {
    await alertRepo.deleteAlertByProduct(userId, alertId);
  }

  return await getAlerts(userId);
};

module.exports = {
  createAlert,
  getAlerts,
  deleteAlert,
};
