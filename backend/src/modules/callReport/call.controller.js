const CallReport = require('./call.model');
const Doctor = require('../doctor/doctor.model');
const haversine = require('../../utils/haversine');
const dateFns = require('date-fns'); // Assuming backend has it, or use native

// @desc    Submit Call Report
// @route   POST /api/v1/call-reports
// @access  Private (Employee)
exports.createCallReport = async (req, res, next) => {
    try {
        const { doctorId, latitude, longitude, remarks, digipin } = req.body;

        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }

        // Check if call already exists for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existingCall = await CallReport.findOne({
            employee: req.user.id,
            doctor: doctorId,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existingCall) {
            return res.status(400).json({ success: false, error: 'Call report already submitted for this doctor today' });
        }

        // Get Doctor coordinates
        const doctorCoords = {
            latitude: doctor.location.coordinates[1],
            longitude: doctor.location.coordinates[0]
        };

        const empCoords = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        };

        // Calculate details
        const distance = haversine(doctorCoords, empCoords);
        const threshold = 20; // meters. PRD says 20m.
        const isApproved = distance <= threshold;

        const callReport = await CallReport.create({
            employee: req.user.id,
            doctor: doctorId,
            location: {
                type: 'Point',
                coordinates: [empCoords.longitude, empCoords.latitude]
            },
            digipin,
            remarks,
            isApproved,
            distanceFromDoctor: distance
        });

        res.status(201).json({
            success: true,
            data: callReport,
            message: isApproved ? 'Call Report Approved' : `Call Report Submitted but Pending Approval (Distance: ${Math.round(distance)}m)`
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Call Reports
// @route   GET /api/v1/call-reports
// @access  Private
exports.getCallReports = async (req, res, next) => {
    try {
        let query;

        if (req.user.role === 'admin') {
            query = CallReport.find();
        } else if (req.user.role === 'hq') {
            // Find employees in this HQ
            // Complex query, or aggregate.
            // OR: Find calls where employee.hq == user.hq. 
            // Requires populate or aggregation.
            // Simpler: find users in HQ first.
            // For now, let's assume we populate and filter or just finding by doctor's HQ if that's linked?
            // CallReport -> Doctor -> HQ.
            // Or CallReport -> Employee -> HQ.
            // Let's filter by Doctor's HQ as it's more direct for "Area".

            // Using aggregate to look up doctor
            /*
           query = CallReport.aggregate([
               {
                   $lookup: {
                       from: 'doctors',
                       localField: 'doctor',
                       foreignField: '_id',
                       as: 'doctorDetails'
                   }
               },
               { $match: { 'doctorDetails.hq': req.user.hq } }
           ]);
           */
            // Mongoose populate approach
            // We can fetch details and filter in memory if volume is low, or use path population match.
            // But 'hq' is on User and Doctor.

            // Let's find IDs of doctors in this HQ
            const doctors = await Doctor.find({ hq: req.user.hq }).select('_id');
            const doctorIds = doctors.map(d => d._id);

            query = CallReport.find({ doctor: { $in: doctorIds } });
        } else {
            // Employee sees own
            query = CallReport.find({ employee: req.user.id });
        }

        query = query.populate('doctor', 'name address location').populate('employee', 'name');

        const reports = await query;

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (err) {
        next(err);
    }
};
