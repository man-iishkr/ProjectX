const express = require('express');
const {
    createChemist,
    getChemists,
    getChemist,
    updateChemist,
    deleteChemist
} = require('./chemist.controller');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth.middleware');

router.use(protect);

router
    .route('/')
    .get(getChemists)
    .post(authorize('admin', 'hq', 'employee'), createChemist);

router
    .route('/:id')
    .get(getChemist)
    .put(authorize('admin', 'hq'), updateChemist)
    .delete(authorize('admin', 'hq'), deleteChemist);

module.exports = router;
