const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now // or selected date
    },
    expenseType: {
        type: String,
        enum: ['Travel', 'Food', 'Lodging', 'Misc'],
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Please add amount']
    },
    imageUrl: {
        type: String,
        required: [true, 'Please upload an image receipt']
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    remarks: String,
    hqApproval: {
        type: Boolean,
        default: false
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
