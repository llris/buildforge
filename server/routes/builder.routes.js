const express = require('express');
const router = express.Router();
const builderController = require('../controllers/builder.controller');

router.post('/validate', builderController.validate);
router.get('/components/:type', builderController.getComponents);

module.exports = router;
