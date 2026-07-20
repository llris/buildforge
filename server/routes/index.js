const express = require('express');
const healthRoutes = require('./health.routes');

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');

const router = express.Router();

router.use('/', healthRoutes); // Mounts /health, /ready, /example directly under /api/v1
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;
