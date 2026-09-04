import { useState } from 'react'
import { Star } from 'lucide-react'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { ScoutAssignment, ScoutReport } from '../../../domain/entities/Scouting'
import { PlayerPosition } from '../../../domain/enums'
import { getScoutReportAge } from '../../../domain/services/scoutingService'
import { getScoutablePlayers } from '../../../domain/services/talentScoutService'
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
// L3 (mobil speltest-audit, 2026-08-26): Scoutrapporter var okapad — varje
// rad är lång (namn + 2 metarader + notis + 4 attributstaplar), så listan
// växte monotont med antal utvärderade spelare och tryckte "Spelare att
// utvärdera" långt ner på mobil. Lägre golv än GROUP_CAP eftersom raderna
// här är mycket högre — 5 okapade rader fyller redan en 375-skärm.
const REPORT_CAP = 5

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
  onToggleShortlist: (playerId: string) => void
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
  onToggleShortlist,
}: ScoutingTabProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<PlayerPosition>>(new Set())
  const [reportsExpanded, setReportsExpanded] = useState(false)

  const scoutablePlayers = getScoutablePlayers(game.players, game.managedClubId)
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
      <div className="card-stagger-1 transfers-section">
        <div className="card-sharp transfers-spaning-intro">
          <p className="transfers-spaning-info">
            <strong className="transfers-strong">Spaning</strong> skickar ut din scout för att hitta okända spelare som matchar dina kriterier. Tar 2 omgångar. Skiljer sig från <em>Scouting</em> som utvärderar kända spelare.
          </p>
        </div>

        {game.activeScoutAssignment && (
          <div className="card-sharp transfers-state-danger transfers-state-message transfers-state-message--danger">
            Scouten är upptagen med en utvärdering. Klar om {game.activeScoutAssignment.roundsRemaining} omgång{game.activeScoutAssignment.roundsRemaining !== 1 ? 'ar' : ''}.
          </div>
        )}

        {game.activeTalentSearch && (
          <div className="card-sharp transfers-state-copper">
            Scout ute och letar... {game.activeTalentSearch.roundsRemaining} omgång{game.activeTalentSearch.roundsRemaining !== 1 ? 'ar' : ''} kvar
          </div>
        )}

        {!game.activeTalentSearch && (
          <div className="card-sharp transfers-search-form">
            <SectionLabel>Ny talangspaning</SectionLabel>
            <div className="transfers-form-group">
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
            <div className="transfers-form-group">
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
            <div className="transfers-form-group transfers-form-group--md">
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
              className={`btn ${scoutBudget >= 2 ? 'btn-primary' : 'btn-ghost'} transfers-spaning-cta`}
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
              <div className="card-sharp transfers-card-clipped">
                {latestResult.players.map((suggestion, index) => {
                  const player = game.players.find(p => p.id === suggestion.playerId)
                  const club = player ? game.clubs.find(c => c.id === player.clubId) : null
                  const report = player ? (game.scoutReports ?? {})[player.id] : null
                  const isAlreadyScouted = !!report
                  return (
                    <div key={suggestion.playerId} className={`transfers-talent-row ${index < latestResult.players.length - 1 ? 'transfers-row-divider' : ''} ${isAlreadyScouted ? 'transfers-talent-row--scouted' : ''}`}>
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
                            className={`btn ${(!activeAssignment && scoutBudget > 0) ? 'btn-outline' : 'btn-ghost'} transfers-btn-sm transfers-btn-sm--slim`}
                          >
                            {activeAssignment ? 'Scout upptagen' : scoutBudget <= 0 ? 'Ingen budget' : 'Utvärdera'}
                          </button>
                        )}
                        {windowOpen && player && managedClub && (
                          <button
                            onClick={() => onBid(suggestion.playerId)}
                            className="btn btn-outline transfers-btn-sm transfers-btn-sm--slim"
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
        // L3: favoriter alltid synliga, resten kapas — se REPORT_CAP-
        // kommentaren. Stabil sortering: favoriter i sin ursprungsordning
        // före resten i sin.
        const allEntries = Object.values(scoutReports)
        const shortlistedEntries = allEntries.filter(r => r.shortlisted)
        const restEntries = allEntries.filter(r => !r.shortlisted)
        const visibleRest = reportsExpanded ? restEntries : restEntries.slice(0, Math.max(0, REPORT_CAP - shortlistedEntries.length))
        const reportEntries = [...shortlistedEntries, ...visibleRest]
        const hiddenCount = restEntries.length - visibleRest.length
        return (
          <div className="card-stagger-2 transfers-section">
            <SectionLabel>Scoutrapporter ({allEntries.length})</SectionLabel>
            <div className="card-sharp transfers-card-clipped">
              {reportEntries.map((report, index) => {
                const reportPlayer = game.players.find(p => p.id === report.playerId)
                const reportClub = game.clubs.find(c => c.id === report.clubId)
                const age = getScoutReportAge(report, game.currentSeason, report.scoutedSeason)
                const freshnessLabel = age === 'fresh' ? 'Färsk' : age === 'aging' ? 'Gammal' : 'Inaktuell'
                const freshnessClass = `transfers-freshness--${age}`
                const caRange = Math.round((100 - report.accuracy) / 10)
                return (
                  <div
                    key={report.playerId}
                    className={`transfers-report-row ${index < reportEntries.length - 1 ? 'transfers-row-divider' : ''}`}
                  >
                    <div className="transfers-list-content">
                      <div className="transfers-report-header">
                        <p className="transfers-report-name">
                          {reportPlayer ? `${reportPlayer.firstName} ${reportPlayer.lastName}` : report.playerId}
                        </p>
                        <button
                          onClick={() => onToggleShortlist(report.playerId)}
                          aria-label={report.shortlisted ? 'Ta bort från favoriter' : 'Lägg till i favoriter'}
                          className="btn-ghost transfers-shortlist-btn"
                        >
                          <Star
                            size={16}
                            color={report.shortlisted ? 'var(--accent)' : 'var(--text-muted)'}
                            fill={report.shortlisted ? 'var(--accent)' : 'none'}
                          />
                        </button>
                        <span className={`transfers-freshness ${freshnessClass}`}>
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
                        <div className="transfers-attribute-profile">
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
                        className="btn btn-outline transfers-btn-sm transfers-btn-sm--slim"
                      >
                        Lägg bud
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {!reportsExpanded && hiddenCount > 0 && (
              <button
                className="btn btn-ghost transfers-expand-btn"
                onClick={() => setReportsExpanded(true)}
              >
                + {hiddenCount} fler rapporter
              </button>
            )}
          </div>
        )
      })()}

      {/* ── 3. Spelare att utvärdera — grupperat per position ── */}
      <div className="card-stagger-3 transfers-section">
        <SectionLabel right={
          <span className={`transfers-budget-remaining ${scoutBudget > 3 ? '' : 'transfers-budget-remaining--low'}`}>
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
            <div key={pos} className="transfers-group">
              <SectionLabel>{positionLong(pos)}</SectionLabel>
              <div className="card-sharp transfers-card-clipped">
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
                      className={`transfers-list-row-lg${isScouted ? ' transfers-state-scouted-bg transfers-player-row--scouted' : ''}${index < visible.length - 1 ? ' transfers-row-divider' : ''}`}
                    >
                      <div className="transfers-list-content">
                        <p className="transfers-list-name-lg">
                          {player.firstName} {player.lastName}
                          {isStale && <span className="transfers-stale-label">Föråldrad</span>}
                          {reportAge === 'aging' && !isStale && (
                            <span className="tag tag-outline transfers-aging-tag">1 säsong sedan</span>
                          )}
                        </p>
                        <p className="transfers-player-meta">
                          {positionShort(player.position)} · {player.age} år · {club?.name ?? '?'} · {formatValue(player.marketValue)} ·{' '}
                          {isScouted
                            ? <span>Styrka ~{report!.estimatedCA}</span>
                            : <span className="transfers-muted">Styrka ej utvärderad</span>
                          }
                          {cost && (
                            <span className="transfers-cost-wrap">
                              <span className={`tag ${cost === 'direkt' ? 'tag-copper' : 'tag-outline'} transfers-cost-tag`}>
                                {cost}
                              </span>
                            </span>
                          )}
                        </p>
                        {isScouted && (
                          <p className="transfers-player-notes">{report!.notes}</p>
                        )}
                      </div>
                      {isScouted && windowOpen && (
                        <button
                          onClick={() => onBid(player.id)}
                          className="btn btn-outline transfers-btn-sm transfers-btn-sm--slim transfers-btn-offset"
                        >
                          Bud
                        </button>
                      )}
                      {!isScouted && (
                        <button
                          onClick={() => canScout && onScout(player)}
                          disabled={!canScout}
                          className={`btn ${canScout ? 'btn-outline' : 'btn-ghost'} transfers-btn-sm transfers-btn-sm--slim`}
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
                  className="btn btn-ghost transfers-expand-btn"
                  onClick={() => setExpandedGroups(prev => new Set([...prev, pos]))}
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
