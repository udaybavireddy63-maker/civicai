const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const { saveBase64Image } = require('./storage/imageStorage');
const { complaintAnalysisService } = require('./ai/complaintAnalysisService');
const {
  validateCreateComplaint,
  validateStatusUpdate,
  validateTriageUpdate,
  validateAdminNote
} = require('../validators/complaintValidator');
const { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } = require('../constants');

class ComplaintService {
  /**
   * Submit a new civic complaint
   */
  async createComplaint(citizenId, inputData) {
    const { isValid, errors, sanitized } = validateCreateComplaint(inputData);
    if (!isValid) {
      const err = new Error(errors.join(' '));
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    // Process image attachment if provided
    let imageMetadata = { url: null, storageKey: null, mimeType: null };
    if (sanitized.imageBase64) {
      try {
        const stored = await saveBase64Image(sanitized.imageBase64);
        if (stored) {
          imageMetadata = stored;
        }
      } catch (imgErr) {
        const err = new Error(`Image upload failed: ${imgErr.message}`);
        err.status = 400;
        err.code = 'IMAGE_UPLOAD_ERROR';
        throw err;
      }
    }

    const referenceCode = Complaint.generateReferenceCode();

    const initialHistoryEntry = {
      from: null,
      to: COMPLAINT_STATUSES.SUBMITTED,
      changedBy: citizenId,
      note: 'Issue reported by citizen via CivicAI.',
      changedAt: new Date()
    };

    const complaint = await Complaint.create({
      referenceCode,
      citizenId,
      title: sanitized.title,
      description: sanitized.description,
      category: sanitized.category,
      location: sanitized.location,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
      status: COMPLAINT_STATUSES.SUBMITTED,
      department: 'Unassigned',
      image: imageMetadata,
      aiAnalysis: {
        status: 'PENDING',
        summary: '',
        suggestedCategory: '',
        suggestedPriority: '',
        suggestedDepartment: '',
        rationale: '',
        analyzedAt: null
      },
      statusHistory: [initialHistoryEntry],
      adminNotes: []
    });

    // Asynchronously initiate AI classification and duplicate detection
    complaintAnalysisService.analyzeComplaintAsync(complaint._id);

    return complaint;
  }

  /**
   * Retrieve complaints reported by the authenticated citizen
   * Internal adminNotes are omitted for privacy and security.
   */
  async getCitizenComplaints(citizenId, queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { citizenId };

    if (queryParams.status && queryParams.status !== 'ALL') {
      filter.status = queryParams.status;
    }

    if (queryParams.category && queryParams.category !== 'ALL') {
      filter.category = queryParams.category;
    }

    if (queryParams.search && queryParams.search.trim()) {
      const term = queryParams.search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { referenceCode: { $regex: term, $options: 'i' } },
        { 'location.address': { $regex: term, $options: 'i' } }
      ];
    }

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .select('-adminNotes') // Strictly omit internal admin notes
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Complaint.countDocuments(filter)
    ]);

    return {
      complaints,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit
      }
    };
  }

  /**
   * Retrieve all complaints for administrators with search, filters, and pagination
   */
  async getAllComplaints(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const filter = {};

    if (queryParams.status && queryParams.status !== 'ALL') {
      filter.status = queryParams.status;
    }

    if (queryParams.category && queryParams.category !== 'ALL') {
      filter.category = queryParams.category;
    }

    if (queryParams.priority && queryParams.priority !== 'ALL') {
      filter.priority = queryParams.priority;
    }

    if (queryParams.department && queryParams.department !== 'ALL') {
      filter.department = queryParams.department;
    }

    if (queryParams.search && queryParams.search.trim()) {
      const term = queryParams.search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { referenceCode: { $regex: term, $options: 'i' } },
        { 'location.address': { $regex: term, $options: 'i' } }
      ];
    }

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('citizenId', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('adminNotes.authorId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Complaint.countDocuments(filter)
    ]);

    return {
      complaints,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit
      }
    };
  }

  /**
   * Retrieve aggregated dashboard metrics for an authenticated citizen
   * Uses single-pass MongoDB $facet aggregation across all records
   */
  async getCitizenDashboardMetrics(citizenId) {
    const citizenObjectId =
      typeof citizenId === 'string' ? new mongoose.Types.ObjectId(citizenId) : citizenId;

    const [result] = await Complaint.aggregate([
      { $match: { citizenId: citizenObjectId } },
      {
        $facet: {
          statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          categoryCounts: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          totalCount: [{ $count: 'total' }],
          recentReport: [
            { $sort: { updatedAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 1,
                referenceCode: 1,
                title: 1,
                status: 1,
                category: 1,
                priority: 1,
                updatedAt: 1
              }
            }
          ]
        }
      }
    ]);

    const total = result?.totalCount?.[0]?.total || 0;

    const statusMap = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REJECTED: 0
    };

    (result?.statusCounts || []).forEach((item) => {
      if (item._id && statusMap[item._id] !== undefined) {
        statusMap[item._id] = item.count;
      }
    });

    const active =
      statusMap.SUBMITTED +
      statusMap.UNDER_REVIEW +
      statusMap.ASSIGNED +
      statusMap.IN_PROGRESS;
    const resolved = statusMap.RESOLVED;
    const rejected = statusMap.REJECTED;

    const categoryBreakdown = (result?.categoryCounts || []).map((cat) => ({
      category: cat._id,
      count: cat.count,
      percentage: total > 0 ? Math.round((cat.count / total) * 100) : 0
    }));

    const recentReport =
      result?.recentReport && result.recentReport.length > 0 ? result.recentReport[0] : null;

    return {
      total,
      active,
      resolved,
      rejected,
      statusCounts: {
        submitted: statusMap.SUBMITTED,
        underReview: statusMap.UNDER_REVIEW,
        assigned: statusMap.ASSIGNED,
        inProgress: statusMap.IN_PROGRESS,
        resolved: statusMap.RESOLVED,
        rejected: statusMap.REJECTED
      },
      categoryBreakdown,
      recentReport
    };
  }

  /**
   * Retrieve system-wide aggregated dashboard metrics for administrators
   * Uses single-pass MongoDB $facet aggregation across all records
   */
  async getAdminDashboardMetrics() {
    const [result] = await Complaint.aggregate([
      {
        $facet: {
          statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          categoryCounts: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          priorityCounts: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          aiStatusCounts: [{ $group: { _id: '$aiAnalysis.status', count: { $sum: 1 } } }],
          totalCount: [{ $count: 'total' }],
          recentActivity: [
            { $sort: { updatedAt: -1 } },
            { $limit: 6 },
            {
              $project: {
                _id: 1,
                referenceCode: 1,
                title: 1,
                status: 1,
                category: 1,
                priority: 1,
                department: 1,
                'aiAnalysis.status': 1,
                updatedAt: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ]);

    const total = result?.totalCount?.[0]?.total || 0;

    const statusMap = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REJECTED: 0
    };

    (result?.statusCounts || []).forEach((item) => {
      if (item._id && statusMap[item._id] !== undefined) {
        statusMap[item._id] = item.count;
      }
    });

    const pendingTriage = statusMap.SUBMITTED + statusMap.UNDER_REVIEW;
    const active =
      statusMap.SUBMITTED +
      statusMap.UNDER_REVIEW +
      statusMap.ASSIGNED +
      statusMap.IN_PROGRESS;
    const resolved = statusMap.RESOLVED;
    const rejected = statusMap.REJECTED;

    const statusBreakdown = [
      {
        status: 'SUBMITTED',
        label: 'Submitted',
        count: statusMap.SUBMITTED,
        percentage: total > 0 ? Math.round((statusMap.SUBMITTED / total) * 100) : 0,
        color: 'var(--color-info)'
      },
      {
        status: 'UNDER_REVIEW',
        label: 'Under Review',
        count: statusMap.UNDER_REVIEW,
        percentage: total > 0 ? Math.round((statusMap.UNDER_REVIEW / total) * 100) : 0,
        color: 'var(--color-warning)'
      },
      {
        status: 'ASSIGNED',
        label: 'Assigned',
        count: statusMap.ASSIGNED,
        percentage: total > 0 ? Math.round((statusMap.ASSIGNED / total) * 100) : 0,
        color: '#7C3AED'
      },
      {
        status: 'IN_PROGRESS',
        label: 'In Progress',
        count: statusMap.IN_PROGRESS,
        percentage: total > 0 ? Math.round((statusMap.IN_PROGRESS / total) * 100) : 0,
        color: 'var(--color-primary)'
      },
      {
        status: 'RESOLVED',
        label: 'Resolved',
        count: statusMap.RESOLVED,
        percentage: total > 0 ? Math.round((statusMap.RESOLVED / total) * 100) : 0,
        color: 'var(--color-success)'
      },
      {
        status: 'REJECTED',
        label: 'Rejected',
        count: statusMap.REJECTED,
        percentage: total > 0 ? Math.round((statusMap.REJECTED / total) * 100) : 0,
        color: 'var(--color-danger)'
      }
    ];

    const categoryBreakdown = (result?.categoryCounts || []).map((cat) => ({
      category: cat._id,
      count: cat.count,
      percentage: total > 0 ? Math.round((cat.count / total) * 100) : 0
    }));

    const priorityMap = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    (result?.priorityCounts || []).forEach((p) => {
      if (p._id && priorityMap[p._id] !== undefined) {
        priorityMap[p._id] = p.count;
      }
    });

    const priorityBreakdown = [
      {
        priority: 'HIGH',
        label: 'High Priority',
        count: priorityMap.HIGH,
        percentage: total > 0 ? Math.round((priorityMap.HIGH / total) * 100) : 0,
        color: 'var(--color-danger)'
      },
      {
        priority: 'MEDIUM',
        label: 'Medium Priority',
        count: priorityMap.MEDIUM,
        percentage: total > 0 ? Math.round((priorityMap.MEDIUM / total) * 100) : 0,
        color: 'var(--color-warning)'
      },
      {
        priority: 'LOW',
        label: 'Low Priority',
        count: priorityMap.LOW,
        percentage: total > 0 ? Math.round((priorityMap.LOW / total) * 100) : 0,
        color: 'var(--color-text-muted)'
      }
    ];

    const aiStatusMap = { PENDING: 0, COMPLETED: 0, FAILED: 0, SKIPPED: 0 };
    (result?.aiStatusCounts || []).forEach((a) => {
      if (a._id && aiStatusMap[a._id] !== undefined) {
        aiStatusMap[a._id] = a.count;
      }
    });

    return {
      total,
      submitted: statusMap.SUBMITTED,
      underReview: statusMap.UNDER_REVIEW,
      assigned: statusMap.ASSIGNED,
      inProgress: statusMap.IN_PROGRESS,
      resolved: statusMap.RESOLVED,
      rejected: statusMap.REJECTED,
      pendingTriage,
      active,
      statusBreakdown,
      categoryBreakdown,
      priorityBreakdown,
      aiCoverage: aiStatusMap,
      recentActivity: result?.recentActivity || []
    };
  }

  /**
   * Retrieve a single complaint detail with ownership enforcement
   */
  async getComplaintById(idOrRef, requestingUser) {
    const idString = String(idOrRef || '');
    let query = { _id: idOrRef };
    if (!idString.match(/^[0-9a-fA-F]{24}$/)) {
      query = { referenceCode: idString };
    }

    const complaint = await Complaint.findOne(query)
      .populate('citizenId', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('statusHistory.changedBy', 'name email role')
      .populate('adminNotes.authorId', 'name email');

    if (!complaint) {
      const err = new Error('Complaint not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const isOwner = complaint.citizenId._id.toString() === requestingUser._id.toString();
    const isAdmin = requestingUser.role === 'ADMIN';

    // Strict ownership enforcement: Citizens can ONLY view their own complaints
    if (!isOwner && !isAdmin) {
      const err = new Error('Access denied. You do not have permission to view this report.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const result = complaint.toObject();

    // Security: Internal admin notes must NEVER be exposed to citizens
    if (!isAdmin) {
      delete result.adminNotes;
    }

    return result;
  }

  /**
   * Update complaint status and append to audit history (Admin only)
   */
  async updateStatus(id, adminUser, data) {
    const { isValid, errors, sanitized } = validateStatusUpdate(data);
    if (!isValid) {
      const err = new Error(errors.join(' '));
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      const err = new Error('Complaint not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const prevStatus = complaint.status;
    const newStatus = sanitized.status;

    // Create status history transition
    complaint.statusHistory.push({
      from: prevStatus,
      to: newStatus,
      changedBy: adminUser._id,
      note: sanitized.note || `Status changed from ${prevStatus} to ${newStatus}`,
      changedAt: new Date()
    });

    complaint.status = newStatus;
    await complaint.save();

    return complaint.populate('statusHistory.changedBy', 'name email role');
  }

  /**
   * Triage complaint: correct category, priority, department, or assignee (Admin only)
   */
  async triageComplaint(id, adminUser, data) {
    const { isValid, errors, updates } = validateTriageUpdate(data);
    if (!isValid) {
      const err = new Error(errors.join(' '));
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      const err = new Error('Complaint not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (updates.category !== undefined) complaint.category = updates.category;
    if (updates.priority !== undefined) complaint.priority = updates.priority;
    if (updates.department !== undefined) complaint.department = updates.department;
    if (updates.assignedTo !== undefined) complaint.assignedTo = updates.assignedTo;

    await complaint.save();
    return complaint;
  }

  /**
   * Add internal administrative note (Admin only)
   */
  async addAdminNote(id, adminUser, data) {
    const { isValid, errors, text } = validateAdminNote(data);
    if (!isValid) {
      const err = new Error(errors.join(' '));
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      const err = new Error('Complaint not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    complaint.adminNotes.push({
      authorId: adminUser._id,
      text,
      createdAt: new Date()
    });

    await complaint.save();
    return complaint.populate('adminNotes.authorId', 'name email role');
  }

  /**
   * Trigger or re-run AI analysis on a complaint (Citizen owner or Admin)
   */
  async triggerAiAnalysis(id, requestingUser) {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      const err = new Error('Complaint not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Citizens can only trigger analysis on their own complaints
    if (
      requestingUser.role !== 'ADMIN' &&
      complaint.citizenId.toString() !== requestingUser._id.toString()
    ) {
      const err = new Error('Access denied. You do not have permission to analyze this report.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const updated = await complaintAnalysisService.analyzeAndPersist(complaint._id);
    return this.getComplaintById(id, requestingUser);
  }

  /**
   * Confirm/adopt AI suggestions onto official fields (Admin only)
   */
  async confirmAiSuggestions(id, adminUser, options = {}) {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      const err = new Error('Complaint not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    await complaintAnalysisService.confirmAiSuggestions(complaint._id, adminUser, options);
    return this.getComplaintById(id, adminUser);
  }
}

module.exports = new ComplaintService();
