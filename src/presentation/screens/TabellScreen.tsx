import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ClubBadge } from '../components/ClubBadge'
import { isRivalryMatch } from '../../domain/data/rivalries'
import { calculateStandings } from '../../domain/services/standingsService'
import { FormDots } from '../components/FormDots'
import { getFormResults } from '../utils/formUtils'

export function TabellScreen() {
  const game = useGameStore(s => s.game)
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tabell' | 'statistik' | 'cupen'>('tabell')

  if (!game) return null

  const standings = [...game.standings].sort((a, b) => a.position - b.position)
  const managedClubId = game.managedClubId

  // Calculate previous round standings for position movement arrows
  const completedLeague = (game.fixtures ?? []).filter(f => f.status === 'completed' && !f.isCup)
  const latestRound = completedLeague.reduce((max, f) => Math.max(max, f.roundNumber), 0)
  const prevRoundFixtures = completedLeague.filter(f => f.roundNumber < latestRound)
  const prevStandings = latestRound > 1
    ? calculateStandings(game.league?.teamIds ?? game.clubs.map(c => c.id), prevRoundFixtures as any)
    : []

  function clubName(clubId: string): string {
    return game!.clubs.find(c => c.id === clubId)?.shortName
      ?? game!.clubs.find(c => c.id === clubId)?.name
      ?? clubId
  }


  function getNextMeeting(clubId: string) {
    return (game!.fixtures ?? [])
      .filter(f =>
        f.status !== 'completed' &&
        ((f.homeClubId === managedClubId && f.awayClubId === clubId) ||
         (f.awayClubId === managedClubId && f.homeClubId === clubId))
      )
      .sort((a, b) => a.roundNumber - b.roundNumber)[0] ?? null
  }

  function getRowBorderColor(position: number): string {
    if (position <= 3) return 'var(--accent)'
    if (position <= 8) return 'rgba(196,122,58,0.4)'
    if (position <= 10) return 'transparent'
    return 'rgba(239,68,68,0.6)'
  }

  const myRow = standings.find(s => s.clubId === managedClubId)
  const leaderPoints = standings[0]?.points ?? 0
  const myPoints = myRow?.points ?? 0
  const myPos = myRow?.position ?? 0
  const ptToLeader = leaderPoints - myPoints

  return (
    <div style={{ padding: '0 12px', paddingTop: 8, overflowY: 'auto', height: '100%' }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, background: 'var(--bg-elevated)', borderRadius: 8, padding: 4 }}>
        {(['tabell', 'statistik', 'cupen'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 0',
              background: activeTab === tab ? 'var(--accent)' : 'transparent',
              color: activeTab === tab ? 'var(--text-light)' : 'var(--text-muted)',
              border: 'none', borderRadius: 6, outline: 'none',
              fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {tab === 'tabell' ? 'TABELL' : tab === 'statistik' ? 'STATISTIK' : 'CUPEN'}
          </button>
        ))}
      </div>

      {activeTab === 'statistik' && (() => {
        const allPlayers = game!.players.filter(p => p.seasonStats.gamesPlayed > 0)
        if (allPlayers.length === 0) return (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '32px 16px' }}>
            Statistiken fylls på efter första omgången.
          </p>
        )
        const topScorers = [...allPlayers].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals).slice(0, 5)
        const topAssisters = [...allPlayers].sort((a, b) => b.seasonStats.assists - a.seasonStats.assists).slice(0, 5)
        const topCornerGoals = [...allPlayers].sort((a, b) => b.seasonStats.cornerGoals - a.seasonStats.cornerGoals).slice(0, 5)
        const topRated = [...allPlayers].filter(p => p.seasonStats.gamesPlayed >= 3).sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating).slice(0, 5)
        const topPenaltyMin = [...allPlayers].sort((a, b) => (b.seasonStats.yellowCards * 5 + b.seasonStats.redCards * 10) - (a.seasonStats.yellowCards * 5 + a.seasonStats.redCards * 10)).slice(0, 5)

        function StatTable({ title, players, value, unit }: { title: string; players: typeof allPlayers; value: (p: typeof allPlayers[0]) => string | number; unit?: string }) {
          return (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{title}</p>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {players.map((p, i) => {
                  const club = game!.clubs.find(c => c.id === p.clubId)
                  const isManaged = p.clubId === game!.managedClubId
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 12px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                      background: isManaged ? 'rgba(196,122,58,0.06)' : 'transparent',
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 16, textAlign: 'right' }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: isManaged ? 700 : 500, color: isManaged ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {p.firstName} {p.lastName}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                          {club?.shortName ?? club?.name ?? '?'} · {p.age} år
                        </span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-dark)', fontFamily: 'var(--font-display)' }}>
                        {value(p)}{unit ? <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>{unit}</span> : null}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        return (
          <div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>Ligans toppskyttar, assistkungar och betyg.</p>
            <StatTable title="🏒 Toppskytt" players={topScorers} value={p => p.seasonStats.goals} unit=" mål" />
            <StatTable title="🎯 Flest assist" players={topAssisters} value={p => p.seasonStats.assists} unit=" ast" />
            <StatTable title="🔄 Flest hörnmål" players={topCornerGoals} value={p => p.seasonStats.cornerGoals} unit=" hörn" />
            <StatTable title="⭐ Bäst snittbetyg (min 3 matcher)" players={topRated} value={p => p.seasonStats.averageRating.toFixed(1)} />
            <StatTable title="⏱️ Flest utvisningsminuter" players={topPenaltyMin} value={p => p.seasonStats.yellowCards * 5 + p.seasonStats.redCards * 10} unit=" min" />
          </div>
        )
      })()}

      {activeTab === 'tabell' && (
      <>
      {/* Summary card for managed club */}
      {myRow && (
        <div className="card-sharp" style={{
          padding: '10px 14px',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700 }}>{myPos}. plats</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            {(() => {
              const hasPlayed = standings.some(s => s.played > 0)
              if (!hasPlayed) return <span style={{ color: 'var(--text-muted)' }}>Säsongen har inte börjat</span>
              if (myPos <= 8) return <span>I slutspelszonen</span>
              if (myPos <= 10) return <span>Utanför slutspel</span>
              return <span style={{ color: 'var(--danger)' }}>I nedflyttningszonen</span>
            })()}
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            {(() => {
              const hasPlayed = standings.some(s => s.played > 0)
              if (!hasPlayed) return null
              if (myPos === 1 && ptToLeader === 0) return <span style={{ color: 'var(--success)' }}>Serieledare</span>
              return <span>{ptToLeader}p till ledaren</span>
            })()}
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Aktuell tabell med form och målskillnad.</p>
        </div>
      )}

      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '24px 32px 1fr 22px 52px 32px 28px',
        gap: 4,
        padding: '6px 10px',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        color: 'var(--text-muted)',
        marginBottom: 4,
        background: 'linear-gradient(90deg, var(--bg-dark), var(--bg-dark-surface), var(--bg-dark))',
        borderRadius: 6,
      }}>
        <span>#</span>
        <span></span>
        <span>Lag</span>
        <span style={{ textAlign: 'center' }}>S</span>
        <span style={{ textAlign: 'center' }}>Form</span>
        <span style={{ textAlign: 'center' }}>MS</span>
        <span style={{ textAlign: 'right' }}>P</span>
      </div>

      <div className="card-stagger-1" style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        {standings.map((row, i) => {
          const isManaged = row.clubId === managedClubId
          const isTop3 = row.position <= 3
          const goalDiff = row.goalDifference >= 0
            ? `+${row.goalDifference}`
            : String(row.goalDifference)
          const lastPos = prevStandings.find(s => s.clubId === row.clubId)?.position
          const posDiff = lastPos != null ? lastPos - row.position : null
          const form = getFormResults(row.clubId, game.fixtures, game.clubs)

          return (
            <div key={row.clubId}>
              {/* Zone divider: after position 8 (top 8 to playoffs) */}
              {row.position === 9 && (
                <div style={{
                  padding: '5px 10px',
                  borderTop: '1px solid rgba(196,122,58,0.4)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'rgba(196,122,58,0.6)',
                  background: 'rgba(196,122,58,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span>━━</span><span>Slutspelsstrecket</span><span>━━</span>
                </div>
              )}

              {/* Zone divider: after position 10 */}
              {row.position === 11 && (
                <div style={{
                  padding: '5px 10px',
                  borderTop: '1px solid rgba(239,68,68,0.5)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'rgba(239,68,68,0.5)',
                  background: 'rgba(239,68,68,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span>━━</span><span>Nedflyttning</span><span>━━</span>
                </div>
              )}

              {/* Table row */}
              <div
                onClick={() => setExpandedClubId(prev => prev === row.clubId ? null : row.clubId)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 32px 1fr 22px 52px 32px 28px',
                  gap: 4,
                  padding: '7px 10px',
                  alignItems: 'center',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  borderLeft: `3px solid ${getRowBorderColor(row.position)}`,
                  background: isManaged
                    ? 'linear-gradient(90deg, rgba(196,122,58,0.12) 0%, rgba(196,122,58,0.04) 100%)'
                    : isTop3
                    ? 'rgba(196,122,58,0.05)'
                    : row.position >= 11
                    ? 'rgba(239,68,68,0.04)'
                    : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {/* Position */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isTop3 ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                    {row.position}
                  </span>
                  {posDiff !== null && posDiff !== 0 && (
                    <span style={{
                      fontSize: 9,
                      color: posDiff > 0 ? 'var(--success)' : 'var(--danger)',
                      lineHeight: 1,
                    }}>
                      {posDiff > 0 ? '▲' : '▼'}
                    </span>
                  )}
                </span>

                {/* Club badge */}
                <ClubBadge clubId={row.clubId} name={clubName(row.clubId)} size={24} />

                {/* Club name */}
                <span style={{
                  fontSize: 13,
                  fontWeight: isManaged ? 700 : 500,
                  color: isManaged ? 'var(--accent)' : 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {isManaged ? '★ ' : ''}{clubName(row.clubId)}{isRivalryMatch(row.clubId, managedClubId) ? ' 🔥' : ''}
                </span>

                {/* Played */}
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {row.played}
                </span>

                {/* Form dots */}
                <FormDots results={form} size={8} />

                {/* Goal diff */}
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: row.goalDifference > 0
                    ? 'var(--success)'
                    : row.goalDifference < 0
                    ? 'var(--danger)'
                    : 'var(--text-secondary)',
                }}>
                  {goalDiff}
                </span>

                {/* Points */}
                <span style={{
                  fontSize: 14,
                  fontWeight: 800,
                  textAlign: 'right',
                  color: isManaged ? 'var(--accent)' : 'var(--text-primary)',
                }}>
                  {row.points}
                </span>
              </div>

              {/* Expansion row */}
              {expandedClubId === row.clubId && (() => {
                if (row.clubId === managedClubId) {
                  // Own club: show season summary instead of h2h
                  return (
                    <div style={{
                      padding: '8px 10px 10px 59px',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      background: 'rgba(196,122,58,0.04)',
                      borderTop: '1px solid rgba(196,122,58,0.1)',
                      display: 'flex',
                      gap: 10,
                    }}>
                      <span>{row.wins}V {row.draws}O {row.losses}F</span>
                      <span style={{ color: 'var(--text-muted)' }}>·</span>
                      <span>Gjorda: {row.goalsFor} · Insläppta: {row.goalsAgainst}</span>
                    </div>
                  )
                }
                const fix = getNextMeeting(row.clubId)
                const isDerby = isRivalryMatch(row.clubId, managedClubId)
                const isHome = fix?.homeClubId === managedClubId

                const h2hFixtures = (game!.fixtures ?? []).filter(f =>
                  f.status === 'completed' &&
                  ((f.homeClubId === managedClubId && f.awayClubId === row.clubId) ||
                   (f.awayClubId === managedClubId && f.homeClubId === row.clubId))
                ).sort((a, b) => a.roundNumber - b.roundNumber)

                let h2hW = 0, h2hD = 0, h2hL = 0, h2hGF = 0, h2hGA = 0
                for (const f of h2hFixtures) {
                  const isH = f.homeClubId === managedClubId
                  const gf = isH ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
                  const ga = isH ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
                  h2hGF += gf; h2hGA += ga
                  if (gf > ga) h2hW++
                  else if (gf < ga) h2hL++
                  else h2hD++
                }

                const career = game!.rivalryHistory?.[row.clubId]

                return (
                  <div style={{
                    padding: '10px 10px 12px 59px',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    background: 'rgba(196,122,58,0.04)',
                    borderTop: '1px solid rgba(196,122,58,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}>
                    {fix ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Omgång {fix.roundNumber}</span>
                        <span>·</span>
                        <span>{isHome ? 'Hemma' : 'Borta'}</span>
                        {isDerby && <span>· 🔥 Derby</span>}
                      </div>
                    ) : (
                      <span>Inga fler möten denna säsong</span>
                    )}

                    {h2hFixtures.length > 0 && (
                      <div style={{ display: 'flex', gap: 10, fontSize: 11, flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)' }}>I år:</span>
                        {h2hFixtures.map(f => {
                          const isH = f.homeClubId === managedClubId
                          const gf = isH ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
                          const ga = isH ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
                          const col = gf > ga ? 'var(--success)' : gf < ga ? 'var(--danger)' : 'var(--accent)'
                          return (
                            <span key={f.id} style={{ color: col, fontWeight: 700 }}>
                              {gf}–{ga}
                            </span>
                          )
                        })}
                        <span style={{ color: 'var(--text-muted)' }}>({h2hW}V {h2hD}O {h2hL}F, {h2hGF}–{h2hGA})</span>
                      </div>
                    )}

                    {career && (career.wins + career.losses + career.draws) >= 2 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Totalt: {career.wins}V {career.draws}O {career.losses}F
                        {career.currentStreak !== 0 && (
                          <span style={{ color: career.currentStreak > 0 ? 'var(--success)' : 'var(--danger)', marginLeft: 6 }}>
                            · {Math.abs(career.currentStreak)} raka {career.currentStreak > 0 ? 'segrar' : 'förluster'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
        S = Spelade · MS = Målskillnad · P = Poäng · Form: ●grön=seger ●röd=förlust ●gul=oavgjort
      </p>
      </>
      )}

      {/* ── CUPEN ── */}
      {activeTab === 'cupen' && (() => {
        const bracket = game.cupBracket
        if (!bracket) return (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '32px 16px' }}>
            Cupen har inte startat ännu.
          </p>
        )

        const managedId = game.managedClubId
        const clubName = (id: string) => game.clubs.find(c => c.id === id)?.shortName ?? '?'
        const isManaged = (id: string) => id === managedId

        // Status
        const managedMatches = bracket.matches.filter(m => m.homeClubId === managedId || m.awayClubId === managedId)
        const managedWon = managedMatches.filter(m => m.winnerId === managedId)
        const managedLost = managedMatches.find(m => m.winnerId && m.winnerId !== managedId)
        const cupWinner = bracket.completed && bracket.winnerId === managedId

        const statusText = cupWinner ? '🏆 Cupvinnare!'
          : managedLost ? `Utslagen i ${['', 'förstarundan', 'kvartsfinalen', 'semifinalen', 'finalen'][managedLost.round] ?? 'cupen'}`
          : `Kvar i cupen · ${managedWon.length} matcher vunna`

        const statusColor = cupWinner ? 'var(--accent)' : managedLost ? 'var(--danger)' : 'var(--success)'

        // Rounds
        const roundNames: Record<number, string> = { 1: 'FÖRSTARUNDA', 2: 'KVARTSFINAL', 3: 'SEMIFINAL', 4: 'FINAL' }
        const rounds = [...new Set(bracket.matches.map(m => m.round))].sort((a, b) => b - a)

        // Next cup match
        const nextCupFixture = game.fixtures.find(f =>
          f.isCup && f.status === 'scheduled' &&
          (f.homeClubId === managedId || f.awayClubId === managedId)
        )

        return (
          <div>
            {/* Status */}
            <div className="card-sharp" style={{ padding: '14px 16px', marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: statusColor, fontFamily: 'var(--font-display)' }}>
                {statusText}
              </p>
            </div>

            {/* Dina cupmatcher */}
            {managedMatches.length > 0 && (
              <div className="card-sharp" style={{ padding: '14px 16px', marginBottom: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  DINA CUPMATCHER
                </p>
                {managedMatches.map(m => {
                  const home = clubName(m.homeClubId)
                  const away = clubName(m.awayClubId)
                  const won = m.winnerId === managedId
                  const played = m.winnerId !== null
                  return (
                    <div key={m.fixtureId ?? `${m.round}-${m.homeClubId}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80 }}>
                        {roundNames[m.round] ?? `Runda ${m.round}`}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>
                        {home} {played ? `${(game.fixtures.find(f => f.id === m.fixtureId)?.homeScore ?? 0)}–${(game.fixtures.find(f => f.id === m.fixtureId)?.awayScore ?? 0)}` : 'vs'} {away}
                      </span>
                      {played && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: won ? 'var(--success)' : 'var(--danger)' }}>
                          {won ? '✓ Vidare' : '✗ Utslagen'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Nästa cupmatch */}
            {nextCupFixture && (
              <div className="card-round" style={{ padding: '14px 16px', marginBottom: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                  NÄSTA CUPMATCH
                </p>
                <p style={{ fontSize: 13, fontWeight: 600 }}>
                  {clubName(nextCupFixture.homeClubId)} vs {clubName(nextCupFixture.awayClubId)}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {nextCupFixture.homeClubId === managedId ? 'Hemma' : 'Borta'} · Matchdag {nextCupFixture.matchday}
                </p>
              </div>
            )}

            {/* Full bracket */}
            {rounds.map(round => {
              const matches = bracket.matches.filter(m => m.round === round)
              return (
                <div key={round} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    {roundNames[round] ?? `RUNDA ${round}`}
                  </p>
                  <div className="card-sharp" style={{ overflow: 'hidden' }}>
                    {matches.map((m, i) => {
                      const home = clubName(m.homeClubId)
                      const away = clubName(m.awayClubId)
                      const played = m.winnerId !== null
                      const homeWon = m.winnerId === m.homeClubId
                      const awayWon = m.winnerId === m.awayClubId
                      const homeManaged = isManaged(m.homeClubId)
                      const awayManaged = isManaged(m.awayClubId)
                      return (
                        <div key={m.fixtureId ?? i} style={{
                          display: 'flex', alignItems: 'center', padding: '8px 12px',
                          borderBottom: i < matches.length - 1 ? '1px solid var(--border)' : 'none',
                          background: (homeManaged || awayManaged) ? 'rgba(196,122,58,0.04)' : undefined,
                        }}>
                          <span style={{
                            flex: 1, fontSize: 12,
                            fontWeight: homeWon ? 700 : played ? 400 : 500,
                            color: homeWon ? 'var(--text-primary)' : played ? 'var(--text-muted)' : 'var(--text-primary)',
                          }}>
                            {homeManaged ? '★ ' : ''}{home}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', minWidth: 40, textAlign: 'center' }}>
                            {played ? `${(game.fixtures.find(f => f.id === m.fixtureId)?.homeScore ?? 0)}–${(game.fixtures.find(f => f.id === m.fixtureId)?.awayScore ?? 0)}` : '–'}
                          </span>
                          <span style={{
                            flex: 1, fontSize: 12, textAlign: 'right',
                            fontWeight: awayWon ? 700 : played ? 400 : 500,
                            color: awayWon ? 'var(--text-primary)' : played ? 'var(--text-muted)' : 'var(--text-primary)',
                          }}>
                            {away}{awayManaged ? ' ★' : ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}
