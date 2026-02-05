const express = require('express');
const Stockist = require('./stockist.model');
const Target = require('../target/target.model');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

// STOCKIST CRUD
router.get('/stockists', async (req, res, next) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') query.hq = req.user.hq;
        const stockists = await Stockist.find(query);
        res.json({ success: true, data: stockists });
    } catch (err) { next(err); }
});

router.post('/stockists', authorize('admin', 'hq'), async (req, res, next) => {
    try {
        if (req.user.role === 'hq') req.body.hq = req.user.hq;
        const stockist = await Stockist.create(req.body);
        res.status(201).json({ success: true, data: stockist });
    } catch (err) { next(err); }
});

// TARGET CRUD
router.get('/targets', async (req, res, next) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') query.hq = req.user.hq;
        const targets = await Target.find(query);
        res.json({ success: true, data: targets });
    } catch (err) { next(err); }
});

router.post('/targets', authorize('admin', 'hq'), async (req, res, next) => {
    try {
        if (req.user.role === 'hq') req.body.hq = req.user.hq;
        const target = await Target.create(req.body);
        res.status(201).json({ success: true, data: target });
    } catch (err) { next(err); }
});

module.exports = router;
