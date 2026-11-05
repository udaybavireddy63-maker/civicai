const express = require('express');
const complaintController = require('../controllers/complaintController');
const authenticate = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { aiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Citizen submission and personal complaints
router.post('/', authenticate, complaintController.createComplaint);
router.get('/mine', authenticate, complaintController.getMyComplaints);

// Dashboard metrics endpoints
router.get('/metrics/mine', authenticate, complaintController.getCitizenMetrics);
router.get('/metrics/overview', authenticate, requireAdmin, complaintController.getAdminMetrics);

// Admin-only queue with filters and pagination
router.get('/', authenticate, requireAdmin, complaintController.getAllComplaints);

// Detail view (Citizen owner or Admin)
router.get('/:id', authenticate, complaintController.getComplaintById);

// AI assistance endpoints
router.post('/:id/ai/analyze', authenticate, aiLimiter, complaintController.triggerAiAnalysis);
router.post('/:id/ai/confirm', authenticate, requireAdmin, complaintController.confirmAiSuggestions);

// Admin-only updates
router.patch('/:id/status', authenticate, requireAdmin, complaintController.updateStatus);
router.patch('/:id/triage', authenticate, requireAdmin, complaintController.triageComplaint);
router.post('/:id/notes', authenticate, requireAdmin, complaintController.addAdminNote);

module.exports = router;
