const express = require('express');
const {
    getRoutes,
    createRoute,
    searchRoutes
} = require('./route.controller');

const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/search', searchRoutes); // Autocomplete route

router
    .route('/')
    .get(getRoutes)
    .post(createRoute);

module.exports = router;
