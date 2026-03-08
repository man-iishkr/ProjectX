const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    period: {
        year: {
            type: Number,
            required: true
        },
        month: {
            type: Number, // 1-12
            required: true
        }
    },
    earnings: {
        basicPay: { type: Number, default: 0 },
        eduAllow: { type: Number, default: 0 },
        conveyance: { type: Number, default: 0 },
        splAllow: { type: Number, default: 0 },
        vme: { type: Number, default: 0 },
        hra: { type: Number, default: 0 }
    },
    deductions: {
        pf: { type: Number, default: 0 },
        lop: { type: Number, default: 0 } // Loss of Pay deduction
    },
    expenses: { // Admin-only visible operational expenses
        ta: { type: Number, default: 0 },
        hqAllowance: { type: Number, default: 0 },
        xStationAllowance: { type: Number, default: 0 },
        offStationAllowance: { type: Number, default: 0 }
    },
    // Attendance related
    workingDays: {
        total: { type: Number, default: 0 },
        present: { type: Number, default: 0 },
        absent: { type: Number, default: 0 },
        leaves: { type: Number, default: 0 },
        sundays: { type: Number, default: 0 },
        holidays: { type: Number, default: 0 },
        expectedWorkingDays: { type: Number, default: 0 } // Total - Sundays - Holidays
    },
    // Payment details
    paymentStatus: {
        type: String,
        enum: ['pending', 'processed', 'paid', 'hold'],
        default: 'pending'
    },
    paymentDate: {
        type: Date,
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'cash', 'cheque'],
        default: 'bank_transfer'
    },
    transactionId: {
        type: String,
        default: null
    },
    notes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Composite unique index
SalarySchema.index({ employee: 1, 'period.year': 1, 'period.month': 1 }, { unique: true });

// Virtuals for Earnings
SalarySchema.virtual('totalEarnings').get(function () {
    return (this.earnings?.basicPay || 0) +
        (this.earnings?.eduAllow || 0) +
        (this.earnings?.conveyance || 0) +
        (this.earnings?.splAllow || 0) +
        (this.earnings?.vme || 0) +
        (this.earnings?.hra || 0);
});

// Virtual for Deductions
SalarySchema.virtual('totalDeductions').get(function () {
    return (this.deductions?.pf || 0) +
        (this.deductions?.lop || 0);
});

// Virtual for Expenses
SalarySchema.virtual('totalExpenses').get(function () {
    return (this.expenses?.ta || 0) +
        (this.expenses?.hqAllowance || 0) +
        (this.expenses?.xStationAllowance || 0) +
        (this.expenses?.offStationAllowance || 0);
});

// Virtual for Net Payable Salary
SalarySchema.virtual('netPayable').get(function () {
    return this.totalEarnings - this.totalDeductions;
});

// Auto-calculate attendance bounds and Loss of Pay (LOP) based on real Calendar bounds
SalarySchema.pre('save', function () {
    const year = this.period.year;
    const month = this.period.month;

    if (year && month) {
        const daysInMonth = new Date(year, month, 0).getDate();

        // Count Sundays
        let sundays = 0;
        for (let i = 1; i <= daysInMonth; i++) {
            if (new Date(year, month - 1, i).getDay() === 0) sundays++;
        }

        if (!this.workingDays) this.workingDays = {};

        this.workingDays.total = daysInMonth;
        this.workingDays.sundays = sundays;

        const expected = daysInMonth - sundays - (this.workingDays.holidays || 0);
        this.workingDays.expectedWorkingDays = expected;

        const presentDays = this.workingDays.present || 0;

        // Only trigger LOP deduction if they worked fewer days than expected
        const lopDays = Math.max(0, expected - presentDays);
        this.workingDays.absent = lopDays;

        if (this.earnings && this.earnings.basicPay) {
            const perDaySalary = this.earnings.basicPay / daysInMonth;
            this.deductions.lop = Math.round(lopDays * perDaySalary);
        } else {
            this.deductions.lop = 0;
        }
    }
});

// Enable virtuals in JSON
SalarySchema.set('toJSON', { virtuals: true });
SalarySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Salary', SalarySchema);
