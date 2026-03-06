const Doctor = require('./doctor.model');
const Route = require('../route/route.model');
const { getRoadDistance } = require('../../utils/roadDistance');
const { client, get, set, del } = require('../../config/redis');

// @desc    Add new doctor
// @route   POST /api/v1/doctors
// @access  Private (All authenticated users)
exports.createDoctor = async (req, res, next) => {
    try {
        // Auto-assign HQ from user's HQ (for data segmentation)
        if (req.user.role !== 'admin') {
            req.body.hq = req.user.hq;
        }

        req.body.createdBy = req.user.id;

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

        // Validate Off-Station limit
        if (req.body.distance) {
            const offStationLimit = Number(process.env.OFF_STATION_LIMIT_KM) || 150;
            if (req.body.distance > offStationLimit) {
                return res.status(400).json({
                    success: false,
                    error: `Doctor route distance (${req.body.distance} km) exceeds the maximum allowed limit of ${offStationLimit} km.`
                });
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

        query = query.populate('hq', 'name').populate('createdBy', 'name');

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

        // Validate Off-Station limit
        const finalDistance = req.body.distance !== undefined ? req.body.distance : doctor.distance;
        if (finalDistance && finalDistance > 0) {
            const offStationLimit = Number(process.env.OFF_STATION_LIMIT_KM) || 150;
            if (finalDistance > offStationLimit) {
                return res.status(400).json({
                    success: false,
                    error: `Updated doctor route distance (${finalDistance} km) exceeds the maximum allowed limit of ${offStationLimit} km.`
                });
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

// @desc    Upload location image and coordinates for First-Time Capture
// @route   POST /api/v1/doctors/:id/location
// @access  Private (Employee)
exports.uploadLocation = async (req, res, next) => {
    try {
        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }

        // Only allow if not yet verified or if admin
        if (doctor.isLocationVerified && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, error: 'Location already captured and verified' });
        }

        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Latitude and Longitude are required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Location image is required' });
        }

        // Update Doctor Document
        doctor.location = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
        doctor.locationImageUrl = `/uploads/${req.file.filename}`;
        doctor.locationCapturedBy = req.user.id;
        doctor.locationCapturedAt = Date.now();
        // The PRD mentions admin verification of the image, 
        // however the user specifically stated "isLocationVerified is only for admin to review, it should not cause any problem in the workflow"
        // And "First-time call establishes doctor location". 
        // We will set this to true to indicate it HAS been captured, so the logic knows to fall back to the 20m check.
        doctor.isLocationVerified = true;

        await doctor.save();

        // Invalidate cache
        await del('doctors:*');

        res.status(200).json({
            success: true,
            data: doctor,
            message: 'Location captured and image uploaded successfully'
        });

    } catch (err) {
        next(err);
    }
};
// @desc    Batch approve doctors
// @route   PUT /api/v1/doctors/batch-approve
// @access  Private (Admin/HQ)
exports.batchApproveDoctors = async (req, res, next) => {
    try {
        const { doctorIds } = req.body;

        if (!doctorIds || !Array.isArray(doctorIds) || doctorIds.length === 0) {
            return res.status(400).json({ success: false, error: 'Please provide an array of doctor IDs' });
        }

        let query = { _id: { $in: doctorIds } };

        if (req.user.role === 'hq') {
            query.hq = req.user.hq;
        } else if (req.user.role === 'employee') {
            return res.status(403).json({ success: false, error: 'Not authorized to approve doctors' });
        }

        await Doctor.updateMany(query, { approvalStatus: 'Approved' }, { runValidators: false });

        // Invalidate cache
        await del('doctors:*');

        res.status(200).json({
            success: true,
            message: `${doctorIds.length} doctors approved successfully`
        });
    } catch (err) {
        next(err);
    }
};
