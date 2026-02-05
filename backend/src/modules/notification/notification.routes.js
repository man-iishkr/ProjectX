const express = require('express');
const { getNotifications } = require('./notification.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'hq'), getNotifications);

module.exports = router;
