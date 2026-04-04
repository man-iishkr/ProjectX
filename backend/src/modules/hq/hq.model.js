const mongoose = require('mongoose');

const HQSchema = new mongoose.Schema({
    name: { // e.g., "Delhi HQ"
        type: String,
        unique: true,
        sparse: true // Allow null values during bulk import
    },
    location: {
        type: String, // String Address
        required: false
    },
    // GeoJSON Point for Mapping/Radius Search
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [lng, lat]
            index: '2dsphere'
        }
    },
    state: {
        type: String,
        required: false
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
