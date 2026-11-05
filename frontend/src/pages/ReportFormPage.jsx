import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  MapPin,
  Camera,
  X,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import CitizenNavbar from '../components/layout/CitizenNavbar';
import Footer from '../components/layout/Footer';
import Card, { CardBody, CardFooter } from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import './ReportPages.css';
import complaintService from '../services/complaintService';
import { CIVIC_CATEGORIES } from '../constants/civicConstants';

export default function ReportFormPage({ user, onReportCreated }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(CIVIC_CATEGORIES[0]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setError('Please select a valid image file (JPEG, PNG, or WEBP).');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5 MB.');
        e.target.value = '';
        return;
      }
      setError('');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Please provide title, description, and location.');
      return;
    }

    setIsSubmitting(true);

    try {
      const complaint = await complaintService.submitComplaint({
        title: title.trim(),
        description: description.trim(),
        location: { address: location.trim() },
        category,
        imageBase64: imagePreview || undefined
      });

      setSuccess(complaint);
      if (onReportCreated) onReportCreated(complaint);
    } catch (err) {
      setError(err.message || 'Could not submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="civic-report-page">
      <CitizenNavbar user={user} />

      <main className="container civic-report-page__main">
        <button
          type="button"
          className="civic-report-page__back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} /> Back
        </button>

        {success ? (
          <Card padding="lg" className="civic-success-card">
            <div className="civic-success-card__icon">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="civic-success-card__title">Issue Report Submitted!</h2>
            <p className="civic-success-card__ref">
              Reference Code: <strong>{success.referenceCode}</strong>
            </p>
            <p className="civic-success-card__desc">
              Your civic report has been received and logged in our audit trail. Municipal teams have been notified.
            </p>

            {success.aiAnalysis && (
              <div className="civic-success-card__ai-box">
                <div className="civic-success-card__ai-header">
                  <Sparkles size={18} className="civic-success-card__ai-spark" />
                  <h4>AI Triage Preview (Advisory)</h4>
                </div>
                <div className="civic-success-card__ai-grid">
                  <div>
                    <span className="civic-label">Suggested Priority</span>
                    <Badge priority={success.aiAnalysis.suggestedPriority || 'MEDIUM'} size="sm" />
                  </div>
                  <div>
                    <span className="civic-label">Responsible Dept</span>
                    <p className="civic-value">{success.aiAnalysis.suggestedDepartment || 'Public Works'}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span className="civic-label">Summary</span>
                    <p className="civic-value">{success.aiAnalysis.summary}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="civic-success-card__actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/reports/${success._id}`)}
              >
                Track this Report Live
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/citizen')}
              >
                Go to My Reports
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSuccess(null);
                  setTitle('');
                  setDescription('');
                  setLocation('');
                  setImagePreview(null);
                }}
              >
                Submit another report
              </Button>
            </div>
          </Card>
        ) : (
          <div className="civic-form-wrapper">
            <div className="civic-form-header">
              <Badge variant="primary" size="md">Community Voice</Badge>
              <h1 className="civic-form-title">Report a Civic Issue</h1>
              <p className="civic-form-subtitle">
                Provide clear details and location. Our AI assistant will automatically analyze severity and recommend the proper municipal department.
              </p>
            </div>

            {/* AI Advisory Callout */}
            <div className="civic-form-advisory">
              <Sparkles size={20} className="civic-form-advisory__icon" />
              <div>
                <strong>How AI helps:</strong> Upon submission, CivicSense AI generates an instant summary and advises municipal staff on priority and routing. All final decisions are made by verified human officers.
              </div>
            </div>

            {error && (
              <div className="civic-form-alert" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="civic-form" noValidate>
              <Card padding="lg">
                <CardBody className="civic-form-card-body">
                  <Input
                    label="Issue Title"
                    id="report-title"
                    placeholder="e.g. Hazardous deep pothole causing traffic slowdown"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    helperText="A concise summary of what needs repair"
                  />

                  <div className="civic-field">
                    <label htmlFor="report-category" className="civic-field__label">
                      Infrastructure Category
                    </label>
                    <select
                      id="report-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="civic-select"
                    >
                      {CIVIC_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Location / Landmark"
                    id="report-location"
                    placeholder="e.g. Near Indiranagar 100ft Rd intersection, opposite metro pillar 45"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    leftIcon={<MapPin size={18} />}
                    helperText="Specific street, crossroad, or nearby public landmark"
                  />

                  <Input
                    label="Detailed Description"
                    id="report-description"
                    placeholder="Describe the problem, approximate size/severity, how long it has been present, and any immediate danger..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    isTextArea
                    rows={4}
                  />

                  {/* Image Attachment */}
                  <div className="civic-field">
                    <label className="civic-field__label">
                      Photo Evidence (Optional)
                    </label>
                    {imagePreview ? (
                      <div className="civic-image-preview">
                        <img src={imagePreview} alt="Issue preview" className="civic-image-preview__img" />
                        <button
                          type="button"
                          className="civic-image-preview__remove"
                          onClick={removeImage}
                          aria-label="Remove photo"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="civic-upload-dropzone">
                        <Camera size={32} className="civic-upload-dropzone__icon" />
                        <span className="civic-upload-dropzone__title">Upload photo evidence</span>
                        <span className="civic-upload-dropzone__sub">PNG, JPG or WEBP up to 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="civic-upload-dropzone__input"
                        />
                      </label>
                    )}
                  </div>
                </CardBody>

                <CardFooter>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    leftIcon={<PlusCircle size={18} />}
                  >
                    Submit Report to CivicSense AI
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
