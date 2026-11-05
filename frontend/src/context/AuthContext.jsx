import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore authenticated session from HttpOnly cookie on initial load
  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      // 401 or no active session is normal on initial load for guest users
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (credentials) => {
    setError(null);
    try {
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setError(err.message || 'Login failed.');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const registeredUser = await authService.register(userData);
      setUser(registeredUser);
      return registeredUser;
    } catch (err) {
      setError(err.message || 'Registration failed.');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isCitizen: user?.role === 'CITIZEN',
    isLoading,
    error,
    login,
    register,
    logout,
    refreshSession: checkSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
