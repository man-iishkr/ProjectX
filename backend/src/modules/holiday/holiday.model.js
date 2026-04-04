const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        unique: true,
        sparse: true // Allow null values during bulk import
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Holiday', HolidaySchema);
