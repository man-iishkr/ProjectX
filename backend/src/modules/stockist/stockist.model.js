const mongoose = require('mongoose');

const StockistSchema = new mongoose.Schema({
    name: {
        type: String
    },
    hq: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HQ'
    },
    code: String,
    address: String,
    contact: String,
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Stockist', StockistSchema);
