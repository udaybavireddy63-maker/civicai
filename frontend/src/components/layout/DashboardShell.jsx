import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CitizenNavbar from './CitizenNavbar';
import AdminNavbar from './AdminNavbar';
import './DashboardShell.css';

export default function DashboardShell({
  user: propUser,
  onLogout = null,
  children
}) {
  const { user: authUser, logout: authLogout } = useAuth();
  const user = propUser || authUser;
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await authLogout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="civic-dash">
      {/* Top Navigation Bar: Citizen or Admin */}
      {isAdmin ? (
        <AdminNavbar user={user} onLogout={handleLogout} />
      ) : (
        <CitizenNavbar user={user} onLogout={handleLogout} />
      )}

      {/* Main Content Container (Full Width, Centered, No Sidebar) */}
      <main className="civic-dash__content">
        {children}
      </main>

      {/* Clean Dashboard Footer */}
      <footer className="civic-dash__footer">
        <div className="civic-dash__footer-inner">
          <span className="civic-dash__footer-text">
            © {new Date().getFullYear()} CivicSense AI — Civic Intelligence & Municipal Operations Platform
          </span>
          <span className="civic-dash__footer-audit">
            Audit Trails Verified • Automated AI Assistance is Advisory
          </span>
        </div>
      </footer>
    </div>
  );
}
