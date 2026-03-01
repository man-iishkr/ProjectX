const express = require('express');
const {
    getDoctors,
    getDoctor,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    uploadLocation
} = require('./doctor.controller');

const { protect, authorize } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getDoctors)
    .post(createDoctor);

router
    .route('/batch-approve')
    .put(authorize('admin', 'hq'), exports.batchApproveDoctors || require('./doctor.controller').batchApproveDoctors);

router
    .route('/:id')
    .get(getDoctor)
    .put(authorize('admin', 'hq'), updateDoctor)
    .delete(authorize('admin', 'hq'), deleteDoctor);

router
    .route('/:id/location')
    .post(upload.single('image'), uploadLocation);

module.exports = router;
