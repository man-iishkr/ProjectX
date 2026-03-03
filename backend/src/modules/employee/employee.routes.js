const express = require('express');
const {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getPotentialManagers
} = require('./employee.controller');

const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Get potential managers for a given role (used in create/edit dropdown)
router.get('/managers', authorize('admin', 'sm', 'rsm', 'asm'), getPotentialManagers);

router
    .route('/')
    .get(authorize('admin', 'sm', 'rsm', 'asm'), getEmployees)
    .post(authorize('admin', 'sm', 'rsm', 'asm'), createEmployee);

router
    .route('/:id')
    .get(authorize('admin', 'sm', 'rsm', 'asm', 'bde'), getEmployee)
    .put(authorize('admin'), updateEmployee)
    .delete(authorize('admin'), deleteEmployee);

module.exports = router;
