import type { Fixture } from '../../../domain/entities/Fixture'
import { FormSquares } from '../FormDots'
import type { FormResult } from '../../utils/formUtils'

interface LastResultCardProps {
  lastResult: { scoreFor: number; scoreAgainst: number; opponentName: string }
  lastCompletedFixture: Fixture | null
  managedClubId: string
  recentForm: FormResult[]
  onNavigateToReport: () => void
}

export function LastResultCard({
  lastResult,
  lastCompletedFixture,
  managedClubId,
  recentForm,
  onNavigateToReport,
}: LastResultCardProps) {
  const isWin = lastResult.scoreFor > lastResult.scoreAgainst
  const isLoss = lastResult.scoreFor < lastResult.scoreAgainst

  const f = lastCompletedFixture
  const isHome = f ? f.homeClubId === managedClubId : false
  const penaltyWon = f?.wentToPenalties && f.penaltyResult
    ? (isHome ? f.penaltyResult.home > f.penaltyResult.away : f.penaltyResult.away > f.penaltyResult.home)
    : null
  const overtimeWon = f?.wentToOvertime && !f.wentToPenalties && f.overtimeResult
    ? f.overtimeResult === (isHome ? 'home' : 'away')
    : null

  const actualWin = isWin || penaltyWon === true || overtimeWon === true
  const actualLoss = isLoss || penaltyWon === false || overtimeWon === false

  let resultText = 'oavgjort'
  if (actualWin) {
    resultText = f?.wentToPenalties ? 'vinst på straffar'
      : f?.wentToOvertime ? 'vinst på övertid'
      : 'vinst'
  } else if (actualLoss) {
    resultText = f?.wentToPenalties ? 'förlust på straffar'
      : f?.wentToOvertime ? 'förlust på övertid'
      : 'förlust'
  }

  return (
    <div
      className="card-sharp card-stagger-2"
      style={{ flex: 1, cursor: 'pointer', overflow: 'hidden' }}
      onClick={onNavigateToReport}
    >
      <div style={{ padding: '12px 12px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            🏒 Senast
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

        {f?.wentToPenalties && f.penaltyResult && (
          <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginTop: 2, fontFamily: 'var(--font-body)' }}>
            str. {f.penaltyResult.home}-{f.penaltyResult.away}
          </p>
        )}
        {f?.wentToOvertime && !f.wentToPenalties && (
          <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginTop: 2, fontFamily: 'var(--font-body)' }}>
            förlängning
          </p>
        )}

        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '3px 0 0', fontFamily: 'var(--font-body)' }}>
          {resultText} mot {lastResult.opponentName}
        </p>
        <p style={{ fontSize: 10, color: actualWin ? 'var(--success)' : actualLoss ? 'var(--danger)' : 'var(--text-muted)', marginTop: 3, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
          {(() => {
            const diff = lastResult.scoreFor - lastResult.scoreAgainst
            if (diff >= 4) return '🎉 Storstilat!'
            if (diff >= 2) return '😊 Kontrollerad seger'
            if (diff === 1 || penaltyWon || overtimeWon) return '😅 Tight vinst'
            if (diff === 0) return '😐 Poängdelning'
            if (diff === -1 || penaltyWon === false || overtimeWon === false) return '😤 Nära men inte nog'
            if (diff >= -3) return '😞 Tungt'
            return '💀 En kväll att glömma'
          })()}
        </p>

        {/* Form squares */}
        {recentForm.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <FormSquares results={recentForm} size={14} />
          </div>
        )}
      </div>
    </div>
  )
}
