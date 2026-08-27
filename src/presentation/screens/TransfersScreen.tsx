import { useState, useEffect } from 'react'
import { Lock, Circle } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { useGameStore } from '../store/gameStore'
import type { Player } from '../../domain/entities/Player'
import type { TransferBid } from '../../domain/entities/GameEvent'
import { getTransferWindowStatus } from '../../domain/services/transferWindowService'
import { formatFinanceAbs, positionShort, formatValue } from '../utils/formatters'
import { SectionLabel } from '../components/SectionLabel'

import { BidModal } from '../components/transfers/BidModal'
import { getRivalry } from '../../domain/data/rivalries'
import { TransferPlayerCard } from '../components/transfers/TransferPlayerCard'
import { ScoutingTab } from '../components/transfers/ScoutingTab'
import { FreeAgentList } from '../components/transfers/FreeAgentList'
import { WageOverrunWarning } from '../components/transfers/WageOverrunWarning'
import { IncomingBidCard } from '../components/transfers/IncomingBidCard'
import { bidReceivedEvent } from '../../domain/services/events/eventFactories'
import '../styles/transfers.css'
import { TabBar } from '../components/shared/TabBar'
import { TabIntro } from '../components/shared/TabIntro'
import { TAB_INTROS } from '../../domain/data/tabIntros'

/**
 * Å4 (SLUTTEST_KO.md, 2026-08-18): sorterar inkommande bud efter svarsfrist
 * (lägst expiresRound = mest brådskande, ohanterat "expiresRound saknas"
 * räknas som mest brådskande, 0). Renderns .map() sätter isPrimary på
 * index 0 av resultatet — så det alltid är det mest brådskande kortet,
 * inte det första i transferBids-arrayens godtyckliga lagringsordning.
 */
export function sortBidsByUrgency(bids: TransferBid[]): TransferBid[] {
  return [...bids].sort((a, b) => (a.expiresRound ?? 0) - (b.expiresRound ?? 0))
}

export function TransfersScreen() {
  const game = useGameStore(s => s.game)
  const startEvaluation = useGameStore(s => s.startEvaluation)
  const toggleScoutShortlist = useGameStore(s => s.toggleScoutShortlist)
  const placeOutgoingBid = useGameStore(s => s.placeOutgoingBid)
  const signFreeAgent = useGameStore(s => s.signFreeAgent)
  const listPlayerForSale = useGameStore(s => s.listPlayerForSale)
  const respondToIncomingBid = useGameStore(s => s.respondToIncomingBid)
  const startTalentSearch = useGameStore(s => s.startTalentSearch)
  const markScreenVisited = useGameStore(s => s.markScreenVisited)
  useEffect(() => { markScreenVisited('transfers') }, [])

  // B1-nav Fas 2: renew-state + contracts-tabben flyttade till ContractsTab (Trupp → Värvning).
  // pendingAction/overrunPct stannar — buden använder dem (egen wage-overrun-instans per yta).
  const [scoutMessage, setScoutMessage] = useState<string | null>(null)
  const [biddingPlayerId, setBiddingPlayerId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [overrunPct, setOverrunPct] = useState(0)
  const [activeTab, setActiveTab] = useState<'marknad' | 'scouting' | 'freeagents' | 'sell'>('marknad')
  const [spaningPosition, setSpanningPosition] = useState<string>('any')
  const [spaningMaxAge, setSpanningMaxAge] = useState<number>(30)
  const [spaningMaxSalary, setSpanningMaxSalary] = useState<number>(16000)
  const location = useLocation()

  useEffect(() => {
    const state = location.state as { tab?: string; highlightPlayer?: string } | null
    const highlightId = state?.highlightPlayer
    const tabOverride = state?.tab as typeof activeTab | undefined
    if (tabOverride) {
      setActiveTab(tabOverride)
    }
    if (highlightId && game) {
      const player = game.players.find(p => p.id === highlightId)
      if (player && player.clubId !== game.managedClubId) {
        setBiddingPlayerId(highlightId)
        setActiveTab('scouting')
      }
    }
    if (highlightId || tabOverride) {
      window.history.replaceState({ ...window.history.state, usr: {} }, '')
    }
  }, [location.state])

  if (!game) return null

  const managedClubPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)

  const freeAgents = game.transferState.freeAgents
  const windowInfo = getTransferWindowStatus(game.currentDate)
  const windowOpen = windowInfo.status !== 'closed'

  const scoutReports = game.scoutReports ?? {}
  const activeAssignment = game.activeScoutAssignment ?? null
  const scoutBudget = game.scoutBudget ?? 10

  const currentRound = game.fixtures.filter(f => f.status === 'scheduled').sort((a, b) => a.roundNumber - b.roundNumber)[0]?.roundNumber ?? 1
  const incomingBids = (game.transferBids ?? []).filter(b => b.direction === 'incoming' && b.status === 'pending')

  const availablePlayersForDot = game.players.filter(p =>
    p.clubId !== game.managedClubId &&
    p.clubId !== 'free_agent' &&
    p.availability && p.availability !== 'unavailable'
  )
  // B1 (Korrvända 2-audit, 2026-07-28): incomingBids flyttad hit ur
  // marknadHasDot. Pricken lovade uppmärksamhet på Marknad-fliken, men
  // inkommande bud renderas aldrig där — payoffen är 🔥-badgen per spelarrad
  // på Sälj-fliken (rad ~354, samma filter). Pricken hörde till fel flik.
  const marknadHasDot = availablePlayersForDot.length > 0
  const saljHasDot = incomingBids.length > 0

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

  // ÖVERLÄMNING 2 (2026-08-12): choiceId ('accept'|'reject'|'counter') istf
  // ett smalare 'accept'|'reject' — samma tre utfall som HÄNDELSE-kortet
  // (resolveEvent) nu erbjuds via, "kräv mer" inkluderat.
  function handleRespondToBid(bidId: string, choiceId: string) {
    if (!game) return
    const result = respondToIncomingBid(bidId, choiceId)
    if (!result.success) {
      setScoutMessage(result.error ?? 'Kunde inte svara på budet.')
      setTimeout(() => setScoutMessage(null), 3000)
    }
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

      {scoutMessage && (
        <div className="card-sharp transfers-state-copper-dim">
          {scoutMessage}
        </div>
      )}

      {activeAssignment && (() => {
        const target = game.players.find(p => p.id === activeAssignment.targetPlayerId)
        const targetClub = game.clubs.find(c => c.id === activeAssignment.targetClubId)
        return (
          <div className="card-sharp transfers-state-copper">
            Scouting pågår: <strong>{target?.firstName} {target?.lastName}</strong> ({targetClub?.name ?? '?'}) · {activeAssignment.roundsRemaining} omgång{activeAssignment.roundsRemaining !== 1 ? 'ar' : ''} kvar
          </div>
        )
      })()}

      {game.activeTalentSearch && !activeAssignment && (
        <div className="card-sharp transfers-state-copper">
          Scouten är ute på talangspaning. Klar om {game.activeTalentSearch.roundsRemaining} omgång{game.activeTalentSearch.roundsRemaining !== 1 ? 'ar' : ''}.
        </div>
      )}

      <div className="transfers-scout-budget">
        <span className="transfers-scout-label">Scoutbudget:</span>
        <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
          {/* Q3: chrome-meter ● → Lucide Circle (solid dot) */}
          {Array.from({ length: 10 }, (_, i) => (
            <Circle key={i} size={8} strokeWidth={0} fill="currentColor"
              style={{ color: i < scoutBudget ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </span>
        <span style={{ fontSize: 11, color: scoutBudget > 3 ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 600 }}>
          {scoutBudget}/10
        </span>
      </div>

      <TabBar
        tabs={[
          { id: 'marknad', label: 'Marknad', dot: marknadHasDot ? 'accent' : null },
          { id: 'scouting', label: 'Scouting', dot: null },
          { id: 'freeagents', label: 'Fria', dot: freeAgents.length > 0 && windowOpen ? 'accent' : null },
          { id: 'sell', label: 'Sälj', dot: saljHasDot ? 'accent' : null },
        ]}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as typeof activeTab)}
      />

      <TabIntro entry={TAB_INTROS[activeTab]} />

      <div className={`card-sharp transfers-window-bar ${windowInfo.status === 'open' ? 'transfers-window-open' : windowInfo.status === 'winter' ? 'transfers-window-winter' : 'transfers-window-closed'}`}>
        <p className="transfers-window-status" style={{ color: windowInfo.status === 'open' ? 'var(--success)' : windowInfo.status === 'winter' ? 'var(--accent)' : 'var(--danger)' }}>
          <span className={`transfers-dot ${windowInfo.status === 'open' ? 'transfers-dot-green' : windowInfo.status === 'winter' ? 'transfers-dot-yellow' : 'transfers-dot-red'}`} />
          {windowInfo.label} · <span className="transfers-window-desc">{windowInfo.description}</span>
        </p>
      </div>

      {/* AUDIT DEL 2 B1 (2026-08-09): inkommande bud — förstaklasskort överst på
          Marknad, före dina egna utgående bud. incomingBids beräknad ovan
          (rad ~77, samma filter Sälj-fliken redan använder för 🔥-badgen). */}
      {activeTab === 'marknad' && sortBidsByUrgency(incomingBids).map((bid, i) => {
        const player = game.players.find(p => p.id === bid.playerId)
        const buyingClub = game.clubs.find(c => c.id === bid.buyingClubId)
        if (!player || !buyingClub) return null
        // ÖVERLÄMNING 2 (2026-08-12): samma choices resolveEvent-vägen visar
        // (bidReceivedEvent, eventFactories.ts) — Marknad och HÄNDELSE-kortet
        // erbjuder nu identiska val, inklusive "Kräv mer" när canCounter.
        const choices = bidReceivedEvent(bid, game).choices
        return (
          <IncomingBidCard
            key={bid.id}
            bid={bid}
            player={player}
            buyingClub={buyingClub}
            currentRound={currentRound}
            choices={choices}
            onChoose={(choiceId) => handleRespondToBid(bid.id, choiceId)}
            isPrimary={i === 0}
          />
        )
      })}

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
                  <div
                    key={bid.id}
                    className="transfers-list-row"
                    style={{ borderBottom: i < outgoing.length - 1 ? '1px solid var(--border)' : 'none' }}
                    data-entity-id={`bid:${bid.id}`}
                    data-entity-source="TransfersOutgoingBid"
                  >
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
            {/* Å4 (SLUTTEST_KO.md, 2026-08-18): "Marknaden är tom" visades tidigare
                även med tre aktiva inkommande bud synliga precis ovanför — olika
                datakällor (köpbara spelare vs. bud på egna spelare) men samma skärm,
                läste som självmotsägande. Gaten mot incomingBids.length istället för
                ny text som förklarar skillnaden (Code skriver ingen ny svensk text). */}
            {groups.length === 0 && incomingBids.length === 0 ? (
              <div className="card-sharp" style={{ padding: '24px 18px', textAlign: 'center' }}>
                <p style={{ fontSize: 22, marginBottom: 10 }}>🔍</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Marknaden är tom just nu
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 16 }}>
                  Spelare dyker upp när klubbar säljer. Vill du hitta egna talanger — skicka ut en scout.
                </p>
                <button
                  onClick={() => setActiveTab('scouting')}
                  className="btn btn-primary"
                >
                  Gå till Scouting →
                </button>
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
                      isLast={group.players.length <= 10 && i >= Math.min(group.players.length, 10) - 1}
                      activeAssignment={!!activeAssignment}
                      scoutBudget={scoutBudget}
                      onBid={setBiddingPlayerId}
                      onScout={handleScout}
                    />
                  ))}
                  {/* AUDIT DEL 2 A4 (2026-08-09): slice(0,10) dolde tidigare grupper
                      över 10 spelare utan att visa att det fanns fler — samma
                      spillmönster som Trupp-chipsen (VISUELL_AUDIT punkt 3, +N-pill). */}
                  {group.players.length > 10 && (
                    <div style={{
                      padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)',
                      textAlign: 'center', fontWeight: 600,
                    }}>
                      +{group.players.length - 10} fler spelare
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Scouting tab */}
      {activeTab === 'scouting' && (
        <ScoutingTab
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
          onToggleShortlist={toggleScoutShortlist}
        />
      )}

      {/* Contracts tab */}
      {/* Kontrakt-tabben flyttad till Trupp → Värvning (ContractsTab), B1-nav Fas 2 */}

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
              <div key={player.id} className="transfers-list-row-lg" style={{ borderBottom: index < managedClubPlayers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="transfers-list-content">
                  <p className="transfers-list-name-lg">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="transfers-list-meta">
                    {positionShort(player.position)} · Styrka {Math.round(player.currentAbility)} · MV {formatFinanceAbs(player.marketValue ?? 0)}
                    {(() => {
                      const bidsForPlayer = (game.transferBids ?? []).filter(b => b.playerId === player.id && b.direction === 'incoming')
                      return bidsForPlayer.length > 0
                        ? <span className="transfers-interest-badge">🔥 {bidsForPlayer.length} klubb{bidsForPlayer.length > 1 ? 'ar' : ''} intresserad{bidsForPlayer.length > 1 ? 'e' : ''}</span>
                        : null
                    })()}
                  </p>
                </div>
                {player.isClubLegend ? (
                  <span className="btn btn-ghost transfers-legend-lock-badge">
                    <Lock size={11} /> Legend
                  </span>
                ) : (
                  <button
                    onClick={() => windowOpen && handleListForSale(player.id)}
                    disabled={!windowOpen}
                    className={`btn ${windowOpen ? 'btn-outline' : 'btn-ghost'}`}
                    style={{ flexShrink: 0, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: windowOpen ? 'pointer' : 'not-allowed', opacity: windowOpen ? 1 : 0.6 }}
                  >
                    Till salu
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
