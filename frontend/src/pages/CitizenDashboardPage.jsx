import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Sparkles,
  MapPin,
  RefreshCw,
  XCircle,
  PieChart,
  Activity,
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
import './DashboardPages.css';

export default function CitizenDashboardPage({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/citizen/reports' || location.hash === '#my-reports-section') {
      const timer = setTimeout(() => {
        const el = document.getElementById('my-reports-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Server-side aggregate metrics state
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    rejected: 0,
    categoryBreakdown: [],
    recentReport: null
  });
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);

  // Fetch live server-aggregated metrics
  const fetchMetrics = useCallback(async () => {
    setIsMetricsLoading(true);
    try {
      const data = await complaintService.getCitizenMetrics();
      if (data) {
        setMetrics(data);
      }
    } catch (err) {
      console.warn('Could not fetch citizen metrics:', err.message);
    } finally {
      setIsMetricsLoading(false);
    }
  }, []);

  // Fetch paginated complaints
  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await complaintService.getMyComplaints(params);
      setComplaints(data.complaints || []);
      setPagination(data.pagination || { total: data.complaints?.length || 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load your complaints.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchComplaints]);

  const handleRefreshAll = () => {
    fetchMetrics();
    fetchComplaints();
  };

  return (
    <DashboardShell user={user} onLogout={onLogout}>
      <div className="civic-portal">
        {/* Welcome Banner */}
        <div className="civic-portal__banner">
          <div className="civic-portal__banner-text">
            <h2 className="civic-portal__greeting">Hello, {user?.name || 'Citizen'}</h2>
            <p className="civic-portal__banner-sub">
              Track your reported issues, submit neighborhood concerns, and view real-time municipal resolution progress.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle size={18} />}
            onClick={() => navigate('/report/new')}
          >
            Report an issue
          </Button>
        </div>

        {/* Server-Aggregated Metrics Row */}
        <div className="civic-portal__kpi-grid">
          <Card padding="md" className="civic-kpi-card">
            <div className="civic-kpi-card__inner">
              <div>
                <span className="civic-kpi-card__label">Total Submitted</span>
                <h3 className="civic-kpi-card__value">
                  {isMetricsLoading ? <Skeleton width="50px" height="36px" /> : metrics.total}
                </h3>
              </div>
              <div className="civic-kpi-card__icon civic-kpi-card__icon--primary">
                <FileText size={24} />
              </div>
            </div>
            <span className="civic-kpi-card__note">All lifetime reports in database</span>
          </Card>

          <Card padding="md" className="civic-kpi-card">
            <div className="civic-kpi-card__inner">
              <div>
                <span className="civic-kpi-card__label">Active In Progress</span>
                <h3 className="civic-kpi-card__value">
                  {isMetricsLoading ? <Skeleton width="50px" height="36px" /> : metrics.active}
                </h3>
              </div>
              <div className="civic-kpi-card__icon civic-kpi-card__icon--warning">
                <Clock size={24} />
              </div>
            </div>
            <span className="civic-kpi-card__note">Under municipal review or repair</span>
          </Card>

          <Card padding="md" className="civic-kpi-card">
            <div className="civic-kpi-card__inner">
              <div>
                <span className="civic-kpi-card__label">Successfully Resolved</span>
                <h3 className="civic-kpi-card__value">
                  {isMetricsLoading ? <Skeleton width="50px" height="36px" /> : metrics.resolved}
                </h3>
              </div>
              <div className="civic-kpi-card__icon civic-kpi-card__icon--success">
                <CheckCircle2 size={24} />
              </div>
            </div>
            <span className="civic-kpi-card__note">Verified closed & resolved</span>
          </Card>

          <Card padding="md" className="civic-kpi-card">
            <div className="civic-kpi-card__inner">
              <div>
                <span className="civic-kpi-card__label">Closed / Rejected</span>
                <h3 className="civic-kpi-card__value">
                  {isMetricsLoading ? <Skeleton width="50px" height="36px" /> : metrics.rejected}
                </h3>
              </div>
              <div className="civic-kpi-card__icon civic-kpi-card__icon--danger">
                <XCircle size={24} />
              </div>
            </div>
            <span className="civic-kpi-card__note">Ineligible or rejected entries</span>
          </Card>
        </div>

        {/* Visual Analytics & Recent Report Section */}
        <div className="civic-analytics-grid">
          {/* Category Distribution Chart */}
          <Card padding="md" className="civic-analytics-card">
            <CardHeader
              title="Issue Categories Reported"
              subtitle="Breakdown of your reports by civic department category"
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
                  {metrics.categoryBreakdown.map((item, idx) => (
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
                  No category history available yet. Submit a report to view analytics.
                </p>
              )}
            </CardBody>
          </Card>

          {/* Latest Report Quick Status Card */}
          <Card padding="md" className="civic-analytics-card">
            <CardHeader
              title="Latest Activity Update"
              subtitle="Most recently updated report from municipal teams"
              action={<Activity size={18} style={{ color: 'var(--color-primary)' }} />}
            />
            <CardBody>
              {isMetricsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Skeleton height="40px" />
                  <Skeleton height="20px" />
                </div>
              ) : metrics.recentReport ? (
                <div className="civic-citizen-recent-card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="civic-table__ref">{metrics.recentReport.referenceCode}</span>
                      <Badge status={metrics.recentReport.status} size="sm" />
                      <Badge priority={metrics.recentReport.priority} size="sm" />
                    </div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                      {metrics.recentReport.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Updated: {new Date(metrics.recentReport.updatedAt).toLocaleDateString()} at{' '}
                      {new Date(metrics.recentReport.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ArrowRight size={14} />}
                    onClick={() => navigate(`/report/${metrics.recentReport._id}`)}
                  >
                    Track Report
                  </Button>
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No reports logged yet. Your latest report status updates will appear here.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Reports Management Section */}
        <Card padding="lg" className="civic-portal__section-card" id="my-reports-section">
          <CardHeader
            title="My Reported Issues"
            subtitle="Real-time status tracking and audit history for your submissions."
            action={
              <div className="civic-portal__filters">
                <div className="civic-portal__search">
                  <Input
                    placeholder="Search by ref, title, locality..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search size={16} />}
                  />
                </div>
                <select
                  className="civic-portal__select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshAll}
                  aria-label="Refresh complaints"
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
            }
          />

          <CardBody>
            {error && (
              <div className="civic-auth__alert" style={{ marginBottom: '1.5rem' }}>
                <AlertTriangle size={18} />
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={handleRefreshAll} style={{ marginLeft: 'auto' }}>
                  Retry
                </Button>
              </div>
            )}

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                <Skeleton height="70px" radius="10px" />
                <Skeleton height="70px" radius="10px" />
                <Skeleton height="70px" radius="10px" />
              </div>
            ) : complaints.length === 0 ? (
              <EmptyState
                title={searchTerm || statusFilter !== 'ALL' ? 'No matching reports found' : 'No civic reports yet'}
                description={
                  searchTerm || statusFilter !== 'ALL'
                    ? 'Try clearing your search query or status filter.'
                    : 'Report your first neighborhood problem to help improve public spaces.'
                }
                actionLabel="Report an issue"
                onAction={() => navigate('/report/new')}
                actionIcon={<PlusCircle size={16} />}
              />
            ) : (
              <div className="civic-reports-list">
                {complaints.map((report) => (
                  <div
                    key={report._id}
                    className="civic-report-row"
                    onClick={() => navigate(`/report/${report._id}`)}
                  >
                    <div className="civic-report-row__main">
                      <div className="civic-report-row__top">
                        <span className="civic-report-row__ref">{report.referenceCode}</span>
                        <Badge status={report.status} dot size="sm" />
                        <Badge priority={report.priority} size="sm" />
                        {report.image?.url && (
                          <span
                            title="Photo evidence attached"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.6875rem',
                              padding: '0.12rem 0.4rem',
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
                      <h4 className="civic-report-row__title">{report.title}</h4>
                      {report.aiAnalysis?.summary ? (
                        <p className="civic-report-row__summary">
                          <Sparkles size={14} className="civic-report-row__ai-icon" />
                          <span>{report.aiAnalysis.summary}</span>
                        </p>
                      ) : (
                        <p className="civic-report-row__summary">
                          <span>{report.description.slice(0, 120)}...</span>
                        </p>
                      )}
                      <div className="civic-report-row__meta">
                        <span className="civic-report-row__loc">
                          <MapPin size={14} /> {report.location?.address}
                        </span>
                        <span>•</span>
                        <span>{report.category}</span>
                        <span>•</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="civic-report-row__action">
                      <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
