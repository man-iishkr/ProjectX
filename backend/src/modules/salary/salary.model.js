const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
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
    baseSalary: {
        type: Number,
        required: true,
        min: 0
    },
    allowances: {
        hra: { type: Number, default: 0 },
        ta: { type: Number, default: 0 },
        da: { type: Number, default: 0 },
        medical: { type: Number, default: 0 },
        others: { type: Number, default: 0 }
    },
    deductions: {
        pf: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
        loanRepayment: { type: Number, default: 0 },
        others: { type: Number, default: 0 }
    },
    bonuses: {
        performance: { type: Number, default: 0 },
        festive: { type: Number, default: 0 },
        others: { type: Number, default: 0 }
    },
    approvedExpenses: {
        type: Number,
        default: 0
    },
    // Attendance related
    workingDays: {
        total: { type: Number, default: 0 },
        present: { type: Number, default: 0 },
        absent: { type: Number, default: 0 },
        leaves: { type: Number, default: 0 },
        holidays: { type: Number, default: 0 }
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
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt on save
SalarySchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Composite unique index
SalarySchema.index({ employee: 1, 'period.year': 1, 'period.month': 1 }, { unique: true });

// Virtual for total allowances
SalarySchema.virtual('totalAllowances').get(function () {
    return this.allowances.hra +
        this.allowances.ta +
        this.allowances.da +
        this.allowances.medical +
        this.allowances.others;
});

// Virtual for total deductions
SalarySchema.virtual('totalDeductions').get(function () {
    return this.deductions.pf +
        this.deductions.tax +
        this.deductions.insurance +
        this.deductions.loanRepayment +
        this.deductions.others;
});

// Virtual for total bonuses
SalarySchema.virtual('totalBonuses').get(function () {
    return this.bonuses.performance +
        this.bonuses.festive +
        this.bonuses.others;
});

// Virtual for gross salary
SalarySchema.virtual('grossSalary').get(function () {
    return this.baseSalary + this.totalAllowances + this.totalBonuses + (this.approvedExpenses || 0);
});

// Virtual for net salary
SalarySchema.virtual('netSalary').get(function () {
    return this.grossSalary - this.totalDeductions;
});

// Enable virtuals in JSON
SalarySchema.set('toJSON', { virtuals: true });
SalarySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Salary', SalarySchema);
