import React from 'react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  type = 'button',
  onClick,
  className = '',
  fullWidth = false,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`civic-btn civic-btn--${variant} civic-btn--${size} ${fullWidth ? 'civic-btn--full' : ''} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <span className="civic-btn__spinner" aria-hidden="true" />
      ) : (
        leftIcon && <span className="civic-btn__icon civic-btn__icon--left">{leftIcon}</span>
      )}
      <span className="civic-btn__content">{children}</span>
      {!isLoading && rightIcon && (
        <span className="civic-btn__icon civic-btn__icon--right">{rightIcon}</span>
      )}
    </button>
  );
}
