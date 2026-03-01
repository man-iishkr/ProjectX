const WeeklyAchievement = require('./weeklyAchievement.model');
const Target = require('./target.model');
const mongoose = require('mongoose');

// @desc    Submit weekly sales achievement
// @route   POST /api/v1/targets/weekly-achievements
// @access  Private (Employee)
exports.submitWeeklyAchievement = async (req, res, next) => {
    try {
        const { year, month, week, salesAchieved } = req.body;

        if (!year || !month || !week || salesAchieved === undefined) {
            return res.status(400).json({ success: false, error: 'Please provide year, month, week, and salesAchieved' });
        }

        // Check if an entry already exists for this employee for the given week
        const existingEntry = await WeeklyAchievement.findOne({
            employee: req.user.id,
            year,
            month,
            week
        });

        if (existingEntry) {
            return res.status(400).json({ success: false, error: 'Achievement for this week is already submitted' });
        }

        const achievement = await WeeklyAchievement.create({
            employee: req.user.id,
            hq: req.user.hq,
            year,
            month,
            week,
            salesAchieved
        });

        res.status(201).json({
            success: true,
            data: achievement
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Achievement for this week is already submitted' });
        }
        console.error('Error submitting weekly achievement:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get monthly progress for an HQ
// @route   GET /api/v1/targets/progress
// @access  Private
exports.getMonthlyProgress = async (req, res, next) => {
    try {
        const hq = req.query.hq || (req.user.role !== 'admin' ? req.user.hq : null);
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

        if (!hq && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, error: 'HQ is required' });
        }

        let targetQuery = { year, month };
        let achievementQuery = { year, month };

        if (hq) {
            targetQuery.hq = hq;
            achievementQuery.hq = hq;
        }

        // 1. Get the assigned target(s)
        const targets = await Target.find(targetQuery);
        const targetValue = targets.reduce((sum, t) => sum + t.targetValue, 0);

        // 2. Aggregate weekly achievements
        const achievements = await WeeklyAchievement.find(achievementQuery).populate('employee', 'name role');

        let totalAchieved = 0;
        const weeklyBreakdown = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        };

        const employeeBreakdown = {};

        achievements.forEach(ach => {
            totalAchieved += ach.salesAchieved;
            weeklyBreakdown[ach.week] += ach.salesAchieved;

            const empId = ach.employee._id.toString();
            if (!employeeBreakdown[empId]) {
                employeeBreakdown[empId] = {
                    id: empId,
                    name: ach.employee.name,
                    total: 0,
                    weeks: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                };
            }
            employeeBreakdown[empId].total += ach.salesAchieved;
            employeeBreakdown[empId].weeks[ach.week] += ach.salesAchieved;
        });

        const remainingTarget = Math.max(0, targetValue - totalAchieved);
        const completionPercentage = targetValue > 0 ? ((totalAchieved / targetValue) * 100).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                hq,
                year,
                month,
                targetValue,
                totalAchieved,
                remainingTarget,
                completionPercentage: parseFloat(completionPercentage),
                weeklyBreakdown,
                employeeBreakdown: Object.values(employeeBreakdown)
            }
        });

    } catch (err) {
        console.error('Error getting target progress:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
