import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { ScoutAssignment, ScoutReport } from '../../../domain/entities/Scouting'
import { PlayerPosition } from '../../../domain/enums'
import { getScoutReportAge } from '../../../domain/services/scoutingService'
import { positionShort, positionLong, formatValue } from '../../utils/formatters'
import { SectionLabel } from '../SectionLabel'

const POSITION_GROUPS: PlayerPosition[] = [
  PlayerPosition.Goalkeeper,
  PlayerPosition.Defender,
  PlayerPosition.Half,
  PlayerPosition.Midfielder,
  PlayerPosition.Forward,
]

const GROUP_CAP = 8

interface ScoutingTabProps {
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

export function ScoutingTab({
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
}: ScoutingTabProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<PlayerPosition>>(new Set())

  const scoutablePlayers = game.players
    .filter(p => p.clubId !== game.managedClubId)
    .sort((a, b) => {
      const aScout = !!scoutReports[a.id]
      const bScout = !!scoutReports[b.id]
      if (aScout !== bScout) return aScout ? 1 : -1
      return b.currentAbility - a.currentAbility
    })

  // Pre-compute scout cost per player (same logic as handleScout in TransfersScreen)
  function scoutCost(player: Player): 'direkt' | '1 omgång' {
    const targetClub = game.clubs.find(c => c.id === player.clubId)
    const sameRegion = !!managedClub && !!targetClub && managedClub.region === targetClub.region
    const hasPlayedAgainst = game.fixtures.some(f =>
      f.status === 'completed' &&
      ((f.homeClubId === game.managedClubId && f.awayClubId === player.clubId) ||
       (f.awayClubId === game.managedClubId && f.homeClubId === player.clubId))
    )
    return sameRegion || hasPlayedAgainst ? 'direkt' : '1 omgång'
  }

  return (
    <>
      {/* ── 1. Talangspaning — söker okända spelare ── */}
      <div className="card-stagger-1" style={{ marginBottom: 24 }}>
        <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 12 }}>
          <p className="transfers-spaning-info">
            <strong style={{ color: 'var(--text-primary)' }}>Spaning</strong> skickar ut din scout för att hitta okända spelare som matchar dina kriterier. Tar 2 omgångar. Skiljer sig från <em>Scouting</em> som utvärderar kända spelare.
          </p>
        </div>

        {game.activeScoutAssignment && (
          <div className="card-sharp transfers-state-danger" style={{ padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>
            Scouten är upptagen med en utvärdering. Klar om {game.activeScoutAssignment.roundsRemaining} omgång{game.activeScoutAssignment.roundsRemaining !== 1 ? 'ar' : ''}.
          </div>
        )}

        {game.activeTalentSearch && (
          <div className="card-sharp transfers-state-copper" style={{ padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            Scout ute och letar... {game.activeTalentSearch.roundsRemaining} omgång{game.activeTalentSearch.roundsRemaining !== 1 ? 'ar' : ''} kvar
          </div>
        )}

        {!game.activeTalentSearch && (
          <div className="card-sharp" style={{ padding: '16px', marginBottom: 16 }}>
            <SectionLabel>Ny talangspaning</SectionLabel>
            <div style={{ marginBottom: 12 }}>
              <label className="transfers-label">Position</label>
              <select
                value={spaningPosition}
                onChange={e => onSetSpanningPosition(e.target.value)}
                className="transfers-select"
              >
                <option value="any">Alla positioner</option>
                {[...POSITION_GROUPS].reverse().map(pos => (
                  <option key={pos} value={pos}>{positionLong(pos)}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="transfers-label">Max ålder</label>
              <select
                value={spaningMaxAge}
                onChange={e => onSetSpanningMaxAge(Number(e.target.value))}
                className="transfers-select"
              >
                <option value={21}>21 år</option>
                <option value={25}>25 år</option>
                <option value={30}>30 år</option>
                <option value={40}>Alla åldrar</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="transfers-label">Max lön (kr/mån)</label>
              <select
                value={spaningMaxSalary}
                onChange={e => onSetSpanningMaxSalary(Number(e.target.value))}
                className="transfers-select"
              >
                <option value={8000}>8 000 kr</option>
                <option value={12000}>12 000 kr</option>
                <option value={16000}>16 000 kr</option>
                <option value={25000}>25 000 kr</option>
              </select>
            </div>
            <p className="transfers-spaning-footer">Kostar 2 scoutbudget · kvar: {scoutBudget}</p>
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
              className={`btn ${scoutBudget >= 2 ? 'btn-copper' : 'btn-ghost'} transfers-spaning-cta`}
              style={{ cursor: scoutBudget >= 2 ? 'pointer' : 'not-allowed', opacity: scoutBudget >= 2 ? 1 : 0.5 }}
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
              <div className="card-sharp" style={{ overflow: 'hidden' }}>
                {latestResult.players.map((suggestion, index) => {
                  const player = game.players.find(p => p.id === suggestion.playerId)
                  const club = player ? game.clubs.find(c => c.id === player.clubId) : null
                  const report = player ? (game.scoutReports ?? {})[player.id] : null
                  const isAlreadyScouted = !!report
                  return (
                    <div key={suggestion.playerId} className="transfers-talent-row" style={{ borderBottom: index < latestResult.players.length - 1 ? '1px solid var(--border)' : 'none', borderLeft: isAlreadyScouted ? '3px solid var(--accent)' : '3px solid transparent' }}>
                      <div className="transfers-list-content">
                        <p className="transfers-talent-name">
                          {player ? `${player.firstName} ${player.lastName}` : suggestion.playerId}
                        </p>
                        <p className="transfers-talent-meta">
                          {player ? positionShort(player.position) + ' · ' : ''}{club?.name ?? '?'} · {player ? `${player.age} år` : ''} · Styrka ~{suggestion.estimatedCA}
                        </p>
                        <p className="transfers-talent-notes">{suggestion.scoutNotes}</p>
                      </div>
                      <div className="transfers-talent-actions">
                        {isAlreadyScouted && <span className="tag tag-copper">Scoutad</span>}
                        {player && !isAlreadyScouted && (
                          <button
                            onClick={() => player && onScout(player)}
                            disabled={!!activeAssignment || scoutBudget <= 0}
                            className={`btn ${(!activeAssignment && scoutBudget > 0) ? 'btn-outline' : 'btn-ghost'}`}
                            style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: (!activeAssignment && scoutBudget > 0) ? 'pointer' : 'not-allowed', opacity: (!activeAssignment && scoutBudget > 0) ? 1 : 0.5 }}
                          >
                            {activeAssignment ? 'Scout upptagen' : scoutBudget <= 0 ? 'Ingen budget' : 'Utvärdera'}
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

      {/* ── 2. Scoutrapporter ── */}
      {Object.keys(scoutReports).length > 0 && (() => {
        const reportEntries = Object.values(scoutReports)
        return (
          <div className="card-stagger-2" style={{ marginBottom: 24 }}>
            <SectionLabel>Scoutrapporter ({reportEntries.length})</SectionLabel>
            <div className="card-sharp" style={{ overflow: 'hidden' }}>
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
                    className="transfers-report-row"
                    style={{ borderBottom: index < reportEntries.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="transfers-list-content">
                      <div className="transfers-report-header">
                        <p className="transfers-report-name">
                          {reportPlayer ? `${reportPlayer.firstName} ${reportPlayer.lastName}` : report.playerId}
                        </p>
                        <span style={{ fontSize: 11, fontWeight: 600, color: freshnessColor, flexShrink: 0 }}>
                          {freshnessLabel}
                        </span>
                      </div>
                      <p className="transfers-report-meta">
                        {reportPlayer ? positionShort(reportPlayer.position) + ' · ' : ''}{reportClub?.name ?? '?'} · Säsong {report.scoutedSeason}
                      </p>
                      <p className="transfers-report-meta">
                        Styrka ~{report.estimatedCA} ± {caRange} · Potential ~{report.estimatedPA}
                      </p>
                      {report.notes && (
                        <p className="transfers-report-notes">{report.notes}</p>
                      )}
                      {report.attributeProfile && (
                        <div style={{ marginTop: 8 }}>
                          {([
                            { label: 'Offensiv', value: report.attributeProfile.offensive },
                            { label: 'Defensiv', value: report.attributeProfile.defensive },
                            { label: 'Fysisk', value: report.attributeProfile.physical },
                            { label: 'Mental', value: report.attributeProfile.mental },
                          ] as const).map(({ label, value }) => (
                            <div key={label} className="transfers-attr-row">
                              <div className="transfers-attr-label-row">
                                <span className="transfers-attr-label">{label}</span>
                                <span className="transfers-attr-value">{value}</span>
                              </div>
                              <div className="transfers-attr-bar-bg">
                                <div className="transfers-attr-bar-fill" style={{ width: `${value}%` }} />
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

      {/* ── 3. Spelare att utvärdera — grupperat per position ── */}
      <div className="card-stagger-3" style={{ marginBottom: 24 }}>
        <SectionLabel right={
          <span style={{ fontSize: 12, color: scoutBudget > 3 ? 'var(--text-secondary)' : 'var(--danger)', fontWeight: 600 }}>
            Budget: {scoutBudget} kvar
          </span>
        }>Spelare att utvärdera</SectionLabel>

        {POSITION_GROUPS.map(pos => {
          const groupPlayers = scoutablePlayers.filter(p => p.position === pos)
          if (groupPlayers.length === 0) return null
          const isExpanded = expandedGroups.has(pos)
          const visible = isExpanded ? groupPlayers : groupPlayers.slice(0, GROUP_CAP)
          const hidden = groupPlayers.length - GROUP_CAP

          return (
            <div key={pos} style={{ marginBottom: 16 }}>
              <SectionLabel>{positionLong(pos)}</SectionLabel>
              <div className="card-sharp" style={{ overflow: 'hidden' }}>
                {visible.map((player, index) => {
                  const report = scoutReports[player.id]
                  const reportAge = report ? getScoutReportAge(report, game.currentSeason, report.scoutedSeason) : null
                  const isStale = reportAge === 'stale'
                  const isScouted = !!report && !isStale
                  const club = game.clubs.find(c => c.id === player.clubId)
                  const canScout = !activeAssignment && scoutBudget > 0 && !isScouted
                  const cost = !isScouted ? scoutCost(player) : null
                  return (
                    <div
                      key={player.id}
                      className={`transfers-list-row-lg${isScouted ? ' transfers-state-scouted-bg' : ''}`}
                      style={{
                        borderBottom: index < visible.length - 1 ? '1px solid var(--border)' : 'none',
                        opacity: isScouted ? 0.8 : 1,
                      }}
                    >
                      <div className="transfers-list-content">
                        <p className="transfers-list-name-lg">
                          {player.firstName} {player.lastName}
                          {isStale && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--danger)', fontWeight: 400 }}>Föråldrad</span>}
                          {reportAge === 'aging' && !isStale && (
                            <span className="tag tag-outline" style={{ marginLeft: 6, color: 'var(--warning)' }}>1 säsong sedan</span>
                          )}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                          {positionShort(player.position)} · {player.age} år · {club?.name ?? '?'} · {formatValue(player.marketValue)} ·{' '}
                          {isScouted
                            ? <span>Styrka ~{report!.estimatedCA}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>Styrka ej utvärderad</span>
                          }
                          {cost && (
                            <span style={{ marginLeft: 6 }}>
                              <span className={`tag ${cost === 'direkt' ? 'tag-copper' : 'tag-outline'}`} style={{ fontSize: 10 }}>
                                {cost}
                              </span>
                            </span>
                          )}
                        </p>
                        {isScouted && (
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>{report!.notes}</p>
                        )}
                      </div>
                      {isScouted && windowOpen && (
                        <button
                          onClick={() => onBid(player.id)}
                          className="btn btn-outline"
                          style={{ flexShrink: 0, padding: '5px 10px', fontSize: 12, fontWeight: 600, marginLeft: 4 }}
                        >
                          Bud
                        </button>
                      )}
                      {!isScouted && (
                        <button
                          onClick={() => canScout && onScout(player)}
                          disabled={!canScout}
                          className={`btn ${canScout ? 'btn-outline' : 'btn-ghost'}`}
                          style={{ flexShrink: 0, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: canScout ? 'pointer' : 'not-allowed', opacity: canScout ? 1 : 0.5 }}
                        >
                          {activeAssignment ? 'Scout upptagen' : scoutBudget <= 0 ? 'Ingen budget' : 'Utvärdera'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              {!isExpanded && hidden > 0 && (
                <button
                  className="btn btn-ghost"
                  onClick={() => setExpandedGroups(prev => new Set([...prev, pos]))}
                  style={{ marginTop: 4, fontSize: 11, padding: '4px 10px', width: '100%' }}
                >
                  + {hidden} fler {positionLong(pos).toLowerCase()}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
