import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import BrandLogo from '../components/common/BrandLogo';
import './AuthPages.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password
      });
      navigate('/citizen', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="civic-auth">
      {/* Visual Brand Column */}
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
            <ShieldCheck size={15} />
            <span>Resident Network</span>
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
            <h1 className="civic-auth__title">Create your citizen account</h1>
            <p className="civic-auth__subtitle">
              Join your community in reporting civic issues and tracking municipal repairs.
            </p>
          </div>

          <div className="civic-auth__policy-note">
            <ShieldCheck size={16} className="civic-auth__policy-icon" />
            <span>Public registration creates Resident Citizen accounts. Admin roles are provisioned by municipality administrators.</span>
          </div>

          {error && (
            <div className="civic-auth__alert" role="alert">
              <AlertCircle size={18} className="civic-auth__alert-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="civic-auth__form" noValidate>
            <Input
              label="Full Name"
              id="register-name"
              type="text"
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              leftIcon={<User size={18} />}
              autoComplete="name"
            />

            <Input
              label="Email Address"
              id="register-email"
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
              id="register-password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock size={18} />}
              helperText="Must be at least 8 characters long"
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              id="register-confirm-password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              leftIcon={<Lock size={18} />}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              leftIcon={<UserPlus size={18} />}
            >
              Register Account
            </Button>
          </form>

          <div className="civic-auth__footer">
            <p>
              Already registered?{' '}
              <Link to="/login" className="civic-auth__link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
