const express = require('express');
const router = express.Router();
const salaryController = require('./salary.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

// All routes require authentication AND admin role
router.use(protect);
router.use(authorize('admin'));

// Get all salary records
router.get('/', salaryController.getAllSalaries);

// Get salary statistics
router.get('/stats', salaryController.getSalaryStats);

// Get salary slip PDF
router.get('/:id/slip', salaryController.generateSalarySlip);

// Get single salary by ID
router.get('/:id', salaryController.getSalaryById);

// Create or update salary record
router.post('/', salaryController.upsertSalary);

// Update payment status
router.put('/:id/payment', salaryController.updatePaymentStatus);

// Delete salary record
router.delete('/:id', salaryController.deleteSalary);

module.exports = router;
