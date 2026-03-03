const express = require('express');
const {
    createExpense,
    getExpenses,
    updateExpenseStatus
} = require('./expense.controller');

const { protect, authorize } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getExpenses)
    .post(authorize('bde', 'asm', 'rsm', 'sm'), upload.single('image'), createExpense);

router
    .route('/:id')
    .put(authorize('admin', 'sm', 'rsm', 'asm'), updateExpenseStatus);

module.exports = router;
