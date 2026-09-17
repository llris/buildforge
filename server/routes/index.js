const express = require('express');
const healthRoutes = require('./health.routes');

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');

const builderRoutes = require('./builder.routes');
const buildsRoutes = require('./builds.routes');
const cartRoutes = require('./cart.routes');
const wishlistRoutes = require('./wishlist.routes');
const alertRoutes = require('./alert.routes');
const orderRoutes = require('./order.routes');
const addressRoutes = require('./address.routes');
const legalRoutes = require('./legal.routes');
const reviewRoutes = require('./review.routes');
const qaRoutes = require('./qa.routes');
const returnRoutes = require('./return.routes');
const adminRoutes = require('./admin.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

router.use('/', healthRoutes); // Mounts /health, /ready, /example directly under /api/v1
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/builder', builderRoutes);
router.use('/builds', buildsRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/alerts', alertRoutes);
router.use('/orders', orderRoutes);
router.use('/addresses', addressRoutes);
router.use('/legal', legalRoutes);
router.use('/reviews', reviewRoutes);
router.use('/questions', qaRoutes);
router.use('/returns', returnRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
