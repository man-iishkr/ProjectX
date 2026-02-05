const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a holiday name'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Please add a date'],
        unique: true
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
