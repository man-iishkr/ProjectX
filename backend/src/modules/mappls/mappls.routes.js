const express = require('express');
const { searchPlaces, getPlaceDetails } = require('./mappls.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All Mappls routes are protected
router.use(protect);

router.get('/search', searchPlaces);
router.get('/details', getPlaceDetails);

module.exports = router;
