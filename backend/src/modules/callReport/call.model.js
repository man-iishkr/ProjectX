const mongoose = require('mongoose');

const CallReportSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    location: {
        // Employee location at time of call
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    digipin: String, // Optional reference
    isApproved: {
        type: Boolean,
        default: false
    },
    distanceFromDoctor: { // Store the calculated distance for audit
        type: Number
    },
    remarks: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one call per doctor per day per employee?
// Compound index to check uniqueness is tricky with Date ranges.
// Using logic in controller is better.

module.exports = mongoose.model('CallReport', CallReportSchema);
