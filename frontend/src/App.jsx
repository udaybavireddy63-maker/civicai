import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CitizenRoute, AdminRoute, GuestRoute } from './routes/ProtectedRoutes';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboardPage from './pages/CitizenDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ReportFormPage from './pages/ReportFormPage';
import ReportDetailPage from './pages/ReportDetailPage';

function AppRoutes() {
  const { user, logout } = useAuth();

  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage user={user} />} />

      {/* Guest only routes (redirect if signed in) */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      {/* Citizen Protected Routes */}
      <Route
        path="/citizen"
        element={
          <CitizenRoute>
            <CitizenDashboardPage user={user} onLogout={logout} />
          </CitizenRoute>
        }
      />
      <Route
        path="/citizen/reports"
        element={
          <CitizenRoute>
            <CitizenDashboardPage user={user} onLogout={logout} />
          </CitizenRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage user={user} onLogout={logout} />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminRoute>
            <AdminDashboardPage user={user} onLogout={logout} />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/triage"
        element={
          <AdminRoute>
            <AdminDashboardPage user={user} onLogout={logout} />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <AdminRoute>
            <AdminDashboardPage user={user} onLogout={logout} />
          </AdminRoute>
        }
      />

      {/* Report Creation (Citizen Protected) */}
      <Route
        path="/report/new"
        element={
          <CitizenRoute>
            <ReportFormPage user={user} />
          </CitizenRoute>
        }
      />

      {/* Report Detail (Supports both singular /report/:id and plural /reports/:id) */}
      <Route
        path="/report/:id"
        element={<ReportDetailPage user={user} />}
      />
      <Route
        path="/reports/:id"
        element={<ReportDetailPage user={user} />}
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
