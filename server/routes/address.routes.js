const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createAddressSchema, updateAddressSchema, addressIdParamSchema } = require('../validations/address.validation');

// Public route for shipping zones
router.get('/shipping-zones', addressController.getShippingZones);

// Protected routes
router.use(requireAuth);
router.get('/', addressController.getAddresses);
router.post('/', validate(createAddressSchema), addressController.createAddress);
router.put('/:id', validate(updateAddressSchema), addressController.updateAddress);
router.patch('/:id', validate(updateAddressSchema), addressController.updateAddress);
router.delete('/:id', validate(addressIdParamSchema), addressController.deleteAddress);
router.patch('/:id/default', validate(addressIdParamSchema), addressController.setDefaultAddress);

module.exports = router;
