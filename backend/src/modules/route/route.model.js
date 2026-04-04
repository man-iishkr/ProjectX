const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    code: {
        type: String,
        trim: true
    },
    hq: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HQ'
    },
    areas: {
        type: [String], // Array of area names
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Route', RouteSchema);
