const HQ = require('./hq.model');
const User = require('../auth/auth.model');

// @desc    Get all HQs
// @route   GET /api/v1/hqs
// @access  Private
exports.getHQs = async (req, res, next) => {
    try {
        const hqs = await HQ.find();

        res.status(200).json({
            success: true,
            count: hqs.length,
            data: hqs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new HQ
// @route   POST /api/v1/hqs
// @access  Private
exports.createHQ = async (req, res, next) => {
    try {
        console.log('Creating HQ with data:', req.body);
        // Strip out 'password' field — HQ login was removed, HQs are data records only
        const { password, ...hqData } = req.body;

        const hq = await HQ.create(hqData);

        console.log('HQ created successfully:', hq._id);

        res.status(201).json({
            success: true,
            data: hq
        });
    } catch (err) {
        console.error('Error creating HQ:', err);

        // Handle duplicate name error
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'An HQ with this name already exists'
            });
        }

        // Handle validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        next(err);
    }
};

// @desc    Get single HQ
// @route   GET /api/v1/hqs/:id
// @access  Private
exports.getHQ = async (req, res, next) => {
    try {
        const hq = await HQ.findById(req.params.id);

        if (!hq) {
            return res.status(404).json({ success: false, error: 'HQ not found' });
        }

        res.status(200).json({
            success: true,
            data: hq
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update HQ
// @route   PUT /api/v1/hqs/:id
// @access  Private (Admin)
exports.updateHQ = async (req, res, next) => {
    try {
        let hq = await HQ.findById(req.params.id);

        if (!hq) {
            return res.status(404).json({ success: false, error: 'HQ not found' });
        }

        hq = await HQ.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: hq
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete HQ
// @route   DELETE /api/v1/hqs/:id
// @access  Private (Admin)
exports.deleteHQ = async (req, res, next) => {
    try {
        const hq = await HQ.findById(req.params.id);

        if (!hq) {
            return res.status(404).json({ success: false, error: 'HQ not found' });
        }

        // Also delete the associated User (HQ Login)
        // Find user by HQ reference or name?
        // In createHQ we did: hq: hq._id
        await User.findOneAndDelete({ hq: hq._id });

        await hq.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
