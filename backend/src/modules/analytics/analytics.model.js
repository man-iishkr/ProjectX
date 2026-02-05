const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    hq: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HQ'
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
    // Target vs Achieved
    targets: {
        doctorVisits: {
            target: { type: Number, default: 0 },
            achieved: { type: Number, default: 0 }
        },
        chemistVisits: {
            target: { type: Number, default: 0 },
            achieved: { type: Number, default: 0 }
        },
        sales: {
            target: { type: Number, default: 0 },
            achieved: { type: Number, default: 0 }
        },
        callReports: {
            target: { type: Number, default: 0 },
            achieved: { type: Number, default: 0 }
        }
    },
    // Visit Frequency Data
    visitFrequency: {
        totalVisits: { type: Number, default: 0 },
        uniqueDoctors: { type: Number, default: 0 },
        uniqueChemists: { type: Number, default: 0 },
        averageVisitsPerDay: { type: Number, default: 0 },
        peakVisitDay: { type: String, default: null } // Monday, Tuesday, etc.
    },
    // Performance Metrics
    performance: {
        attendancePercentage: { type: Number, default: 0 },
        onTimeReporting: { type: Number, default: 0 },
        expenseCompliance: { type: Number, default: 0 },
        overallScore: { type: Number, default: 0 }
    },
    // Location/Region Data
    coverage: {
        regionsAssigned: { type: Number, default: 0 },
        regionsCovered: { type: Number, default: 0 },
        coveragePercentage: { type: Number, default: 0 }
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
AnalyticsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Composite unique index for employee + period
AnalyticsSchema.index({ employee: 1, 'period.year': 1, 'period.month': 1 }, { unique: true });

// Virtual for overall completion percentage
AnalyticsSchema.virtual('completionPercentage').get(function () {
    const targetTotal =
        this.targets.doctorVisits.target +
        this.targets.chemistVisits.target +
        this.targets.sales.target +
        this.targets.callReports.target;

    const achievedTotal =
        this.targets.doctorVisits.achieved +
        this.targets.chemistVisits.achieved +
        this.targets.sales.achieved +
        this.targets.callReports.achieved;

    return targetTotal > 0 ? ((achievedTotal / targetTotal) * 100).toFixed(2) : 0;
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
