const mongoose = require('mongoose');

const TourProgramSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    period: {
        year: { type: Number, required: true },
        month: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Approved', 'Rejected'],
        default: 'Draft'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvalDate: {
        type: Date
    },
    remarks: {
        type: String
    },
    dailyPlans: [{
        date: {
            type: String,
            required: true // 'YYYY-MM-DD'
        },
        isWorkingDay: {
            type: Boolean,
            default: true
        },
        from: {
            type: String,
            default: ''
        },
        to: {
            type: String,
            default: ''
        },
        notes: {
            type: String
        }
    }]
}, {
    timestamps: true
});

// One tour program per employee per month
TourProgramSchema.index({ employee: 1, 'period.year': 1, 'period.month': 1 }, { unique: true });

module.exports = mongoose.model('TourProgram', TourProgramSchema);
