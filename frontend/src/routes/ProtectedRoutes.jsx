import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

/**
 * Route accessible only to verified Citizens
 * If an Admin attempts to access citizen-only routes, they are redirected to /admin
 */
export function CitizenRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullScreen message="Verifying resident session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

/**
 * Route strictly reserved for verified Administrators
 * If a citizen attempts to visit an admin page, they are redirected to /citizen
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullScreen message="Verifying administrative credentials..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Non-admin attempting to access admin route is redirected to citizen home
    return <Navigate to="/citizen" replace />;
  }

  return children;
}

/**
 * Route for guests only (e.g. /login, /register)
 * If already authenticated, redirects directly to their dashboard
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <Loader fullScreen message="Loading CivicAI..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/citizen'} replace />;
  }

  return children;
}
