const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a doctor name'],
        trim: true
    },
    code: {
        type: String,
        trim: true
    },
    routeFrom: {
        type: String,
        required: [true, 'Please add route start']
    },
    routeTo: {
        type: String,
        required: [true, 'Please add route end']
    },
    date: {
        type: Date,
        default: Date.now
    },
    area: {
        type: String,
        required: [true, 'Please add an area']
    },
    speciality: {
        type: String,
        required: [true, 'Please add speciality']
    },
    hq: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HQ',
        required: true
    },
    clinicAddress: {
        type: String,
        required: [true, 'Please add clinic address'] // Full formatted address
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
        type: String,
        required: [true, 'Please add mobile number']
    },
    phone: String,
    email: String,

    // Distance for Travel Allowance (in km)
    distance: {
        type: Number,
        default: 0
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
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Doctor', DoctorSchema);
