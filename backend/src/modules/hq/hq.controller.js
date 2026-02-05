const HQ = require('./hq.model');

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

        const hq = await HQ.create(req.body);

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
