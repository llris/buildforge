const express = require('express');
const legalController = require('../controllers/legal.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public Legal Documents
router.get('/terms', legalController.getTerms);
router.get('/disclaimer', legalController.getDisclaimer);
router.get('/privacy', legalController.getPrivacy);
router.get('/copyright', legalController.getCopyright);

// Authenticated Consent Recording
router.post('/accept-terms', requireAuth, legalController.acceptTerms);

module.exports = router;
