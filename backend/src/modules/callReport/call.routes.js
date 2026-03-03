const express = require('express');
const {
    createCallReport,
    getCallReports
} = require('./call.controller');

const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getCallReports)
    .post(authorize('bde'), createCallReport);

module.exports = router;
