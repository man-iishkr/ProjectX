const express = require('express');
const Stockist = require('./stockist.model');
const Target = require('../target/target.model');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

// STOCKIST CRUD MOVED TO stockist.routes.js

// TARGET CRUD
router.get('/targets', async (req, res, next) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') query.hq = req.user.hq;
        const targets = await Target.find(query);
        res.json({ success: true, data: targets });
    } catch (err) { next(err); }
});

// Bulk Construct Target (Annual)
router.post('/targets/bulk', authorize('admin', 'hq'), async (req, res, next) => {
    try {
        const { hq, year, targets } = req.body;

        // 1. Validate
        if (!hq || !year || !targets || targets.length !== 12) {
            return res.status(400).json({ success: false, error: 'Please provide HQ, Year and 12 monthly targets' });
        }

        // 2. Check if already exists for this year
        const existing = await Target.findOne({ hq, year });
        if (existing) {
            return res.status(400).json({ success: false, error: `Targets for Year ${year} already exist for this HQ` });
        }

        // 3. Prepare documents
        const docs = targets.map((val, idx) => ({
            hq,
            year,
            month: idx + 1,
            targetValue: val
        }));

        const created = await Target.insertMany(docs);

        res.status(201).json({ success: true, count: created.length, data: created });
    } catch (err) { next(err); }
});

router.delete('/targets/:id', authorize('admin', 'hq'), async (req, res, next) => {
    try {
        const target = await Target.findById(req.params.id);
        if (!target) return res.status(404).json({ success: false, error: 'Target not found' });

        if (req.user.role === 'hq' && target.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        await target.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) { next(err); }
});

router.delete('/targets/annual', authorize('admin', 'hq'), async (req, res, next) => {
    try {
        const { hq, year } = req.query;
        if (!hq || !year) return res.status(400).json({ success: false, error: 'HQ and Year required' });

        if (req.user.role === 'hq' && hq !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        await Target.deleteMany({ hq, year });
        res.status(200).json({ success: true, data: {} });
    } catch (err) { next(err); }
});

module.exports = router;
