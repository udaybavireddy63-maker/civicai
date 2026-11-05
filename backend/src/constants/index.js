const USER_ROLES = {
  CITIZEN: 'CITIZEN',
  ADMIN: 'ADMIN'
};

const COMPLAINT_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED'
};

const COMPLAINT_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

const AI_ANALYSIS_STATUSES = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED'
};

const CIVIC_CATEGORIES = [
  'Roads and potholes',
  'Streetlights and electrical',
  'Waste and sanitation',
  'Water supply and leakage',
  'Drainage and sewage',
  'Public parks and facilities',
  'Traffic and road signs',
  'Other'
];

const CIVIC_DEPARTMENTS = [
  'Roads & Asphalt Maintenance',
  'Electrical & Streetlight Division',
  'Solid Waste Management',
  'Water Supply & Sewerage Board',
  'Stormwater Drainage Department',
  'Parks & Recreation Department',
  'Traffic Engineering Division',
  'Public Works Department',
  'General Civic Services'
];

module.exports = {
  USER_ROLES,
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
  AI_ANALYSIS_STATUSES,
  CIVIC_CATEGORIES,
  CIVIC_DEPARTMENTS
};
