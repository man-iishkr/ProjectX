const CallReport = require('./call.model');
const Doctor = require('../doctor/doctor.model');
const User = require('../auth/auth.model');
const haversine = require('../../utils/haversine');
const dateFns = require('date-fns');

// @desc    Submit Call Report
// @route   POST /api/v1/call-reports
// @access  Private (Employee)
exports.createCallReport = async (req, res, next) => {
    try {
        const { doctorId, latitude, longitude, remarks, digipin, products, alongWith } = req.body;

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

        // Filter out self from alongWith
        const validAlongWith = (alongWith || []).filter((id) => id.toString() !== req.user.id.toString());

        const callReport = await CallReport.create({
            employee: req.user.id,
            doctor: doctorId,
            location: {
                type: 'Point',
                coordinates: [empCoords.longitude, empCoords.latitude]
            },
            digipin,
            remarks,
            products,
            alongWith: validAlongWith,
            isApproved,
            distanceFromDoctor: distance
        });

        // ---------------------------------------------------------
        // SALARY & ATTENDANCE UPDATES
        // ---------------------------------------------------------
        if (isApproved) {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();

            const Salary = require('../salary/salary.model');
            const User = require('../auth/auth.model');

            let salary = await Salary.findOne({
                employee: req.user.id,
                'period.month': month,
                'period.year': year
            });

            if (!salary) {
                const employee = await User.findById(req.user.id);
                if (employee) {
                    salary = await Salary.create({
                        employee: req.user.id,
                        period: { month, year },
                        baseSalary: employee.monthlyPay || 0
                    });
                }
            }

            if (salary) {
                // 1. Mark Attendance (Present) if not already marked for today
                // We check if workingDays.present was incremented today? 
                // Difficult to track "today" specifically in a simple counter unless we log dates.
                // Better approach: Check if this is the FIRST approved call of the day.
                const callsTodayCount = await CallReport.countDocuments({
                    employee: req.user.id,
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                    isApproved: true,
                    _id: { $ne: callReport._id } // Exclude current one
                });

                if (callsTodayCount === 0) {
                    // First successful call of the day -> Mark Present
                    salary.workingDays.present += 1;
                }

                // 2. Travel Allowance (TA)
                // Logic: "calculate distance * 10". 
                // User said "if route is set from one location to other... road distance... multiplied by a fixed given cost"
                // And "if the route of doctor is defined same ,i.e jamshedpur to jamshedpur, no calculation is made"

                let taAmount = 0;

                // Normalization for comparison
                const routeFrom = (doctor.routeFrom || '').trim().toLowerCase();
                const routeTo = (doctor.routeTo || '').trim().toLowerCase();

                if (routeFrom !== routeTo) {
                    // Different locations -> Calculate TA
                    // We rely on doctor.distance being populated (manually or via Google API elsewhere)
                    if (doctor.distance && doctor.distance > 0) {
                        taAmount = doctor.distance * 10;
                    }
                }

                if (taAmount > 0) {
                    salary.allowances.ta += taAmount;
                }

                await salary.save();
            }
        }

        res.status(201).json({
            success: true,
            data: callReport,
            message: isApproved ? 'Call Report Approved & Attendance Marked' : `Call Report Submitted but Pending Approval (Distance: ${Math.round(distance)}m)`
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Call Reports (Admin/Manager Monitoring via designation hierarchy)
// @route   GET /api/v1/call-reports
// @access  Private
exports.getCallReports = async (req, res, next) => {
    try {
        const { getSubordinateIds } = require('../../middleware/auth.middleware');
        const { employeeId, startDate, endDate, hqId } = req.query;

        let query = {};

        // Date Filter
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }

        // Role Based Filters
        if (req.user.role === 'admin') {
            if (employeeId) query.employee = employeeId;
            // HQ filter still supported for data segmentation
            if (hqId && !employeeId) {
                const employees = await User.find({ hq: hqId }).select('_id');
                query.employee = { $in: employees.map(e => e._id) };
            }
        } else if (req.user.role === 'bde') {
            // BDE sees own calls only
            query.employee = req.user.id;
        } else {
            // SM/RSM/ASM: see their subordinates via the reportingTo hierarchy tree
            const subordinateIds = await getSubordinateIds(req.user._id, false);
            if (employeeId) {
                // Verify the requested employee is indeed a subordinate
                if (!subordinateIds.includes(employeeId.toString())) {
                    return res.status(401).json({ success: false, error: 'Unauthorized to view this employee' });
                }
                query.employee = employeeId;
            } else {
                query.employee = { $in: subordinateIds };
            }
        }

        // Fetch Reports
        const reports = await CallReport.find(query)
            .populate('doctor', 'name address location distance routeFrom routeTo')
            .populate('employee', 'name username designation')
            .populate('products', 'name')
            .populate('alongWith', 'name designation')
            .sort({ createdAt: -1 });

        const reportsWithStats = await Promise.all(reports.map(async (doc) => {
            const report = doc.toObject();

            const reportDate = new Date(report.createdAt);
            const startOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
            const endOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0, 23, 59, 59);

            const visitCount = await CallReport.countDocuments({
                employee: report.employee._id,
                doctor: report.doctor?._id,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });

            report.stats = {
                visitFrequency: visitCount
            };

            return report;
        }));

        res.status(200).json({
            success: true,
            count: reportsWithStats.length,
            data: reportsWithStats
        });
    } catch (err) {
        next(err);
    }
};


