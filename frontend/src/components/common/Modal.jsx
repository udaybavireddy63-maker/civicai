import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '540px'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="civic-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="civic-modal"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="civic-modal__header">
          <h3 className="civic-modal__title">{title}</h3>
          <button
            type="button"
            className="civic-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="civic-modal__body">{children}</div>

        {footer && <div className="civic-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
