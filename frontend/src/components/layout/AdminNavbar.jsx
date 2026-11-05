import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BarChart3,
  Layers,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function AdminNavbar({ user: propUser = null, onLogout = null }) {
  const { user: authUser, logout: authLogout } = useAuth();
  const user = propUser || authUser;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const profileRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
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
      label: 'Overview',
      path: '/admin',
      icon: <LayoutDashboard size={17} />,
      isActive: location.pathname === '/admin' && !location.hash && location.pathname !== '/admin/analytics'
    },
    {
      label: 'Complaints',
      path: '/admin/reports',
      icon: <FileSpreadsheet size={17} />,
      isActive: location.pathname === '/admin/reports'
    },
    {
      label: 'Analytics',
      path: '/admin/analytics',
      icon: <BarChart3 size={17} />,
      isActive: location.pathname === '/admin/analytics' || location.hash === '#analytics'
    },
    {
      label: 'Department Triage',
      path: '/admin/triage',
      icon: <Layers size={17} />,
      isActive: location.pathname === '/admin/triage'
    }
  ];

  const adminInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <header className="civic-topbar" aria-label="Admin Navigation Bar">
      <div className="civic-topbar__inner">
        {/* Brand & Municipal Admin Badge */}
        <div className="civic-topbar__brand-wrap">
          <BrandLogo size="md" to="/admin" />
          <span className="civic-topbar__badge civic-topbar__badge--admin">
            Admin Portal
          </span>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <nav className="civic-topbar__nav" aria-label="Admin Navigation Links">
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

        {/* Right Section Actions */}
        <div className="civic-topbar__actions">
          {/* AI Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.65rem',
              backgroundColor: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-primary)'
            }}
            className="civic-topbar__ai-pill"
          >
            <Sparkles size={13} />
            <span>AI Triage Active</span>
          </div>

          {/* Profile Dropdown */}
          <div className="civic-topbar__profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="civic-topbar__profile-trigger"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              aria-label="Admin profile menu"
              aria-expanded={profileDropdownOpen}
            >
              <div className="civic-topbar__avatar civic-topbar__avatar--admin">
                {adminInitial}
              </div>
              <div className="civic-topbar__profile-meta">
                <span className="civic-topbar__profile-name">{user?.name || 'Administrator'}</span>
                <span className="civic-topbar__profile-role">Admin</span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
            </button>

            {profileDropdownOpen && (
              <div className="civic-topbar__dropdown">
                <div className="civic-topbar__dropdown-header">
                  <div className="civic-topbar__dropdown-name">{user?.name || 'Municipal Administrator'}</div>
                  <div className="civic-topbar__dropdown-email">{user?.email || 'admin@civicai.org'}</div>
                  <Badge variant="accent" size="sm">Municipal Operations</Badge>
                </div>

                <Link
                  to="/admin"
                  className="civic-topbar__dropdown-item"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <LayoutDashboard size={15} />
                  <span>Admin Overview</span>
                </Link>

                <Link
                  to="/admin/reports"
                  className="civic-topbar__dropdown-item"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <FileSpreadsheet size={15} />
                  <span>Reports Queue</span>
                </Link>

                <Link
                  to="/admin/analytics"
                  className="civic-topbar__dropdown-item"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <BarChart3 size={15} />
                  <span>System Analytics</span>
                </Link>

                <Link
                  to="/admin/triage"
                  className="civic-topbar__dropdown-item"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <Layers size={15} />
                  <span>Department Routing</span>
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

          {/* Explicit Sign Out Button */}
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
            <div className="civic-topbar__avatar civic-topbar__avatar--admin">{adminInitial}</div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {user?.name || 'Municipal Administrator'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {user?.email || 'admin@civicai.org'}
              </div>
            </div>
            <Badge variant="accent" size="sm" style={{ marginLeft: 'auto' }}>ADMIN</Badge>
          </div>

          <nav className="civic-topbar__mobile-nav">
            <Link
              to="/admin"
              className={`civic-topbar__mobile-link ${location.pathname === '/admin' && !location.hash && location.pathname !== '/admin/analytics' ? 'civic-topbar__mobile-link--active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </Link>

            <Link
              to="/admin/reports"
              className={`civic-topbar__mobile-link ${location.pathname === '/admin/reports' ? 'civic-topbar__mobile-link--active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileSpreadsheet size={18} />
              <span>Complaints Queue</span>
            </Link>

            <Link
              to="/admin/analytics"
              className={`civic-topbar__mobile-link ${location.pathname === '/admin/analytics' || location.hash === '#analytics' ? 'civic-topbar__mobile-link--active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </Link>

            <Link
              to="/admin/triage"
              className={`civic-topbar__mobile-link ${location.pathname === '/admin/triage' ? 'civic-topbar__mobile-link--active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Layers size={18} />
              <span>Department Triage</span>
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
