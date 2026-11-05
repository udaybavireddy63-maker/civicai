import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function CitizenNavbar({ user: propUser = null, onLogout = null }) {
  const { user: authUser, logout: authLogout } = useAuth();
  const user = propUser || authUser;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const notifyRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    if (onLogout) {
      await onLogout();
    } else {
      await authLogout();
      navigate('/login', { replace: true });
    }
  };

  const navLinks = [
    {
      label: 'Dashboard',
      path: '/citizen',
      icon: <LayoutDashboard size={17} />,
      isActive: location.pathname === '/citizen'
    },
    {
      label: 'My Reports',
      path: '/citizen/reports',
      icon: <FileSpreadsheet size={17} />,
      isActive: location.pathname === '/citizen/reports'
    }
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'C';

  return (
    <header className="civic-topbar" aria-label="Citizen Navigation Bar">
      <div className="civic-topbar__inner">
        {/* Brand & Resident Portal Tag */}
        <div className="civic-topbar__brand-wrap">
          <BrandLogo size="md" to="/citizen" />
          <span className="civic-topbar__badge civic-topbar__badge--citizen">
            Resident Portal
          </span>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <nav className="civic-topbar__nav" aria-label="Citizen Links">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`civic-topbar__link ${item.isActive ? 'civic-topbar__link--active' : ''}`}
            >
              <span className="civic-topbar__link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Action Items */}
        <div className="civic-topbar__actions">
          {/* Report an Issue CTA */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle size={16} />}
            onClick={() => navigate('/report/new')}
          >
            Report an issue
          </Button>

          {/* Notifications Dropdown */}
          <div className="civic-topbar__profile-wrap" ref={notifyRef}>
            <button
              type="button"
              className="civic-topbar__notify-btn"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileDropdownOpen(false);
              }}
              aria-label="View notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell size={18} />
              <span className="civic-topbar__notify-badge" />
            </button>

            {notificationsOpen && (
              <div className="civic-topbar__dropdown" style={{ width: '300px' }}>
                <div className="civic-topbar__dropdown-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      Notifications
                    </span>
                    <Badge variant="primary" size="sm">Live</Badge>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Real-time municipal updates on your reports
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.25rem 0' }}>
                  <div style={{ display: 'flex', gap: '0.625rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-muted)' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                        Automatic AI Triage Active
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        All new issues are instantly analyzed and routed to municipal staff.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.625rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <Clock size={16} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                        Audit Timeline Synchronized
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Officer updates reflect in real-time in your resolution timeline.
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/citizen/reports"
                  className="civic-topbar__dropdown-item"
                  style={{ justifyContent: 'center', color: 'var(--color-primary)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.625rem' }}
                  onClick={() => setNotificationsOpen(false)}
                >
                  View All Reported Issues
                </Link>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="civic-topbar__profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="civic-topbar__profile-trigger"
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotificationsOpen(false);
              }}
              aria-label="User menu"
              aria-expanded={profileDropdownOpen}
            >
              <div className="civic-topbar__avatar">{userInitial}</div>
              <div className="civic-topbar__profile-meta">
                <span className="civic-topbar__profile-name">{user?.name || 'Resident'}</span>
                <span className="civic-topbar__profile-role">Citizen</span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
            </button>

            {profileDropdownOpen && (
              <div className="civic-topbar__dropdown">
                <div className="civic-topbar__dropdown-header">
                  <div className="civic-topbar__dropdown-name">{user?.name || 'Resident'}</div>
                  <div className="civic-topbar__dropdown-email">{user?.email || 'citizen@civicai.org'}</div>
                  <Badge variant="primary" size="sm">Verified Resident</Badge>
                </div>

                <Link
                  to="/citizen"
                  className="civic-topbar__dropdown-item"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <LayoutDashboard size={15} />
                  <span>Resident Dashboard</span>
                </Link>

                <Link
                  to="/citizen/reports"
                  className="civic-topbar__dropdown-item"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <FileSpreadsheet size={15} />
                  <span>My Reported Issues</span>
                </Link>

                <Link
                  to="/report/new"
                  className="civic-topbar__dropdown-item"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <PlusCircle size={15} />
                  <span>Report New Issue</span>
                </Link>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)', margin: '0.25rem 0' }} />

                <button
                  type="button"
                  className="civic-topbar__dropdown-item civic-topbar__dropdown-item--danger"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Sign Out Button */}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<LogOut size={16} />}
            onClick={handleLogout}
            aria-label="Sign out"
          >
            Logout
          </Button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="civic-topbar__mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="civic-topbar__mobile-drawer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div className="civic-topbar__avatar">{userInitial}</div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {user?.name || 'Resident'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {user?.email || 'citizen@civicai.org'}
              </div>
            </div>
            <Badge variant="primary" size="sm" style={{ marginLeft: 'auto' }}>Citizen</Badge>
          </div>

          <nav className="civic-topbar__mobile-nav">
            <Link
              to="/citizen"
              className={`civic-topbar__mobile-link ${location.pathname === '/citizen' ? 'civic-topbar__mobile-link--active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/citizen/reports"
              className={`civic-topbar__mobile-link ${location.pathname === '/citizen/reports' ? 'civic-topbar__mobile-link--active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileSpreadsheet size={18} />
              <span>My Reports</span>
            </Link>

            <Link
              to="/report/new"
              className="civic-topbar__mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <PlusCircle size={18} />
              <span>Report an Issue</span>
            </Link>
          </nav>

          <Button
            variant="danger"
            size="md"
            fullWidth
            leftIcon={<LogOut size={16} />}
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </div>
      )}
    </header>
  );
}
