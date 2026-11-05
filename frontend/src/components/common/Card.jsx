import React from 'react';
import './Card.css';

export default function Card({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
  onClick,
  as: Component = 'div',
  ...rest
}) {
  return (
    <Component
      className={`civic-card civic-card--pad-${padding} ${hoverable ? 'civic-card--hoverable' : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = '', title, subtitle, action }) {
  return (
    <div className={`civic-card__header ${className}`}>
      <div className="civic-card__header-text">
        {title && <h3 className="civic-card__title">{title}</h3>}
        {subtitle && <p className="civic-card__subtitle">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="civic-card__header-action">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`civic-card__body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`civic-card__footer ${className}`}>{children}</div>;
}
