import { useNavigate, useLocation } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { Fixture } from '../../domain/entities/Fixture'
import { getRivalry } from '../../domain/data/rivalries'
import { MatchEventType } from '../../domain/enums'

interface SimSummaryState {
  simulatedFixtures: Fixture[]
  positionBefore: number
  positionAfter: number
  pointsBefore: number
  pointsAfter: number
}

const LABEL: React.CSSProperties = {
  fontSize: 8, fontWeight: 600, letterSpacing: '2px',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  fontFamily: 'var(--font-body)', margin: 0,
}

function ordinal(n: number): string {
  return `${n}:a`
}

export function SimSummaryScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const game = useGameStore(s => s.game)

  const state = location.state as SimSummaryState | undefined

  if (!state || !Array.isArray(state.simulatedFixtures) || !game) {
    navigate('/game/dashboard', { replace: true })
    return null
  }

  const { simulatedFixtures, positionBefore, positionAfter, pointsBefore, pointsAfter } = state
  const managedClubId = game!.managedClubId
  const pointsGained = pointsAfter - pointsBefore
  const positionDelta = positionBefore - positionAfter // positive = improved
  const positionImproved = positionDelta > 0
  const positionWorse = positionDelta < 0

  const sorted = [...simulatedFixtures].sort((a, b) => a.matchday - b.matchday)

  // Compute per-fixture outcome from managed club perspective
  function getOutcome(f: Fixture): 'W' | 'D' | 'L' {
    const isHome = f.homeClubId === managedClubId
    const scoreFor = isHome ? f.homeScore : f.awayScore
    const scoreAgainst = isHome ? f.awayScore : f.homeScore
    if (scoreFor > scoreAgainst) return 'W'
    if (scoreFor < scoreAgainst) return 'L'
    return 'D'
  }

  function getScoreFor(f: Fixture): number {
    return f.homeClubId === managedClubId ? f.homeScore : f.awayScore
  }

  function getScoreAgainst(f: Fixture): number {
    return f.homeClubId === managedClubId ? f.awayScore : f.homeScore
  }

  function getOpponent(f: Fixture) {
    const oppId = f.homeClubId === managedClubId ? f.awayClubId : f.homeClubId
    return game!.clubs.find(c => c.id === oppId) ?? null
  }

  // Highlights
  let biggestWin: { fixture: Fixture; margin: number } | null = null
  let worstLoss: { fixture: Fixture; margin: number } | null = null
  const derbyResults: Fixture[] = []

  for (const f of sorted) {
    const margin = getScoreFor(f) - getScoreAgainst(f)
    if (margin >= 3) {
      if (!biggestWin || margin > biggestWin.margin) biggestWin = { fixture: f, margin }
    }
    if (margin <= -3) {
      if (!worstLoss || margin < worstLoss.margin) worstLoss = { fixture: f, margin }
    }
    if (getRivalry(f.homeClubId, f.awayClubId)) {
      derbyResults.push(f)
    }
  }

  // Top scorer in this period
  const scorerMap: Record<string, { goals: number; firstName: string; lastName: string }> = {}
  for (const f of sorted) {
    for (const ev of f.events ?? []) {
      if (ev.type === MatchEventType.Goal && ev.clubId === managedClubId && ev.playerId) {
        const player = game!.players.find(p => p.id === ev.playerId)
        if (player) {
          if (!scorerMap[ev.playerId]) {
            scorerMap[ev.playerId] = { goals: 0, firstName: player.firstName, lastName: player.lastName }
          }
          scorerMap[ev.playerId].goals++
        }
      }
    }
  }

  const topScorer = Object.values(scorerMap).sort((a, b) => b.goals - a.goals)[0] ?? null

  const hasHighlights = biggestWin || worstLoss || derbyResults.length > 0 || (topScorer && topScorer.goals >= 2)

  return (
    <div className="screen-enter" style={{ position: 'relative', minHeight: '100%', background: 'var(--bg)' }}>
      <div style={{ paddingTop: 12, paddingBottom: 'var(--scroll-padding-bottom)', display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* ── Header ── */}
        <div className="card-sharp" style={{ padding: '10px 14px' }}>
          <p style={{ ...LABEL, marginBottom: 6 }}>⏩ SIMULERINGSRESULTAT</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: '0 0 2px' }}>
            {sorted.length} matcher simulerade
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            {/* Position */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...LABEL }}>Placering</span>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                {ordinal(positionBefore)}
                {' '}→{' '}
                <span style={{ color: positionImproved ? 'var(--success)' : positionWorse ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600 }}>
                  {ordinal(positionAfter)}
                </span>
                {positionImproved && <span style={{ color: 'var(--success)', marginLeft: 4 }}>↑</span>}
                {positionWorse && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>↓</span>}
              </span>
            </div>

            {/* Points gained */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...LABEL }}>Poäng under perioden</span>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                <span style={{ color: pointsGained > 0 ? 'var(--success)' : pointsGained < 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600 }}>
                  {pointsGained >= 0 ? '+' : ''}{pointsGained} poäng
                </span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 11 }}>
                  (totalt {pointsAfter} p)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Results list ── */}
        {sorted.length > 0 && (
          <div className="card-sharp" style={{ padding: '10px 14px' }}>
            <p style={{ ...LABEL, marginBottom: 8 }}>MATCHRESULTAT</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sorted.map(f => {
                const outcome = getOutcome(f)
                const scoreFor = getScoreFor(f)
                const scoreAgainst = getScoreAgainst(f)
                const opp = getOpponent(f)
                const isHome = f.homeClubId === managedClubId
                const isDerby = !!getRivalry(f.homeClubId, f.awayClubId)
                const pillColor = outcome === 'W' ? 'var(--success)' : outcome === 'L' ? 'var(--danger)' : 'var(--text-muted)'
                const pillBg = outcome === 'W' ? 'rgba(34,197,94,0.12)' : outcome === 'L' ? 'rgba(239,68,68,0.12)' : 'var(--bg-elevated)'

                return (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 4,
                    background: 'var(--bg-elevated)',
                    fontSize: 12, fontFamily: 'var(--font-body)',
                  }}>
                    {/* Round */}
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, minWidth: 28, flexShrink: 0 }}>
                      {f.isCup ? 'Cup' : `R${f.roundNumber}`}
                    </span>

                    {/* Opponent + home/away */}
                    <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opp?.shortName ?? opp?.name ?? '?'}
                      <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 4 }}>
                        {isHome ? '(H)' : '(B)'}
                      </span>
                      {isDerby && <span style={{ marginLeft: 4 }}>⚔️</span>}
                    </span>

                    {/* Score */}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, minWidth: 36, textAlign: 'center' }}>
                      {scoreFor}–{scoreAgainst}
                    </span>

                    {/* W/D/L pill */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: pillColor,
                      background: pillBg,
                      padding: '2px 6px', borderRadius: 3, minWidth: 20, textAlign: 'center',
                    }}>
                      {outcome}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Highlights ── */}
        {hasHighlights && (
          <div className="card-sharp" style={{ padding: '10px 14px' }}>
            <p style={{ ...LABEL, marginBottom: 8 }}>HÖJDPUNKTER</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

              {biggestWin && (() => {
                const opp = getOpponent(biggestWin.fixture)
                return (
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                    💥 <strong>Stor seger:</strong> {getScoreFor(biggestWin.fixture)}–{getScoreAgainst(biggestWin.fixture)} mot {opp?.shortName ?? opp?.name ?? '?'}
                  </div>
                )
              })()}

              {derbyResults.map(f => {
                const opp = getOpponent(f)
                const rivalry = getRivalry(f.homeClubId, f.awayClubId)
                return (
                  <div key={`derby-${f.id}`} style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                    ⚔️ <strong>Derby mot {opp?.shortName ?? opp?.name ?? '?'}:</strong> {getScoreFor(f)}–{getScoreAgainst(f)}
                    {rivalry && <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 10 }}>({rivalry.name})</span>}
                  </div>
                )
              })}

              {worstLoss && (() => {
                const opp = getOpponent(worstLoss.fixture)
                return (
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                    😔 <strong>Tung förlust:</strong> {getScoreFor(worstLoss.fixture)}–{getScoreAgainst(worstLoss.fixture)} mot {opp?.shortName ?? opp?.name ?? '?'}
                  </div>
                )
              })()}

              {topScorer && topScorer.goals >= 2 && (
                <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                  🏒 <strong>{topScorer.firstName} {topScorer.lastName}</strong> — {topScorer.goals} mål under perioden
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Continue button ── */}
        <div style={{ padding: '4px 0' }}>
          <button
            onClick={() => navigate('/game/dashboard', { replace: true })}
            style={{
              width: '100%', padding: '13px 0',
              background: 'var(--accent)', color: 'var(--bg)',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 14, fontWeight: 700, letterSpacing: '1px',
              fontFamily: 'var(--font-display)',
            }}
          >
            Tillbaka till dashboard →
          </button>
        </div>

      </div>
    </div>
  )
}
