import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  leftIcon = null,
  isTextArea = false,
  rows = 4,
  className = '',
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const actualType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`civic-field ${error ? 'civic-field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="civic-field__label">
          {label}
          {required && <span className="civic-field__required" aria-hidden="true"> *</span>}
        </label>
      )}

      <div className="civic-field__control-wrapper">
        {leftIcon && <span className="civic-field__icon civic-field__icon--left">{leftIcon}</span>}

        {isTextArea ? (
          <textarea
            id={inputId}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            required={required}
            className={`civic-field__control civic-field__control--textarea ${leftIcon ? 'civic-field__control--has-left' : ''}`}
            {...rest}
          />
        ) : (
          <input
            id={inputId}
            type={actualType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`civic-field__control ${leftIcon ? 'civic-field__control--has-left' : ''} ${type === 'password' ? 'civic-field__control--has-right' : ''}`}
            {...rest}
          />
        )}

        {type === 'password' && (
          <button
            type="button"
            className="civic-field__password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <p className="civic-field__error" role="alert">{error}</p>
      ) : helperText ? (
        <p className="civic-field__helper">{helperText}</p>
      ) : null}
    </div>
  );
}
