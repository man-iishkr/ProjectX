const Route = require('./route.model');

// @desc    Get all routes
// @route   GET /api/v1/routes
// @access  Private
exports.getRoutes = async (req, res, next) => {
    try {
        let query;

        if (req.user.role === 'admin') {
            query = Route.find();
        } else {
            query = Route.find({ hq: req.user.hq });
        }

        const routes = await query.populate('hq', 'name');

        res.status(200).json({
            success: true,
            count: routes.length,
            data: routes
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new route
// @route   POST /api/v1/routes
// @access  Private
exports.createRoute = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            req.body.hq = req.user.hq;
        }

        req.body.createdBy = req.user.id;

        const route = await Route.create(req.body);

        res.status(201).json({
            success: true,
            data: route
        });
    } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Route already exists for this HQ' });
        }
        next(err);
    }
};
