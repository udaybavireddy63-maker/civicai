import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, PlusCircle, LogIn, ShieldAlert, Sparkles } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header({ user: propUser = null, onLogout = null }) {
  const { user: authUser } = useAuth();
  const user = propUser !== null ? propUser : authUser;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (hash) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + hash);
    } else {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className={`civic-header ${isScrolled ? 'civic-header--scrolled' : ''}`}>
      <div className="container civic-header__inner">
        <Link to="/" className="civic-header__brand" onClick={() => setMobileMenuOpen(false)}>
          <img src="/images/civic-logo.svg" alt="CivicSense AI" className="civic-header__logo" width="38" height="38" />
          <div className="civic-header__brand-text">
            <span className="civic-header__title">CivicSense <span className="civic-header__title-accent">AI</span></span>
            <span className="civic-header__tag">Civic Intelligence Platform</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="civic-header__nav" aria-label="Main Navigation">
          <Link to="/" className="civic-header__link">Home</Link>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); handleNavClick('#how-it-works'); }} className="civic-header__link">How It Works</a>
          <a href="#features" onClick={(e) => { e.preventDefault(); handleNavClick('#features'); }} className="civic-header__link">Features</a>
          <a href="#categories" onClick={(e) => { e.preventDefault(); handleNavClick('#categories'); }} className="civic-header__link">Civic Categories</a>
          <a href="#trust" onClick={(e) => { e.preventDefault(); handleNavClick('#trust'); }} className="civic-header__link">Transparency</a>
        </nav>

        {/* Desktop Actions */}
        <div className="civic-header__actions">
          {user ? (
            <>
              {user.role === 'ADMIN' ? (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ShieldAlert size={16} />}
                  onClick={() => navigate('/admin')}
                >
                  Admin Portal
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/citizen')}
                >
                  My Reports
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusCircle size={16} />}
                onClick={() => navigate('/report/new')}
              >
                Report an issue
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<LogIn size={16} />}
                onClick={() => navigate('/login')}
              >
                Sign in
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusCircle size={16} />}
                onClick={() => navigate('/report/new')}
              >
                Report an issue
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="civic-header__toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="civic-header__mobile-drawer">
          <nav className="civic-header__mobile-nav">
            <Link
              to="/"
              className="civic-header__mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <a
              href="#how-it-works"
              className="civic-header__mobile-link"
              onClick={(e) => { e.preventDefault(); handleNavClick('#how-it-works'); }}
            >
              How It Works
            </a>
            <a
              href="#features"
              className="civic-header__mobile-link"
              onClick={(e) => { e.preventDefault(); handleNavClick('#features'); }}
            >
              Features
            </a>
            <a
              href="#categories"
              className="civic-header__mobile-link"
              onClick={(e) => { e.preventDefault(); handleNavClick('#categories'); }}
            >
              Civic Categories
            </a>
            <a
              href="#trust"
              className="civic-header__mobile-link"
              onClick={(e) => { e.preventDefault(); handleNavClick('#trust'); }}
            >
              Transparency
            </a>
          </nav>

          <div className="civic-header__mobile-actions">
            {user ? (
              <>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(user.role === 'ADMIN' ? '/admin' : '/citizen');
                  }}
                >
                  {user.role === 'ADMIN' ? 'Admin Portal' : 'My Reports'}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  leftIcon={<PlusCircle size={18} />}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/report/new');
                  }}
                >
                  Report an issue
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon={<LogIn size={18} />}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  Sign in
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  leftIcon={<PlusCircle size={18} />}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/report/new');
                  }}
                >
                  Report an issue
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
