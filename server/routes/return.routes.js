const express = require('express');
const router = express.Router();
const returnController = require('../controllers/return.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', returnController.getUserReturns);

module.exports = router;
