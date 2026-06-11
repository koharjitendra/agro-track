import React from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-group ${error ? 'has-error' : ''} ${className}`.trim()}>
      {label && (
        <label className="input-label" htmlFor={name}>
          {label}
          {required && <span className="input-required-star"> *</span>}
        </label>
      )}
      <div className="input-field-wrapper">
        {Icon && <Icon className="input-field-icon" />}
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`input-field ${Icon ? 'with-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Input;
