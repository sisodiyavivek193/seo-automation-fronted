export default function StatCard({ label, value, icon: Icon, color = 'accent', sub, delay = '' }) {
  const colorMap = {
    accent: { bg: 'var(--accent-dim)', border: 'var(--accent)', text: 'var(--accent)' },
    warn:   { bg: 'var(--warn-dim)',   border: 'var(--warn)',   text: 'var(--warn)'   },
    blue:   { bg: 'var(--blue-dim)',   border: 'var(--blue)',   text: 'var(--blue)'   },
  };
  const c = colorMap[color];

  return (
    <div
      className={delay}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderRadius: 12,
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 3,
          background: c.border,
          borderRadius: '12px 0 0 12px',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginLeft: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {label}
          </p>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 32,
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {value ?? '—'}
          </p>
          {sub && (
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
              {sub}
            </p>
          )}
        </div>
        {Icon && (
          <div
            style={{
              width: 40,
              height: 40,
              background: c.bg,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} color={c.text} />
          </div>
        )}
      </div>
    </div>
  );
}
