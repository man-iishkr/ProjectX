const MonthlyAchievement = require('./monthlyAchievement.model');
const Target = require('./target.model');
const mongoose = require('mongoose');

// Helper to determine financial year
const getFinancialYearInfo = (date = new Date()) => {
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    if (month >= 4) {
        return { startYear: year, endYear: year + 1 };
    } else {
        return { startYear: year - 1, endYear: year };
    }
};

// @desc    Submit monthly sales achievement
// @route   POST /api/v1/targets/monthly-achievements
// @access  Private (Employee)
exports.submitMonthlyAchievement = async (req, res, next) => {
    try {
        const { year, month, salesAchieved } = req.body;

        if (!year || !month || salesAchieved === undefined) {
            return res.status(400).json({ success: false, error: 'Please provide year, month, and salesAchieved' });
        }

        // Check if an entry already exists for this employee for the given month
        const existingEntry = await MonthlyAchievement.findOne({
            employee: req.user.id,
            year,
            month
        });

        if (existingEntry) {
            // Alternatively, we could allow updating here, but let's stick to PRD (or throw error)
            // Let's allow updating instead so employees can fix mistakes
            existingEntry.salesAchieved = salesAchieved;
            await existingEntry.save();
            return res.status(200).json({ success: true, data: existingEntry, message: 'Achievement updated' });
        }

        const achievement = await MonthlyAchievement.create({
            employee: req.user.id,
            hq: req.user.hq,
            year,
            month,
            salesAchieved
        });

        res.status(201).json({
            success: true,
            data: achievement
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Achievement for this month is already submitted' });
        }
        console.error('Error submitting monthly achievement:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get financial year progress
// @route   GET /api/v1/targets/progress
// @access  Private
exports.getFinancialYearProgress = async (req, res, next) => {
    try {
        const hq = req.query.hq || (req.user.role !== 'admin' ? req.user.hq : null);
        const { startYear, endYear } = req.query.startYear ?
            { startYear: parseInt(req.query.startYear), endYear: parseInt(req.query.startYear) + 1 } :
            getFinancialYearInfo();

        if (!hq && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, error: 'HQ is required' });
        }

        // Financial Year spans:
        // Apr - Dec of startYear
        // Jan - Mar of endYear

        let matchCondition = {
            $or: [
                { year: startYear, month: { $gte: 4, $lte: 12 } },
                { year: endYear, month: { $gte: 1, $lte: 3 } }
            ]
        };

        let targetQuery = { ...matchCondition };
        let achievementQuery = { ...matchCondition };

        if (hq) {
            targetQuery.hq = hq;
            achievementQuery.hq = hq;
        }

        const employeeId = req.query.employeeId || null;
        if (employeeId) {
            achievementQuery.employee = employeeId;
        }

        // 1. Get the assigned targets
        const targets = await Target.find(targetQuery);

        // 2. Aggregate monthly achievements
        const achievements = await MonthlyAchievement.find(achievementQuery).populate('employee', 'name role');

        // Prepare data structure for April - March
        const financialYearMonths = [
            { label: 'Apr', month: 4, year: startYear },
            { label: 'May', month: 5, year: startYear },
            { label: 'Jun', month: 6, year: startYear },
            { label: 'Jul', month: 7, year: startYear },
            { label: 'Aug', month: 8, year: startYear },
            { label: 'Sep', month: 9, year: startYear },
            { label: 'Oct', month: 10, year: startYear },
            { label: 'Nov', month: 11, year: startYear },
            { label: 'Dec', month: 12, year: startYear },
            { label: 'Jan', month: 1, year: endYear },
            { label: 'Feb', month: 2, year: endYear },
            { label: 'Mar', month: 3, year: endYear }
        ];

        // Format chart data arrays
        const labels = financialYearMonths.map(m => m.label);
        const targetsData = new Array(12).fill(0);
        const achievementsData = new Array(12).fill(0);
        let totalYearlyTarget = 0;
        let totalYearlyAchieved = 0;

        // Map targets
        targets.forEach(t => {
            const index = financialYearMonths.findIndex(m => m.month === t.month && m.year === t.year);
            if (index !== -1) {
                targetsData[index] += t.targetValue;
                totalYearlyTarget += t.targetValue;
            }
        });

        // Map achievements & employee breakdown
        const employeeBreakdown = {};

        achievements.forEach(ach => {
            const index = financialYearMonths.findIndex(m => m.month === ach.month && m.year === ach.year);
            if (index !== -1) {
                achievementsData[index] += ach.salesAchieved;
                totalYearlyAchieved += ach.salesAchieved;
            }

            // Breakdown
            if (ach.employee) { // Might be null if employee deleted, but schema requires it
                const empId = ach.employee._id.toString();
                if (!employeeBreakdown[empId]) {
                    employeeBreakdown[empId] = {
                        id: empId,
                        name: ach.employee.name,
                        total: 0,
                        months: new Array(12).fill(0)
                    };
                }
                employeeBreakdown[empId].total += ach.salesAchieved;
                if (index !== -1) {
                    employeeBreakdown[empId].months[index] += ach.salesAchieved;
                }
            }
        });

        // Calculate Current Month Stats
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        let currentMonthTarget = 0;
        let currentMonthAchieved = 0;

        targets.forEach(t => {
            if (t.month === currentMonth && t.year === currentYear) {
                currentMonthTarget += t.targetValue;
            }
        });

        achievements.forEach(ach => {
            if (ach.month === currentMonth && ach.year === currentYear) {
                currentMonthAchieved += ach.salesAchieved;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                hq,
                financialYear: `${startYear}-${endYear}`,
                totalYearlyTarget,
                totalYearlyAchieved,
                currentMonthTarget,
                currentMonthAchieved,
                remainingYearlyTarget: Math.max(0, totalYearlyTarget - totalYearlyAchieved),
                completionPercentage: totalYearlyTarget > 0 ? parseFloat(((totalYearlyAchieved / totalYearlyTarget) * 100).toFixed(2)) : 0,
                currentMonthCompletion: currentMonthTarget > 0 ? parseFloat(((currentMonthAchieved / currentMonthTarget) * 100).toFixed(2)) : 0,
                chartData: {
                    labels,
                    targets: targetsData,
                    achievements: achievementsData
                },
                financialYearMonths,
                employeeBreakdown: Object.values(employeeBreakdown)
            }
        });

    } catch (err) {
        console.error('Error getting target progress:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
