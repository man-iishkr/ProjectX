const Expense = require('./expense.model');
const { getSubordinateIds, isSubordinate } = require('../../middleware/auth.middleware');

// @desc    Create Expense
// @route   POST /api/v1/expenses
// @access  Private (Employee/BDE)
exports.createExpense = async (req, res, next) => {
    try {
        let imageUrl = '';

        if (req.file) {
            imageUrl = req.file.path;
        } else if (req.body.imageUrl) {
            imageUrl = req.body.imageUrl;
        }

        if (!imageUrl) {
            return res.status(400).json({ success: false, error: 'Please upload an image' });
        }

        const expense = await Expense.create({
            employee: req.user.id,
            date: req.body.date || Date.now(),
            expenseType: req.body.expenseType,
            amount: req.body.amount,
            imageUrl,
            remarks: req.body.remarks
        });

        res.status(201).json({
            success: true,
            data: expense
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Expenses (scoped by hierarchy)
// @route   GET /api/v1/expenses
// @access  Private
exports.getExpenses = async (req, res, next) => {
    try {
        let query;

        if (req.user.role === 'admin') {
            // Admin sees all
            query = Expense.find().populate('employee', 'name designation hq');
        } else if (req.user.role === 'bde') {
            // BDE sees only their own
            query = Expense.find({ employee: req.user.id });
        } else {
            // SM/RSM/ASM: see their subordinates' expenses
            const subordinateIds = await getSubordinateIds(req.user._id, false);
            query = Expense.find({ employee: { $in: subordinateIds } }).populate('employee', 'name designation');
        }

        const expenses = await query;

        res.status(200).json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update Expense Status (Approve/Reject)
// @route   PUT /api/v1/expenses/:id
// @access  Private (Admin/SM/RSM/ASM)
exports.updateExpenseStatus = async (req, res, next) => {
    try {
        const { status, amount } = req.body;

        let expense = await Expense.findById(req.params.id).populate('employee');

        if (!expense) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }

        // Access check
        if (req.user.role === 'bde') {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        if (req.user.role !== 'admin') {
            // Verify employee is a subordinate
            const isSub = await isSubordinate(req.user._id, expense.employee._id);
            if (!isSub) {
                return res.status(403).json({ success: false, error: 'Not authorized for this employee' });
            }
        }

        expense.status = status;
        expense.approvedBy = req.user.id;
        if (status === 'Approved') {
            expense.hqApproval = true;
            if (amount) {
                expense.amount = amount;
            }

            // Update Salary Record
            const expenseDate = new Date(expense.date);
            const month = expenseDate.getMonth() + 1;
            const year = expenseDate.getFullYear();

            const Salary = require('../salary/salary.model');
            const User = require('../auth/auth.model');

            let salary = await Salary.findOne({
                employee: expense.employee._id,
                'period.month': month,
                'period.year': year
            });

            if (!salary) {
                const employee = await User.findById(expense.employee._id);
                if (employee) {
                    salary = await Salary.create({
                        employee: expense.employee._id,
                        period: { month, year },
                        baseSalary: employee.monthlyPay || 0,
                        approvedExpenses: expense.amount
                    });
                }
            } else {
                salary.approvedExpenses += expense.amount;
                await salary.save();
            }
        }

        await expense.save();

        res.status(200).json({
            success: true,
            data: expense
        });
    } catch (err) {
        next(err);
    }
};
