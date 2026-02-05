const Salary = require('./salary.model');
const User = require('../auth/auth.model');

// Get all salary records (with filters)
exports.getAllSalaries = async (req, res) => {
    try {
        const { employeeId, year, month, status } = req.query;

        let query = {};
        if (employeeId) query.employee = employeeId;
        if (year) query['period.year'] = parseInt(year);
        if (month) query['period.month'] = parseInt(month);
        if (status) query.paymentStatus = status;

        const salaries = await Salary.find(query)
            .populate('employee', 'name email employeeId designation')
            .sort({ 'period.year': -1, 'period.month': -1 });

        res.json(salaries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching salaries', error: error.message });
    }
};

// Get salary by ID
exports.getSalaryById = async (req, res) => {
    try {
        const salary = await Salary.findById(req.params.id)
            .populate('employee', 'name email employeeId designation bankDetails');

        if (!salary) {
            return res.status(404).json({ message: 'Salary record not found' });
        }

        res.json(salary);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching salary', error: error.message });
    }
};

const Expense = require('../expense/expense.model');

// Create or update salary record
exports.upsertSalary = async (req, res) => {
    try {
        const {
            employeeId,
            year,
            month,
            allowances,
            deductions,
            bonuses,
            workingDays,
            paymentStatus,
            paymentDate,
            paymentMethod,
            transactionId,
            notes
        } = req.body;

        // Validate employee exists
        const employee = await User.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Calculate Approved Expenses for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const expenses = await Expense.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate },
            status: 'Approved'
        });

        const totalApprovedExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        const filter = {
            employee: employeeId,
            'period.year': year,
            'period.month': month
        };

        // Use employee's current monthlyPay as baseSalary if not provided
        const baseSalary = employee.monthlyPay || 0;

        const update = {
            employee: employeeId,
            period: { year, month },
            baseSalary,
            allowances: allowances || {},
            deductions: deductions || {},
            bonuses: bonuses || {},
            approvedExpenses: totalApprovedExpenses,
            workingDays: workingDays || {},
            paymentStatus: paymentStatus || 'pending',
            paymentDate,
            paymentMethod,
            transactionId,
            notes
        };

        const salary = await Salary.findOneAndUpdate(
            filter,
            update,
            { new: true, upsert: true, runValidators: true }
        ).populate('employee', 'name email employeeId designation');

        res.json({ message: 'Salary record saved', salary });
    } catch (error) {
        res.status(500).json({ message: 'Error saving salary', error: error.message });
    }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { status, paymentDate, paymentMethod, transactionId } = req.body;

        const salary = await Salary.findById(req.params.id);
        if (!salary) {
            return res.status(404).json({ message: 'Salary record not found' });
        }

        salary.paymentStatus = status;
        if (paymentDate) salary.paymentDate = paymentDate;
        if (paymentMethod) salary.paymentMethod = paymentMethod;
        if (transactionId) salary.transactionId = transactionId;

        await salary.save();
        await salary.populate('employee', 'name email employeeId');

        res.json({ message: 'Payment status updated', salary });
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment status', error: error.message });
    }
};

// Generate PDF salary slip
exports.generateSalarySlip = async (req, res) => {
    try {
        const salary = await Salary.findById(req.params.id)
            .populate('employee', 'name email employeeId designation bankDetails address');

        if (!salary) {
            return res.status(404).json({ message: 'Salary record not found' });
        }

        // For now, return salary data in structured format
        // In production, integrate a PDF library like pdfkit or puppeteer
        const salarySlip = {
            companyName: 'Field ERP Company',
            companyAddress: 'Company Address Here',
            slipDate: new Date().toLocaleDateString(),
            employee: {
                name: salary.employee.name,
                employeeId: salary.employee.employeeId,
                designation: salary.employee.designation,
                bankAccount: salary.employee.bankDetails?.accountNumber || 'N/A'
            },
            period: {
                month: new Date(salary.period.year, salary.period.month - 1).toLocaleDateString('en-US', { month: 'long' }),
                year: salary.period.year
            },
            earnings: {
                baseSalary: salary.baseSalary,
                hra: salary.allowances.hra,
                ta: salary.allowances.ta,
                da: salary.allowances.da,
                medical: salary.allowances.medical,
                otherAllowances: salary.allowances.others,
                performanceBonus: salary.bonuses.performance,
                festiveBonus: salary.bonuses.festive,
                otherBonuses: salary.bonuses.others,
                totalEarnings: salary.grossSalary
            },
            deductions: {
                pf: salary.deductions.pf,
                tax: salary.deductions.tax,
                insurance: salary.deductions.insurance,
                loanRepayment: salary.deductions.loanRepayment,
                others: salary.deductions.others,
                totalDeductions: salary.totalDeductions
            },
            attendance: salary.workingDays,
            netSalary: salary.netSalary,
            paymentDetails: {
                status: salary.paymentStatus,
                method: salary.paymentMethod,
                transactionId: salary.transactionId,
                date: salary.paymentDate
            }
        };

        // TODO: Integrate PDF generation library
        // For now, return JSON that frontend can use
        res.json({
            message: 'Salary slip data',
            salarySlip,
            pdfUrl: null // Would return PDF URL after generation
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating salary slip', error: error.message });
    }
};

// Get salary statistics
exports.getSalaryStats = async (req, res) => {
    try {
        const { year, month } = req.query;

        let query = {};
        if (year) query['period.year'] = parseInt(year);
        if (month) query['period.month'] = parseInt(month);

        const salaries = await Salary.find(query);

        const stats = {
            totalEmployees: salaries.length,
            totalPayroll: salaries.reduce((sum, s) => sum + s.netSalary, 0),
            averageSalary: salaries.length > 0
                ? salaries.reduce((sum, s) => sum + s.netSalary, 0) / salaries.length
                : 0,
            paymentStatus: {
                pending: salaries.filter(s => s.paymentStatus === 'pending').length,
                processed: salaries.filter(s => s.paymentStatus === 'processed').length,
                paid: salaries.filter(s => s.paymentStatus === 'paid').length,
                hold: salaries.filter(s => s.paymentStatus === 'hold').length
            },
            totalDeductions: salaries.reduce((sum, s) => sum + s.totalDeductions, 0),
            totalBonuses: salaries.reduce((sum, s) => sum + s.totalBonuses, 0)
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching salary stats', error: error.message });
    }
};

// Delete salary record
exports.deleteSalary = async (req, res) => {
    try {
        const salary = await Salary.findByIdAndDelete(req.params.id);

        if (!salary) {
            return res.status(404).json({ message: 'Salary record not found' });
        }

        res.json({ message: 'Salary record deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting salary', error: error.message });
    }
};
