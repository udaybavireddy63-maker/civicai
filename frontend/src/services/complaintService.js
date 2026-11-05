import api from './api';

export const complaintService = {
  /**
   * Submit a new complaint (Citizen)
   */
  async submitComplaint(complaintData) {
    const res = await api.post('/complaints', complaintData);
    return res.data.complaint;
  },

  /**
   * Retrieve complaints reported by the logged in citizen
   */
  async getMyComplaints(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/complaints/mine?${queryString}` : '/complaints/mine';
    const res = await api.get(endpoint);
    return res.data;
  },

  /**
   * Retrieve all complaints queue (Admin only)
   */
  async getAllComplaints(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/complaints?${queryString}` : '/complaints';
    const res = await api.get(endpoint);
    return res.data;
  },

  /**
   * Get single complaint by ID or Reference Code
   */
  async getComplaintById(idOrRef) {
    const res = await api.get(`/complaints/${idOrRef}`);
    return res.data.complaint;
  },

  /**
   * Update complaint status (Admin only)
   */
  async updateStatus(id, { status, note }) {
    const res = await api.patch(`/complaints/${id}/status`, { status, note });
    return res.data.complaint;
  },

  /**
   * Triage complaint: update category, priority, department, or assignee (Admin only)
   */
  async triageComplaint(id, triageData) {
    const res = await api.patch(`/complaints/${id}/triage`, triageData);
    return res.data.complaint;
  },

  /**
   * Add internal administrative note (Admin only)
   */
  async addAdminNote(id, { text }) {
    const res = await api.post(`/complaints/${id}/notes`, { text });
    return res.data.complaint;
  },

  /**
   * Trigger or re-run AI analysis on complaint
   */
  async triggerAiAnalysis(id) {
    const res = await api.post(`/complaints/${id}/ai/analyze`);
    return res.data.complaint;
  },

  /**
   * Confirm/adopt AI suggestions onto official fields (Admin only)
   */
  async confirmAiSuggestions(id, options = {}) {
    const res = await api.post(`/complaints/${id}/ai/confirm`, options);
    return res.data.complaint;
  },

  /**
   * Retrieve aggregated dashboard metrics for citizen
   */
  async getCitizenMetrics() {
    const res = await api.get('/complaints/metrics/mine');
    return res.data.metrics;
  },

  /**
   * Retrieve system-wide aggregated dashboard metrics (Admin only)
   */
  async getAdminMetrics() {
    const res = await api.get('/complaints/metrics/overview');
    return res.data.metrics;
  }
};

export default complaintService;
