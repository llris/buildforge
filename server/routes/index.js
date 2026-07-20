const express = require('express');
const healthRoutes = require('./health.routes');

const authRoutes = require('./auth.routes');

const router = express.Router();

router.use('/', healthRoutes); // Mounts /health, /ready, /example directly under /api/v1
router.use('/auth', authRoutes);

module.exports = router;
