import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { ScoutAssignment, ScoutReport } from '../../../domain/entities/Scouting'
import { getScoutReportAge } from '../../../domain/services/scoutingService'
import { positionShort } from '../../utils/formatters'
import { SectionLabel } from '../SectionLabel'

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

interface ActiveBidsListProps {
  game: SaveGame
  scoutReports: Record<string, ScoutReport>
  scoutBudget: number
  activeAssignment: ScoutAssignment | null
  windowOpen: boolean
  managedClub: { id: string; region?: string } | undefined
  spaningPosition: string
  spaningMaxAge: number
  spaningMaxSalary: number
  currentRound: number
  onSetSpanningPosition: (v: string) => void
  onSetSpanningMaxAge: (v: number) => void
  onSetSpanningMaxSalary: (v: number) => void
  onBid: (playerId: string) => void
  onScout: (player: Player) => void
  onStartTalentSearch: (position: string, maxAge: number, maxSalary: number, currentRound: number) => { success: boolean; error?: string }
  onScoutMessage: (msg: string | null) => void
}

export function ActiveBidsList({
  game,
  scoutReports,
  scoutBudget,
  activeAssignment,
  windowOpen,
  managedClub,
  spaningPosition,
  spaningMaxAge,
  spaningMaxSalary,
  currentRound,
  onSetSpanningPosition,
  onSetSpanningMaxAge,
  onSetSpanningMaxSalary,
  onBid,
  onScout,
  onStartTalentSearch,
  onScoutMessage,
}: ActiveBidsListProps) {
  const scoutablePlayers = game.players
    .filter(p => p.clubId !== game.managedClubId)
    .sort((a, b) => {
      const aScout = !!scoutReports[a.id]
      const bScout = !!scoutReports[b.id]
      if (aScout !== bScout) return aScout ? 1 : -1
      return b.currentAbility - a.currentAbility
    })

  return (
    <>
      {/* Scoutable players */}
      <div className="card-stagger-2" style={{ marginBottom: 24 }}>
        <SectionLabel right={
          <span style={{ fontSize: 12, color: scoutBudget > 3 ? 'var(--text-secondary)' : 'var(--danger)', fontWeight: 600 }}>
            Scoutbudget: {scoutBudget} kvar
          </span>
        }>Scouting — andra lag</SectionLabel>
        <div className="card-round" style={{ overflow: 'hidden' }}>
          {scoutablePlayers.slice(0, 30).map((player, index) => {
            const report = scoutReports[player.id]
            const reportAge = report ? getScoutReportAge(report, game.currentSeason, report.scoutedSeason) : null
            const isStale = reportAge === 'stale'
            const isScounted = !!report && !isStale
            const club = game.clubs.find(c => c.id === player.clubId)
            const canScout = !activeAssignment && scoutBudget > 0 && !isScounted
            return (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderBottom: index < Math.min(scoutablePlayers.length, 30) - 1 ? '1px solid var(--border)' : 'none',
                  gap: 10,
                  opacity: isScounted ? 0.8 : 1,
                  background: isScounted ? 'rgba(196,122,58,0.04)' : undefined,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.firstName} {player.lastName}
                    {isScounted && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)' }}>🔍</span>}
                    {isStale && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--danger)', fontWeight: 400 }}>Föråldrad</span>}
                    {reportAge === 'aging' && !isStale && (
                      <span className="tag tag-outline" style={{ marginLeft: 6, color: 'var(--warning)' }}>1 säsong sedan</span>
                    )}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                    {positionShort(player.position)} · {player.age} år · {club?.name ?? '?'} · {formatValue(player.marketValue)} ·{' '}
                    {isScounted
                      ? <span>Styrka ~{report!.estimatedCA}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>Styrka ?</span>
                    }
                  </p>
                  {isScounted && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>{report!.notes}</p>
                  )}
                </div>
                {isScounted && windowOpen && (
                  <button
                    onClick={() => onBid(player.id)}
                    className="btn btn-outline"
                    style={{ flexShrink: 0, padding: '5px 10px', fontSize: 12, fontWeight: 600, marginLeft: 4 }}
                  >
                    💰 Bud
                  </button>
                )}
                {!isScounted && (
                  <button
                    onClick={() => canScout && onScout(player)}
                    disabled={!canScout}
                    className={`btn ${canScout ? 'btn-outline' : 'btn-ghost'}`}
                    style={{ flexShrink: 0, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: canScout ? 'pointer' : 'not-allowed', opacity: canScout ? 1 : 0.5 }}
                  >
                    {activeAssignment ? '⏳ Scout upptagen' : scoutBudget <= 0 ? '❌ Ingen budget' : '🔍 Utvärdera'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Scout reports */}
      {Object.keys(scoutReports).length > 0 && (() => {
        const reportEntries = Object.values(scoutReports)
        return (
          <div className="card-stagger-3" style={{ marginBottom: 24 }}>
            <SectionLabel>Scoutrapporter ({reportEntries.length})</SectionLabel>
            <div className="card-round" style={{ overflow: 'hidden' }}>
              {reportEntries.map((report, index) => {
                const reportPlayer = game.players.find(p => p.id === report.playerId)
                const reportClub = game.clubs.find(c => c.id === report.clubId)
                const age = getScoutReportAge(report, game.currentSeason, report.scoutedSeason)
                const freshnessLabel = age === 'fresh' ? 'Färsk' : age === 'aging' ? 'Gammal' : 'Inaktuell'
                const freshnessColor = age === 'fresh' ? 'var(--success)' : age === 'aging' ? 'var(--warning)' : 'var(--danger)'
                const caRange = Math.round((100 - report.accuracy) / 10)
                return (
                  <div
                    key={report.playerId}
                    style={{
                      padding: '10px 14px',
                      borderBottom: index < reportEntries.length - 1 ? '1px solid var(--border)' : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {reportPlayer ? `${reportPlayer.firstName} ${reportPlayer.lastName}` : report.playerId}
                        </p>
                        <span style={{ fontSize: 11, fontWeight: 600, color: freshnessColor, flexShrink: 0 }}>
                          {freshnessLabel}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                        {reportPlayer ? positionShort(reportPlayer.position) + ' · ' : ''}{reportClub?.name ?? '?'} · Säsong {report.scoutedSeason}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                        Styrka ~{report.estimatedCA} ± {caRange} · Potential ~{report.estimatedPA}
                      </p>
                      {report.notes && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{report.notes}</p>
                      )}
                      {report.attributeProfile && (
                        <div style={{ marginTop: 8 }}>
                          {([
                            { label: 'Offensiv', value: report.attributeProfile.offensive },
                            { label: 'Defensiv', value: report.attributeProfile.defensive },
                            { label: 'Fysisk', value: report.attributeProfile.physical },
                            { label: 'Mental', value: report.attributeProfile.mental },
                          ] as const).map(({ label, value }) => (
                            <div key={label} style={{ marginBottom: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{value}</span>
                              </div>
                              <div style={{ background: 'var(--border)', borderRadius: 4, height: 4 }}>
                                <div style={{ background: 'var(--accent)', borderRadius: 4, height: 4, width: `${value}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {windowOpen && reportPlayer && managedClub && (
                      <button
                        onClick={() => onBid(report.playerId)}
                        className="btn btn-outline"
                        style={{ flexShrink: 0, padding: '5px 10px', fontSize: 12, fontWeight: 600 }}
                      >
                        Lägg bud
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Talent search (Spaning) */}
      <div className="card-stagger-2" style={{ marginBottom: 24 }}>
        <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            🔎 <strong style={{ color: 'var(--text-primary)' }}>Spaning</strong> skickar ut din scout för att hitta okända spelare som matchar dina kriterier. Tar 2 omgångar. Skiljer sig från <em>Scouting</em> som utvärderar kända spelare.
          </p>
        </div>

        {game.activeScoutAssignment && (
          <div className="card-sharp" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>
            Scouten är upptagen med en utvärdering. Klar om {game.activeScoutAssignment.roundsRemaining} omgång{game.activeScoutAssignment.roundsRemaining !== 1 ? 'ar' : ''}.
          </div>
        )}

        {game.activeTalentSearch && (
          <div className="card-sharp" style={{ background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.25)', padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            🔍 Scout ute och letar... {game.activeTalentSearch.roundsRemaining} omgång{game.activeTalentSearch.roundsRemaining !== 1 ? 'ar' : ''} kvar
          </div>
        )}

        {!game.activeTalentSearch && (
          <div className="card-round" style={{ padding: '16px', marginBottom: 16 }}>
            <SectionLabel>Ny talangspaning</SectionLabel>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Position</label>
              <select
                value={spaningPosition}
                onChange={e => onSetSpanningPosition(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14 }}
              >
                <option value="any">Alla positioner</option>
                <option value="forward">Anfallare</option>
                <option value="midfielder">Mittfältare</option>
                <option value="half">Ytterhalv</option>
                <option value="defender">Back</option>
                <option value="goalkeeper">Målvakt</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Max ålder</label>
              <select
                value={spaningMaxAge}
                onChange={e => onSetSpanningMaxAge(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14 }}
              >
                <option value={21}>21 år</option>
                <option value={25}>25 år</option>
                <option value={30}>30 år</option>
                <option value={40}>Alla åldrar</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Max lön (kr/mån)</label>
              <select
                value={spaningMaxSalary}
                onChange={e => onSetSpanningMaxSalary(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14 }}
              >
                <option value={8000}>8 000 kr</option>
                <option value={12000}>12 000 kr</option>
                <option value={16000}>16 000 kr</option>
                <option value={25000}>25 000 kr</option>
              </select>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Kostar 2 scoutbudget · kvar: {scoutBudget}</p>
            <button
              onClick={() => {
                const result = onStartTalentSearch(spaningPosition, spaningMaxAge, spaningMaxSalary, currentRound)
                if (result.success) {
                  onScoutMessage('Spaning igång! Rapport om 2 omgångar.')
                  setTimeout(() => onScoutMessage(null), 4000)
                } else {
                  onScoutMessage(result.error ?? 'Kunde inte starta spaning.')
                  setTimeout(() => onScoutMessage(null), 3000)
                }
              }}
              disabled={scoutBudget < 2}
              className={`btn ${scoutBudget >= 2 ? 'btn-copper' : 'btn-ghost'}`}
              style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 600, cursor: scoutBudget >= 2 ? 'pointer' : 'not-allowed', opacity: scoutBudget >= 2 ? 1 : 0.5 }}
            >
              Starta spaning
            </button>
          </div>
        )}

        {game.talentSearchResults && game.talentSearchResults.length > 0 && (() => {
          const latestResult = game.talentSearchResults[game.talentSearchResults.length - 1]
          return (
            <div>
              <SectionLabel>Senaste spaningsrapport</SectionLabel>
              <div className="card-round" style={{ overflow: 'hidden' }}>
                {latestResult.players.map((suggestion, index) => {
                  const player = game.players.find(p => p.id === suggestion.playerId)
                  const club = player ? game.clubs.find(c => c.id === player.clubId) : null
                  const report = player ? (game.scoutReports ?? {})[player.id] : null
                  const isAlreadyScouted = !!report
                  return (
                    <div key={suggestion.playerId} style={{ padding: '10px 14px', borderBottom: index < latestResult.players.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 10, borderLeft: isAlreadyScouted ? '3px solid var(--accent)' : '3px solid transparent' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 2 }}>
                          {player ? `${player.firstName} ${player.lastName}` : suggestion.playerId}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                          {player ? positionShort(player.position) + ' · ' : ''}{club?.name ?? '?'} · {player ? `${player.age} år` : ''} · Styrka ~{suggestion.estimatedCA}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{suggestion.scoutNotes}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignItems: 'flex-end' }}>
                        {isAlreadyScouted && <span className="tag tag-copper">Scoutad</span>}
                        {player && !isAlreadyScouted && (
                          <button
                            onClick={() => player && onScout(player)}
                            disabled={!!activeAssignment || scoutBudget <= 0}
                            className={`btn ${(!activeAssignment && scoutBudget > 0) ? 'btn-outline' : 'btn-ghost'}`}
                            style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: (!activeAssignment && scoutBudget > 0) ? 'pointer' : 'not-allowed', opacity: (!activeAssignment && scoutBudget > 0) ? 1 : 0.5 }}
                          >
                            {activeAssignment ? '⏳ Scout upptagen' : scoutBudget <= 0 ? '❌ Ingen budget' : '🔍 Utvärdera'}
                          </button>
                        )}
                        {windowOpen && player && managedClub && (
                          <button
                            onClick={() => onBid(suggestion.playerId)}
                            className="btn btn-outline"
                            style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600 }}
                          >
                            Lägg bud
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </div>
    </>
  )
}

