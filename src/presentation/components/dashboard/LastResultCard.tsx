import type { Fixture } from '../../../domain/entities/Fixture'

interface LastResultCardProps {
  lastResult: { scoreFor: number; scoreAgainst: number; opponentName: string }
  lastCompletedFixture: Fixture | null
  onNavigateToReport: () => void
  cardStyle: React.CSSProperties
  cardLabelStyle: React.CSSProperties
}

export function LastResultCard({
  lastResult,
  lastCompletedFixture,
  onNavigateToReport,
  cardStyle,
  cardLabelStyle,
}: LastResultCardProps) {
  return (
    <div
      className="card-stagger-2"
      style={{ ...cardStyle, cursor: 'pointer' }}
      onClick={onNavigateToReport}
    >
      <p className="section-heading" style={cardLabelStyle}>SENASTE RESULTAT</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p
            className="tabular"
            key={`${lastResult.scoreFor}-${lastResult.scoreAgainst}`}
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: lastResult.scoreFor > lastResult.scoreAgainst
                ? '#22c55e'
                : lastResult.scoreFor < lastResult.scoreAgainst
                  ? '#ef4444'
                  : '#F0F4F8',
              letterSpacing: '2px',
              lineHeight: 1,
              animation: 'countUp 400ms ease-out both',
            }}
          >
            {lastResult.scoreFor} — {lastResult.scoreAgainst}
          </p>
          {lastCompletedFixture?.wentToPenalties && lastCompletedFixture.penaltyResult && (
            <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600, marginTop: 2 }}>
              str. {lastCompletedFixture.penaltyResult.home}-{lastCompletedFixture.penaltyResult.away}
            </p>
          )}
          {lastCompletedFixture?.wentToOvertime && !lastCompletedFixture.wentToPenalties && (
            <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600, marginTop: 2 }}>
              efter förlängning
            </p>
          )}
          <p style={{ fontSize: 12, color: '#8A9BB0', marginTop: 4 }}>
            vs {lastResult.opponentName}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 700,
            background: lastResult.scoreFor > lastResult.scoreAgainst
              ? 'rgba(34,197,94,0.15)'
              : lastResult.scoreFor < lastResult.scoreAgainst
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(248,250,252,0.1)',
            color: lastResult.scoreFor > lastResult.scoreAgainst
              ? '#22c55e'
              : lastResult.scoreFor < lastResult.scoreAgainst
                ? '#ef4444'
                : '#F0F4F8',
            border: `1px solid ${lastResult.scoreFor > lastResult.scoreAgainst
              ? 'rgba(34,197,94,0.3)'
              : lastResult.scoreFor < lastResult.scoreAgainst
                ? 'rgba(239,68,68,0.3)'
                : 'rgba(248,250,252,0.15)'}`,
          }}>
            {lastResult.scoreFor > lastResult.scoreAgainst
              ? 'Vinst'
              : lastResult.scoreFor < lastResult.scoreAgainst
                ? 'Förlust'
                : 'Oavgjort'}
          </span>
          <span style={{ color: '#C9A84C', fontSize: 16, fontWeight: 700 }}>→</span>
        </div>
      </div>
    </div>
  )
}
