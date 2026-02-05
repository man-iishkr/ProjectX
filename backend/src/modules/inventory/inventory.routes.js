const express = require('express');
const {
    getProducts,
    createProduct,
    getInventory,
    updateStock
} = require('./inventory.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Product Routes
router.route('/products')
    .get(getProducts)
    .post(authorize('admin'), createProduct);

// Inventory/Stock Routes
router.route('/stock')
    .get(getInventory)
    .post(authorize('admin', 'hq'), updateStock);

module.exports = router;
