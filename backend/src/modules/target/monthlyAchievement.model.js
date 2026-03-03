const mongoose = require('mongoose');

const MonthlyAchievementSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hq: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HQ',
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    month: {
        type: Number, // 1-12
        required: true
    },
    salesAchieved: {
        type: Number,
        required: true,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Composite unique index to ensure an employee only submits once per month per year
MonthlyAchievementSchema.index({ employee: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyAchievement', MonthlyAchievementSchema);
