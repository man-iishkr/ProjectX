const Expense = require('./expense.model');
const fs = require('fs');

// @desc    Create Expense
// @route   POST /api/v1/expenses
// @access  Private (Employee)
exports.createExpense = async (req, res, next) => {
    try {
        // Assuming file is uploaded via middleware and path is in req.file
        let imageUrl = '';

        if (req.file) {
            imageUrl = req.file.path; // Or Cloudinary URL if using that
        }
        // If no file uploaded but URL provided (e.g. separate upload)
        else if (req.body.imageUrl) {
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

// @desc    Get Expenses
// @route   GET /api/v1/expenses
// @access  Private
exports.getExpenses = async (req, res, next) => {
    try {
        let query;

        if (req.user.role === 'admin') {
            query = Expense.find().populate('employee', 'name role hq');
        } else if (req.user.role === 'hq') {
            // Find expenses of employees in this HQ
            // We can use aggregation lookups or filter by employee IDs.
            // Let's rely on finding Users in this HQ for now.
            const users = await require('../auth/auth.model').find({ hq: req.user.hq }).select('_id');
            const userIds = users.map(u => u._id);

            query = Expense.find({ employee: { $in: userIds } }).populate('employee', 'name');
        } else {
            query = Expense.find({ employee: req.user.id });
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
// @access  Private (Admin/HQ)
exports.updateExpenseStatus = async (req, res, next) => {
    try {
        const { status, amount } = req.body; // 'Approved' or 'Rejected', and optional new amount

        let expense = await Expense.findById(req.params.id).populate('employee');

        if (!expense) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }

        // Access check
        if (req.user.role === 'employee') {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        if (req.user.role === 'hq') {
            // Verify employee belongs to HQ
            // Should implement util for this: isSubordinate(req.user, expense.employee)
            if (expense.employee.hq.toString() !== req.user.hq.toString()) {
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
            const User = require('../auth/auth.model'); // To get base salary if creating new

            let salary = await Salary.findOne({
                employee: expense.employee._id,
                'period.month': month,
                'period.year': year
            });

            if (!salary) {
                // Fetch user to get base details
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
