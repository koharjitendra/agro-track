import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { useAuthStore } from '../../../store/auth.store.js';
import * as authApi from '../../../api/auth.api.js';
import { validateEmail, validatePassword, passwordHint } from '../../../utils/validators.js';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};
    if (!validateEmail(email)) newErrors.email = 'Enter a valid email address';
    if (!validatePassword(password)) newErrors.password = passwordHint;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      setAuth(response.data.user);
      toast.success(`Welcome back, ${response.data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-page">
      {/* Left panel — brand */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <span>🌾</span>
          </div>
          <h1 className="auth-brand-title">Agro Track</h1>
          <p className="auth-brand-tagline">From seed to sale — track every rupee of your farm.</p>
          <div className="auth-brand-stats">
            <div className="auth-stat">
              <span className="auth-stat-value">₹2.4Cr+</span>
              <span className="auth-stat-label">Revenue tracked</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">1,200+</span>
              <span className="auth-stat-label">Active farmers</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">48 Crops</span>
              <span className="auth-stat-label">Marketplace listings</span>
            </div>
          </div>
        </div>
        <div className="auth-brand-pattern" aria-hidden="true">
          {['🌱','🌾','🚜','🌿','🌻','🥬','🌽','🍅'].map((e, i) => (
            <span key={i} className={`auth-pattern-item auth-pattern-item-${i}`}>{e}</span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-panel">
        <div className="auth-form-card fade-in">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Sign in</h2>
            <p className="auth-form-subtitle">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-body">
            {/* Email */}
            <div className={`auth-field ${errors.email ? 'has-error' : ''}`}>
              <label className="auth-field-label" htmlFor="email">Email address</label>
              <div className="auth-field-wrapper">
                <FiMail className="auth-field-icon" />
                <input
                  id="email"
                  type="email"
                  className="auth-field-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="auth-field-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className={`auth-field ${errors.password ? 'has-error' : ''}`}>
              <label className="auth-field-label" htmlFor="password">Password</label>
              <div className="auth-field-wrapper">
                <FiLock className="auth-field-icon" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="auth-field-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-field-toggle"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-btn-spinner" />
              ) : (
                <>Sign in <FiArrowRight className="auth-btn-arrow" /></>
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-switch-link">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
