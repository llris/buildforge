const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

// All admin routes require authenticated session
router.use(requireAuth);

// Base guard: Only ADMIN and SUPPORT can enter the admin namespace
router.use(requireRole('ADMIN', 'SUPPORT'));

// ==========================================
// 1. ANALYTICS (ADMIN ONLY)
// ==========================================
router.get('/analytics/summary', requireRole('ADMIN'), adminController.getSummaryAnalytics);
router.get('/analytics/sales', requireRole('ADMIN'), adminController.getSalesChartData);
router.get('/analytics/top-products', requireRole('ADMIN'), adminController.getTopProducts);
router.get('/analytics/orders-by-status', requireRole('ADMIN'), adminController.getOrdersByStatus);

// ==========================================
// 2. PRODUCT MANAGEMENT (ADMIN ONLY)
// ==========================================
router.get('/products', requireRole('ADMIN'), adminController.getProducts);
router.post('/products', requireRole('ADMIN'), adminController.createProduct);
router.put('/products/:id', requireRole('ADMIN'), adminController.updateProduct);
router.patch('/products/:id/toggle-active', requireRole('ADMIN'), adminController.toggleProductStatus);
router.delete('/products/:id', requireRole('ADMIN'), adminController.deleteProduct);

// ==========================================
// 3. INVENTORY MANAGEMENT (ADMIN ONLY)
// ==========================================
router.get('/inventory', requireRole('ADMIN'), adminController.getInventory);
router.patch('/inventory/:productId', requireRole('ADMIN'), adminController.adjustStock);

// ==========================================
// 4. ORDER MANAGEMENT (ADMIN & SUPPORT)
// ==========================================
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderById);
router.patch('/orders/:id/status', adminController.advanceOrderStatus);

// ==========================================
// 5. RETURNS MANAGEMENT (ADMIN & SUPPORT)
// ==========================================
router.get('/returns', adminController.getReturns);
router.post('/returns/:id/approve', adminController.approveReturn);
router.post('/returns/:id/reject', adminController.rejectReturn);

// ==========================================
// 6. USERS & ROLES (ADMIN ONLY)
// ==========================================
router.get('/users', requireRole('ADMIN'), adminController.getUsers);
router.patch('/users/:id/role', requireRole('ADMIN'), adminController.changeUserRole);
router.patch('/users/:id/toggle-status', requireRole('ADMIN'), adminController.toggleUserStatus);

// ==========================================
// 7. MODERATION (ADMIN ONLY)
// ==========================================
router.get('/moderation/reviews', requireRole('ADMIN'), adminController.getReviews);
router.patch('/moderation/reviews/:id', requireRole('ADMIN'), adminController.toggleReviewApproval);
router.delete('/moderation/reviews/:id', requireRole('ADMIN'), adminController.deleteReview);

router.get('/moderation/qa', requireRole('ADMIN'), adminController.getQA);
router.patch('/moderation/questions/:id', requireRole('ADMIN'), adminController.toggleQuestionApproval);
router.delete('/moderation/questions/:id', requireRole('ADMIN'), adminController.deleteQuestion);
router.post('/moderation/questions/:id/answer', requireRole('ADMIN'), adminController.adminAnswerQuestion);
router.patch('/moderation/answers/:id', requireRole('ADMIN'), adminController.toggleAnswerApproval);
router.delete('/moderation/answers/:id', requireRole('ADMIN'), adminController.deleteAnswer);

// ==========================================
// 8. COUPONS (ADMIN ONLY)
// ==========================================
router.get('/coupons', requireRole('ADMIN'), adminController.getCoupons);
router.post('/coupons', requireRole('ADMIN'), adminController.createCoupon);
router.put('/coupons/:id', requireRole('ADMIN'), adminController.updateCoupon);
router.delete('/coupons/:id', requireRole('ADMIN'), adminController.deleteCoupon);

// ==========================================
// 9. AUDIT LOGS (ADMIN ONLY)
// ==========================================
router.get('/audit', requireRole('ADMIN'), adminController.getAuditLogs);

module.exports = router;
