const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createAlertSchema,
  deleteAlertSchema,
} = require('../validations/alert.validation');

router.use(requireAuth);

router.post('/', validate(createAlertSchema), alertController.createAlert);
router.get('/', alertController.getAlerts);
router.delete('/:id', validate(deleteAlertSchema), alertController.deleteAlert);

module.exports = router;
