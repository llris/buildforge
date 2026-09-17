const adminAnalyticsService = require('../services/adminAnalytics.service');
const adminProductService = require('../services/adminProduct.service');
const adminInventoryService = require('../services/adminInventory.service');
const adminOrderService = require('../services/adminOrder.service');
const adminReturnService = require('../services/adminReturn.service');
const adminUserService = require('../services/adminUser.service');
const adminModerationService = require('../services/adminModeration.service');
const adminCouponService = require('../services/adminCoupon.service');
const auditService = require('../services/audit.service');
const { formatResponse } = require('../utils/response');

// ==========================================
// 1. ANALYTICS
// ==========================================
const getSummaryAnalytics = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getSummaryAnalytics();
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const getSalesChartData = async (req, res, next) => {
  try {
    const { range } = req.query;
    const data = await adminAnalyticsService.getSalesChartData(range);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const getTopProducts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const data = await adminAnalyticsService.getTopProducts(limit);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const getOrdersByStatus = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getOrdersByStatus();
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. PRODUCTS
// ==========================================
const getProducts = async (req, res, next) => {
  try {
    const data = await adminProductService.getProducts(req.query);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const data = await adminProductService.createProduct(req.user.id, req.body);
    res.status(201).json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const data = await adminProductService.updateProduct(req.user.id, req.params.id, req.body);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const toggleProductStatus = async (req, res, next) => {
  try {
    const data = await adminProductService.toggleProductStatus(req.user.id, req.params.id);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const data = await adminProductService.deleteProduct(req.user.id, req.params.id);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. INVENTORY
// ==========================================
const getInventory = async (req, res, next) => {
  try {
    const data = await adminInventoryService.getInventory(req.query);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const data = await adminInventoryService.adjustStock(req.user.id, req.params.productId, req.body);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. ORDERS
// ==========================================
const getOrders = async (req, res, next) => {
  try {
    const data = await adminOrderService.getOrders(req.query);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const data = await adminOrderService.getOrderById(req.params.id);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const advanceOrderStatus = async (req, res, next) => {
  try {
    const data = await adminOrderService.advanceOrderStatus(req.user.id, req.params.id, req.body);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. RETURNS
// ==========================================
const getReturns = async (req, res, next) => {
  try {
    const data = await adminReturnService.getReturns(req.query);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const approveReturn = async (req, res, next) => {
  try {
    const data = await adminReturnService.approveReturn(req.user.id, req.params.id);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const rejectReturn = async (req, res, next) => {
  try {
    const data = await adminReturnService.rejectReturn(req.user.id, req.params.id, req.body);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. USERS & ROLES
// ==========================================
const getUsers = async (req, res, next) => {
  try {
    const data = await adminUserService.getUsers(req.query);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const changeUserRole = async (req, res, next) => {
  try {
    const data = await adminUserService.changeUserRole(req.user.id, req.params.id, req.body.role);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const data = await adminUserService.toggleUserStatus(req.user.id, req.params.id);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. MODERATION
// ==========================================
const getReviews = async (req, res, next) => {
  try {
    const data = await adminModerationService.getReviews(req.query);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const toggleReviewApproval = async (req, res, next) => {
  try {
    const data = await adminModerationService.toggleReviewApproval(
      req.user.id,
      req.params.id,
      req.body.isApproved
    );
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const data = await adminModerationService.deleteReview(req.user.id, req.params.id);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const getQA = async (req, res, next) => {
  try {
    const data = await adminModerationService.getQA(req.query);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const toggleQuestionApproval = async (req, res, next) => {
  try {
    const data = await adminModerationService.toggleQuestionApproval(
      req.user.id,
      req.params.id,
      req.body.isApproved
    );
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const data = await adminModerationService.deleteQuestion(req.user.id, req.params.id);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const adminAnswerQuestion = async (req, res, next) => {
  try {
    const data = await adminModerationService.adminAnswerQuestion(
      req.user.id,
      req.params.id,
      req.body
    );
    res.status(201).json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const toggleAnswerApproval = async (req, res, next) => {
  try {
    const data = await adminModerationService.toggleAnswerApproval(
      req.user.id,
      req.params.id,
      req.body.isApproved
    );
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const deleteAnswer = async (req, res, next) => {
  try {
    const data = await adminModerationService.deleteAnswer(req.user.id, req.params.id);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. COUPONS
// ==========================================
const getCoupons = async (req, res, next) => {
  try {
    const data = await adminCouponService.getCoupons(req.query);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const data = await adminCouponService.createCoupon(req.user.id, req.body);
    res.status(201).json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const data = await adminCouponService.updateCoupon(req.user.id, req.params.id, req.body);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const data = await adminCouponService.deleteCoupon(req.user.id, req.params.id);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 9. AUDIT LOGS
// ==========================================
const getAuditLogs = async (req, res, next) => {
  try {
    const data = await auditService.getAuditLogs(req.query);
    res.json(formatResponse(true, data));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummaryAnalytics,
  getSalesChartData,
  getTopProducts,
  getOrdersByStatus,
  getProducts,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
  getInventory,
  adjustStock,
  getOrders,
  getOrderById,
  advanceOrderStatus,
  getReturns,
  approveReturn,
  rejectReturn,
  getUsers,
  changeUserRole,
  toggleUserStatus,
  getReviews,
  toggleReviewApproval,
  deleteReview,
  getQA,
  toggleQuestionApproval,
  deleteQuestion,
  adminAnswerQuestion,
  toggleAnswerApproval,
  deleteAnswer,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAuditLogs,
};
