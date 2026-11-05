import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartHandshake, FileText, CheckCircle2 } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="civic-footer">
      <div className="container civic-footer__inner">
        <div className="civic-footer__grid">
          {/* Brand Info */}
          <div className="civic-footer__col civic-footer__col--brand">
            <div className="civic-footer__brand">
              <img src="/images/civic-logo.svg" alt="CivicSense AI" width="34" height="34" />
              <span className="civic-footer__title">CivicSense AI</span>
            </div>
            <p className="civic-footer__description">
              An AI-powered civic issue reporting and resolution platform helping residents and municipal authorities collaborate on safer, cleaner, well-maintained public infrastructure.
            </p>
            <div className="civic-footer__badges">
              <span className="civic-footer__pill">
                <ShieldCheck size={14} /> Advisory AI
              </span>
              <span className="civic-footer__pill">
                <CheckCircle2 size={14} /> 100% Audit Trail
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="civic-footer__col">
            <h4 className="civic-footer__heading">Platform</h4>
            <ul className="civic-footer__links">
              <li><Link to="/report/new">Report an Issue</Link></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#features">AI Triage Features</a></li>
              <li><Link to="/login">Citizen Portal</Link></li>
              <li><Link to="/login">Admin Queue</Link></li>
            </ul>
          </div>

          {/* Civic Categories */}
          <div className="civic-footer__col">
            <h4 className="civic-footer__heading">Civic Categories</h4>
            <ul className="civic-footer__links">
              <li>Damaged Roads & Potholes</li>
              <li>Streetlight & Electrical</li>
              <li>Garbage & Waste Management</li>
              <li>Drainage & Waterlogging</li>
              <li>Damaged Footpaths</li>
              <li>Public Parks & Facilities</li>
            </ul>
          </div>

          {/* Transparency & Governance */}
          <div className="civic-footer__col">
            <h4 className="civic-footer__heading">Governance & Privacy</h4>
            <p className="civic-footer__privacy-note">
              CivicSense AI is dedicated to public transparency. All AI classifications are strictly advisory recommendations for human civic officers. Resident privacy is strictly preserved.
            </p>
          </div>
        </div>

        <div className="civic-footer__bottom">
          <p className="civic-footer__copy">
            © {new Date().getFullYear()} CivicSense AI Platform. Modern civic-tech engineering for responsive governance.
          </p>
          <div className="civic-footer__sublinks">
            <span>Citizen Privacy First</span>
            <span>•</span>
            <span>Human-in-the-Loop</span>
            <span>•</span>
            <span>Audited Transparency</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
