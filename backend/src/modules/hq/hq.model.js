const mongoose = require('mongoose');

const HQSchema = new mongoose.Schema({
    name: { // e.g., "Delhi HQ"
        type: String,
        required: [true, 'Please add a HQ name'],
        unique: true
    },
    location: {
        type: String, // Address or description
        required: [true, 'Please add a location']
    },
    state: {
        type: String,
        required: true
    },
    employeeStrength: {
        type: Number,
        default: 0
    },
    managerStrength: {
        type: Number,
        default: 0
    },
    transitDays: {
        type: Number,
        default: 0
    },
    transportRemarks: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HQ', HQSchema);
