const express = require('express');
const legalController = require('../controllers/legal.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/legal/terms - public
router.get('/terms', legalController.getTerms);

// POST /api/v1/legal/accept-terms - authenticated
router.post('/accept-terms', requireAuth, legalController.acceptTerms);

module.exports = router;
