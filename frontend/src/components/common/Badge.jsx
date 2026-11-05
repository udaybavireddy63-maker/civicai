import React from 'react';
import './Badge.css';

export default function Badge({
  children,
  variant = 'neutral',
  status = null,
  priority = null,
  size = 'md',
  dot = false,
  className = '',
  ...rest
}) {
  let computedVariant = variant;

  if (status) {
    const s = status.toUpperCase().replace(/\s+/g, '_');
    switch (s) {
      case 'SUBMITTED':
        computedVariant = 'status-submitted';
        break;
      case 'UNDER_REVIEW':
        computedVariant = 'status-under-review';
        break;
      case 'ASSIGNED':
        computedVariant = 'status-assigned';
        break;
      case 'IN_PROGRESS':
        computedVariant = 'status-in-progress';
        break;
      case 'RESOLVED':
        computedVariant = 'status-resolved';
        break;
      case 'REJECTED':
        computedVariant = 'status-rejected';
        break;
      default:
        computedVariant = 'neutral';
    }
  } else if (priority) {
    const p = priority.toUpperCase();
    switch (p) {
      case 'LOW':
        computedVariant = 'priority-low';
        break;
      case 'MEDIUM':
        computedVariant = 'priority-medium';
        break;
      case 'HIGH':
        computedVariant = 'priority-high';
        break;
      default:
        computedVariant = 'neutral';
    }
  }

  const label = children || (status ? formatLabel(status) : priority ? formatLabel(priority) : '');

  return (
    <span className={`civic-badge civic-badge--${computedVariant} civic-badge--${size} ${className}`} {...rest}>
      {dot && <span className="civic-badge__dot" aria-hidden="true" />}
      <span className="civic-badge__text">{label}</span>
    </span>
  );
}

function formatLabel(str) {
  return str
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
