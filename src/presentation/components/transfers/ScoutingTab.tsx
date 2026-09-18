import { useEffect, useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { ScoutAssignment, ScoutReport } from '../../../domain/entities/Scouting'
import { PlayerPosition } from '../../../domain/enums'
import { getScoutAssignmentRounds, getScoutReportAge, getAttributeBand, ATTRIBUTE_BAND_LABELS, ATTRIBUTE_BAND_BAR_WIDTH } from '../../../domain/services/scoutingService'
import { getScoutablePlayers } from '../../../domain/services/talentScoutService'
import { positionShort, positionLong, formatValue } from '../../utils/formatters'
import { SectionLabel } from '../SectionLabel'
import { PlayerPortrait } from '../PlayerPortrait'

const POSITION_GROUPS: PlayerPosition[] = [
  PlayerPosition.Goalkeeper,
  PlayerPosition.Defender,
  PlayerPosition.Half,
  PlayerPosition.Midfielder,
  PlayerPosition.Forward,
]
const POSITION_GROUP_LABELS: Record<PlayerPosition, string> = {
  [PlayerPosition.Goalkeeper]: 'Målvakter',
  [PlayerPosition.Defender]: 'Backar',
  [PlayerPosition.Half]: 'Ytterhalvor',
  [PlayerPosition.Midfielder]: 'Mittfältare',
  [PlayerPosition.Forward]: 'Anfallare',
}

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
  onShowFreeAgents: () => void
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
  onShowFreeAgents,
  onScout,
  onStartTalentSearch,
  onScoutMessage,
  onToggleShortlist,
}: ScoutingTabProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<PlayerPosition>>(new Set())
  const [openPosition, setOpenPosition] = useState<PlayerPosition | null>(null)
  const [reportsExpanded, setReportsExpanded] = useState(false)
  const [reportToShow, setReportToShow] = useState<string | null>(null)

  const scoutablePlayers = getScoutablePlayers(game.players, game.managedClubId)
    .filter(player => player.clubId !== 'free_agent')
    // Låt spelaren stå kvar på samma plats när rapporten blir klar. Den gamla
    // sorteringen flyttade rapportklara spelare bakom de outvärderade och kunde
    // få ett klick på ”Utvärdera” att se ut som om ingenting hände.
    .sort((a, b) => b.currentAbility - a.currentAbility)
  const pendingBids = new Map((game.transferBids ?? [])
    .filter(bid => bid.direction === 'outgoing' && bid.status === 'pending')
    .map(bid => [bid.playerId, bid]))

  function bidState(playerId: string) {
    const bid = pendingBids.get(playerId)
    if (!bid) return null
    const roundsLeft = bid.expiresRound - currentRound
    return <span className="transfers-bid-pending" role="status">Bud skickat · {formatValue(bid.offerAmount)} · {roundsLeft > 0 ? `svar om ${roundsLeft} omg.` : 'svar väntat'}</span>
  }

  useEffect(() => {
    if (!reportToShow) return
    document.getElementById(`scout-report-${reportToShow}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setReportToShow(null)
  }, [reportToShow, reportsExpanded])

  function showReport(playerId: string) {
    setReportsExpanded(true)
    setReportToShow(playerId)
  }

  // Pre-compute scout cost per player (same logic as handleScout in TransfersScreen)
  function scoutCost(player: Player): 'direkt' | '1 omgång' | '2 omgångar' {
    const targetClub = game.clubs.find(c => c.id === player.clubId)
    const sameRegion = !!managedClub && !!targetClub && managedClub.region === targetClub.region
    const hasPlayedAgainst = game.fixtures.some(f =>
      f.status === 'completed' &&
      ((f.homeClubId === game.managedClubId && f.awayClubId === player.clubId) ||
       (f.awayClubId === game.managedClubId && f.homeClubId === player.clubId))
    )
    const rounds = getScoutAssignmentRounds(sameRegion, hasPlayedAgainst)
    return rounds === 0 ? 'direkt' : rounds === 1 ? '1 omgång' : '2 omgångar'
  }

  return (
    <>
      {/* ── 1. Talangspaning — söker okända spelare ── */}
      <div className="card-stagger-1 transfers-section">
        <div className="card-sharp transfers-spaning-intro">
          <p className="transfers-spaning-info">
            <strong className="transfers-strong">Spaning</strong> sållar fram namn efter position, ålder och lön. Tar 2 omgångar. <em>Utvärdering</em> ger en rapport om en spelare du väljer själv.
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
              disabled={scoutBudget < 2 || !!activeAssignment}
              className={`btn ${scoutBudget >= 2 && !activeAssignment ? 'btn-primary' : 'btn-ghost'} transfers-spaning-cta`}
            >
              {activeAssignment ? 'Scout upptagen' : 'Starta spaning'}
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
                  const report = player ? scoutReports[player.id] : null
                  const isAlreadyScouted = !!report
                  const isCurrentAssignment = activeAssignment?.targetPlayerId === suggestion.playerId
                  return (
                    <div key={suggestion.playerId} className={`transfers-talent-row ${index < latestResult.players.length - 1 ? 'transfers-row-divider' : ''} ${isAlreadyScouted ? 'transfers-talent-row--scouted' : ''}`}>
                      <div className="transfers-list-content">
                        <p className="transfers-talent-name">
                          {player ? `${player.firstName} ${player.lastName}` : suggestion.playerId}
                        </p>
                        <p className="transfers-talent-meta">
                          {player ? positionShort(player.position) + ' · ' : ''}{club?.name ?? (player?.clubId === 'free_agent' ? 'Fri agent' : '?')} · {player ? `${player.age} år` : ''} · Styrka ~{suggestion.estimatedCA}
                        </p>
                        <p className="transfers-talent-notes">{suggestion.scoutNotes}</p>
                        {bidState(suggestion.playerId)}
                      </div>
                      <div className="transfers-talent-actions">
                        {isAlreadyScouted && (
                          <button type="button" onClick={() => showReport(suggestion.playerId)} className="transfers-report-link">
                            Visa rapport
                          </button>
                        )}
                        {player && player.clubId !== 'free_agent' && player.clubId !== game.managedClubId && !isAlreadyScouted && (
                          <button
                            onClick={() => player && onScout(player)}
                            disabled={!!activeAssignment || !!game.activeTalentSearch || scoutBudget <= 0}
                            className={`btn ${(!activeAssignment && !game.activeTalentSearch && scoutBudget > 0) ? 'btn-outline' : 'btn-ghost'} transfers-btn-sm transfers-btn-sm--slim`}
                          >
                            {isCurrentAssignment ? 'Pågår' : activeAssignment || game.activeTalentSearch ? 'Scout upptagen' : scoutBudget <= 0 ? 'Ingen budget' : 'Utvärdera'}
                          </button>
                        )}
                        {player?.clubId === 'free_agent' && (
                          <button onClick={onShowFreeAgents} className="btn btn-outline transfers-btn-sm transfers-btn-sm--slim">
                            Visa under Fria
                          </button>
                        )}
                        {windowOpen && player && player.clubId !== 'free_agent' && player.clubId !== game.managedClubId && managedClub && isAlreadyScouted && !pendingBids.has(player.id) && (
                          <button
                            onClick={() => onBid(suggestion.playerId)}
                            className="btn btn-outline transfers-btn-sm transfers-btn-sm--slim"
                          >Lägg bud</button>
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
                const reportClub = game.clubs.find(c => c.id === reportPlayer?.clubId)
                const age = getScoutReportAge(report, game.currentSeason, report.scoutedSeason)
                const freshnessLabel = age === 'fresh' ? 'Färsk' : age === 'aging' ? 'Gammal' : 'Inaktuell'
                const freshnessClass = `transfers-freshness--${age}`
                const caRange = Math.round((100 - report.accuracy) / 10)
                return (
                  <div
                    key={report.playerId}
                    id={`scout-report-${report.playerId}`}
                    className={`transfers-report-row ${index < reportEntries.length - 1 ? 'transfers-row-divider' : ''}`}
                  >
                    <div className="transfers-list-content">
                      <div className="transfers-report-header">
                        {reportPlayer && (
                          <span className="transfers-report-portrait">
                            <PlayerPortrait playerId={reportPlayer.id} age={reportPlayer.age} position={reportPlayer.position} />
                          </span>
                        )}
                        <p className="transfers-report-name">
                          {reportPlayer ? `${reportPlayer.firstName} ${reportPlayer.lastName}` : report.playerId}
                        </p>
                        <span className={`transfers-freshness ${freshnessClass}`}>
                          {freshnessLabel}
                        </span>
                      </div>
                      <p className="transfers-report-meta">
                        {reportPlayer ? positionShort(reportPlayer.position) + ' · ' : ''}{reportClub?.name ?? (reportPlayer?.clubId === 'free_agent' ? 'Fri agent' : '?')} · Säsong {report.scoutedSeason}
                      </p>
                      <p className="transfers-report-meta">
                        Styrka ~{report.estimatedCA} ± {caRange} · Potential ~{report.estimatedPA}
                      </p>
                      {bidState(report.playerId)}
                      {report.notes && (
                        <p className="transfers-report-notes">{report.notes}</p>
                      )}
                      {report.attributeProfile && (
                        <div className="transfers-attribute-profile">
                          {/* transfer-scouting-falsk-precision (DOM 2026-09-04):
                              osignerad spelare → band (svag/ok/stark), aldrig rå
                              decimal. Stapelbredden är bandets representativa
                              bredd, inte det faktiska medelvärdet — annars
                              läcker precisionen tillbaka via grafiken. */}
                          {([
                            { label: 'Offensiv', value: report.attributeProfile.offensive },
                            { label: 'Defensiv', value: report.attributeProfile.defensive },
                            { label: 'Fysisk', value: report.attributeProfile.physical },
                            { label: 'Mental', value: report.attributeProfile.mental },
                          ] as const).map(({ label, value }) => {
                            const band = getAttributeBand(value)
                            return (
                              <div key={label} className="transfers-attr-row">
                                <div className="transfers-attr-label-row">
                                  <span className="transfers-attr-label">{label}</span>
                                  <span className="transfers-attr-value">{ATTRIBUTE_BAND_LABELS[band]}</span>
                                </div>
                                <div className="transfers-attr-bar-bg">
                                  <div className="transfers-attr-bar-fill" style={{ width: `${ATTRIBUTE_BAND_BAR_WIDTH[band]}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <div className="transfers-report-actions">
                      {reportPlayer?.clubId === 'free_agent' && (
                        <button onClick={onShowFreeAgents} className="btn btn-outline transfers-btn-sm transfers-btn-sm--slim">
                          Visa under Fria
                        </button>
                      )}
                      {windowOpen && reportPlayer && reportPlayer.clubId !== 'free_agent' && reportPlayer.clubId !== game.managedClubId && managedClub && !pendingBids.has(report.playerId) && (
                        <button
                          onClick={() => onBid(report.playerId)}
                          className="btn btn-outline transfers-btn-sm transfers-btn-sm--slim"
                        >Lägg bud</button>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleShortlist(report.playerId)}
                        aria-pressed={Boolean(report.shortlisted)}
                        aria-label={report.shortlisted ? 'Ta bort från favoriter' : 'Lägg till i favoriter'}
                        className="transfers-shortlist-btn"
                      >
                        {report.shortlisted ? 'Ta bort favorit' : 'Spara favorit'}
                      </button>
                    </div>
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
        }>Spelare per position</SectionLabel>
        <p className="transfers-scouting-guide">
          Antalet visar spelare i andra klubbar, inte vilka som är till salu. Utvärdera för en rapport; därefter kan du spara en favorit eller lägga bud.
        </p>

        {POSITION_GROUPS.map(pos => {
          const groupPlayers = scoutablePlayers.filter(p => p.position === pos)
          if (groupPlayers.length === 0) return null
          const isOpen = openPosition === pos
          const isExpanded = expandedGroups.has(pos)
          const visible = isExpanded ? groupPlayers : groupPlayers.slice(0, GROUP_CAP)
          const hidden = groupPlayers.length - GROUP_CAP

          return (
            <div key={pos} className="transfers-group">
              <button
                type="button"
                className={`btn btn-ghost transfers-position-toggle${isOpen ? ' transfers-position-toggle--open' : ''}`}
                aria-expanded={isOpen}
                onClick={() => setOpenPosition(current => current === pos ? null : pos)}
              >
                <span className="transfers-position-toggle-label">
                  {POSITION_GROUP_LABELS[pos]} · {groupPlayers.length} spelare
                </span>
                <span aria-hidden="true" className="transfers-position-toggle-icon">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && <div className="card-sharp transfers-card-clipped">
                {visible.map((player, index) => {
                  const report = scoutReports[player.id]
                  const reportAge = report ? getScoutReportAge(report, game.currentSeason, report.scoutedSeason) : null
                  const isStale = reportAge === 'stale'
                  const isScouted = !!report && !isStale
                  const isCurrentAssignment = activeAssignment?.targetPlayerId === player.id
                  const club = game.clubs.find(c => c.id === player.clubId)
                  const canScout = !activeAssignment && !game.activeTalentSearch && scoutBudget > 0 && !isScouted
                  const cost = !isScouted && !isCurrentAssignment ? scoutCost(player) : null
                  return (
                    <div
                      key={player.id}
                      className={`transfers-list-row-lg${isScouted ? ' transfers-state-scouted-bg' : ''}${index < visible.length - 1 ? ' transfers-row-divider' : ''}`}
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
                            ? <span>Rapport klar · Styrka ~{report!.estimatedCA}</span>
                            : isCurrentAssignment
                              ? <span>Utvärdering pågår · {activeAssignment.roundsRemaining} omg. kvar</span>
                              : isStale
                                ? <span>Rapporten behöver uppdateras</span>
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
                        {bidState(player.id)}
                      </div>
                      {isScouted && (
                        <div className="transfers-scout-actions">
                          <button type="button" onClick={() => showReport(player.id)} className="transfers-report-link">
                            Visa rapport
                          </button>
                          {windowOpen && !pendingBids.has(player.id) && (
                            <button onClick={() => onBid(player.id)} className="btn btn-outline transfers-btn-sm transfers-btn-sm--slim">
                              Lägg bud
                            </button>
                          )}
                        </div>
                      )}
                      {!isScouted && (
                        <button
                          onClick={() => canScout && onScout(player)}
                          disabled={!canScout}
                          className={`btn ${canScout ? 'btn-outline' : 'btn-ghost'} transfers-btn-sm transfers-btn-sm--slim`}
                        >
                          {isCurrentAssignment ? 'Pågår' : activeAssignment || game.activeTalentSearch ? 'Scout upptagen' : scoutBudget <= 0 ? 'Ingen budget' : isStale ? 'Utvärdera igen' : 'Utvärdera'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>}
              {isOpen && !isExpanded && hidden > 0 && (
                <button
                  className="btn btn-ghost transfers-expand-btn"
                  onClick={() => setExpandedGroups(prev => new Set([...prev, pos]))}
                >
                  + {hidden} fler {POSITION_GROUP_LABELS[pos].toLowerCase()}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
