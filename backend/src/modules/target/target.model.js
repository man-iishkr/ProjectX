const mongoose = require('mongoose');

const TargetSchema = new mongoose.Schema({
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
    targetValue: {
        type: Number,
        required: true
    },
    // breakdown by employee? Prd says "HQ ID... Target Value". 
    // Maybe total target for the HQ.
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Composite unique index
TargetSchema.index({ hq: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Target', TargetSchema);
