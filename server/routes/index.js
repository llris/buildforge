const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

router.use('/', healthRoutes); // Mounts /health, /ready, /example directly under /api/v1

module.exports = router;
