import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle2,
  MapPin,
  Camera,
  Lightbulb,
  Trash2,
  Droplets,
  Footprints,
  Route,
  BrainCircuit,
  LayoutDashboard,
  Sliders,
  ChevronDown,
  Search,
  Activity,
  FileCheck2
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import Card, { CardBody } from '../components/common/Card';
import Badge from '../components/common/Badge';
import './LandingPage.css';

export default function LandingPage({ user = null }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  const handleCardToggle = (id) => {
    setActiveCard((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Guarantee browser autoplay compatibility
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playVideo = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setVideoLoaded(true);
          })
          .catch((err) => {
            console.warn('Video autoplay waiting for interaction or policy:', err?.message);
          });
      }
    };

    video.addEventListener('loadeddata', playVideo);
    if (video.readyState >= 2) {
      playVideo();
    }

    return () => {
      video.removeEventListener('loadeddata', playVideo);
    };
  }, []);

  const civicProblems = [
    {
      id: 'roads',
      name: 'Damaged Roads',
      image: '/images/civic-categories/damaged-roads.jpg',
      icon: <Route size={26} />,
      desc: 'Cracked asphalt, deep potholes, hazardous road undulations, and uneven surfaces that risk vehicle and commuter safety.'
    },
    {
      id: 'streetlights',
      name: 'Streetlight Issues',
      image: '/images/civic-categories/streetlight-issues.jpg',
      icon: <Lightbulb size={26} />,
      desc: 'Dark intersections, non-functioning street fixtures, collapsed lamp posts, and hazardous exposed electrical cables.'
    },
    {
      id: 'waste',
      name: 'Garbage & Waste Management',
      image: '/images/civic-categories/garbage-waste.jpg',
      icon: <Trash2 size={26} />,
      desc: 'Overflowing roadside dustbins, uncollected commercial refuse, and open illegal garbage dumping across neighborhood corridors.'
    },
    {
      id: 'drainage',
      name: 'Drainage & Waterlogging',
      image: '/images/civic-categories/drainage-waterlogging.jpg',
      icon: <Droplets size={26} />,
      desc: 'Clogged stormwater gullies, severe street waterlogging during rains, and contaminated runoff in pedestrian walking areas.'
    },
    {
      id: 'footpaths',
      name: 'Damaged Footpaths',
      image: '/images/civic-categories/damaged-footpaths.jpg',
      icon: <Footprints size={26} />,
      desc: 'Broken sidewalks, missing pavement blocks, damaged accessibility ramps, and unsafe walking corridors for pedestrians.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Report a Problem',
      desc: 'Snap a photo of the hazard, add street location, and describe the issue in under 60 seconds with zero bureaucratic hurdles.',
      icon: <Camera size={26} />,
      highlight: 'primary'
    },
    {
      number: '02',
      title: 'AI Analyzes the Complaint',
      desc: 'Google Gemini AI validates image evidence, scores hazard severity, tags the correct civic category, and routes it.',
      icon: <BrainCircuit size={26} />,
      highlight: 'accent'
    },
    {
      number: '03',
      title: 'Municipal Authorities Review It',
      desc: 'Authorized municipal officers verify the AI advisory recommendations, assign field crews, and schedule priority repairs.',
      icon: <ShieldCheck size={26} />,
      highlight: 'primary'
    },
    {
      number: '04',
      title: 'Track Resolution',
      desc: 'Follow transparent milestone updates from SUBMITTED to RESOLVED with timestamped closure notes in your audit trail.',
      icon: <CheckCircle2 size={26} />,
      highlight: 'success'
    }
  ];

  const platformFeatures = [
    {
      title: 'AI-Assisted Complaint Analysis',
      desc: 'Multimodal Google Gemini scans photos, detects civic hazards, and drafts executive triage summaries for engineers.',
      icon: <BrainCircuit size={24} className="feature-card__icon--accent" />,
      tag: 'Google Gemini'
    },
    {
      title: 'Live Complaint Tracking',
      desc: 'Transparent status lifecycle tracking with real-time timestamps across Submitted, In Progress, and Resolved milestones.',
      icon: <Clock size={24} className="feature-card__icon--primary" />,
      tag: 'Real-Time'
    },
    {
      title: 'Image-Based Hazard Reporting',
      desc: 'Upload visual evidence with server-side magic-byte verification and cloud persistence via Cloudinary and local adapters.',
      icon: <Camera size={24} className="feature-card__icon--primary" />,
      tag: 'Visual Verification'
    },
    {
      title: 'Priority & Category Routing',
      desc: 'Urgency classification (LOW, MEDIUM, HIGH) guarantees that dangerous streetlights and deep potholes are handled first.',
      icon: <Sliders size={24} className="feature-card__icon--accent" />,
      tag: 'Smart Triage'
    },
    {
      title: 'Municipal Administration Portal',
      desc: 'Dedicated command center for city officers with server-aggregated analytics, internal notes, and department reassignment.',
      icon: <LayoutDashboard size={24} className="feature-card__icon--primary" />,
      tag: 'Admin Operations'
    },
    {
      title: 'Transparent Public Accountability',
      desc: 'Audited status trails ensure municipal accountability. Citizens see official verification notes on every resolved issue.',
      icon: <ShieldCheck size={24} className="feature-card__icon--success" />,
      tag: '100% Audit Trail'
    }
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="civic-landing">
      <Header user={user} />

      {/* Hero Section with Cinematic Background Video */}
      <section className="civic-hero" aria-label="Hero Section">
        {/* Background Video Layer */}
        <div className="civic-hero__video-container">
          <video
            ref={videoRef}
            className={`civic-hero__video ${videoLoaded ? 'civic-hero__video--loaded' : ''}`}
            autoPlay
            loop
            muted
            playsInline
            poster="/images/civic-hero-poster.jpg"
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
          >
            <source src="/videos/civic-hero.webm" type="video/webm" />
            <source src="/videos/civic-hero.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Premium Soft White & Teal Translucent Overlay */}
          <div className="civic-hero__video-overlay" aria-hidden="true" />
        </div>

        {/* Hero Foreground Content */}
        <div className="container civic-hero__container">
          <div className="civic-hero__content">
            
            <h1 className="civic-hero__title">
              See the Problem. <br />
              Report It. <span className="civic-hero__highlight">Make a Difference.</span>
            </h1>

            <p className="civic-hero__subtitle">
              AI-powered civic issue reporting that helps communities identify problems, track complaints and build better cities.
            </p>

            <div className="civic-hero__actions">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<PlusCircle size={20} />}
                onClick={() => navigate('/report/new')}
                className="civic-hero__cta-primary"
              >
                Report an Issue
              </Button>
              <Button
                variant="outline"
                size="lg"
                leftIcon={<Search size={18} />}
                onClick={() => {
                  if (user) {
                    navigate(user.role === 'ADMIN' ? '/admin' : '/citizen');
                  } else {
                    navigate('/login');
                  }
                }}
                className="civic-hero__cta-secondary"
              >
                Track Complaint
              </Button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="civic-hero__stats">
              <div className="civic-hero__stat-item">
                <span className="civic-hero__stat-num">100%</span>
                <span className="civic-hero__stat-lbl">Audited Status Trail</span>
              </div>
              <div className="civic-hero__stat-divider" />
              <div className="civic-hero__stat-item">
                <span className="civic-hero__stat-num">&lt; 60s</span>
                <span className="civic-hero__stat-lbl">Fast Submission</span>
              </div>
              <div className="civic-hero__stat-divider" />
              <div className="civic-hero__stat-item">
                <span className="civic-hero__stat-num">Advisory</span>
                <span className="civic-hero__stat-lbl">Human-in-the-Loop AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          type="button"
          className="civic-hero__scroll-indicator"
          onClick={() => scrollToSection('categories')}
          aria-label="Scroll to Civic Problems"
        >
          <span className="civic-hero__scroll-text">Explore Civic Problems</span>
          <ChevronDown size={18} className="civic-hero__scroll-arrow" />
        </button>
      </section>

      {/* Section C — Civic Problems We Address */}
      <section id="categories" className="civic-section civic-section--surface">
        <div className="container">
          <div className="civic-section__header">
            <Badge variant="primary" size="md">Civic Problems We Address</Badge>
            <h2 className="civic-section__title">Common Urban Infrastructure Challenges</h2>
            <p className="civic-section__subtitle">
              CivicSense AI standardizes citizen reports across verified civic problem categories to accelerate municipal routing and dispatch.
            </p>
          </div>

          <div className="civic-categories-grid">
            {civicProblems.map((prob) => {
              const isActive = activeCard === prob.id;
              return (
                <div
                  key={prob.id}
                  className={`civic-cat-card ${isActive ? 'civic-cat-card--active' : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isActive}
                  aria-label={`Civic category: ${prob.name}. Click or press Enter to toggle details`}
                  onClick={() => handleCardToggle(prob.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardToggle(prob.id);
                    }
                  }}
                >
                  {/* Normal State: High-Quality Category Photograph */}
                  <div className="civic-cat-card__media-layer" aria-hidden={isActive}>
                    <img
                      src={prob.image}
                      alt={prob.name}
                      className="civic-cat-card__img"
                      loading="lazy"
                    />
                    <div className="civic-cat-card__media-overlay">
                      <div className="civic-cat-card__label-badge">
                        <span className="civic-cat-card__label-icon">{prob.icon}</span>
                        <span className="civic-cat-card__label-text">{prob.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover / Active State: Clean Solid Light Background Details */}
                  <div className="civic-cat-card__details-layer" aria-hidden={!isActive}>
                    <div className="civic-cat-card__icon-wrap">
                      {prob.icon}
                    </div>
                    <h3 className="civic-cat-card__name">{prob.name}</h3>
                    <p className="civic-cat-card__desc">{prob.desc}</p>
                    <div className="civic-cat-card__action-hint">
                      <span>Report in this category</span>
                      <ArrowRight size={14} className="civic-cat-card__action-arrow" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section D — How CivicSense AI Works */}
      <section id="how-it-works" className="civic-section">
        <div className="container">
          <div className="civic-section__header">
            <Badge variant="accent" size="md">Workflow Architecture</Badge>
            <h2 className="civic-section__title">How CivicSense AI Works</h2>
            <p className="civic-section__subtitle">
              A transparent four-step process connecting citizen vigilance with verified municipal execution.
            </p>
          </div>

          <div className="civic-workflow">
            {steps.map((step, idx) => (
              <React.Fragment key={step.number}>
                <div className="civic-workflow-card">
                  <div className="civic-workflow-card__top">
                    <span className="civic-workflow-card__num">{step.number}</span>
                    <div className={`civic-workflow-card__icon civic-workflow-card__icon--${step.highlight}`}>
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="civic-workflow-card__title">{step.title}</h3>
                  <p className="civic-workflow-card__desc">{step.desc}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="civic-workflow-connector" aria-hidden="true">
                    <div className="civic-workflow-connector__line" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Section E — Platform Features */}
      <section id="features" className="civic-section civic-section--surface">
        <div className="container">
          <div className="civic-section__header">
            <Badge variant="primary" size="md">Platform Capabilities</Badge>
            <h2 className="civic-section__title">Intelligent Civic Tech Built for Accountability</h2>
            <p className="civic-section__subtitle">
              Engineered with precision for residents who care about their neighborhoods and administrators managing public infrastructure.
            </p>
          </div>

          <div className="civic-features-grid">
            {platformFeatures.map((feat, idx) => (
              <Card key={idx} hoverable padding="lg" className="civic-feature-card">
                <CardBody>
                  <div className="civic-feature-card__top">
                    <div className="civic-feature-card__icon">{feat.icon}</div>
                    <Badge variant="neutral" size="sm">{feat.tag}</Badge>
                  </div>
                  <h3 className="civic-feature-card__title">{feat.title}</h3>
                  <p className="civic-feature-card__desc">{feat.desc}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section F — Call to Action */}
      <section className="civic-cta-section">
        <div className="container">
          <div className="civic-cta-box">
            <div className="civic-cta-box__inner">
              <Badge variant="accent" size="md">Join the Civic Movement</Badge>
              <h2 className="civic-cta-box__title">
                Let's Make Our Cities Better Together.
              </h2>
              <p className="civic-cta-box__desc">
                Your voice can help improve the places we live. Report hazards, track progress in real-time, and hold municipal operations to the highest standard.
              </p>
              <div className="civic-cta-box__actions">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<PlusCircle size={20} />}
                  onClick={() => navigate('/report/new')}
                  className="civic-cta-box__btn"
                >
                  Report a Civic Issue
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="civic-cta-box__btn-sec"
                >
                  Register as a Resident
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section G — Public Trust & Ethics */}
      <section id="trust" className="civic-trust-section">
        <div className="container">
          <div className="civic-trust-box">
            <div className="civic-trust-box__content">
              <Badge variant="success" size="md">Public Trust & Ethics</Badge>
              <h2 className="civic-trust-box__title">Committed to Ethical Civic Technology</h2>
              <p className="civic-trust-box__text">
                CivicSense AI keeps humans at the center of civic governance. Artificial intelligence provides advisory classifications and triage summaries, but operational decisions, field crew dispatches, and ticket resolutions remain under authorized municipal control.
              </p>

              <div className="civic-trust-box__checklist">
                <div className="civic-trust-item">
                  <CheckCircle2 size={20} className="civic-trust-item__icon" />
                  <span>Strict data privacy: citizen credentials and personal identifiers are never sold or exposed.</span>
                </div>
                <div className="civic-trust-item">
                  <CheckCircle2 size={20} className="civic-trust-item__icon" />
                  <span>Advisory AI only: machine recommendations inform and accelerate official reviews without replacing human oversight.</span>
                </div>
                <div className="civic-trust-item">
                  <CheckCircle2 size={20} className="civic-trust-item__icon" />
                  <span>Immutable audit history: every status transition records who updated it, when, and the official operational rationale.</span>
                </div>
              </div>
            </div>

            <div className="civic-trust-box__cta-card">
              <h3 className="civic-trust-cta__title">Start Making a Civic Difference</h3>
              <p className="civic-trust-cta__desc">
                Spot a pothole, failed streetlight, or waterlogged road? File a report in seconds.
              </p>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<PlusCircle size={20} />}
                onClick={() => navigate('/report/new')}
              >
                Report an issue now
              </Button>
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => navigate('/login')}
              >
                Sign in to your account
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
