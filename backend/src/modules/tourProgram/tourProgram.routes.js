const express = require('express');
const router = express.Router();
const controller = require('./tourProgram.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(protect);

// Get my tour programs
router.get('/my-plans', controller.getMyTourPrograms);

// Upsert a tour program
router.post('/', controller.upsertTourProgram);

// Get programs for approval (Restricted to Managers and Admins)
router.get('/approvals', authorize('admin', 'sm', 'rsm', 'asm'), controller.getTourProgramsForApproval);

// Approve/Reject program
router.patch('/:id/status', authorize('admin', 'sm', 'rsm', 'asm'), controller.updateTourStatus);

module.exports = router;
