const express = require('express');
const {
    getStockists,
    getStockist,
    createStockist,
    updateStockist,
    deleteStockist
} = require('./stockist.controller');

const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getStockists)
    .post(authorize('admin', 'hq'), createStockist);

router
    .route('/:id')
    .get(getStockist)
    .put(authorize('admin', 'hq'), updateStockist)
    .delete(authorize('admin', 'hq'), deleteStockist);

module.exports = router;
