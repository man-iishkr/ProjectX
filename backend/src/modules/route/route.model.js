const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a route name'],
        trim: true
    },
    code: {
        type: String,
        trim: true
    },
    hq: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HQ',
        required: [true, 'Please add an HQ']
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
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Route', RouteSchema);
