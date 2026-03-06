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
        const threshold = Number(process.env.ATTENDANCE_DISTANCE_THRESHOLD_METERS) || 100; // meters. PRD says 20m.
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
                    // First successful call of the day -> Mark Present & Add HQ Allowance
                    salary.workingDays.present += 1;
                    const hqAllowance = Number(process.env.HQ_ALLOWANCE_PER_DAY) || 150;
                    salary.allowances.hqAllowance = (salary.allowances.hqAllowance || 0) + hqAllowance;
                }

                // Fetch all previous approved calls for TODAY to evaluate daily gates
                const callsTodayCursor = await CallReport.find({
                    employee: req.user.id,
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                    isApproved: true,
                    _id: { $ne: callReport._id } // Exclude current one
                }).populate('doctor', 'routeTo distance routeFrom');

                // 2. Evaluate State (HQ vs X-Station vs Off-Station)
                const docDistance = doctor.distance || 0;
                const xStationLimit = Number(process.env.X_STATION_LIMIT_KM) || 50;

                let isCurrentXStation = false;
                let isCurrentOffStation = false;

                if (doctor.routeFrom && doctor.routeTo && doctor.routeFrom.trim().toLowerCase() !== doctor.routeTo.trim().toLowerCase() && docDistance > 0) {
                    if (docDistance <= xStationLimit) {
                        isCurrentXStation = true;
                    } else {
                        isCurrentOffStation = true;
                    }
                }

                // 3. Mutually Exclusive Tiered Allowances
                let hasPastXStation = false;
                let hasPastOffStation = false;
                let visitedRoutesToday = new Set();

                for (const priorCall of callsTodayCursor) {
                    if (priorCall.doctor) {
                        const priorDist = priorCall.doctor.distance || 0;
                        if (priorDist > 0 && priorCall.doctor.routeFrom && priorCall.doctor.routeTo && priorCall.doctor.routeFrom.trim().toLowerCase() !== priorCall.doctor.routeTo.trim().toLowerCase()) {
                            if (priorDist <= xStationLimit) hasPastXStation = true;
                            if (priorDist > xStationLimit) hasPastOffStation = true;
                        }

                        if (priorCall.doctor.routeTo) {
                            visitedRoutesToday.add(priorCall.doctor.routeTo.trim().toLowerCase());
                        }
                    }
                }

                // Inject Allowance (Off-station has priority)
                if (isCurrentOffStation) {
                    if (!hasPastOffStation) {
                        const offStationAllowance = Number(process.env.OFF_STATION_ALLOWANCE_PER_DAY) || 300;
                        salary.allowances.offStationAllowance = (salary.allowances.offStationAllowance || 0) + offStationAllowance;

                        // Deduct X-Station if it was already awarded earlier today
                        if (hasPastXStation) {
                            const xStationAllowance = Number(process.env.X_STATION_ALLOWANCE_PER_DAY) || 250;
                            salary.allowances.xStationAllowance = Math.max(0, (salary.allowances.xStationAllowance || 0) - xStationAllowance);
                        }
                    }
                } else if (isCurrentXStation) {
                    // Only award X-Station if no Off-station happened today AND no X-station happened today
                    if (!hasPastOffStation && !hasPastXStation) {
                        const xStationAllowance = Number(process.env.X_STATION_ALLOWANCE_PER_DAY) || 250;
                        salary.allowances.xStationAllowance = (salary.allowances.xStationAllowance || 0) + xStationAllowance;
                    }
                }

                // 4. Travel Allowance (TA) - Exactly Once per Route Designation per day
                const currentRouteTo = (doctor.routeTo || '').trim().toLowerCase();

                if (currentRouteTo && (isCurrentXStation || isCurrentOffStation) && !visitedRoutesToday.has(currentRouteTo)) {
                    let taRate = 0;
                    if (isCurrentXStation) taRate = Number(process.env.X_STATION_TA_RATE_PER_KM) || 5;
                    if (isCurrentOffStation) taRate = Number(process.env.OFF_STATION_TA_RATE_PER_KM) || 10;

                    if (taRate > 0) {
                        salary.allowances.ta = (salary.allowances.ta || 0) + (docDistance * taRate);
                    }
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


