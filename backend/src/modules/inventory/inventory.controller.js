const Inventory = require('./inventory.model');
const Product = require('./product.model');
const Stockist = require('../stockist/stockist.model');
const { client, get, set, del } = require('../../config/redis');

// @desc    Get all products
// @route   GET /api/v1/inventory/products
// @access  Private
exports.getProducts = async (req, res, next) => {
    try {
        // Check Cache
        const cacheKey = 'products:all';
        const cachedProducts = await get(cacheKey);

        if (cachedProducts) {
            return res.status(200).json(cachedProducts);
        }

        const products = await Product.find();

        const response = { success: true, count: products.length, data: products };

        // Cache for 24 hours (products change rarely)
        await set(cacheKey, response, 86400);

        res.status(200).json(response);
    } catch (err) {
        next(err);
    }
};

// @desc    Create new product
// @route   POST /api/v1/inventory/products
// @access  Private (Admin)
exports.createProduct = async (req, res, next) => {
    try {
        const product = await Product.create(req.body);

        // Invalidate cache
        await del('products:*');

        res.status(201).json({ success: true, data: product });
    } catch (err) {
        next(err);
    }
};

// @desc    Get inventory (stock levels)
// @route   GET /api/v1/inventory/stock
// @access  Private
exports.getInventory = async (req, res, next) => {
    try {
        let query = {};

        // Filter by Stockist if provided
        if (req.query.stockistId) {
            query.stockist = req.query.stockistId;
        }

        // Access Control
        if (req.user.role === 'hq') {
            // Find stockists belonging to this HQ
            const stockists = await Stockist.find({ hq: req.user.hq }).select('_id');
            const stockistIds = stockists.map(s => s._id);

            // Allow filtering by specific stockist if it belongs to this HQ
            if (query.stockist) {
                if (!stockistIds.some(id => id.toString() === query.stockist.toString())) {
                    return res.status(403).json({ success: false, error: 'Not authorized for this stockist' });
                }
            } else {
                // Otherwise show all stockists for this HQ
                query.stockist = { $in: stockistIds };
            }
        } else if (req.user.role === 'employee') {
            // Employee can see stock? Maybe mapped to their HQ?
            // For now, let's keep it open or restrict to their HQ similar to above
            const stockists = await Stockist.find({ hq: req.user.hq }).select('_id');
            query.stockist = { $in: stockists.map(s => s._id) };
        }

        const inventory = await Inventory.find(query)
            .populate('product', 'name code unitPrice')
            .populate('stockist', 'name location');

        res.status(200).json({ success: true, count: inventory.length, data: inventory });
    } catch (err) {
        next(err);
    }
};

// @desc    Update stock (Inward/Outward)
// @route   POST /api/v1/inventory/stock
// @access  Private (Admin/HQ)
exports.updateStock = async (req, res, next) => {
    try {
        const { stockistId, productId, stockIn, stockOut } = req.body;

        if (!stockistId || !productId) {
            return res.status(400).json({ success: false, error: 'Please provide Stockist and Product' });
        }

        let inv = await Inventory.findOne({ stockist: stockistId, product: productId });

        const inQty = parseInt(stockIn) || 0;
        const outQty = parseInt(stockOut) || 0;

        if (!inv) {
            // Create new inventory record if it doesn't exist
            inv = await Inventory.create({
                stockist: stockistId,
                product: productId,
                openingStock: 0,
                stockIn: inQty,
                stockOut: outQty,
                closingStock: inQty - outQty
            });
        } else {
            // Update existing record
            // Logic: Cumulative update
            inv.stockIn += inQty;
            inv.stockOut += outQty;

            // Recalculate closing stock
            // Closing = Opening + Total In - Total Out
            inv.closingStock = inv.openingStock + inv.stockIn - inv.stockOut;

            inv.updatedAt = Date.now();
            await inv.save();
        }

        // Ideally we should record a "Transaction" here for audit trail, 
        // but for now keeping it simple as per current schema.

        const populatedInv = await Inventory.findById(inv._id)
            .populate('product', 'name code')
            .populate('stockist', 'name');

        // Notification logic removed as it's handled dynamically by notification.controller.js
        res.status(200).json({ success: true, data: populatedInv });
    } catch (err) {
        next(err);
    }
};
