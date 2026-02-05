const express = require('express');
const { getHQs, createHQ } = require('./hq.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getHQs)
    .post(createHQ);

module.exports = router;
