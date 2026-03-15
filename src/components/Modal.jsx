import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-up"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-bright)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          padding: '28px 32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
