const Doctor = require('./doctor.model');
const Route = require('../route/route.model');
const { getRoadDistance } = require('../../utils/roadDistance');
const { client, get, set, del } = require('../../config/redis');

// @desc    Add new doctor
// @route   POST /api/v1/doctors
// @access  Private (Admin/HQ/Employee)
exports.createDoctor = async (req, res, next) => {
    try {
        // If Employee, check if they are allowed to add more? 
        // PRD says "Add doctor (once only)". 
        // This might mean "Add a SPECIFIC doctor once" to avoid duplicates, or "Add ONE doctor only"?
        // Assuming "Add new doctor to system". Duplicates check by name+phone?

        // Auto-assign HQ from user's HQ
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
        }

        // Check/Sync Route From
        if (req.body.routeFrom && req.body.hq) {
            const routeName = req.body.routeFrom;
            const routeExists = await Route.findOne({
                name: routeName,
                hq: req.body.hq
            });

            if (!routeExists) {
                await Route.create({
                    name: routeName,
                    hq: req.body.hq,
                    createdBy: req.user.id
                });
            }
        }

        // Check/Sync Route To
        if (req.body.routeTo && req.body.hq) {
            const routeName = req.body.routeTo;
            const routeExists = await Route.findOne({
                name: routeName,
                hq: req.body.hq
            });

            if (!routeExists) {
                await Route.create({
                    name: routeName,
                    hq: req.body.hq,
                    createdBy: req.user.id
                });
            }
        }

        // Calculate road distance between routeFrom and routeTo
        if (req.body.routeFrom && req.body.routeTo) {
            const rf = (req.body.routeFrom || '').trim().toLowerCase();
            const rt = (req.body.routeTo || '').trim().toLowerCase();
            if (rf === rt) {
                req.body.distance = 0;
            } else {
                try {
                    const dist = await getRoadDistance(req.body.routeFrom, req.body.routeTo);
                    req.body.distance = dist;

                } catch (distErr) {
                    console.error('Road distance calc failed:', distErr.message);
                    req.body.distance = 0;
                }
            }
        }

        const doctor = await Doctor.create(req.body);

        // Invalidate cache
        await del('doctors:*');

        res.status(201).json({
            success: true,
            data: doctor
        });
    } catch (err) {
        console.error('Create Doctor Error:', err.message);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            console.error('Validation Messages:', messages);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        next(err);
    }
};

// @desc    Get all doctors
// @route   GET /api/v1/doctors
// @access  Private
exports.getDoctors = async (req, res, next) => {
    try {
        let query;

        // Check Cache
        const cacheKey = `doctors:${req.user.hq || 'all'}:${JSON.stringify(req.query)}`;
        const cachedDocs = await get(cacheKey);

        if (cachedDocs) {
            return res.status(200).json(cachedDocs);
        }

        // Admin sees all, HQ sees own, Employee sees own HQ's doctors
        if (req.user.role === 'admin') {
            let filter = {};
            if (req.query.hq) {
                filter.hq = req.query.hq;
            }
            query = Doctor.find(filter);
        } else {
            query = Doctor.find({ hq: req.user.hq });
        }

        query = query.populate('hq', 'name');

        const doctors = await query;

        const response = {
            success: true,
            count: doctors.length,
            data: doctors
        };

        // Cache for 1 hour
        await set(cacheKey, response, 3600);

        res.status(200).json(response);
    } catch (err) {
        next(err);
    }
};

// @desc    Get single doctor
// @route   GET /api/v1/doctors/:id
// @access  Private
exports.getDoctor = async (req, res, next) => {
    try {
        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }

        // Access check
        if (req.user.role !== 'admin' && doctor.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        res.status(200).json({
            success: true,
            data: doctor
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update doctor
// @route   PUT /api/v1/doctors/:id
// @access  Private (Admin/HQ)
exports.updateDoctor = async (req, res, next) => {
    try {
        let doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }

        // Employee cannot edit doctor location or details (PRD: "Cannot edit doctor location")
        if (req.user.role === 'employee') {
            return res.status(403).json({ success: false, error: 'Employees cannot edit doctors' });
        }

        if (req.user.role === 'hq' && doctor.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        // Prevent location update if strict rules apply, but HQ might need to correct it.
        // PRD says "Doctor location immutable by employee". HQ/Admin can probably edit.

        // Sync Route From
        if (req.body.routeFrom) {
            const hqId = req.body.hq || doctor.hq;
            const routeName = req.body.routeFrom;

            const routeExists = await Route.findOne({
                name: routeName,
                hq: hqId
            });

            if (!routeExists) {
                await Route.create({
                    name: routeName,
                    hq: hqId,
                    createdBy: req.user.id
                });
            }
        }

        // Sync Route To
        if (req.body.routeTo) {
            const hqId = req.body.hq || doctor.hq;
            const routeName = req.body.routeTo;

            const routeExists = await Route.findOne({
                name: routeName,
                hq: hqId
            });

            if (!routeExists) {
                await Route.create({
                    name: routeName,
                    hq: hqId,
                    createdBy: req.user.id
                });
            }
        }

        // Update geojson if lat/lng provided
        if (req.body.latitude && req.body.longitude) {
            req.body.location = {
                type: 'Point',
                coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
            };
        }

        // Recalculate road distance if route changed
        const newRouteFrom = req.body.routeFrom || doctor.routeFrom;
        const newRouteTo = req.body.routeTo || doctor.routeTo;
        if (req.body.routeFrom || req.body.routeTo) {
            const rf = (newRouteFrom || '').trim().toLowerCase();
            const rt = (newRouteTo || '').trim().toLowerCase();
            if (rf === rt) {
                req.body.distance = 0;
            } else {
                try {
                    const dist = await getRoadDistance(newRouteFrom, newRouteTo);
                    req.body.distance = dist;
                } catch (distErr) {
                    console.error('Road distance calc failed:', distErr.message);
                }
            }
        }

        doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Invalidate cache
        await del('doctors:*');

        res.status(200).json({
            success: true,
            data: doctor
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete doctor
// @route   DELETE /api/v1/doctors/:id
// @access  Private (Admin/HQ)
exports.deleteDoctor = async (req, res, next) => {
    try {
        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }

        if (req.user.role === 'employee') {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        if (req.user.role === 'hq' && doctor.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        await doctor.deleteOne();

        // Invalidate cache
        await del('doctors:*');

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
