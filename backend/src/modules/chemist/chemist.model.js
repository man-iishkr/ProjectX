const mongoose = require('mongoose');

const ChemistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a chemist name'],
        trim: true
    },
    contactPerson: {
        type: String,
        required: [true, 'Please add a contact person name'],
        trim: true
    },
    hq: {
        type: mongoose.Schema.Types.ObjectId, // Chemist belongs to an HQ area
        ref: 'HQ',
        required: true
    },
    address: {
        type: String,
        required: [true, 'Please add address']
    },
    location: {
        // GeoJSON Point
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            index: '2dsphere'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    phone: String,
    email: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Chemist', ChemistSchema);
