import type { Fixture } from '../../../domain/entities/Fixture'

interface LastResultCardProps {
  lastResult: { scoreFor: number; scoreAgainst: number; opponentName: string }
  lastCompletedFixture: Fixture | null
  recentForm: Array<'V' | 'O' | 'F'>
  onNavigateToReport: () => void
}

const formColors = {
  V: { bg: 'var(--success)', letter: '#fff' },
  O: { bg: 'var(--border-dark)', letter: '#fff' },
  F: { bg: 'var(--danger)', letter: '#fff' },
}

export function LastResultCard({
  lastResult,
  lastCompletedFixture,
  recentForm,
  onNavigateToReport,
}: LastResultCardProps) {
  const isWin = lastResult.scoreFor > lastResult.scoreAgainst
  const isLoss = lastResult.scoreFor < lastResult.scoreAgainst

  return (
    <div
      className="card-sharp card-stagger-2"
      style={{ flex: 1, cursor: 'pointer', overflow: 'hidden' }}
      onClick={onNavigateToReport}
    >
      <div style={{ padding: '12px 12px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            🔴 Senast
          </p>
          <button style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, flexShrink: 0, background: 'transparent', border: '1px solid var(--border)', color: 'var(--accent)', fontSize: 12, lineHeight: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', cursor: 'pointer' }}>›</button>
        </div>

        <p
          className="tabular"
          key={`${lastResult.scoreFor}-${lastResult.scoreAgainst}`}
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1,
            fontFamily: 'var(--font-display)',
            animation: 'countUp 400ms ease-out both',
          }}
        >
          {lastResult.scoreFor}
          <span style={{ color: 'var(--border-dark)', fontSize: 20 }}>–</span>
          {lastResult.scoreAgainst}
        </p>

        {lastCompletedFixture?.wentToPenalties && lastCompletedFixture.penaltyResult && (
          <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginTop: 2, fontFamily: 'var(--font-body)' }}>
            str. {lastCompletedFixture.penaltyResult.home}-{lastCompletedFixture.penaltyResult.away}
          </p>
        )}
        {lastCompletedFixture?.wentToOvertime && !lastCompletedFixture.wentToPenalties && (
          <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginTop: 2, fontFamily: 'var(--font-body)' }}>
            förlängning
          </p>
        )}

        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '3px 0 0', fontFamily: 'var(--font-body)' }}>
          {isWin ? 'vinst' : isLoss ? 'förlust' : 'oavgjort'} mot {lastResult.opponentName}
        </p>

        {/* Form squares */}
        {recentForm.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
            {recentForm.map((r, i) => (
              <div
                key={i}
                style={{
                  width: 14, height: 14, borderRadius: 3,
                  background: formColors[r].bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, fontWeight: 700, color: formColors[r].letter,
                  lineHeight: 1,
                }}
              >
                {r}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
