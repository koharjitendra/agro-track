import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck } from 'react-icons/fi';
import * as authApi from '../../../api/auth.api.js';
import { useAuthStore } from '../../../store/auth.store.js';
import { validateEmail, validatePassword, passwordHint } from '../../../utils/validators.js';

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('FARMER');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!validateEmail(email)) newErrors.email = 'Please enter a valid email';
    if (phone && phone.length < 10) newErrors.phone = 'Phone must be at least 10 digits';
    if (!validatePassword(password)) newErrors.password = passwordHint;
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const response = await authApi.register({ name, email, phone, password, role });
      setAuth(response.data.user);
      toast.success('Account created. Welcome!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-page">
      {/* Left panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-brand-logo"><span>🌾</span></div>
          <h1 className="auth-brand-title">Agro Track</h1>
          <p className="auth-brand-tagline">Built for Indian farmers and agri-buyers. Simple. Reliable. Yours.</p>
          <ul className="auth-feature-list">
            {[
              'Track every crop cycle from seed to harvest',
              'Log expenses — seeds, labor, fertilizers',
              'List crops on the marketplace and find buyers',
              'Real-time weather alerts for your field',
            ].map((f, i) => (
              <li key={i} className="auth-feature-item">
                <FiCheck className="auth-feature-check" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-brand-pattern" aria-hidden="true">
          {['🌱','🌾','🚜','🌿','🌻','🥬','🌽','🍅'].map((e, i) => (
            <span key={i} className={`auth-pattern-item auth-pattern-item-${i}`}>{e}</span>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-form-panel auth-form-panel--scroll">
        <div className="auth-form-card fade-in">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create account</h2>
            <p className="auth-form-subtitle">Start tracking your farm today</p>
          </div>

          {/* Role selector */}
          <div className="auth-role-row">
            {[
              { val: 'FARMER', icon: '🚜', title: 'Farmer', desc: 'I grow and sell crops' },
              { val: 'BUYER',  icon: '💼', title: 'Buyer',  desc: 'I buy farm produce' },
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                className={`auth-role-btn ${role === r.val ? 'active' : ''}`}
                onClick={() => setRole(r.val)}
              >
                <span className="auth-role-icon">{r.icon}</span>
                <span className="auth-role-title">{r.title}</span>
                <span className="auth-role-desc">{r.desc}</span>
                {role === r.val && <FiCheck className="auth-role-check" />}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form-body">
            {/* Name */}
            <div className={`auth-field ${errors.name ? 'has-error' : ''}`}>
              <label className="auth-field-label" htmlFor="reg-name">Full name</label>
              <div className="auth-field-wrapper">
                <FiUser className="auth-field-icon" />
                <input id="reg-name" type="text" className="auth-field-input" placeholder="Rajesh Kumar"
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              {errors.name && <span className="auth-field-error">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className={`auth-field ${errors.email ? 'has-error' : ''}`}>
              <label className="auth-field-label" htmlFor="reg-email">Email address</label>
              <div className="auth-field-wrapper">
                <FiMail className="auth-field-icon" />
                <input id="reg-email" type="email" className="auth-field-input" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              {errors.email && <span className="auth-field-error">{errors.email}</span>}
            </div>

            {/* Phone */}
            <div className={`auth-field ${errors.phone ? 'has-error' : ''}`}>
              <label className="auth-field-label" htmlFor="reg-phone">Phone <span className="auth-field-optional">(optional)</span></label>
              <div className="auth-field-wrapper">
                <FiPhone className="auth-field-icon" />
                <input id="reg-phone" type="tel" className="auth-field-input" placeholder="9876543210"
                  value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              {errors.phone && <span className="auth-field-error">{errors.phone}</span>}
            </div>

            {/* Password row */}
            <div className="auth-field-row">
              <div className={`auth-field ${errors.password ? 'has-error' : ''}`}>
                <label className="auth-field-label" htmlFor="reg-pass">Password</label>
                <div className="auth-field-wrapper">
                  <FiLock className="auth-field-icon" />
                  <input id="reg-pass" type={showPass ? 'text' : 'password'} className="auth-field-input"
                    placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="auth-field-toggle" onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && <span className="auth-field-error">{errors.password}</span>}
              </div>

              <div className={`auth-field ${errors.confirmPassword ? 'has-error' : ''}`}>
                <label className="auth-field-label" htmlFor="reg-confirm">Confirm password</label>
                <div className="auth-field-wrapper">
                  <FiLock className="auth-field-icon" />
                  <input id="reg-confirm" type={showPass ? 'text' : 'password'} className="auth-field-input"
                    placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="auth-btn-spinner" /> : <>Create account <FiArrowRight className="auth-btn-arrow" /></>}
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
