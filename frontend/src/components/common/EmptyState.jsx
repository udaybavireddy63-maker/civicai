import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';
import './EmptyState.css';

export default function EmptyState({
  icon = <Inbox size={42} strokeWidth={1.5} />,
  title = 'No reports found',
  description = 'There are no items to display right now.',
  actionLabel = null,
  onAction = null,
  actionIcon = null,
  secondaryActionLabel = null,
  onSecondaryAction = null,
  className = ''
}) {
  return (
    <div className={`civic-empty ${className}`}>
      <div className="civic-empty__icon-wrapper" aria-hidden="true">
        {icon}
      </div>
      <h3 className="civic-empty__title">{title}</h3>
      <p className="civic-empty__description">{description}</p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="civic-empty__actions">
          {actionLabel && (
            <Button
              variant="primary"
              size="md"
              leftIcon={actionIcon}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button
              variant="outline"
              size="md"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
