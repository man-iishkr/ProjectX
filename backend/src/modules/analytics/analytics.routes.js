const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Get analytics (with filters)
router.get('/', analyticsController.getAnalytics);

// Get dashboard summary
router.get('/summary', analyticsController.getDashboardSummary);

// Call frequency stats (stacked bar chart data)
router.get('/call-frequency', analyticsController.getCallFrequencyStats);

// Employee monthly trend (last 3 months)
router.get('/employee-trend', analyticsController.getEmployeeTrend);

// Get single analytics by ID
router.get('/:id', analyticsController.getAnalyticsById);

// Upsert analytics (admin/hq only)
router.post('/', authorize('admin', 'hq'), analyticsController.upsertAnalytics);

// Generate analytics for employee/period (admin/hq only)
router.post('/generate', authorize('admin', 'hq'), analyticsController.generateAnalytics);

// Delete analytics (admin only)
router.delete('/:id', authorize('admin'), analyticsController.deleteAnalytics);

module.exports = router;
