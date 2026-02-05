const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    stockist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stockist',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    openingStock: {
        type: Number,
        default: 0
    },
    stockIn: {
        type: Number,
        default: 0
    },
    stockOut: {
        type: Number,
        default: 0
    },
    closingStock: {
        type: Number,
        default: 0 // Should be Opening + In - Out. Calculated or stored.
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Inventory', InventorySchema);
