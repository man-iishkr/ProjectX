const express = require('express');
const {
    getRoutes,
    createRoute
} = require('./route.controller');

const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getRoutes)
    .post(createRoute);

module.exports = router;
