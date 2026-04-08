import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { useGameStore } from '../store/gameStore'
import type { Player } from '../../domain/entities/Player'
import { getTransferWindowStatus } from '../../domain/services/transferWindowService'
import { formatCurrency, positionShort } from '../utils/formatters'
import { SectionLabel } from '../components/SectionLabel'
import { bidReceivedEvent } from '../../domain/services/events/eventFactories'

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

  const [renewingPlayerId, setRenewingPlayerId] = useState<string | null>(null)
  const [renewError, setRenewError] = useState<string | null>(null)
  const [wageWarning, setWageWarning] = useState<string | null>(null)
  const [scoutMessage, setScoutMessage] = useState<string | null>(null)
  const [biddingPlayerId, setBiddingPlayerId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'marknad' | 'scouting' | 'contracts' | 'freeagents' | 'sell'>('marknad')
  const [spaningPosition, setSpanningPosition] = useState<string>('any')
  const [spaningMaxAge, setSpanningMaxAge] = useState<number>(30)
  const [spaningMaxSalary, setSpanningMaxSalary] = useState<number>(16000)
  const location = useLocation()

  useEffect(() => {
    const highlightId = (location.state as any)?.highlightPlayer
    if (highlightId && game) {
      const player = game.players.find(p => p.id === highlightId)
      if (player && player.clubId !== game.managedClubId) {
        setBiddingPlayerId(highlightId)
        setActiveTab('scouting')
      }
      window.history.replaceState({ ...window.history.state, usr: {} }, '')
    }
  }, [location.state])

  if (!game) return null

  const managedClubPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)

  const expiringPlayers = managedClubPlayers
    .filter(p => p.contractUntilSeason <= game.currentSeason + 1)
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
    const updatedPlayers = game.players.map(p =>
      p.id === playerId ? { ...p, contractUntilSeason: game.currentSeason + years, salary: newSalary } : p
    )
    useGameStore.setState({ game: { ...game, players: updatedPlayers } })
    setRenewingPlayerId(null)
    setRenewError(null)
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

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
        {([
          { key: 'marknad', label: '🏪 Marknad' },
          { key: 'scouting', label: '🔍 Scouting' },
          { key: 'contracts', label: '📋 Kontrakt' },
          { key: 'freeagents', label: '👤 Fria' },
          { key: 'sell', label: '💰 Sälj' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn ${activeTab === tab.key ? 'btn-copper' : 'btn-ghost'}`}
            style={{ padding: '6px 10px', fontSize: 12, fontWeight: activeTab === tab.key ? 600 : 400, whiteSpace: 'nowrap' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {({ marknad: 'Spelare som är tillgängliga för transfer just nu.',
          scouting: 'Utvärdera spelare eller sök nya talanger.',
          contracts: 'Förläng avtal med dina spelare.',
          freeagents: 'Kontraktslösa spelare. Ingen transfersumma.',
          sell: 'Sälj spelare från din trupp.',
      } as Record<string, string>)[activeTab] && (
        <p style={{ padding: '6px 16px 10px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)', marginBottom: 10 }}>
          {({ marknad: 'Spelare som är tillgängliga för transfer just nu.',
              scouting: 'Utvärdera spelare eller sök nya talanger.',
              contracts: 'Förläng avtal med dina spelare.',
              freeagents: 'Kontraktslösa spelare. Ingen transfersumma.',
              sell: 'Sälj spelare från din trupp.',
          } as Record<string, string>)[activeTab]}
        </p>
      )}

      <div className="card-sharp card-stagger-1" style={{
        background: windowInfo.status === 'open' ? 'rgba(34,197,94,0.08)' : windowInfo.status === 'winter' ? 'rgba(196,122,58,0.08)' : 'rgba(239,68,68,0.06)',
        border: `1px solid ${windowInfo.status === 'open' ? 'rgba(34,197,94,0.3)' : windowInfo.status === 'winter' ? 'rgba(196,122,58,0.25)' : 'rgba(239,68,68,0.2)'}`,
        padding: '10px 14px',
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: windowInfo.status === 'open' ? 'var(--success)' : windowInfo.status === 'winter' ? 'var(--accent)' : 'var(--danger)', marginBottom: 4 }}>
          {windowInfo.status === 'open' ? '🟢' : windowInfo.status === 'winter' ? '🟡' : '🔴'} {windowInfo.label}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{windowInfo.description}</p>
      </div>

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
          {wageWarning && (
            <div style={{ background: 'rgba(196,122,58,0.12)', border: '1px solid rgba(196,122,58,0.4)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>⚠️ {wageWarning}</p>
              <button onClick={() => setWageWarning(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
          )}
          <SectionLabel>Utgående kontrakt</SectionLabel>
          {expiringPlayers.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '12px 0' }}>Inga kontrakt utgår snart.</p>
          ) : (
            <div className="card-round" style={{ overflow: 'hidden' }}>
              {expiringPlayers.map((player, index) => (
                <div key={player.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: index < expiringPlayers.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.firstName} {player.lastName}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {positionShort(player.position)} · {formatValue(player.marketValue)} · {formatCurrency(player.salary)}/mån · t.o.m. {player.contractUntilSeason}
                    </p>
                  </div>
                  <button onClick={() => setRenewingPlayerId(player.id)} className="btn btn-outline" style={{ flexShrink: 0, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
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
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Transferfönstret är stängt. Försäljning möjlig sommaren och vintern.</p>
          )}
          <div className="card-round" style={{ overflow: 'hidden' }}>
            {managedClubPlayers.sort((a, b) => b.currentAbility - a.currentAbility).map((player, index) => (
              <div key={player.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: index < managedClubPlayers.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.firstName} {player.lastName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
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
                  style={{ flexShrink: 0, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: windowOpen ? 'pointer' : 'not-allowed', opacity: windowOpen ? 1 : 0.6 }}
                >
                  Sätt till salu
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
