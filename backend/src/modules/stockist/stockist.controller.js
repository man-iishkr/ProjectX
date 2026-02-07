const Stockist = require('./stockist.model');

// @desc    Get all stockists
// @route   GET /api/v1/stockists
// @access  Private
exports.getStockists = async (req, res, next) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.hq = req.user.hq;
        } else if (req.query.hq) {
            query.hq = req.query.hq;
        }

        const stockists = await Stockist.find(query).populate('hq', 'name');

        res.status(200).json({
            success: true,
            count: stockists.length,
            data: stockists
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single stockist
// @route   GET /api/v1/stockists/:id
// @access  Private
exports.getStockist = async (req, res, next) => {
    try {
        const stockist = await Stockist.findById(req.params.id);

        if (!stockist) {
            return res.status(404).json({ success: false, error: 'Stockist not found' });
        }

        if (req.user.role !== 'admin' && stockist.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        res.status(200).json({
            success: true,
            data: stockist
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create stockist
// @route   POST /api/v1/stockists
// @access  Private (Admin/HQ)
exports.createStockist = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            req.body.hq = req.user.hq;
        }

        const stockist = await Stockist.create(req.body);

        res.status(201).json({
            success: true,
            data: stockist
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update stockist
// @route   PUT /api/v1/stockists/:id
// @access  Private (Admin/HQ)
exports.updateStockist = async (req, res, next) => {
    try {
        let stockist = await Stockist.findById(req.params.id);

        if (!stockist) {
            return res.status(404).json({ success: false, error: 'Stockist not found' });
        }

        if (req.user.role !== 'admin' && stockist.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        stockist = await Stockist.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: stockist
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete stockist
// @route   DELETE /api/v1/stockists/:id
// @access  Private (Admin/HQ)
exports.deleteStockist = async (req, res, next) => {
    try {
        const stockist = await Stockist.findById(req.params.id);

        if (!stockist) {
            return res.status(404).json({ success: false, error: 'Stockist not found' });
        }

        if (req.user.role !== 'admin' && stockist.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        await stockist.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
