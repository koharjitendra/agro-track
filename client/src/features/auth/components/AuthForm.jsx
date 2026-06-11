import React from 'react';

const AuthForm = ({ children, title, subtitle }) => {
  return (
    <div className="auth-page-wrapper">
      <div className="auth-card glass-card fade-in">
        <div className="auth-header">
          <span className="auth-logo">🌾</span>
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthForm;
