import React from 'react';
import './Loader.css';

export default function Loader({
  message = 'Loading...',
  fullScreen = false,
  size = 'md',
  className = ''
}) {
  const content = (
    <div className={`civic-loader civic-loader--${size} ${className}`} role="status">
      <div className="civic-loader__ring" aria-hidden="true" />
      {message && <p className="civic-loader__text">{message}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );

  if (fullScreen) {
    return <div className="civic-loader-screen">{content}</div>;
  }

  return content;
}

export function Skeleton({ width = '100%', height = '1rem', radius = 'var(--radius-sm)', className = '' }) {
  return (
    <div
      className={`civic-skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
