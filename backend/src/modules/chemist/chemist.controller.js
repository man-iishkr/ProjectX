const Chemist = require('./chemist.model');

// @desc    Add new chemist
// @route   POST /api/v1/chemists
// @access  Private (Admin/HQ/Employee)
exports.createChemist = async (req, res, next) => {
    try {
        // Auto-assign HQ from user's HQ if not admin
        if (req.user.role !== 'admin') {
            req.body.hq = req.user.hq;
        }

        req.body.createdBy = req.user.id; // Assign creator

        // Parse lat/lng to GeoJSON
        if (req.body.latitude && req.body.longitude) {
            req.body.location = {
                type: 'Point',
                coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
            };
        } else if (!req.body.location) {
            // Fallback if no location provided, maybe optional or error? 
            // Doctor model had it required. Let's make it required but safeguard here?
            // Actually, if required in model, Mongoose will validation error.
        }

        const chemist = await Chemist.create(req.body);

        res.status(201).json({
            success: true,
            data: chemist
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all chemists
// @route   GET /api/v1/chemists
// @access  Private
exports.getChemists = async (req, res, next) => {
    try {
        let query;

        // Admin sees all, HQ sees own, Employee sees own HQ's chemists
        if (req.user.role === 'admin') {
            let filter = {};
            if (req.query.hq) {
                filter.hq = req.query.hq;
            }
            query = Chemist.find(filter);
        } else {
            query = Chemist.find({ hq: req.user.hq });
        }

        query = query.populate('hq', 'name');

        const chemists = await query;

        res.status(200).json({
            success: true,
            count: chemists.length,
            data: chemists
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single chemist
// @route   GET /api/v1/chemists/:id
// @access  Private
exports.getChemist = async (req, res, next) => {
    try {
        const chemist = await Chemist.findById(req.params.id);

        if (!chemist) {
            return res.status(404).json({ success: false, error: 'Chemist not found' });
        }

        // Access check
        if (req.user.role !== 'admin' && chemist.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        res.status(200).json({
            success: true,
            data: chemist
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update chemist
// @route   PUT /api/v1/chemists/:id
// @access  Private (Admin/HQ)
exports.updateChemist = async (req, res, next) => {
    try {
        let chemist = await Chemist.findById(req.params.id);

        if (!chemist) {
            return res.status(404).json({ success: false, error: 'Chemist not found' });
        }

        // Employee cannot edit chemist (following Doctor pattern)
        if (req.user.role === 'employee') {
            return res.status(403).json({ success: false, error: 'Employees cannot edit chemists' });
        }

        if (req.user.role === 'hq' && chemist.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        // Update geojson if lat/lng provided
        if (req.body.latitude && req.body.longitude) {
            req.body.location = {
                type: 'Point',
                coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
            };
        }

        chemist = await Chemist.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: chemist
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete chemist
// @route   DELETE /api/v1/chemists/:id
// @access  Private (Admin/HQ)
exports.deleteChemist = async (req, res, next) => {
    try {
        const chemist = await Chemist.findById(req.params.id);

        if (!chemist) {
            return res.status(404).json({ success: false, error: 'Chemist not found' });
        }

        if (req.user.role === 'employee') {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        if (req.user.role === 'hq' && chemist.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        await chemist.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
