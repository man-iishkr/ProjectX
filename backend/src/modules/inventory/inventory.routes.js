const express = require('express');
const {
    getProducts,
    createProduct,
    getInventory,
    updateStock,
    updateProduct
} = require('./inventory.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Product Routes
router.route('/products')
    .get(getProducts)
    .post(authorize('admin'), createProduct);

router.route('/products/:id')
    .put(authorize('admin'), updateProduct);

// Inventory/Stock Routes
router.route('/stock')
    .get(getInventory)
    .post(authorize('admin', 'hq'), updateStock);

module.exports = router;
