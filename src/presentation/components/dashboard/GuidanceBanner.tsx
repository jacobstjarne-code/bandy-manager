import type { Fixture } from '../../../domain/entities/Fixture'

interface GuidanceBannerProps {
  hasPendingLineup: boolean
  nextFixture: Fixture | null
  lastCompletedFixture: Fixture | null
  onNavigateToMatch: () => void
  onNavigateToReport: () => void
}

export function GuidanceBanner({
  hasPendingLineup,
  nextFixture,
  lastCompletedFixture,
  onNavigateToMatch,
  onNavigateToReport,
}: GuidanceBannerProps) {
  if (!hasPendingLineup && nextFixture) {
    return (
      <div className="card-stagger-5" style={{
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 13,
        color: '#8A9BB0',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠ Du har inte satt en startelva. Sätt din trupp inför matchen.</span>
          <button
            onClick={onNavigateToMatch}
            style={{
              flexShrink: 0,
              marginLeft: 10,
              background: 'none',
              border: 'none',
              color: '#C9A84C',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            → Trupp
          </button>
        </div>
      </div>
    )
  }

  if (lastCompletedFixture) {
    return (
      <div
        className="card-stagger-5"
        style={{
          background: 'rgba(37,99,235,0.08)',
          border: '1px solid rgba(37,99,235,0.2)',
          borderRadius: 10,
          padding: '12px 14px',
          fontSize: 13,
          color: '#8A9BB0',
          marginBottom: 12,
          cursor: 'pointer',
        }}
        onClick={onNavigateToReport}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 Ny matchrapport tillgänglig. Klicka för att se rapporten</span>
          <span style={{ marginLeft: 10, color: '#C9A84C', fontWeight: 700 }}>→</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card-stagger-5" style={{
      fontSize: 13,
      color: '#22c55e',
      fontWeight: 600,
      marginBottom: 12,
      padding: '10px 14px',
      background: 'rgba(34,197,94,0.08)',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: 10,
    }}>
      ✓ Redo för match
    </div>
  )
}
