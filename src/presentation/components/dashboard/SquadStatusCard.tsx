interface StatBarProps {
  label: string
  value: number
  valueColor: string
  barGradient: string
}

function StatBar({ label, value, valueColor, barGradient }: StatBarProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: valueColor, fontFamily: 'var(--font-body)' }}>{value}</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, overflow: 'hidden', background: 'var(--border-dark)' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: barGradient,
          borderRadius: 4,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

interface SquadStatusCardProps {
  readyCount: number
  injuredCount: number
  avgForm: number
  avgFitness: number
  morale: number
  sharpness: number
  onNavigateToSquad?: () => void
}

export function SquadStatusCard({
  readyCount,
  injuredCount,
  avgForm,
  avgFitness,
  morale,
  sharpness,
  onNavigateToSquad,
}: SquadStatusCardProps) {
  return (
    <div
      className="card-sharp card-stagger-4"
      style={{ overflow: 'hidden', cursor: onNavigateToSquad ? 'pointer' : undefined }}
      onClick={onNavigateToSquad}
    >
      {/* Stat bars */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            👥 Trupp
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="tag tag-green">{readyCount} redo</span>
            {injuredCount > 0 && <span className="tag tag-red">{injuredCount} skadade</span>}
            {onNavigateToSquad && (
              <button onClick={(e) => { e.stopPropagation(); onNavigateToSquad() }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, flexShrink: 0, background: 'transparent', border: '1px solid var(--border)', color: 'var(--accent)', fontSize: 12, lineHeight: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', cursor: 'pointer' }}>›</button>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatBar
            label="Form"
            value={avgForm}
            valueColor="var(--success-light)"
            barGradient="linear-gradient(90deg, #6BA04A, #5A9A4A)"
          />
          <StatBar
            label="Kondition"
            value={avgFitness}
            valueColor="var(--accent)"
            barGradient="linear-gradient(90deg, #D4945A, #C47A3A)"
          />
          <StatBar
            label="Moral"
            value={morale}
            valueColor="var(--ice-dark)"
            barGradient="linear-gradient(90deg, #7EB3D4, #5A7A8A)"
          />
          <StatBar
            label="Skärpa"
            value={sharpness}
            valueColor="var(--text-muted)"
            barGradient="linear-gradient(90deg, #C4BAA8, #8A857A)"
          />
        </div>
      </div>
    </div>
  )
}
