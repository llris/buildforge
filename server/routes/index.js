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

module.exports = router;
