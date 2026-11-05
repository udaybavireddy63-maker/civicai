import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  User,
  AlertTriangle,
  Edit3,
  Sliders,
  MessageSquare,
  Send,
  Lock,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Check,
  Camera,
  ZoomIn
} from 'lucide-react';
import Header from '../components/layout/Header';
import CitizenNavbar from '../components/layout/CitizenNavbar';
import AdminNavbar from '../components/layout/AdminNavbar';
import Footer from '../components/layout/Footer';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import complaintService from '../services/complaintService';
import { CIVIC_CATEGORIES } from '../constants/civicConstants';
import { getComplaintImageUrl } from '../utils/imageUtils';
import './ReportPages.css';

export default function ReportDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Admin Modals State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('UNDER_REVIEW');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [triageCategory, setTriageCategory] = useState('');
  const [triagePriority, setTriagePriority] = useState('MEDIUM');
  const [triageDepartment, setTriageDepartment] = useState('');
  const [isUpdatingTriage, setIsUpdatingTriage] = useState(false);

  // Admin Note State
  const [adminNoteText, setAdminNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // AI Assistant States
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [isAdoptingAi, setIsAdoptingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);

  const fetchReport = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError(null);
    try {
      const data = await complaintService.getComplaintById(id);
      setReport(data);
      setImageError(false);
      setNewStatus(data.status);
      setTriageCategory(data.category);
      setTriagePriority(data.priority);
      setTriageDepartment(data.department || '');
    } catch (err) {
      if (!isSilent) setError(err.message || 'Failed to load report details.');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Polling for AI analysis completion if status is PENDING
  useEffect(() => {
    let interval;
    if (report?.aiAnalysis?.status === 'PENDING') {
      let pollCount = 0;
      interval = setInterval(async () => {
        pollCount += 1;
        await fetchReport(true);
        if (pollCount >= 8) {
          clearInterval(interval);
        }
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [report?.aiAnalysis?.status, fetchReport]);

  // Handle Trigger or Re-run AI Analysis
  const handleTriggerAiAnalysis = async () => {
    setIsAnalyzingAi(true);
    setAiMessage(null);
    try {
      const updated = await complaintService.triggerAiAnalysis(report._id);
      setReport(updated);
      setAiMessage({ type: 'success', text: 'AI analysis completed successfully!' });
    } catch (err) {
      setAiMessage({ type: 'error', text: err.message || 'Failed to run AI analysis' });
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Handle Admin adopting all AI suggestions
  const handleAdoptAllAi = async () => {
    setIsAdoptingAi(true);
    setAiMessage(null);
    try {
      const updated = await complaintService.confirmAiSuggestions(report._id, {
        applyCategory: true,
        applyPriority: true,
        applyDepartment: true,
        comment: 'Adopted all AI triage recommendations'
      });
      setReport(updated);
      setTriageCategory(updated.category);
      setTriagePriority(updated.priority);
      setTriageDepartment(updated.department);
      setAiMessage({ type: 'success', text: 'Applied all AI recommendations to official report!' });
    } catch (err) {
      setAiMessage({ type: 'error', text: err.message || 'Failed to apply AI suggestions' });
    } finally {
      setIsAdoptingAi(false);
    }
  };

  // Handle Admin adopting single field
  const handleAdoptField = async (field) => {
    setIsAdoptingAi(true);
    setAiMessage(null);
    try {
      const updated = await complaintService.confirmAiSuggestions(report._id, {
        applyCategory: field === 'category',
        applyPriority: field === 'priority',
        applyDepartment: field === 'department',
        comment: `Adopted AI recommendation for ${field}`
      });
      setReport(updated);
      if (field === 'category') setTriageCategory(updated.category);
      if (field === 'priority') setTriagePriority(updated.priority);
      if (field === 'department') setTriageDepartment(updated.department);
      setAiMessage({ type: 'success', text: `Applied AI recommendation for ${field}!` });
    } catch (err) {
      setAiMessage({ type: 'error', text: err.message || `Failed to apply ${field}` });
    } finally {
      setIsAdoptingAi(false);
    }
  };

  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const updated = await complaintService.updateStatus(report._id, {
        status: newStatus,
        note: statusNote
      });
      setReport(updated);
      setStatusModalOpen(false);
      setStatusNote('');
    } catch (err) {
      alert(err.message || 'Could not update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateTriage = async () => {
    setIsUpdatingTriage(true);
    try {
      const updated = await complaintService.triageComplaint(report._id, {
        category: triageCategory,
        priority: triagePriority,
        department: triageDepartment
      });
      setReport(updated);
      setTriageModalOpen(false);
    } catch (err) {
      alert(err.message || 'Could not update triage details');
    } finally {
      setIsUpdatingTriage(false);
    }
  };

  const handleAddAdminNote = async (e) => {
    e.preventDefault();
    if (!adminNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const updated = await complaintService.addAdminNote(report._id, {
        text: adminNoteText.trim()
      });
      setReport(updated);
      setAdminNoteText('');
    } catch (err) {
      alert(err.message || 'Could not record admin note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const renderNavbar = () => {
    if (isAdmin) return <AdminNavbar user={user} />;
    if (user) return <CitizenNavbar user={user} />;
    return <Header user={null} />;
  };

  if (isLoading) {
    return (
      <div className="civic-report-detail-page">
        {renderNavbar()}
        <main className="container civic-report-detail__container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <Loader size="lg" message="Loading civic complaint details..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="civic-report-detail-page">
        {renderNavbar()}
        <main className="container civic-report-detail__container" style={{ padding: '4rem 1rem' }}>
          <EmptyState
            icon={<AlertTriangle size={48} color="var(--color-danger)" />}
            title="Unable to View Report"
            description={error || 'The requested complaint could not be found or access is restricted.'}
            actionLabel="Return to Dashboard"
            onAction={() => navigate(isAdmin ? '/admin' : '/citizen')}
            actionIcon={<ArrowLeft size={16} />}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="civic-report-detail-page">
      {renderNavbar()}

      <main className="container civic-report-detail__container">
        <div className="civic-report-detail__top-nav">
          <button
            type="button"
            className="civic-report-page__back"
            onClick={() => navigate(isAdmin ? '/admin' : '/citizen')}
          >
            <ArrowLeft size={16} /> Back to reports
          </button>

          {isAdmin && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Sliders size={16} />}
                onClick={() => setTriageModalOpen(true)}
              >
                Triage & Routing
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Edit3 size={16} />}
                onClick={() => setStatusModalOpen(true)}
              >
                Update Status
              </Button>
            </div>
          )}
        </div>

        {/* Main Grid: Details Left, Timeline & AI Right */}
        <div className="civic-report-detail__layout">
          {/* Left Column: Evidence & Details */}
          <div className="civic-report-detail__primary">
            <Card padding="lg">
              <div className="civic-report-detail__header">
                <div className="civic-report-detail__badges">
                  <span className="civic-report-detail__ref">{report.referenceCode}</span>
                  <Badge status={report.status} dot size="md" />
                  <Badge priority={report.priority} size="md" />
                </div>
                <h1 className="civic-report-detail__title">{report.title}</h1>

                <div className="civic-report-detail__meta-bar">
                  <span className="civic-meta-item">
                    <Calendar size={15} /> Submitted{' '}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <span className="civic-meta-item">
                    <Layers size={15} /> {report.category}
                  </span>
                  {report.citizenId && (
                    <span className="civic-meta-item">
                      <User size={15} /> By {report.citizenId.name}
                    </span>
                  )}
                  {report.department && (
                    <span className="civic-meta-item">
                      <ShieldCheck size={15} /> Dept: {report.department}
                    </span>
                  )}
                </div>
              </div>

              <div className="civic-report-detail__location-box">
                <MapPin size={18} className="civic-report-detail__loc-icon" />
                <div>
                  <h4 className="civic-loc-title">Location</h4>
                  <p className="civic-loc-address">{report.location?.address}</p>
                </div>
              </div>

              <div className="civic-report-detail__section">
                <h3 className="civic-section-label">Citizen Description</h3>
                <p className="civic-report-detail__desc-text">{report.description}</p>
              </div>

              {/* Photo Evidence */}
              <div className="civic-report-detail__section">
                <h3 className="civic-section-label">Citizen Submitted Photo Evidence</h3>
                {report.image?.url ? (
                  imageError ? (
                    <div className="civic-report-detail__photo-error" role="alert">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <AlertCircle size={22} className="civic-report-detail__photo-error-icon" />
                        <h4 className="civic-report-detail__photo-error-title">Unable to Load Photo Evidence</h4>
                      </div>
                      <p className="civic-report-detail__photo-error-desc">
                        The submitted photo could not be rendered from the storage server. It may have been relocated or a network issue occurred.
                      </p>
                      <div className="civic-report-detail__photo-error-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<RefreshCw size={14} />}
                          onClick={() => setImageError(false)}
                        >
                          Retry Loading
                        </Button>
                        {getComplaintImageUrl(report.image.url) && (
                          <a
                            href={getComplaintImageUrl(report.image.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="civic-report-detail__photo-error-link"
                          >
                            <ExternalLink size={14} /> Open direct URL
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="civic-report-detail__photo-wrapper"
                      onClick={() => setIsImageModalOpen(true)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setIsImageModalOpen(true);
                        }
                      }}
                      title="Click to view full image in inspector"
                    >
                      <img
                        src={getComplaintImageUrl(report.image.url)}
                        alt="Submitted evidence"
                        className="civic-report-detail__photo"
                        onError={() => setImageError(true)}
                      />
                      <div className="civic-report-detail__photo-hint">
                        <ZoomIn size={14} />
                        <span>Click to expand image</span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="civic-report-detail__no-photo">
                    <Camera size={26} className="civic-report-detail__no-photo-icon" />
                    <div>
                      <h4 className="civic-report-detail__no-photo-title">No Image Evidence Submitted</h4>
                      <p className="civic-report-detail__no-photo-desc">
                        No photograph was attached with this report. Assessment and triage can proceed using the location and description.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Internal Admin Notes (Strictly rendered for Administrators ONLY) */}
            {isAdmin && (
              <Card padding="lg" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--color-warning)' }}>
                <CardHeader
                  title="Internal Administrative Notes"
                  subtitle="Staff internal records (never shared with citizens)"
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
                  {report.adminNotes && report.adminNotes.length > 0 ? (
                    report.adminNotes.map((note) => (
                      <div
                        key={note._id}
                        style={{
                          padding: '0.875rem 1rem',
                          backgroundColor: 'var(--color-surface-muted)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border-subtle)'
                        }}
                      >
                        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                          {note.text}
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <span>By: {note.authorId?.name || 'Administrator'}</span>
                          <span>•</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      No internal notes recorded yet.
                    </p>
                  )}
                </div>

                <form onSubmit={handleAddAdminNote} style={{ display: 'flex', gap: '0.75rem' }}>
                  <Input
                    placeholder="Add an internal note or crew dispatch update..."
                    value={adminNoteText}
                    onChange={(e) => setAdminNoteText(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmittingNote}
                    leftIcon={<Send size={16} />}
                  >
                    Post Note
                  </Button>
                </form>
              </Card>
            )}
          </div>

          {/* Right Column: AI Triage Advisory & Status Timeline */}
          <div className="civic-report-detail__secondary">
            {/* AI Assistance Box */}
            <Card padding="md" className="civic-ai-card">
              <div className="civic-ai-card__header" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="civic-ai-card__icon">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="civic-ai-card__title">AI Intelligence Insights</h3>
                    <div className="civic-ai-badge-row" style={{ marginTop: '0.2rem' }}>
                      <span className="civic-ai-card__tag">Gemini Powered</span>
                      {report.aiAnalysis?.confidence && (
                        <span className="civic-ai-advisory-badge" style={{ color: 'var(--color-primary)' }}>
                          {Math.round(report.aiAnalysis.confidence * 100)}% Est. Confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Re-run button */}
                <button
                  type="button"
                  onClick={handleTriggerAiAnalysis}
                  disabled={isAnalyzingAi}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: isAnalyzingAi ? 'not-allowed' : 'pointer',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                  title="Re-run AI Analysis"
                >
                  <RefreshCw size={15} className={isAnalyzingAi ? 'civic-spin' : ''} />
                </button>
              </div>

              {/* Action Toast Feedback */}
              {aiMessage && (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.75rem',
                    fontSize: '0.8125rem',
                    backgroundColor: aiMessage.type === 'success' ? 'var(--color-primary-soft)' : '#FEF2F2',
                    color: aiMessage.type === 'success' ? 'var(--color-primary)' : '#DC2626',
                    border: `1px solid ${aiMessage.type === 'success' ? 'rgba(19, 124, 114, 0.2)' : '#FCA5A5'}`
                  }}
                >
                  {aiMessage.text}
                </div>
              )}

              {/* State 1: PENDING */}
              {report.aiAnalysis?.status === 'PENDING' && (
                <div className="civic-ai-pending-box">
                  <RefreshCw size={20} className="civic-spin" style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.2rem' }}>
                      AI Analysis in progress...
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Evaluating category, triage priority, responsible department, and checking for duplicate reports.
                    </p>
                  </div>
                </div>
              )}

              {/* State 2: FAILED */}
              {report.aiAnalysis?.status === 'FAILED' && (
                <div className="civic-ai-failed-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626' }}>
                    <AlertCircle size={18} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>AI Analysis Currently Unavailable</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#7F1D1D' }}>
                    {report.aiAnalysis.error || 'The system was unable to contact the AI model. Your complaint is safely recorded.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTriggerAiAnalysis}
                    isLoading={isAnalyzingAi}
                    leftIcon={<RefreshCw size={14} />}
                  >
                    Retry AI Analysis
                  </Button>
                </div>
              )}

              {/* State 3: COMPLETED */}
              {report.aiAnalysis?.status === 'COMPLETED' && (
                <div className="civic-ai-card__body">
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span className="civic-ai-advisory-badge">
                      <ShieldCheck size={12} /> Advisory Only — Human Officer Review Required
                    </span>
                  </div>

                  <div className="civic-ai-item">
                    <span className="civic-ai-item__label">AI Executive Summary</span>
                    <p className="civic-ai-item__val">
                      {report.aiAnalysis.summary || 'Summary unavailable.'}
                    </p>
                  </div>

                  {/* Suggested Category */}
                  <div className="civic-ai-item">
                    <div className="civic-ai-adopt-row">
                      <span className="civic-ai-item__label">Suggested Category</span>
                      {isAdmin && report.category !== report.aiAnalysis.suggestedCategory && (
                        <button
                          type="button"
                          className="civic-ai-quick-adopt-btn"
                          disabled={isAdoptingAi}
                          onClick={() => handleAdoptField('category')}
                        >
                          Adopt Category
                        </button>
                      )}
                    </div>
                    <p className="civic-ai-item__val civic-ai-item__val--bold">
                      {report.aiAnalysis.suggestedCategory || report.category}
                    </p>
                  </div>

                  {/* Priority & Department Grid */}
                  <div className="civic-ai-grid">
                    <div className="civic-ai-item">
                      <div className="civic-ai-adopt-row">
                        <span className="civic-ai-item__label">Suggested Priority</span>
                        {isAdmin && report.priority !== report.aiAnalysis.suggestedPriority && (
                          <button
                            type="button"
                            className="civic-ai-quick-adopt-btn"
                            disabled={isAdoptingAi}
                            onClick={() => handleAdoptField('priority')}
                          >
                            Adopt
                          </button>
                        )}
                      </div>
                      <Badge priority={report.aiAnalysis.suggestedPriority || report.priority} size="sm" />
                    </div>

                    <div className="civic-ai-item">
                      <div className="civic-ai-adopt-row">
                        <span className="civic-ai-item__label">Department</span>
                        {isAdmin && report.department !== report.aiAnalysis.suggestedDepartment && (
                          <button
                            type="button"
                            className="civic-ai-quick-adopt-btn"
                            disabled={isAdoptingAi}
                            onClick={() => handleAdoptField('department')}
                          >
                            Adopt
                          </button>
                        )}
                      </div>
                      <p className="civic-ai-item__val civic-ai-item__val--bold" style={{ fontSize: '0.8125rem' }}>
                        {report.aiAnalysis.suggestedDepartment || 'General Civic Services'}
                      </p>
                    </div>
                  </div>

                  {/* Rationale */}
                  {report.aiAnalysis.rationale && (
                    <div className="civic-ai-item">
                      <span className="civic-ai-item__label">Routing & Urgency Rationale</span>
                      <p className="civic-ai-item__val civic-ai-item__val--subtle">
                        {report.aiAnalysis.rationale}
                      </p>
                    </div>
                  )}

                  {/* Duplicate Detection / Similar Reports Section */}
                  <div className="civic-ai-duplicates-section">
                    <div className="civic-ai-duplicates-title">
                      <Layers size={14} />
                      <span>Potential Duplicate & Related Reports</span>
                    </div>

                    {report.aiAnalysis.potentialDuplicates && report.aiAnalysis.potentialDuplicates.length > 0 ? (
                      <div>
                        {report.aiAnalysis.potentialDuplicates.map((dup, idx) => (
                          <div key={idx} className="civic-ai-duplicate-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <a
                                href={`/reports/${dup.referenceCode}`}
                                className="civic-ai-duplicate-ref"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {dup.referenceCode} <ExternalLink size={11} style={{ display: 'inline' }} />
                              </a>
                              {dup.confidence && (
                                <span style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                                  {Math.round(dup.confidence * 100)}% match
                                </span>
                              )}
                            </div>
                            {dup.title && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                {dup.title}
                              </span>
                            )}
                            <p className="civic-ai-duplicate-reason">{dup.similarityReason}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        No duplicate reports detected within this category and area.
                      </p>
                    )}
                  </div>

                  {/* Admin Apply All Action */}
                  {isAdmin && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        style={{ width: '100%' }}
                        isLoading={isAdoptingAi}
                        onClick={handleAdoptAllAi}
                        leftIcon={<Check size={14} />}
                      >
                        Apply All AI Recommendations
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="civic-ai-card__footer">
                <ShieldCheck size={14} />
                <span>Advisory recommendations verified by authorized officers</span>
              </div>
            </Card>

            {/* Status Timeline */}
            <Card padding="md">
              <CardHeader
                title="Resolution Timeline"
                subtitle="Official public audit trail"
              />

              <div className="civic-timeline">
                {report.statusHistory && report.statusHistory.length > 0 ? (
                  report.statusHistory.map((hist, idx) => (
                    <div key={idx} className="civic-timeline__item">
                      <div className="civic-timeline__marker">
                        <div className="civic-timeline__dot" />
                        {idx !== report.statusHistory.length - 1 && (
                          <div className="civic-timeline__line" />
                        )}
                      </div>
                      <div className="civic-timeline__content">
                        <div className="civic-timeline__top">
                          <Badge status={hist.to} size="sm" />
                          <span className="civic-timeline__time">
                            {new Date(hist.changedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="civic-timeline__note">{hist.note}</p>
                        <span className="civic-timeline__date">
                          {new Date(hist.changedAt).toLocaleDateString()}
                          {hist.changedBy?.name && ` • By ${hist.changedBy.name}`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    No status history recorded yet.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Admin Status Update Modal */}
      {isAdmin && (
        <Modal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          title={`Update Official Status (${report.referenceCode})`}
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={isUpdatingStatus}
                onClick={handleUpdateStatus}
              >
                Confirm Status Transition
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="civic-field">
              <label className="civic-field__label">Select New Official Status</label>
              <select
                className="civic-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <Input
              label="Public Resolution Note"
              placeholder="Explain the reason or maintenance action taken..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              isTextArea
              rows={3}
              helperText="This note will be permanently added to the resident's public audit timeline."
            />
          </div>
        </Modal>
      )}

      {/* Admin Triage Modal */}
      {isAdmin && (
        <Modal
          isOpen={triageModalOpen}
          onClose={() => setTriageModalOpen(false)}
          title={`Triage & Routing (${report.referenceCode})`}
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setTriageModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={isUpdatingTriage}
                onClick={handleUpdateTriage}
              >
                Save Triage Updates
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="civic-field">
              <label className="civic-field__label">Infrastructure Category</label>
              <select
                className="civic-select"
                value={triageCategory}
                onChange={(e) => setTriageCategory(e.target.value)}
              >
                {CIVIC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="civic-field">
              <label className="civic-field__label">Official Priority</label>
              <select
                className="civic-select"
                value={triagePriority}
                onChange={(e) => setTriagePriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <Input
              label="Assigned Department"
              placeholder="e.g. Roads & Infrastructure Engineering"
              value={triageDepartment}
              onChange={(e) => setTriageDepartment(e.target.value)}
              helperText="The municipal team responsible for resolving this issue"
            />
          </div>
        </Modal>
      )}

      {/* Photo Inspection Modal */}
      {report.image?.url && (
        <Modal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          title={`Photo Evidence Inspector (${report.referenceCode})`}
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setIsImageModalOpen(false)}>
                Close
              </Button>
              {getComplaintImageUrl(report.image.url) && (
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<ExternalLink size={16} />}
                  onClick={() => {
                    const url = getComplaintImageUrl(report.image.url);
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  Open Original
                </Button>
              )}
            </>
          }
        >
          <div className="civic-photo-modal-content">
            <div className="civic-photo-modal-img-container">
              <img
                src={getComplaintImageUrl(report.image.url)}
                alt="Submitted evidence enlarged"
                className="civic-photo-modal-img"
              />
            </div>
            <div className="civic-photo-modal-meta">
              <span><strong>File Format:</strong> {report.image.mimeType || 'Image'}</span>
              {report.image.storageKey && (
                <span><strong>Storage Key:</strong> {report.image.storageKey}</span>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Footer />
    </div>
  );
}
