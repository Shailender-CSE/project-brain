import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, subtitle, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        {title && <h2>{title}</h2>}
        {subtitle && <p className="sub">{subtitle}</p>}
        {children}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
