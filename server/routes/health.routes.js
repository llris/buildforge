const express = require('express');
const { z } = require('zod');
const healthController = require('../controllers/health.controller');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/health', healthController.getHealth);
router.get('/ready', healthController.getReady);

module.exports = router;
