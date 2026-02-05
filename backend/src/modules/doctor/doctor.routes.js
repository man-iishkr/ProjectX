const express = require('express');
const {
    getDoctors,
    getDoctor,
    createDoctor,
    updateDoctor,
    deleteDoctor
} = require('./doctor.controller');

const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getDoctors)
    .post(createDoctor);

router
    .route('/:id')
    .get(getDoctor)
    .put(authorize('admin', 'hq'), updateDoctor)
    .delete(authorize('admin', 'hq'), deleteDoctor);

module.exports = router;
