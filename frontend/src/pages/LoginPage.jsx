import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import BrandLogo from '../components/common/BrandLogo';
import './AuthPages.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login({ email: email.trim(), password });
      
      // Strict role-based redirection:
      if (user.role === 'ADMIN') {
        // Admin must NEVER be redirected to public homepage, /login, or citizen routes
        if (from && (from.startsWith('/admin') || from.startsWith('/report/') || from.startsWith('/reports/'))) {
          navigate(from, { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else {
        // Citizen role
        if (from && (from.startsWith('/citizen') || from.startsWith('/report/')) && !from.startsWith('/admin')) {
          navigate(from, { replace: true });
        } else {
          navigate('/citizen', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="civic-auth">
      {/* Visual Brand Column — Real High-Res Photography & Translucent Overlay */}
      <div className="civic-auth__visual" aria-hidden="true">
        <img
          src="/images/civic-login-community.jpg"
          alt="Clean modern urban environment with green avenue and public infrastructure"
          className="civic-auth__visual-img"
          loading="eager"
        />
        <div className="civic-auth__visual-overlay" />
        <div className="civic-auth__visual-content">
          <div className="civic-auth__visual-badge">
            <Sparkles size={15} />
            <span>Civic Intelligence</span>
          </div>
          <h2 className="civic-auth__visual-title">Together, We Build Better Communities.</h2>
          <p className="civic-auth__visual-subtitle">
            Your voice matters. Report civic issues and help create safer, cleaner and smarter communities.
          </p>
        </div>
      </div>

      {/* Form Column */}
      <div className="civic-auth__form-col">
        <div className="civic-auth__container">
          <Link to="/" className="civic-auth__back-link">
            <ArrowLeft size={16} /> Back to homepage
          </Link>

          <div className="civic-auth__header">
            <div className="civic-auth__brand-wrapper">
              <BrandLogo size="lg" to="/" />
            </div>
            <h1 className="civic-auth__title">Welcome back</h1>
            <p className="civic-auth__subtitle">
              Sign in to manage your civic reports or review administrative municipal queues.
            </p>
          </div>

          {error && (
            <div className="civic-auth__alert" role="alert">
              <AlertCircle size={18} className="civic-auth__alert-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="civic-auth__form" noValidate>
            <Input
              label="Email Address"
              id="login-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail size={18} />}
              autoComplete="email"
            />

            <Input
              label="Password"
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock size={18} />}
              autoComplete="current-password"
            />

            <div className="civic-auth__options">
              <label className="civic-auth__remember">
                <input type="checkbox" className="civic-auth__checkbox" defaultChecked />
                <span>Keep me signed in</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              leftIcon={<LogIn size={18} />}
            >
              Sign in to CivicSense AI
            </Button>
          </form>

          <div className="civic-auth__footer">
            <p>
              Don't have a citizen account?{' '}
              <Link to="/register" className="civic-auth__link">
                Register as a resident
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
