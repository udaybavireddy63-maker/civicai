import React from 'react';
import { Link } from 'react-router-dom';
import './BrandLogo.css';

export default function BrandLogo({
  size = 'md',
  to = '/',
  showTag = false,
  tagText = 'Civic Intelligence Platform',
  className = ''
}) {
  const iconSizes = { sm: 30, md: 38, lg: 44, xl: 48 };
  const px = iconSizes[size] || 38;

  const content = (
    <div className={`civic-brand civic-brand--${size} ${className}`}>
      <img
        src="/images/civic-logo.svg"
        alt="CivicSense AI"
        width={px}
        height={px}
        className="civic-brand__icon"
      />
      <div className="civic-brand__text">
        <span className="civic-brand__title">
          CivicSense <span className="civic-brand__accent">AI</span>
        </span>
        {showTag && <span className="civic-brand__tag">{tagText}</span>}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="civic-brand__link" aria-label="CivicSense AI Home">
        {content}
      </Link>
    );
  }

  return content;
}
