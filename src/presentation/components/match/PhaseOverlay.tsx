interface PhaseOverlayProps {
  phase: 'overtime' | 'penalties'
  onContinue: () => void
}

export function PhaseOverlay({ phase, onContinue }: PhaseOverlayProps) {
  const isOT = phase === 'overtime'
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="card-sharp" style={{
        padding: '24px 20px', textAlign: 'center',
        minWidth: 260, maxWidth: 320, width: '90%',
        background: 'var(--bg)',
        border: 'none',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{isOT ? '⏱' : '🎯'}</div>
        <h2 style={{
          fontSize: 28, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
          color: isOT ? 'var(--accent)' : 'var(--danger)',
        }}>
          {isOT ? 'FÖRLÄNGNING' : 'STRAFFAR'}
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 4 }}>
          {isOT ? 'Oavgjort efter 60 minuter.' : 'Fortfarande oavgjort efter förlängning.'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          {isOT ? 'Ytterligare 2 × 15 minuter spelas.' : 'Nu avgör straffarna!'}
        </p>
        <button onClick={onContinue} style={{
          width: '100%', padding: '13px 0',
          background: isOT ? 'var(--accent)' : 'var(--danger)',
          color: isOT ? 'var(--bg)' : 'var(--text-on-dark)',
          border: 'none', borderRadius: 0, cursor: 'pointer',
          fontSize: 14, fontWeight: 700, letterSpacing: '1px',
          fontFamily: 'var(--font-display)',
        }}>
          {isOT ? 'Spela förlängning →' : 'Påbörja straffläggning →'}
        </button>
      </div>
    </div>
  )
}
