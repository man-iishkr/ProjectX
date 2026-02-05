const express = require('express');
const { getHolidays, createHoliday, deleteHoliday } = require('./holiday.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getHolidays)
    .post(authorize('admin'), createHoliday);

router
    .route('/:id')
    .delete(authorize('admin'), deleteHoliday);

module.exports = router;
