const mongoose = require('mongoose');

const ChemistSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    contactPerson: {
        type: String,
        trim: true
    },
    hq: {
        type: mongoose.Schema.Types.ObjectId, // Chemist belongs to an HQ area
        ref: 'HQ'
    },
    address: {
        type: String
    },
    location: {
        // GeoJSON Point
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    phone: String,
    email: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Chemist', ChemistSchema);
