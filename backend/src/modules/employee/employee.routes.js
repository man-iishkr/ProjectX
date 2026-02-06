const express = require('express');
const {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee
} = require('./employee.controller');

const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorize('admin', 'hq'), getEmployees)
    .post(authorize('admin', 'hq'), createEmployee);

router
    .route('/:id')
    .get(authorize('admin', 'hq', 'employee'), getEmployee)
    .put(authorize('admin'), updateEmployee)
    .delete(authorize('admin'), deleteEmployee);

module.exports = router;
