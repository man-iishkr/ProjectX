const express = require('express');
const router = express.Router();
const leaveController = require('./leave.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Get all leaves (role-based filtering in controller)
router.get('/', leaveController.getAllLeaves);

// Get leave statistics
router.get('/stats', leaveController.getLeaveStats);

// Get single leave by ID
router.get('/:id', leaveController.getLeaveById);

// Create leave request
router.post('/', leaveController.createLeave);

// Update leave request (only pending leaves)
router.put('/:id', leaveController.updateLeave);

// Approve leave (admin/hq only)
router.patch('/:id/approve', authorize('admin', 'hq'), leaveController.approveLeave);

// Reject leave (admin/hq only)
router.patch('/:id/reject', authorize('admin', 'hq'), leaveController.rejectLeave);

// Cancel leave
router.patch('/:id/cancel', leaveController.cancelLeave);

// Delete leave (admin only)
router.delete('/:id', authorize('admin'), leaveController.deleteLeave);

module.exports = router;
