import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileSpreadsheet,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  PieChart,
  BarChart3,
  Activity,
  ShieldCheck,
  Building2,
  XCircle,
  Camera
} from 'lucide-react';
import DashboardShell from '../components/layout/DashboardShell';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import EmptyState from '../components/common/EmptyState';
import { Skeleton } from '../components/common/Loader';
import complaintService from '../services/complaintService';
import { CIVIC_CATEGORIES, CIVIC_DEPARTMENTS } from '../constants/civicConstants';
import './DashboardPages.css';

export default function AdminDashboardPage({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Smooth scroll and focus based on active route
  useEffect(() => {
    const timer = setTimeout(() => {
      if (location.pathname === '/admin/reports') {
        const el = document.getElementById('reports-queue');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (location.pathname === '/admin/analytics' || location.hash === '#analytics') {
        const el = document.getElementById('analytics-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (location.pathname === '/admin/triage') {
        const el = document.getElementById('reports-queue');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (location.pathname === '/admin') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, location.hash]);

  // Server-side aggregate metrics state
  const [metrics, setMetrics] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    pendingTriage: 0,
    active: 0,
    statusBreakdown: [],
    categoryBreakdown: [],
    priorityBreakdown: [],
    aiCoverage: { PENDING: 0, COMPLETED: 0, FAILED: 0, SKIPPED: 0 },
    recentActivity: []
  });
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);

  // Fetch live server-aggregated metrics
  const fetchMetrics = useCallback(async () => {
    setIsMetricsLoading(true);
    try {
      const data = await complaintService.getAdminMetrics();
      if (data) {
        setMetrics(data);
      }
    } catch (err) {
      console.warn('Could not fetch admin metrics:', err.message);
    } finally {
      setIsMetricsLoading(false);
    }
  }, []);

  // Fetch paginated complaints queue
  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'ALL') params.category = categoryFilter;
      if (priorityFilter && priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (departmentFilter && departmentFilter !== 'ALL') params.department = departmentFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await complaintService.getAllComplaints(params);
      setComplaints(data.complaints || []);
      setPagination(data.pagination || { total: data.complaints?.length || 0, page, pages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load administrative queue.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, categoryFilter, priorityFilter, departmentFilter, searchTerm]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchComplaints]);

  // Handle filter changes (resets page to 1)
  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleCategoryChange = (val) => {
    setCategoryFilter(val);
    setPage(1);
  };

  const handlePriorityChange = (val) => {
    setPriorityFilter(val);
    setPage(1);
  };

  const handleDepartmentChange = (val) => {
    setDepartmentFilter(val);
    setPage(1);
  };

  const handleRefreshAll = () => {
    fetchMetrics();
    fetchComplaints();
  };

  return (
    <DashboardShell user={user} onLogout={onLogout}>
      <div className="civic-portal">
        {/* KPI Row (Backed strictly by server database aggregation) */}
        <div className="civic-portal__kpi-grid">
          <Card padding="md" className="civic-kpi-card">
            <div className="civic-kpi-card__inner">
              <div>
                <span className="civic-kpi-card__label">Total Queue</span>
                <h3 className="civic-kpi-card__value">
                  {isMetricsLoading ? <Skeleton width="60px" height="36px" /> : metrics.total}
                </h3>
              </div>
              <div className="civic-kpi-card__icon civic-kpi-card__icon--primary">
                <FileSpreadsheet size={24} />
              </div>
            </div>
            <span className="civic-kpi-card__note">Total reported complaints in database</span>
          </Card>

          <Card padding="md" className="civic-kpi-card">
            <div className="civic-kpi-card__inner">
              <div>
                <span className="civic-kpi-card__label">Pending Triage / Review</span>
                <h3 className="civic-kpi-card__value">
                  {isMetricsLoading ? <Skeleton width="60px" height="36px" /> : metrics.pendingTriage}
                </h3>
              </div>
              <div className="civic-kpi-card__icon civic-kpi-card__icon--danger">
                <AlertCircle size={24} />
              </div>
            </div>
            <span className="civic-kpi-card__note">Needs department review & routing</span>
          </Card>

          <Card padding="md" className="civic-kpi-card">
            <div className="civic-kpi-card__inner">
              <div>
                <span className="civic-kpi-card__label">In Field Progress</span>
                <h3 className="civic-kpi-card__value">
                  {isMetricsLoading ? <Skeleton width="60px" height="36px" /> : metrics.active}
                </h3>
              </div>
              <div className="civic-kpi-card__icon civic-kpi-card__icon--warning">
                <Clock size={24} />
              </div>
            </div>
            <span className="civic-kpi-card__note">Assigned to maintenance teams</span>
          </Card>

          <Card padding="md" className="civic-kpi-card">
            <div className="civic-kpi-card__inner">
              <div>
                <span className="civic-kpi-card__label">Resolved</span>
                <h3 className="civic-kpi-card__value">
                  {isMetricsLoading ? <Skeleton width="60px" height="36px" /> : metrics.resolved}
                </h3>
              </div>
              <div className="civic-kpi-card__icon civic-kpi-card__icon--success">
                <CheckCircle2 size={24} />
              </div>
            </div>
            <span className="civic-kpi-card__note">Confirmed closed & audited</span>
          </Card>
        </div>

        {/* AI Advisory Callout */}
        <div className="civic-admin-ai-notice">
          <div className="civic-admin-ai-notice__icon">
            <Sparkles size={20} />
          </div>
          <div className="civic-admin-ai-notice__text">
            <h4 className="civic-admin-ai-notice__title">AI Triage Intelligence Ready</h4>
            <p className="civic-admin-ai-notice__desc">
              CivicSense AI evaluates incoming reports for severity and department routing. AI recommendations are advisory suggestions that municipal officers can confirm, edit, or override anytime.
            </p>
          </div>
        </div>

        {/* Analytics & Overview Section */}
        <div className="civic-analytics-grid" id="analytics-section">
          {/* Status Breakdown Meter */}
          <Card padding="md" className="civic-analytics-card">
            <CardHeader
              title="Complaint Status Distribution"
              subtitle="Current resolution pipeline progress across all records"
              action={<BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />}
            />
            <CardBody>
              {isMetricsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Skeleton height="16px" radius="8px" />
                  <Skeleton height="40px" />
                </div>
              ) : metrics.total === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No complaint data available to display status distribution.
                </p>
              ) : (
                <div className="civic-meter">
                  <div className="civic-meter__track">
                    {metrics.statusBreakdown.map((item, idx) =>
                      item.count > 0 ? (
                        <div
                          key={idx}
                          className="civic-meter__segment"
                          style={{
                            width: `${(item.count / metrics.total) * 100}%`,
                            backgroundColor: item.color
                          }}
                          title={`${item.label}: ${item.count} (${item.percentage}%)`}
                        />
                      ) : null
                    )}
                  </div>

                  <div className="civic-meter__legend">
                    {metrics.statusBreakdown.map((item, idx) => (
                      <div key={idx} className="civic-meter__legend-item">
                        <span className="civic-meter__dot" style={{ backgroundColor: item.color }} />
                        <span>{item.label}:</span>
                        <span className="civic-meter__legend-count">{item.count}</span>
                        <span className="civic-meter__legend-pct">({item.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Category Distribution Bar List */}
          <Card padding="md" className="civic-analytics-card">
            <CardHeader
              title="Reports by Civic Category"
              subtitle="Distribution of reported issues across civic domains"
              action={<PieChart size={18} style={{ color: 'var(--color-primary)' }} />}
            />
            <CardBody>
              {isMetricsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Skeleton height="20px" />
                  <Skeleton height="20px" />
                  <Skeleton height="20px" />
                </div>
              ) : metrics.categoryBreakdown && metrics.categoryBreakdown.length > 0 ? (
                <div className="civic-dist-list">
                  {metrics.categoryBreakdown.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="civic-dist-item">
                      <div className="civic-dist-item__header">
                        <span className="civic-dist-item__name">{item.category}</span>
                        <div className="civic-dist-item__stats">
                          <span className="civic-dist-item__count">{item.count}</span>
                          <span>({item.percentage}%)</span>
                        </div>
                      </div>
                      <div className="civic-dist-bar-track">
                        <div
                          className="civic-dist-bar-fill"
                          style={{ width: `${Math.max(item.percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No category records found.
                </p>
              )}
            </CardBody>
          </Card>

          {/* Priority & AI Triage Health Card */}
          <Card padding="md" className="civic-analytics-card">
            <CardHeader
              title="Priority & AI Triage Health"
              subtitle="Severity levels and automated classification coverage"
              action={<ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />}
            />
            <CardBody>
              {isMetricsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Skeleton height="25px" />
                  <Skeleton height="25px" />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Priority Distribution */}
                  <div className="civic-dist-list">
                    {metrics.priorityBreakdown.map((item, idx) => (
                      <div key={idx} className="civic-dist-item">
                        <div className="civic-dist-item__header">
                          <span className="civic-dist-item__name">{item.label}</span>
                          <div className="civic-dist-item__stats">
                            <span className="civic-dist-item__count">{item.count}</span>
                            <span>({item.percentage}%)</span>
                          </div>
                        </div>
                        <div className="civic-dist-bar-track">
                          <div
                            className="civic-dist-bar-fill"
                            style={{
                              width: `${Math.max(item.percentage, item.count > 0 ? 5 : 0)}%`,
                              background: item.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI Coverage Summary */}
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--color-surface-muted)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
                      <span>AI Triage Status:</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <span className="civic-table__ai-pill">
                        {metrics.aiCoverage?.COMPLETED || 0} Ready
                      </span>
                      {metrics.aiCoverage?.PENDING > 0 && (
                        <span className="civic-table__ai-pill civic-table__ai-pill--pending">
                          {metrics.aiCoverage.PENDING} Pending
                        </span>
                      )}
                      {metrics.aiCoverage?.FAILED > 0 && (
                        <span className="civic-table__ai-pill civic-table__ai-pill--failed">
                          {metrics.aiCoverage.FAILED} Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Recent Municipal Activity Stream */}
          <Card padding="md" className="civic-analytics-card">
            <CardHeader
              title="Recent Activity Stream"
              subtitle="Latest 6 complaint updates and status transitions"
              action={<Activity size={18} style={{ color: 'var(--color-primary)' }} />}
            />
            <CardBody>
              {isMetricsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Skeleton height="35px" />
                  <Skeleton height="35px" />
                  <Skeleton height="35px" />
                </div>
              ) : metrics.recentActivity && metrics.recentActivity.length > 0 ? (
                <div className="civic-activity-feed">
                  {metrics.recentActivity.map((item) => (
                    <div
                      key={item._id}
                      className="civic-activity-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/report/${item._id}`)}
                    >
                      <div className="civic-activity-item__main">
                        <div className="civic-activity-item__top">
                          <span className="civic-activity-item__ref">{item.referenceCode}</span>
                          <Badge status={item.status} size="sm" />
                          <Badge priority={item.priority} size="sm" />
                        </div>
                        <span className="civic-activity-item__title">{item.title}</span>
                      </div>
                      <div className="civic-activity-item__time">
                        {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No recent activity logged yet.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Admin Data Queue */}
        <Card padding="none" className="civic-admin-table-card" id="reports-queue">
          <div className="civic-admin-table-card__header">
            <div>
              <h3 className="civic-admin-table-card__title">Civic Reports Management Queue</h3>
              <p className="civic-admin-table-card__subtitle">
                Filter, triage, and update official resolution status for resident submissions.
              </p>
            </div>

            <div className="civic-admin-filters">
              <div className="civic-admin-filters__search">
                <Input
                  placeholder="Search code, citizen, title..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  leftIcon={<Search size={16} />}
                />
              </div>

              <select
                className="civic-portal__select"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                className="civic-portal__select"
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {CIVIC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                className="civic-portal__select"
                value={priorityFilter}
                onChange={(e) => handlePriorityChange(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>

              <select
                className="civic-portal__select"
                value={departmentFilter}
                onChange={(e) => handleDepartmentChange(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                {CIVIC_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshAll}
                aria-label="Refresh complaint queue"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>

          {error && (
            <div className="civic-auth__alert" style={{ margin: '1rem 1.5rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={handleRefreshAll} style={{ marginLeft: 'auto' }}>
                Retry
              </Button>
            </div>
          )}

          <div className="civic-table-container">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Ref Code</th>
                  <th>Title & Citizen</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Department & AI</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <Skeleton height="35px" />
                        <Skeleton height="35px" />
                        <Skeleton height="35px" />
                      </div>
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        title="No matching reports in queue"
                        description="Try resetting search filters or check back later."
                      />
                    </td>
                  </tr>
                ) : (
                  complaints.map((report) => (
                    <tr
                      key={report._id}
                      className={report.priority === 'HIGH' ? 'civic-table__row--high' : ''}
                    >
                      <td className="civic-table__ref">{report.referenceCode}</td>
                      <td>
                        <div className="civic-table__title-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span className="civic-table__title">{report.title}</span>
                            {report.image?.url && (
                              <span
                                title="Photo evidence attached"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  fontSize: '0.6875rem',
                                  padding: '0.1rem 0.4rem',
                                  backgroundColor: 'var(--color-primary-soft)',
                                  color: 'var(--color-primary)',
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: 600
                                }}
                              >
                                <Camera size={11} /> Photo
                              </span>
                            )}
                          </div>
                          <span className="civic-table__citizen">
                            By {report.citizenId?.name || 'Resident'} ({report.citizenId?.email || 'N/A'})
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="civic-table__category">{report.category}</span>
                      </td>
                      <td>
                        <Badge priority={report.priority} size="sm" />
                      </td>
                      <td>
                        <Badge status={report.status} dot size="sm" />
                      </td>
                      <td>
                        <div className="civic-table__ai-cell">
                          <span className="civic-table__dept">{report.department || 'Unassigned'}</span>
                          {report.aiAnalysis?.status === 'COMPLETED' ? (
                            <span className="civic-table__ai-pill">
                              <Sparkles size={11} /> AI Suggested
                            </span>
                          ) : report.aiAnalysis?.status === 'PENDING' ? (
                            <span className="civic-table__ai-pill civic-table__ai-pill--pending">
                              <Clock size={11} /> AI Pending
                            </span>
                          ) : report.aiAnalysis?.status === 'FAILED' ? (
                            <span className="civic-table__ai-pill civic-table__ai-pill--failed">
                              <AlertTriangle size={11} /> AI Failed
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => navigate(`/report/${report._id}`)}
                        >
                          Review & Triage
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--color-border-subtle)',
                backgroundColor: 'var(--color-surface)',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Showing page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} total)
              </span>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ChevronLeft size={16} />}
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ChevronRight size={16} />}
                  disabled={pagination.page >= pagination.pages || isLoading}
                  onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
