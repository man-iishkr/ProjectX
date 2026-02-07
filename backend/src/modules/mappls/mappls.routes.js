const express = require('express');
const { searchPlaces, getPlaceDetails, getToken } = require('./mappls.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All Mappls routes are protected
router.use(protect);

router.get('/token', getToken); // For Frontend Map SDK
router.get('/search', searchPlaces); // Proxy AutoSugegst
router.get('/details', getPlaceDetails); // Proxy eLoc/RevGeo

module.exports = router;
