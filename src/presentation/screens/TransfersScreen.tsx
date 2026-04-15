import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { useGameStore } from '../store/gameStore'
import { saveSaveGame } from '../../infrastructure/persistence/saveGameStorage'
import type { Player } from '../../domain/entities/Player'
import { getTransferWindowStatus } from '../../domain/services/transferWindowService'
import { formatCurrency, positionShort } from '../utils/formatters'
import { SectionLabel } from '../components/SectionLabel'
import { bidReceivedEvent } from '../../domain/services/events/eventFactories'
import { FirstVisitHint } from '../components/FirstVisitHint'

import { RenewContractModal } from '../components/transfers/RenewContractModal'
import { BidModal } from '../components/transfers/BidModal'
import { TransferPlayerCard } from '../components/transfers/TransferPlayerCard'
import { ActiveBidsList } from '../components/transfers/ActiveBidsList'
import { FreeAgentList } from '../components/transfers/FreeAgentList'

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

export function TransfersScreen() {
  const game = useGameStore(s => s.game)
  const startEvaluation = useGameStore(s => s.startEvaluation)
  const placeOutgoingBid = useGameStore(s => s.placeOutgoingBid)
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
  const [activeTab, setActiveTab] = useState<'marknad' | 'scouting' | 'contracts' | 'freeagents' | 'sell'>('marknad')
  const [spaningPosition, setSpanningPosition] = useState<string>('any')
  const [spaningMaxAge, setSpanningMaxAge] = useState<number>(30)
  const [spaningMaxSalary, setSpanningMaxSalary] = useState<number>(16000)
  const location = useLocation()

  useEffect(() => {
    const state = location.state as any
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
    if (projectedWageBill > club.wageBudget) {
      setWageWarning(`OBS: Lönekostnaderna överstiger budgeten med ${formatCurrency(projectedWageBill - club.wageBudget)}/mån`)
    }
    const isMinSalary = newSalary === minSalary
    const updatedPlayers = game.players.map(p =>
      p.id === playerId
        ? { ...p, contractUntilSeason: game.currentSeason + years, salary: newSalary, morale: isMinSalary ? Math.max(20, p.morale - 12) : p.morale }
        : p
    )
    const updatedGame = { ...game, players: updatedPlayers }
    useGameStore.setState({ game: updatedGame })
    saveSaveGame(updatedGame).catch(e => console.warn('Save failed:', e))
    setRenewingPlayerId(null)
    setRenewError(null)
    setRenewConfirmText(`✅ Kontrakt förlängt till ${game.currentSeason + years}`)
    setTimeout(() => setRenewConfirmText(null), 2000)
  }

  function handleSignFreeAgent(agentId: string) {
    if (!game) return
    const agent = game.transferState.freeAgents.find(p => p.id === agentId)
    if (!agent) return
    const agentWithClub = { ...agent, clubId: game.managedClubId, contractUntilSeason: game.currentSeason + 2 }
    const updatedPlayers = [...game.players, agentWithClub]
    const updatedFreeAgents = game.transferState.freeAgents.filter(p => p.id !== agentId)
    const updatedClubs = game.clubs.map(c =>
      c.id === game.managedClubId
        ? { ...c, squadPlayerIds: [...c.squadPlayerIds, agentId] }
        : c
    )
    useGameStore.setState({ game: { ...game, players: updatedPlayers, clubs: updatedClubs, transferState: { ...game.transferState, freeAgents: updatedFreeAgents } } })
  }

  function handleListForSale(playerId: string) {
    if (!game) return
    const player = game.players.find(p => p.id === playerId)
    if (!player) return
    const otherClubs = game.clubs.filter(c => c.id !== game.managedClubId)
    if (otherClubs.length === 0) return
    const buyingClub = otherClubs[Math.floor(Math.random() * otherClubs.length)]
    const marketVal = player.marketValue ?? 50000
    const offerAmount = Math.round(marketVal * 0.9 / 5000) * 5000
    const offeredSalary = Math.round(player.salary * 1.1 / 1000) * 1000
    const bid = {
      id: `bid_sell_${Date.now()}_${playerId}`,
      playerId,
      buyingClubId: buyingClub.id,
      sellingClubId: game.managedClubId,
      offerAmount,
      offeredSalary,
      contractYears: 3,
      direction: 'incoming' as const,
      status: 'pending' as const,
      createdRound: Math.max(0, ...game.fixtures.filter(f => f.status === 'completed' && !f.isCup).map(f => f.roundNumber)),
      expiresRound: Math.max(0, ...game.fixtures.filter(f => f.status === 'completed' && !f.isCup).map(f => f.roundNumber)) + 2,
    }
    const event = bidReceivedEvent(bid, game)
    useGameStore.setState({ game: { ...game, transferBids: [...(game.transferBids ?? []), bid], pendingEvents: [...(game.pendingEvents ?? []), event] } })
  }

  function handleBid(playerId: string, offerAmount: number, offeredSalary: number, contractYears: number) {
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
    <div style={{ padding: '0 12px', paddingTop: 8, overflowY: 'auto', height: '100%', background: 'var(--bg)' }}>

      {!(game.dismissedHints ?? []).includes('transfers') && (
        <FirstVisitHint
          screenId="transfers"
          text="Transferfönstret stänger omgång 15. Scouta billigt. Sälj dyrt. Akademin är gratis."
          onDismiss={() => dismissHint('transfers')}
        />
      )}

      {scoutMessage && (
        <div className="card-sharp" style={{ background: 'rgba(196,122,58,0.04)', border: '1px solid rgba(196,122,58,0.15)', padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--accent)' }}>
          {scoutMessage}
        </div>
      )}

      {activeAssignment && (() => {
        const target = game.players.find(p => p.id === activeAssignment.targetPlayerId)
        const targetClub = game.clubs.find(c => c.id === activeAssignment.targetClubId)
        return (
          <div className="card-sharp" style={{ background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.25)', padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            🔍 Scouting pågår: <strong>{target?.firstName} {target?.lastName}</strong> ({targetClub?.name ?? '?'}) · {activeAssignment.roundsRemaining} omgång{activeAssignment.roundsRemaining !== 1 ? 'ar' : ''} kvar
          </div>
        )
      })()}

      {game.activeTalentSearch && !activeAssignment && (
        <div className="card-sharp" style={{ background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.25)', padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          🔎 Scouten är ute på talangspaning. Klar om {game.activeTalentSearch.roundsRemaining} omgång{game.activeTalentSearch.roundsRemaining !== 1 ? 'ar' : ''}.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '4px 0' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>🔍 Scoutbudget:</span>
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
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 6, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`btn ${activeTab === tab.key ? 'btn-copper' : 'btn-ghost'}`}
                  style={{ padding: '6px 10px', whiteSpace: 'nowrap', position: 'relative', flexShrink: 0 }}
                >
                  {tab.label}
                  {tab.dot && (
                    <span style={{
                      position: 'absolute', top: 2, right: 2,
                      width: 6, height: 6, borderRadius: '50%',
                      background: tab.dot === 'danger' ? 'var(--danger)' : 'var(--accent)',
                    }} />
                  )}
                </button>
              ))}
            </div>
            {/* Fade gradient signals more content to the right */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 20, height: 'calc(100% - 7px)',
              background: 'linear-gradient(to left, var(--bg), transparent)',
              pointerEvents: 'none',
            }} />
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
        <p style={{ padding: '6px 16px 10px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)', marginBottom: 10 }}>
          {({
            marknad: 'Spelare som är tillgängliga för transfer just nu.',
            scouting: 'Utvärdera spelare eller sök nya talanger.',
            contracts: 'Förläng avtal med dina spelare.',
            freeagents: 'Kontraktslösa spelare. Ingen transfersumma.',
            sell: 'Sälj spelare från din trupp.',
          } as Record<string, string>)[activeTab]}
        </p>
      )}

      <div className="card-sharp" style={{
        background: windowInfo.status === 'open' ? 'rgba(34,197,94,0.08)' : windowInfo.status === 'winter' ? 'rgba(196,122,58,0.08)' : 'rgba(239,68,68,0.06)',
        border: `1px solid ${windowInfo.status === 'open' ? 'rgba(34,197,94,0.3)' : windowInfo.status === 'winter' ? 'rgba(196,122,58,0.25)' : 'rgba(239,68,68,0.2)'}`,
        padding: '8px 12px',
        marginBottom: 10,
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: windowInfo.status === 'open' ? 'var(--success)' : windowInfo.status === 'winter' ? 'var(--accent)' : 'var(--danger)' }}>
          {windowInfo.status === 'open' ? '🟢' : windowInfo.status === 'winter' ? '🟡' : '🔴'} {windowInfo.label} · <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{windowInfo.description}</span>
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
                  <div key={bid.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: i < outgoing.length - 1 ? '1px solid var(--border)' : 'none', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{player ? `${player.firstName} ${player.lastName}` : '?'}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{club?.name ?? '?'} · Bud: {formatValue(bid.offerAmount)}</p>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>Väntar på svar</span>
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
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, padding: '0 2px' }}>{group.desc}</p>
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
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>{renewConfirmText}</p>
            </div>
          )}
          {wageWarning && (
            <div style={{ background: 'rgba(196,122,58,0.12)', border: '1px solid rgba(196,122,58,0.4)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>⚠️ {wageWarning}</p>
              <button onClick={() => setWageWarning(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
          )}
          <SectionLabel>Utgående kontrakt</SectionLabel>
          {expiringPlayers.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>Inga kontrakt utgår snart.</p>
          ) : (
            <div className="card-sharp" style={{ overflow: 'hidden' }}>
              {expiringPlayers.map((player, index) => (
                <div key={player.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: index < expiringPlayers.length - 1 ? '1px solid var(--border)' : 'none', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.firstName} {player.lastName}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
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
              <div key={player.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: index < managedClubPlayers.length - 1 ? '1px solid var(--border)' : 'none', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.firstName} {player.lastName}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                    {positionShort(player.position)} · Styrka {Math.round(player.currentAbility)} · MV {formatCurrency(player.marketValue ?? 0)}
                    {(() => {
                      const bidsForPlayer = (game.transferBids ?? []).filter(b => b.playerId === player.id && b.direction === 'incoming')
                      return bidsForPlayer.length > 0
                        ? <span style={{ color: 'var(--accent)', fontWeight: 600, marginLeft: 6 }}>🔥 {bidsForPlayer.length} klubb{bidsForPlayer.length > 1 ? 'ar' : ''} intresserad{bidsForPlayer.length > 1 ? 'e' : ''}</span>
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
        return (
          <BidModal
            player={biddingPlayer}
            managedClub={managedClub}
            onClose={() => setBiddingPlayerId(null)}
            onConfirm={handleBid}
          />
        )
      })()}
    </div>
  )
}
