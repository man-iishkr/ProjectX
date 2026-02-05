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
        const { year, month, hqId } = req.query;
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || new Date().getMonth() + 1;

        // 1. Get Base Counts (Global or HQ filtered)
        let employeeQuery = { role: 'employee' };
        let hqQuery = {};
        let stockistQuery = {}; // Stockist usually linked to HQ? Assuming global for now or refine later

        if (hqId) {
            employeeQuery.hq = hqId;
            hqQuery._id = hqId; // If specific HQ selected, count is 1? Or maybe valid users in that HQ.
            // stockistQuery.hq = hqId; // If stockist has HQ link
        }

        const totalEmployees = await User.countDocuments(employeeQuery);
        const totalHQs = await require('../hq/hq.model').countDocuments(hqQuery); // Lazy require or move to top
        const totalStockists = await require('../stockist/stockist.model').countDocuments(stockistQuery);

        // 2. Get Analytics Data for Period
        let analyticsQuery = {
            'period.year': parseInt(currentYear),
            'period.month': parseInt(currentMonth)
        };
        if (hqId) analyticsQuery.hq = hqId;

        const analytics = await Analytics.find(analyticsQuery).populate('employee', 'name');

        // 3. Aggregate Performance Metrics
        const totalVisits = analytics.reduce((sum, a) => sum + (a.visitFrequency?.totalVisits || 0), 0);

        // Calculate average completion across all reporting employees
        const avgCompletion = analytics.length > 0
            ? analytics.reduce((sum, a) => sum + (parseFloat(a.performance?.overallScore) || 0), 0) / analytics.length
            : 0;

        // Top Performers
        const topPerformers = analytics
            .sort((a, b) => (b.visitFrequency?.totalVisits || 0) - (a.visitFrequency?.totalVisits || 0))
            .slice(0, 5)
            .map(a => ({
                id: a.employee?._id,
                name: a.employee?.name || 'Unknown',
                visits: a.visitFrequency?.totalVisits || 0,
                score: a.performance?.overallScore || 0
            }));

        res.json({
            counts: {
                employees: totalEmployees,
                hqs: totalHQs,
                stockists: totalStockists
            },
            periodMetrics: {
                totalVisits,
                avgCompletion: parseFloat(avgCompletion.toFixed(1)),
                reportingCount: analytics.length
            },
            topPerformers
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching summary', error: error.message });
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
