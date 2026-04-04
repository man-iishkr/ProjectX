const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    username: { // Employee ID or unique username
        type: String,
        unique: true,
        sparse: true // Allow multiple null values during bulk import
    },
    password: {
        type: String,
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        // admin = Super Admin, sm = Sales Manager, rsm = Regional Sales Manager
        // asm = Area Sales Manager, bde = Business Development Executive
        enum: ['admin', 'sm', 'rsm', 'asm', 'bde'],
        default: 'bde'
    },
    // Reporting Manager (direct manager in the hierarchy)
    reportingTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // HQ is kept for data segmentation (doctors/chemists per HQ), not for access control
    hq: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HQ'
    },
    designation: String, // Human-readable: BDE, ASM, RSM, SM
    joiningDate: Date,
    resignationDate: Date,
    aadharCard: String,
    panCard: String,
    mobile: String,
    address: String,
    pincode: String,
    city: String,
    state: String,
    division: String,
    staffType: String,
    salaryDetails: {
        basicPay: { type: Number, default: 0 },
        eduAllow: { type: Number, default: 0 },
        conveyance: { type: Number, default: 0 },
        medical: { type: Number, default: 0 },
        splAllow: { type: Number, default: 0 },
        vme: { type: Number, default: 0 },
        hra: { type: Number, default: 0 },
        lta: { type: Number, default: 0 },
        pf: { type: Number, default: 0 }, // Deduction
        gpa: { type: Number, default: 0 } // Deduction
    },
    allowanceRates: {
        hqAllowance: { type: Number, default: 0 },
        xStationAllowance: { type: Number, default: 0 },
        offStationAllowance: { type: Number, default: 0 }
    },
    employeeInfo: {
        department: String,
        category: String,
        uan: String,
        esicNo: String
    },
    distanceTravelled: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
