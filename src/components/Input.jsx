export default function Input({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      {props.as === 'select' ? (
        <select
          {...props}
          as={undefined}
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: `1px solid ${error ? 'var(--warn)' : 'var(--border)'}`,
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            padding: '10px 14px',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      ) : (
        <input
          {...props}
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: `1px solid ${error ? 'var(--warn)' : 'var(--border)'}`,
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            padding: '10px 14px',
            outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.target.style.borderColor = error ? 'var(--warn)' : 'var(--border)'; }}
        />
      )}
      {error && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--warn)' }}>{error}</p>
      )}
    </div>
  );
}
