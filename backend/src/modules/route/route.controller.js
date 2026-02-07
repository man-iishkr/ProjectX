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
// @desc    Search routes by name (for autocomplete)
// @route   GET /api/v1/routes/search
// @access  Private
exports.searchRoutes = async (req, res, next) => {
    try {
        const { query, hq } = req.query;

        if (!query) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Build filter
        const filter = {
            name: { $regex: query, $options: 'i' } // Case-insensitive regex
        };

        // If HQ is provided, filter by HQ. If not, and user is not admin, use their HQ.
        if (hq) {
            filter.hq = hq;
        } else if (req.user.role !== 'admin') {
            filter.hq = req.user.hq;
        }

        const routes = await Route.find(filter).limit(10).select('name code _id');

        res.status(200).json({
            success: true,
            data: routes
        });
    } catch (err) {
        next(err);
    }
};
