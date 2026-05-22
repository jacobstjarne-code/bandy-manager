import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { useGameStore } from '../store/gameStore'
import type { Player } from '../../domain/entities/Player'
import { getTransferWindowStatus } from '../../domain/services/transferWindowService'
import { formatCurrency, positionShort } from '../utils/formatters'
import { SectionLabel } from '../components/SectionLabel'
import { FirstVisitHint } from '../components/FirstVisitHint'

import { RenewContractModal } from '../components/transfers/RenewContractModal'
import { BidModal } from '../components/transfers/BidModal'
import { getRivalry } from '../../domain/data/rivalries'
import { TransferPlayerCard } from '../components/transfers/TransferPlayerCard'
import { ActiveBidsList } from '../components/transfers/ActiveBidsList'
import { FreeAgentList } from '../components/transfers/FreeAgentList'
import { WageOverrunWarning } from '../components/transfers/WageOverrunWarning'
import '../styles/transfers.css'

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

export function TransfersScreen() {
  const game = useGameStore(s => s.game)
  const startEvaluation = useGameStore(s => s.startEvaluation)
  const placeOutgoingBid = useGameStore(s => s.placeOutgoingBid)
  const renewContract = useGameStore(s => s.renewContract)
  const signFreeAgent = useGameStore(s => s.signFreeAgent)
  const listPlayerForSale = useGameStore(s => s.listPlayerForSale)
  const startTalentSearch = useGameStore(s => s.startTalentSearch)
  const markScreenVisited = useGameStore(s => s.markScreenVisited)
  const dismissHint = useGameStore(s => s.dismissHint)
  useEffect(() => { markScreenVisited('transfers') }, [])

  const [renewingPlayerId, setRenewingPlayerId] = useState<string | null>(null)
  const [renewError, setRenewError] = useState<string | null>(null)
  const [renewConfirmText, setRenewConfirmText] = useState<string | null>(null)
  const [wageWarning, setWageWarning] = useState<string | null>(null)
  const [scoutMessage, setScoutMessage] = useState<string | null>(null)
  const [biddingPlayerId, setBiddingPlayerId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [overrunPct, setOverrunPct] = useState(0)
  const [activeTab, setActiveTab] = useState<'marknad' | 'scouting' | 'contracts' | 'freeagents' | 'sell'>('marknad')
  const [spaningPosition, setSpanningPosition] = useState<string>('any')
  const [spaningMaxAge, setSpanningMaxAge] = useState<number>(30)
  const [spaningMaxSalary, setSpanningMaxSalary] = useState<number>(16000)
  const location = useLocation()

  useEffect(() => {
    const state = location.state as { tab?: string; renewPlayerId?: string; highlightPlayer?: string } | null
    const highlightId = state?.highlightPlayer
    const tabOverride = state?.tab as typeof activeTab | undefined
    const renewId = state?.renewPlayerId as string | undefined
    if (tabOverride) {
      setActiveTab(tabOverride)
    }
    if (renewId) {
      setRenewingPlayerId(renewId)
    }
    if (highlightId && game) {
      const player = game.players.find(p => p.id === highlightId)
      if (player && player.clubId !== game.managedClubId) {
        setBiddingPlayerId(highlightId)
        setActiveTab('scouting')
      }
    }
    if (highlightId || tabOverride || renewId) {
      window.history.replaceState({ ...window.history.state, usr: {} }, '')
    }
  }, [location.state])

  if (!game) return null

  const managedClubPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)

  const expiringPlayers = managedClubPlayers
    .filter(p => p.contractUntilSeason <= game.currentSeason)
    .sort((a, b) => a.contractUntilSeason - b.contractUntilSeason)

  const freeAgents = game.transferState.freeAgents
  const windowInfo = getTransferWindowStatus(game.currentDate)
  const windowOpen = windowInfo.status !== 'closed'
  const renewingPlayer = renewingPlayerId ? game.players.find(p => p.id === renewingPlayerId) ?? null : null

  const scoutReports = game.scoutReports ?? {}
  const activeAssignment = game.activeScoutAssignment ?? null
  const scoutBudget = game.scoutBudget ?? 10

  const currentRound = game.fixtures.filter(f => f.status === 'scheduled').sort((a, b) => a.roundNumber - b.roundNumber)[0]?.roundNumber ?? 1

  function handleRenew(playerId: string, newSalary: number, years: number) {
    if (!game) return
    const club = game.clubs.find(c => c.id === game.managedClubId)
    if (!club) return
    const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const currentPlayer = squadPlayers.find(p => p.id === playerId)
    if (!currentPlayer) return
    const isFullTimePro = !currentPlayer.dayJob
    const minSalary = Math.round((isFullTimePro
      ? currentPlayer.currentAbility * 200 * 0.80
      : currentPlayer.currentAbility * 80 * 0.80) / 500) * 500
    if (newSalary < minSalary) {
      setRenewError(`${currentPlayer.firstName} avslår — kräver minst ${formatCurrency(minSalary)}/mån`)
      return
    }
    if (newSalary === minSalary) {
      let rejectChance = 0
      if (currentPlayer.currentAbility > 60) rejectChance += 0.40
      if (currentPlayer.form > 65) rejectChance += 0.20
      if ((currentPlayer.potentialAbility ?? 0) > 70) rejectChance += 0.15
      if (Math.random() < rejectChance) {
        const counterSalary = Math.round(minSalary * 1.15 / 500) * 500
        setRenewError(`${currentPlayer.firstName} avvisar erbjudandet — vill ha minst ${formatCurrency(counterSalary)}/mån`)
        return
      }
    }
    const currentWageBill = squadPlayers.reduce((sum, p) => sum + p.salary, 0)
    const projectedWageBill = currentWageBill - currentPlayer.salary + newSalary
    const weeklyEquiv = Math.round(projectedWageBill / 4)
    const wouldExceed = weeklyEquiv > club.wageBudget

    const doRenew = () => {
      const result = renewContract(playerId, newSalary, years)
      if (!result.success) {
        setRenewError(result.error ?? 'Kunde inte förlänga kontraktet')
        return
      }
      if (result.wageWarning) {
        setWageWarning(`OBS: Lönekostnaderna överstiger budgeten med ${formatCurrency(result.wageWarning)}/mån`)
      }
      setRenewingPlayerId(null)
      setRenewError(null)
      setRenewConfirmText(`Kontrakt förlängt till ${game.currentSeason + years}`)
      setTimeout(() => setRenewConfirmText(null), 2000)
    }

    if (wouldExceed) {
      const pct = Math.round(((weeklyEquiv - club.wageBudget) / club.wageBudget) * 100)
      setOverrunPct(pct)
      setPendingAction(() => doRenew)
    } else {
      doRenew()
    }
  }

  function handleSignFreeAgent(agentId: string) {
    if (!game) return
    const agent = game.transferState.freeAgents.find(p => p.id === agentId)
    if (!agent) return
    signFreeAgent(agentId)
  }

  function handleListForSale(playerId: string) {
    if (!game) return
    listPlayerForSale(playerId)
  }

  function handleBid(playerId: string, offerAmount: number, offeredSalary: number, contractYears: number) {
    if (!game) return
    const club = game.clubs.find(c => c.id === game.managedClubId)
    const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const currentWageBill = squadPlayers.reduce((sum, p) => sum + p.salary, 0)
    const weeklyEquiv = Math.round((currentWageBill + offeredSalary) / 4)
    const wouldExceed = club ? weeklyEquiv > club.wageBudget : false

    const doBid = () => {
      const result = placeOutgoingBid(playerId, offerAmount, offeredSalary, contractYears)
      setBiddingPlayerId(null)
      if (result.success) {
        setScoutMessage('Bud skickat! Svar om 1 omgång.')
        setTimeout(() => setScoutMessage(null), 4000)
      } else {
        setScoutMessage(result.error ?? 'Kunde inte lägga bud.')
        setTimeout(() => setScoutMessage(null), 3000)
      }
    }

    if (wouldExceed && club) {
      const pct = Math.round(((weeklyEquiv - club.wageBudget) / club.wageBudget) * 100)
      setOverrunPct(pct)
      setPendingAction(() => doBid)
    } else {
      doBid()
    }
  }

  function handleScout(player: Player) {
    const targetClub = game!.clubs.find(c => c.id === player.clubId)
    const sameRegion = !!managedClub && !!targetClub && managedClub.region === targetClub.region
    const hasPlayedAgainst = game!.fixtures.some(f =>
      f.status === 'completed' &&
      ((f.homeClubId === game!.managedClubId && f.awayClubId === player.clubId) ||
       (f.awayClubId === game!.managedClubId && f.homeClubId === player.clubId))
    )
    const result = startEvaluation(player.id, player.clubId, sameRegion, hasPlayedAgainst)
    if (result.success) {
      const rounds = hasPlayedAgainst || sameRegion ? 0 : 1
      setScoutMessage(rounds === 0
        ? `Rapport om ${player.firstName} ${player.lastName} klar direkt!`
        : `Scout utsänd till ${targetClub?.name ?? 'okänd klubb'}. Rapport om ${rounds} omgång.`)
      setTimeout(() => setScoutMessage(null), 4000)
    } else {
      setScoutMessage(result.error ?? 'Kunde inte skicka scout.')
      setTimeout(() => setScoutMessage(null), 3000)
    }
  }

  return (
    <div className="transfers-screen">

      {!(game.dismissedHints ?? []).includes('transfers') && (
        <FirstVisitHint
          screenId="transfers"
          text="Transferfönstret stänger omgång 15. Scouta billigt. Sälj dyrt. Akademin är gratis."
          onDismiss={() => dismissHint('transfers')}
        />
      )}

      {scoutMessage && (
        <div className="card-sharp transfers-state-copper-dim" style={{ padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--accent)' }}>
          {scoutMessage}
        </div>
      )}

      {activeAssignment && (() => {
        const target = game.players.find(p => p.id === activeAssignment.targetPlayerId)
        const targetClub = game.clubs.find(c => c.id === activeAssignment.targetClubId)
        return (
          <div className="card-sharp transfers-state-copper" style={{ padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            Scouting pågår: <strong>{target?.firstName} {target?.lastName}</strong> ({targetClub?.name ?? '?'}) · {activeAssignment.roundsRemaining} omgång{activeAssignment.roundsRemaining !== 1 ? 'ar' : ''} kvar
          </div>
        )
      })()}

      {game.activeTalentSearch && !activeAssignment && (
        <div className="card-sharp transfers-state-copper" style={{ padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          Scouten är ute på talangspaning. Klar om {game.activeTalentSearch.roundsRemaining} omgång{game.activeTalentSearch.roundsRemaining !== 1 ? 'ar' : ''}.
        </div>
      )}

      <div className="transfers-scout-budget">
        <span className="transfers-scout-label">Scoutbudget:</span>
        <span style={{ fontSize: 12, letterSpacing: 1 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={{ color: i < scoutBudget ? 'var(--accent)' : 'var(--border)' }}>●</span>
          ))}
        </span>
        <span style={{ fontSize: 11, color: scoutBudget > 3 ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 600 }}>
          {scoutBudget}/10
        </span>
      </div>

      {(() => {
        const incomingBids = (game.transferBids ?? []).filter(b => b.direction === 'incoming' && b.status === 'pending')
        const tabs = [
          { key: 'marknad' as const, label: 'Marknad', dot: incomingBids.length > 0 ? 'accent' : null },
          { key: 'scouting' as const, label: 'Scouting', dot: null },
          { key: 'contracts' as const, label: 'Kontrakt', dot: expiringPlayers.length > 0 ? 'danger' : null },
          { key: 'freeagents' as const, label: 'Fria', dot: freeAgents.length > 0 && windowOpen ? 'accent' : null },
          { key: 'sell' as const, label: 'Sälj', dot: null },
        ]
        return (
          <div className="transfers-tab-bar">
            <div className="transfers-tab-scroll">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`btn ${activeTab === tab.key ? 'btn-copper' : 'btn-ghost'} transfers-tab-btn`}
                >
                  {tab.label}
                  {tab.dot && (
                    <span className="transfers-tab-dot" style={{ background: tab.dot === 'danger' ? 'var(--danger)' : 'var(--accent)' }} />
                  )}
                </button>
              ))}
            </div>
            <div className="transfers-tab-fade" />
          </div>
        )
      })()}

      {({
        marknad: 'Spelare som är tillgängliga för transfer just nu.',
        scouting: 'Utvärdera spelare eller sök nya talanger.',
        contracts: 'Förläng avtal med dina spelare.',
        freeagents: 'Kontraktslösa spelare. Ingen transfersumma.',
        sell: 'Sälj spelare från din trupp.',
      } as Record<string, string>)[activeTab] && (
        <p className="transfers-section-desc">
          {({
            marknad: 'Spelare som är tillgängliga för transfer just nu.',
            scouting: 'Utvärdera spelare eller sök nya talanger.',
            contracts: 'Förläng avtal med dina spelare.',
            freeagents: 'Kontraktslösa spelare. Ingen transfersumma.',
            sell: 'Sälj spelare från din trupp.',
          } as Record<string, string>)[activeTab]}
        </p>
      )}

      <div className={`card-sharp transfers-window-bar ${windowInfo.status === 'open' ? 'transfers-window-open' : windowInfo.status === 'winter' ? 'transfers-window-winter' : 'transfers-window-closed'}`}>
        <p className="transfers-window-status" style={{ color: windowInfo.status === 'open' ? 'var(--success)' : windowInfo.status === 'winter' ? 'var(--accent)' : 'var(--danger)' }}>
          <span className={`transfers-dot ${windowInfo.status === 'open' ? 'transfers-dot-green' : windowInfo.status === 'winter' ? 'transfers-dot-yellow' : 'transfers-dot-red'}`} />
          {windowInfo.label} · <span className="transfers-window-desc">{windowInfo.description}</span>
        </p>
      </div>

      {/* Aktiva bud (outgoing) — alltid synliga i marknad */}
      {activeTab === 'marknad' && (() => {
        const outgoing = (game.transferBids ?? []).filter(b => b.direction === 'outgoing' && b.status === 'pending')
        if (outgoing.length === 0) return null
        return (
          <div style={{ marginBottom: 10 }}>
            <SectionLabel>📤 Dina aktiva bud</SectionLabel>
            <div className="card-sharp" style={{ overflow: 'hidden' }}>
              {outgoing.map((bid, i) => {
                const player = game.players.find(p => p.id === bid.playerId)
                const club = game.clubs.find(c => c.id === bid.sellingClubId)
                return (
                  <div key={bid.id} className="transfers-list-row" style={{ borderBottom: i < outgoing.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="transfers-list-content">
                      <p className="transfers-list-name">{player ? `${player.firstName} ${player.lastName}` : '?'}</p>
                      <p className="transfers-list-meta-sm">{club?.name ?? '?'} · Bud: {formatValue(bid.offerAmount)}</p>
                    </div>
                    {(() => {
                      const roundsLeft = (bid.expiresRound ?? 0) - currentRound
                      return (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                          {roundsLeft > 0 ? `Svar om ${roundsLeft} omg.` : 'Svar väntat'}
                        </span>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Marknad tab */}
      {activeTab === 'marknad' && (() => {
        const availablePlayers = game.players.filter(p =>
          p.clubId !== game.managedClubId &&
          p.clubId !== 'free_agent' &&
          p.availability && p.availability !== 'unavailable'
        )
        const groups: { key: string; label: string; emoji: string; desc: string; players: typeof availablePlayers }[] = [
          { key: 'contract_expiring', label: 'Kontrakt går ut', emoji: '📋', desc: 'Kan värvas gratis efter säsongen. Förhandling möjlig nu.', players: availablePlayers.filter(p => p.availability === 'contract_expiring') },
          { key: 'unhappy', label: 'Missnöjda', emoji: '😤', desc: 'Spelare som vill byta miljö. Kräver transferbud.', players: availablePlayers.filter(p => p.availability === 'unhappy') },
          { key: 'surplus', label: 'Övertaliga', emoji: '🔻', desc: 'Klubben har för många på positionen. Kan sälja billigt.', players: availablePlayers.filter(p => p.availability === 'surplus') },
          { key: 'financial', label: 'Ekonomiska skäl', emoji: '💰', desc: 'Klubben behöver sälja. Pruta hårt.', players: availablePlayers.filter(p => p.availability === 'financial') },
        ].filter(g => g.players.length > 0)

        return (
          <div style={{ marginBottom: 24 }}>
            {groups.length === 0 ? (
              <div className="card-sharp" style={{ padding: '20px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Inga spelare tillgängliga på marknaden just nu.</p>
              </div>
            ) : groups.map(group => (
              <div key={group.key} style={{ marginBottom: 16 }}>
                <SectionLabel>{group.emoji} {group.label}</SectionLabel>
                <p className="transfers-group-desc">{group.desc}</p>
                <div className="card-sharp" style={{ overflow: 'hidden' }}>
                  {group.players.slice(0, 10).map((player, i) => (
                    <TransferPlayerCard
                      key={player.id}
                      player={player}
                      club={game.clubs.find(c => c.id === player.clubId)}
                      report={scoutReports[player.id]}
                      windowOpen={windowOpen}
                      isLast={i >= Math.min(group.players.length, 10) - 1}
                      activeAssignment={!!activeAssignment}
                      scoutBudget={scoutBudget}
                      onBid={setBiddingPlayerId}
                      onScout={handleScout}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Scouting tab */}
      {activeTab === 'scouting' && (
        <ActiveBidsList
          game={game}
          scoutReports={scoutReports}
          scoutBudget={scoutBudget}
          activeAssignment={activeAssignment}
          windowOpen={windowOpen}
          managedClub={managedClub}
          spaningPosition={spaningPosition}
          spaningMaxAge={spaningMaxAge}
          spaningMaxSalary={spaningMaxSalary}
          currentRound={currentRound}
          onSetSpanningPosition={setSpanningPosition}
          onSetSpanningMaxAge={setSpanningMaxAge}
          onSetSpanningMaxSalary={setSpanningMaxSalary}
          onBid={setBiddingPlayerId}
          onScout={handleScout}
          onStartTalentSearch={startTalentSearch}
          onScoutMessage={setScoutMessage}
        />
      )}

      {/* Contracts tab */}
      {activeTab === 'contracts' && (
        <div className="card-stagger-2" style={{ marginBottom: 24 }}>
          {renewConfirmText && (
            <div className="transfers-state-success-strong transfers-renew-confirm">
              <p className="transfers-renew-confirm-text">{renewConfirmText}</p>
            </div>
          )}
          {wageWarning && (
            <div className="transfers-state-copper-strong transfers-wage-warning">
              <p className="transfers-wage-warning-text">⚠️ {wageWarning}</p>
              <button onClick={() => setWageWarning(null)} className="transfers-wage-warning-close"><X size={12} /></button>
            </div>
          )}
          <SectionLabel>Utgående kontrakt</SectionLabel>
          {expiringPlayers.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>Inga kontrakt utgår snart.</p>
          ) : (
            <div className="card-sharp" style={{ overflow: 'hidden' }}>
              {expiringPlayers.map((player, index) => (
                <div key={player.id} className="transfers-list-row" style={{ borderBottom: index < expiringPlayers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="transfers-list-content">
                    <p className="transfers-list-name">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="transfers-list-meta">
                      {positionShort(player.position)} · {formatValue(player.marketValue)} · {formatCurrency(player.salary)}/mån · t.o.m. {player.contractUntilSeason}
                    </p>
                  </div>
                  <button onClick={() => setRenewingPlayerId(player.id)} className="btn btn-outline" style={{ flexShrink: 0, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}>
                    Förläng
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Free agents tab */}
      {activeTab === 'freeagents' && (
        <div className="card-stagger-2">
          <SectionLabel>Fria agenter</SectionLabel>
          <FreeAgentList
            freeAgents={freeAgents}
            windowOpen={windowOpen}
            scoutReports={scoutReports}
            onSign={handleSignFreeAgent}
          />
        </div>
      )}

      {/* Sell tab */}
      {activeTab === 'sell' && (
        <div className="card-stagger-2" style={{ marginBottom: 24 }}>
          <SectionLabel>Sätt spelare till salu</SectionLabel>
          {!windowOpen && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Transferfönstret är stängt. Försäljning möjlig sommaren och vintern.</p>
          )}
          <div className="card-sharp" style={{ overflow: 'hidden' }}>
            {managedClubPlayers.sort((a, b) => b.currentAbility - a.currentAbility).map((player, index) => (
              <div key={player.id} className="transfers-list-row" style={{ borderBottom: index < managedClubPlayers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="transfers-list-content">
                  <p className="transfers-list-name">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="transfers-list-meta">
                    {positionShort(player.position)} · Styrka {Math.round(player.currentAbility)} · MV {formatCurrency(player.marketValue ?? 0)}
                    {(() => {
                      const bidsForPlayer = (game.transferBids ?? []).filter(b => b.playerId === player.id && b.direction === 'incoming')
                      return bidsForPlayer.length > 0
                        ? <span className="transfers-interest-badge">🔥 {bidsForPlayer.length} klubb{bidsForPlayer.length > 1 ? 'ar' : ''} intresserad{bidsForPlayer.length > 1 ? 'e' : ''}</span>
                        : null
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => windowOpen && handleListForSale(player.id)}
                  disabled={!windowOpen}
                  className={`btn ${windowOpen ? 'btn-outline' : 'btn-ghost'}`}
                  style={{ flexShrink: 0, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: windowOpen ? 'pointer' : 'not-allowed', opacity: windowOpen ? 1 : 0.6 }}
                >
                  Till salu
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {renewingPlayer && (() => {
        const isFullTimePro = !renewingPlayer.dayJob
        const minSalary = Math.round((isFullTimePro
          ? renewingPlayer.currentAbility * 200 * 0.80
          : renewingPlayer.currentAbility * 80 * 0.80) / 500) * 500
        return (
          <RenewContractModal
            player={renewingPlayer}
            currentSeason={game.currentSeason}
            minSalary={minSalary}
            error={renewError}
            onClose={() => { setRenewingPlayerId(null); setRenewError(null) }}
            onConfirm={handleRenew}
          />
        )
      })()}

      {biddingPlayerId && managedClub && (() => {
        const biddingPlayer = game.players.find(p => p.id === biddingPlayerId)
        if (!biddingPlayer) return null
        const bidRivalry = getRivalry(game.managedClubId, biddingPlayer.clubId)
        return (
          <BidModal
            player={biddingPlayer}
            managedClub={managedClub}
            onClose={() => setBiddingPlayerId(null)}
            onConfirm={handleBid}
            rivalry={bidRivalry}
          />
        )
      })()}

      {pendingAction && (
        <WageOverrunWarning
          overrunPct={overrunPct}
          seasonSeed={game.currentSeason}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            setPendingAction(null)
            pendingAction()
          }}
        />
      )}
    </div>
  )
}
