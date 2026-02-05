const express = require('express');
const { getHQs, createHQ, getHQ, updateHQ, deleteHQ } = require('./hq.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getHQs)
    .post(authorize('admin'), createHQ);

router
    .route('/:id')
    .get(authorize('admin', 'hq'), getHQ)
    .put(authorize('admin'), updateHQ)
    .delete(authorize('admin'), deleteHQ);

module.exports = router;
