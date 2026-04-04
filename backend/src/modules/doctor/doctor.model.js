const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    code: {
        type: String,
        trim: true
    },
    routeFrom: {
        type: String
    },
    routeTo: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    area: {
        type: String
    },
    speciality: {
        type: String
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    hq: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HQ'
    },
    clinicAddress: {
        type: String
    },
    city: String,
    state: String,
    pincode: String,
    residentialAddress: {
        type: String
    },
    class: {
        type: String,
        enum: ['Super Core', 'Core', 'Important', 'General'],
        default: 'General'
    },
    frequency: {
        type: Number,
        default: 1
    },
    mobile: {
        type: String
    },
    phone: String,
    email: String,

    // Distance for Travel Allowance (in km)
    distance: {
        type: Number,
        default: 0
    },
    dob: {
        type: Date
    },
    dom: {
        type: Date
    },

    // GeoJSON Point - making it optional if user doesn't have lat/lng immediately
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    isLocationVerified: {
        type: Boolean,
        default: false
    },
    locationImageUrl: {
        type: String
    },
    locationCapturedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    locationCapturedAt: {
        type: Date
    },

    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    rejectedRemark: {
        type: String
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

module.exports = mongoose.model('Doctor', DoctorSchema);
