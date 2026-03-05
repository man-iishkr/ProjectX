const Analytics = require('./analytics.model');
const User = require('../auth/auth.model');
const CallReport = require('../callReport/call.model');
const Target = require('../target/target.model');

// Get analytics for all employees or specific employee
exports.getAnalytics = async (req, res) => {
    try {
        const { employeeId, year, month, hqId } = req.query;

        let query = {};

        if (employeeId) query.employee = employeeId;
        if (hqId) query.hq = hqId;
        if (year) query['period.year'] = parseInt(year);
        if (month) query['period.month'] = parseInt(month);

        const analytics = await Analytics.find(query)
            .populate('employee', 'name email employeeId')
            .populate('hq', 'name code')
            .sort({ 'period.year': -1, 'period.month': -1 });

        res.json(analytics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
};

// Get analytics by ID
exports.getAnalyticsById = async (req, res) => {
    try {
        const analytics = await Analytics.findById(req.params.id)
            .populate('employee', 'name email employeeId')
            .populate('hq', 'name code');

        if (!analytics) {
            return res.status(404).json({ message: 'Analytics not found' });
        }

        res.json(analytics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
};

// Create or update analytics (usually automated)
exports.upsertAnalytics = async (req, res) => {
    try {
        const { employeeId, year, month, targets, visitFrequency, performance, coverage, hqId } = req.body;

        const filter = {
            employee: employeeId,
            'period.year': year,
            'period.month': month
        };

        const update = {
            employee: employeeId,
            hq: hqId,
            period: { year, month },
            targets,
            visitFrequency,
            performance,
            coverage
        };

        const analytics = await Analytics.findOneAndUpdate(
            filter,
            update,
            { new: true, upsert: true, runValidators: true }
        ).populate('employee', 'name email employeeId');

        res.json({ message: 'Analytics updated', analytics });
    } catch (error) {
        res.status(500).json({ message: 'Error upserting analytics', error: error.message });
    }
};

// Calculate and generate analytics for an employee for a specific period
exports.generateAnalytics = async (req, res) => {
    try {
        const { employeeId, year, month } = req.body;

        if (!employeeId || !year || !month) {
            return res.status(400).json({ message: 'employeeId, year, and month are required' });
        }

        const employee = await User.findById(employeeId).populate('hq');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Calculate date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Fetch call reports for the period
        const callReports = await CallReport.find({
            employee: employeeId,
            visitDate: { $gte: startDate, $lte: endDate }
        });

        // Calculate visit frequency
        const doctorVisits = callReports.filter(cr => cr.visitType === 'doctor');
        const chemistVisits = callReports.filter(cr => cr.visitType === 'chemist');
        const uniqueDoctors = new Set(doctorVisits.map(v => v.doctor?.toString())).size;
        const uniqueChemists = new Set(chemistVisits.map(v => v.chemist?.toString())).size;

        const daysInMonth = endDate.getDate();
        const averageVisitsPerDay = callReports.length / daysInMonth;

        // Get day with most visits
        const dayFrequency = {};
        callReports.forEach(cr => {
            const day = new Date(cr.visitDate).toLocaleDateString('en-US', { weekday: 'long' });
            dayFrequency[day] = (dayFrequency[day] || 0) + 1;
        });
        const peakVisitDay = Object.keys(dayFrequency).reduce((a, b) =>
            dayFrequency[a] > dayFrequency[b] ? a : b, Object.keys(dayFrequency)[0] || null
        );

        // Get targets (simplified - using HQ level targets)
        const targetData = await Target.findOne({
            hq: employee.hq,
            year,
            month
        });

        const doctorVisitTarget = targetData?.targetValue || 0;
        const salesTarget = targetData?.targetValue || 0;

        // Build analytics object
        const analyticsData = {
            employee: employeeId,
            hq: employee.hq,
            period: { year, month },
            targets: {
                doctorVisits: {
                    target: doctorVisitTarget,
                    achieved: doctorVisits.length
                },
                chemistVisits: {
                    target: Math.floor(doctorVisitTarget * 0.5), // Assume 50% of doctor visits
                    achieved: chemistVisits.length
                },
                sales: {
                    target: salesTarget,
                    achieved: 0 // Would calculate from sales/orders
                },
                callReports: {
                    target: doctorVisitTarget,
                    achieved: callReports.length
                }
            },
            visitFrequency: {
                totalVisits: callReports.length,
                uniqueDoctors,
                uniqueChemists,
                averageVisitsPerDay: parseFloat(averageVisitsPerDay.toFixed(2)),
                peakVisitDay
            },
            performance: {
                attendancePercentage: 0, // Would calculate from attendance records
                onTimeReporting: 0, // Would calculate from report submission times
                expenseCompliance: 0, // Would calculate from expense submissions
                overallScore: 0 // Composite score
            },
            coverage: {
                regionsAssigned: employee.assignedRegions?.length || 0,
                regionsCovered: 0, // Would calculate from visited locations
                coveragePercentage: 0
            }
        };

        // Upsert analytics
        const filter = {
            employee: employeeId,
            'period.year': year,
            'period.month': month
        };

        const analytics = await Analytics.findOneAndUpdate(
            filter,
            analyticsData,
            { new: true, upsert: true, runValidators: true }
        ).populate('employee', 'name email employeeId');

        res.json({ message: 'Analytics generated', analytics });
    } catch (error) {
        res.status(500).json({ message: 'Error generating analytics', error: error.message });
    }
};

// Get dashboard summary analytics
exports.getDashboardSummary = async (req, res) => {
    try {
        const { year, month, hqId, employeeId } = req.query;
        const currentYear = parseInt(year) || new Date().getFullYear();
        const currentMonth = parseInt(month) || new Date().getMonth() + 1;

        // 1. Base Counts (Live)
        let employeeQuery = { role: { $ne: 'admin' } };
        let hqQuery = {};
        let stockistQuery = {};
        let doctorQuery = {};

        // Scope Logic
        if (employeeId) {
            const user = await User.findById(employeeId);
            if (user?.hq) {
                // Show counts for their HQ
                doctorQuery.hq = user.hq;
                stockistQuery.hq = user.hq;
            }
        } else if (hqId) {
            employeeQuery.hq = hqId;
            hqQuery._id = hqId;
            doctorQuery.hq = hqId;
            stockistQuery.hq = hqId;
        }

        const totalEmployees = await User.countDocuments(employeeQuery);
        const totalHQs = await require('../hq/hq.model').countDocuments(hqQuery);
        const totalStockists = await require('../stockist/stockist.model').countDocuments(stockistQuery);
        const Doctor = require('../doctor/doctor.model');
        const totalDoctors = await Doctor.countDocuments(doctorQuery);

        // 2. Activity Metrics (Live from CallReport)
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        // Determine IDs to filter CallReport
        let matchedEmployeeIds = null;
        if (employeeId) {
            matchedEmployeeIds = [employeeId];
        } else if (hqId) {
            // Find all employees in this HQ
            const hqUsers = await User.find({ hq: hqId, role: { $ne: 'admin' } }).select('_id');
            matchedEmployeeIds = hqUsers.map(u => u._id);
        }

        const activityQuery = {
            createdAt: { $gte: startDate, $lte: endDate }
        };
        if (matchedEmployeeIds) {
            activityQuery.employee = { $in: matchedEmployeeIds };
        }

        // Live Counts
        const totalVisits = await CallReport.countDocuments(activityQuery);
        const distinctReporters = await CallReport.distinct('employee', activityQuery);
        const reportingCount = distinctReporters.length;

        // 3. Top Performers (Live Aggregation)
        let topPerformers = [];
        if (!employeeId) {
            // Aggregate visits by employee
            topPerformers = await CallReport.aggregate([
                { $match: activityQuery },
                { $group: { _id: '$employee', visits: { $sum: 1 } } },
                { $sort: { visits: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                {
                    $project: {
                        id: '$_id',
                        name: '$user.name',
                        visits: 1,
                        score: { $literal: 0 } // Placeholder
                    }
                }
            ]);
        }

        // 4. Performance Scores (Still from Analytics if exists)
        let analyticsQuery = {
            'period.year': parseInt(currentYear),
            'period.month': parseInt(currentMonth)
        };
        if (employeeId) analyticsQuery.employee = employeeId;
        else if (hqId) analyticsQuery.hq = hqId;

        const analyticsDocs = await Analytics.find(analyticsQuery);
        const avgCompletion = analyticsDocs.length > 0
            ? analyticsDocs.reduce((sum, a) => sum + (parseFloat(a.performance?.overallScore) || 0), 0) / analyticsDocs.length
            : 0;

        // Populate scores into topPerformers if available
        if (topPerformers.length > 0 && analyticsDocs.length > 0) {
            topPerformers.forEach(tp => {
                const analytics = analyticsDocs.find(a => a.employee?.toString() === tp.id.toString());
                if (analytics) {
                    tp.score = analytics.performance?.overallScore || 0;
                }
            });
        }

        // 5. HQ Statistics (Live)
        let hqDistribution = [];
        let hqPerformance = [];

        if (!employeeId) {
            // HQ Distribution based on User roles
            hqDistribution = await User.aggregate([
                { $match: { role: { $ne: 'admin' }, hq: { $exists: true } } },
                { $group: { _id: '$hq', count: { $sum: 1 } } },
                { $lookup: { from: 'hqs', localField: '_id', foreignField: '_id', as: 'hqDetails' } },
                { $unwind: '$hqDetails' },
                { $project: { name: '$hqDetails.name', count: 1 } }
            ]);

            // HQ Performance based on CallReport activity
            hqPerformance = await CallReport.aggregate([
                { $match: activityQuery },
                { $group: { _id: '$employee', visits: { $sum: 1 } } },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                {
                    $group: {
                        _id: '$user.hq',
                        totalVisits: { $sum: '$visits' },
                        employeeCount: { $sum: 1 }
                    }
                },
                { $lookup: { from: 'hqs', localField: '_id', foreignField: '_id', as: 'hqDetails' } },
                { $unwind: '$hqDetails' },
                {
                    $project: {
                        name: '$hqDetails.name',
                        avgVisits: { $divide: ['$totalVisits', '$employeeCount'] },
                        avgScore: { $literal: 0 }
                    }
                }
            ]);
        }

        res.json({
            counts: {
                employees: totalEmployees,
                hqs: totalHQs,
                stockists: totalStockists,
                doctors: totalDoctors
            },
            periodMetrics: {
                totalVisits,
                avgCompletion: parseFloat(avgCompletion.toFixed(1)),
                reportingCount
            },
            topPerformers,
            hqDistribution,
            hqPerformance
        });
    } catch (error) {
        console.error('Dashboard Summary Error:', error);
        res.status(500).json({ message: 'Error fetching summary', error: error.message });
    }
};

// ============================================================
// Call Frequency Stats for Stacked Bar Chart
// GET /api/v1/analytics/call-frequency
// Returns per-employee: how many doctors visited 1x, 2x, 3x+
// ============================================================
exports.getCallFrequencyStats = async (req, res) => {
    try {
        const { year, month, hqId, employeeId } = req.query;
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) || (new Date().getMonth() + 1);

        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        // 1. Find relevant employees
        let empFilter = { role: { $ne: 'admin' } };
        if (hqId) empFilter.hq = hqId;
        if (employeeId) empFilter._id = employeeId;

        const employees = await User.find(empFilter).select('name employeeId hq');

        const result = [];

        for (const emp of employees) {
            // 2. Get all call reports for this employee in the month
            const calls = await CallReport.find({
                employee: emp._id,
                createdAt: { $gte: startDate, $lte: endDate }
            }).select('doctor');

            // 3. Count visits per doctor
            const doctorVisitMap = {};
            calls.forEach(call => {
                const docId = call.doctor?.toString();
                if (docId) {
                    doctorVisitMap[docId] = (doctorVisitMap[docId] || 0) + 1;
                }
            });

            // 4. Categorize: how many doctors visited 1x, 2x, 3x+
            let once = 0, twice = 0, thrice = 0;
            Object.values(doctorVisitMap).forEach((count) => {
                if (count === 1) once++;
                else if (count === 2) twice++;
                else if (count >= 3) thrice++;
            });

            result.push({
                employeeId: emp._id,
                employeeName: emp.name,
                once,
                twice,
                thricePlus: thrice,
                totalDoctors: Object.keys(doctorVisitMap).length,
                totalVisits: calls.length
            });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Call Frequency Stats Error:', error);
        res.status(500).json({ message: 'Error fetching call frequency stats', error: error.message });
    }
};

// ============================================================
// Employee Monthly Trend (Last 3 months)
// GET /api/v1/analytics/employee-trend?employeeId=xxx
// ============================================================
exports.getEmployeeTrend = async (req, res) => {
    try {
        const { employeeId } = req.query;
        if (!employeeId) {
            return res.status(400).json({ message: 'employeeId is required' });
        }

        const now = new Date();
        const months = [];

        for (let i = 2; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
            const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

            const count = await CallReport.countDocuments({
                employee: employeeId,
                createdAt: { $gte: startDate, $lte: endDate }
            });

            const monthLabel = startDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            months.push({ month: monthLabel, visits: count });
        }

        // Also get per-doctor breakdown for current employee
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const calls = await CallReport.find({
            employee: employeeId,
            createdAt: { $gte: currentStart, $lte: currentEnd }
        }).populate('doctor', 'name');

        const doctorVisitMap = {};
        calls.forEach(call => {
            const docName = call.doctor?.name || 'Unknown';
            const docId = call.doctor?._id?.toString();
            if (docId) {
                if (!doctorVisitMap[docId]) {
                    doctorVisitMap[docId] = { name: docName, visits: 0 };
                }
                doctorVisitMap[docId].visits++;
            }
        });

        const doctorBreakdown = Object.values(doctorVisitMap).sort((a, b) => b.visits - a.visits);

        res.json({
            success: true,
            data: { trend: months, doctorBreakdown }
        });
    } catch (error) {
        console.error('Employee Trend Error:', error);
        res.status(500).json({ message: 'Error fetching employee trend', error: error.message });
    }
};

// Delete analytics
exports.deleteAnalytics = async (req, res) => {
    try {
        const analytics = await Analytics.findByIdAndDelete(req.params.id);

        if (!analytics) {
            return res.status(404).json({ message: 'Analytics not found' });
        }

        res.json({ message: 'Analytics deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting analytics', error: error.message });
    }
};
