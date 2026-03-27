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
}

export function SquadStatusCard({
  readyCount,
  injuredCount,
  avgForm,
  avgFitness,
  morale,
  sharpness,
}: SquadStatusCardProps) {
  return (
    <div className="card-sharp card-stagger-4" style={{ margin: '0 12px 10px', overflow: 'hidden' }}>
      {/* Leather header bar */}
      <div
        className="texture-leather"
        style={{
          backgroundColor: 'var(--bg-leather)',
          padding: '7px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'var(--text-light-secondary)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          Truppstatus
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <span className="tag" style={{ background: 'rgba(90,154,74,0.15)', color: '#7EB88A', fontSize: 8 }}>
            {readyCount} redo
          </span>
          {injuredCount > 0 && (
            <span className="tag tag-red" style={{ fontSize: 8 }}>
              {injuredCount} skadade
            </span>
          )}
        </div>
      </div>

      {/* Stat bars */}
      <div style={{ padding: '12px 14px' }}>
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
