const complaintService = require('../services/complaintService');

/**
 * Submit a new complaint (Citizen)
 */
async function createComplaint(req, res, next) {
  try {
    const complaint = await complaintService.createComplaint(req.user._id, req.body);
    res.status(201).json({
      success: true,
      data: { complaint },
      message: 'Complaint submitted successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current citizen's own complaints
 */
async function getMyComplaints(req, res, next) {
  try {
    const result = await complaintService.getCitizenComplaints(req.user._id, req.query);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Citizen complaints retrieved'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all complaints (Admin only)
 */
async function getAllComplaints(req, res, next) {
  try {
    const result = await complaintService.getAllComplaints(req.query);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Admin complaint queue retrieved'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get complaint details (Citizen owner or Admin)
 */
async function getComplaintById(req, res, next) {
  try {
    const complaint = await complaintService.getComplaintById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: { complaint },
      message: 'Complaint details retrieved'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update complaint status (Admin only)
 */
async function updateStatus(req, res, next) {
  try {
    const complaint = await complaintService.updateStatus(req.params.id, req.user, req.body);
    res.status(200).json({
      success: true,
      data: { complaint },
      message: 'Status updated successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Triage complaint (Admin only)
 */
async function triageComplaint(req, res, next) {
  try {
    const complaint = await complaintService.triageComplaint(req.params.id, req.user, req.body);
    res.status(200).json({
      success: true,
      data: { complaint },
      message: 'Triage details updated successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Add admin internal note (Admin only)
 */
async function addAdminNote(req, res, next) {
  try {
    const complaint = await complaintService.addAdminNote(req.params.id, req.user, req.body);
    res.status(201).json({
      success: true,
      data: { complaint },
      message: 'Admin note recorded'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Trigger or re-run AI analysis (Citizen owner or Admin)
 */
async function triggerAiAnalysis(req, res, next) {
  try {
    const complaint = await complaintService.triggerAiAnalysis(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: { complaint },
      message: 'AI analysis completed successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Confirm AI recommendations onto official fields (Admin only)
 */
async function confirmAiSuggestions(req, res, next) {
  try {
    const complaint = await complaintService.confirmAiSuggestions(req.params.id, req.user, req.body);
    res.status(200).json({
      success: true,
      data: { complaint },
      message: 'AI suggestions confirmed and applied to official fields'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve citizen dashboard metrics
 */
async function getCitizenMetrics(req, res, next) {
  try {
    const metrics = await complaintService.getCitizenDashboardMetrics(req.user._id);
    res.status(200).json({
      success: true,
      data: { metrics },
      message: 'Citizen dashboard metrics retrieved successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve admin dashboard overview metrics
 */
async function getAdminMetrics(req, res, next) {
  try {
    const metrics = await complaintService.getAdminDashboardMetrics();
    res.status(200).json({
      success: true,
      data: { metrics },
      message: 'Admin dashboard overview metrics retrieved successfully'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateStatus,
  triageComplaint,
  addAdminNote,
  triggerAiAnalysis,
  confirmAiSuggestions,
  getCitizenMetrics,
  getAdminMetrics
};
