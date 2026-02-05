const express = require('express');
const Inventory = require('./inventory.model');
const Product = require('./product.model');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

// PRODUCTS
router.get('/products', async (req, res, next) => {
    try {
        const products = await Product.find();
        res.json({ success: true, data: products });
    } catch (err) { next(err); }
});

router.post('/products', authorize('admin'), async (req, res, next) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
});

// INVENTORY
router.get('/stock', async (req, res, next) => {
    try {
        // Query param stockistId?
        let query = {};
        if (req.query.stockistId) query.stockist = req.query.stockistId;

        const inventory = await Inventory.find(query).populate('product stockist');
        res.json({ success: true, data: inventory });
    } catch (err) { next(err); }
});

// Update Inventory (Simplified)
router.post('/stock', authorize('admin', 'hq'), async (req, res, next) => {
    try {
        const { stockistId, productId, stockIn, stockOut } = req.body;

        let inv = await Inventory.findOne({ stockist: stockistId, product: productId });

        if (!inv) {
            inv = await Inventory.create({
                stockist: stockistId,
                product: productId,
                openingStock: 0,
                stockIn: stockIn || 0,
                stockOut: stockOut || 0,
                closingStock: (stockIn || 0) - (stockOut || 0)
            });
        } else {
            if (stockIn) inv.stockIn += parseInt(stockIn);
            if (stockOut) inv.stockOut += parseInt(stockOut);
            inv.closingStock = inv.openingStock + inv.stockIn - inv.stockOut;
            await inv.save();
        }

        res.status(200).json({ success: true, data: inv });
    } catch (err) { next(err); }
});

module.exports = router;
