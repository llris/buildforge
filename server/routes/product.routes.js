const express = require('express');
const productController = require('../controllers/product.controller');

const router = express.Router();

router.get('/', productController.getProducts);
router.post('/compare', productController.compareProducts);
router.get('/:slug', productController.getProductBySlug);

module.exports = router;
