import { useState } from 'react'

import { useGameStore } from '../store/gameStore'
import type { Player } from '../../domain/entities/Player'
import { getTransferWindowStatus } from '../../domain/services/transferWindowService'
import { getScoutReportAge } from '../../domain/services/scoutingService'
import { formatCurrency, positionShort } from '../utils/formatters'
import { SectionLabel } from '../components/SectionLabel'
import { bidReceivedEvent } from '../../domain/services/events/eventFactories'

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

interface RenewModalProps {
  player: Player
  currentSeason: number
  minSalary: number
  error?: string | null
  onClose: () => void
  onConfirm: (playerId: string, newSalary: number, years: number) => void
}

function RenewContractModal({ player, currentSeason, minSalary, error, onClose, onConfirm }: RenewModalProps) {
  const [newSalary, setNewSalary] = useState(player.salary)
  const [years, setYears] = useState(1)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'flex-end',
      maxWidth: 430,
      margin: '0 auto',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '16px 16px 0 0',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        padding: '24px 20px 32px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>Förläng kontrakt</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, fontSize: 16, padding: 0 }}>✕</button>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 20, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Nuvarande: {formatCurrency(player.salary)}/mån · kontrakt t.o.m. säsong {player.contractUntilSeason}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Lägsta acceptabelt: {formatCurrency(minSalary)}/mån
          </p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Ny lön (kr/mån)</label>
          <input
            type="number"
            value={newSalary}
            onChange={e => setNewSalary(Number(e.target.value))}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 15 }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Antal år</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map(y => (
              <button
                key={y}
                onClick={() => setYears(y)}
                className={`btn ${years === y ? 'btn-copper' : 'btn-outline'}`}
                style={{ flex: 1, padding: '10px', fontSize: 15, fontWeight: 600 }}
              >
                {y} år
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Nytt slutdatum: säsong {currentSeason + years}</p>
        </div>
        {error && <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
        <button
          onClick={() => onConfirm(player.id, newSalary, years)}
          className="btn btn-copper"
          style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600 }}
        >
          Förläng kontrakt
        </button>
      </div>
    </div>
  )
}

interface BidModalProps {
  player: Player
  managedClub: { transferBudget: number; finances: number }
  onClose: () => void
  onConfirm: (playerId: string, offerAmount: number, offeredSalary: number, contractYears: number) => void
}

function BidModal({ player, managedClub, onClose, onConfirm }: BidModalProps) {
  const suggestedBid = Math.round((player.marketValue || 50000) / 5000) * 5000
  const [offerAmount, setOfferAmount] = useState(suggestedBid)
  const [offeredSalary, setOfferedSalary] = useState(Math.round(player.salary / 500) * 500)
  const [contractYears, setContractYears] = useState(3)
  const canAfford = managedClub.transferBudget >= offerAmount

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end', maxWidth: 430, margin: '0 auto',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: '14px 14px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none',
        padding: '20px 16px 28px', width: '100%',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>Lägg bud</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, fontSize: 16, padding: 0 }}>✕</button>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 16, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
          Marknadsvärde: {formatValue(player.marketValue ?? 0)} · Transferbudget: {formatValue(managedClub.transferBudget)}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Budsumma (kr)</label>
          <input type="number" value={offerAmount} onChange={e => setOfferAmount(Number(e.target.value))} step={5000}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 15 }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Erbjuden lön (kr/mån)</label>
          <input type="number" value={offeredSalary} onChange={e => setOfferedSalary(Number(e.target.value))} step={1000}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 15 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Kontraktslängd</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map(y => (
              <button
                key={y}
                onClick={() => setContractYears(y)}
                className={`btn ${contractYears === y ? 'btn-copper' : 'btn-outline'}`}
                style={{ flex: 1, padding: '10px', fontSize: 15, fontWeight: 600 }}
              >
                {y} år
              </button>
            ))}
          </div>
        </div>
        {!canAfford && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>Otillräcklig transferbudget</p>}
        <button
          onClick={() => canAfford && onConfirm(player.id, offerAmount, offeredSalary, contractYears)}
          disabled={!canAfford}
          className={`btn ${canAfford ? 'btn-copper' : 'btn-ghost'}`}
          style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600, cursor: canAfford ? 'pointer' : 'not-allowed', opacity: canAfford ? 1 : 0.5 }}
        >
          Lägg bud
        </button>
      </div>
    </div>
  )
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

  // Other-club players eligible for scouting (not managed club, not free agents)
  const scoutablePlayers = game.players
    .filter(p => p.clubId !== game.managedClubId)
    .sort((a, b) => {
      const aScout = !!scoutReports[a.id]
      const bScout = !!scoutReports[b.id]
      if (aScout !== bScout) return aScout ? 1 : -1  // unscounted first
      return (b.currentAbility - a.currentAbility)
    })

  function handleRenew(playerId: string, newSalary: number, years: number) {
    if (!game) return
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    if (!managedClub) return
    const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const currentPlayer = squadPlayers.find(p => p.id === playerId)
    if (!currentPlayer) return
    // AI negotiation: player demands a salary based on CA
    const isFullTimePro = !currentPlayer.dayJob
    const minSalary = Math.round((isFullTimePro
      ? currentPlayer.currentAbility * 200 * 0.80
      : currentPlayer.currentAbility * 80 * 0.80) / 500) * 500
    if (newSalary < minSalary) {
      setRenewError(`${currentPlayer.firstName} avslår — kräver minst ${formatCurrency(minSalary)}/mån`)
      return
    }
    // Spelaren kan avvisa exakt minlön om CA > 60, god form eller hög PA
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
    // Budget warning (non-blocking)
    const currentWageBill = squadPlayers.reduce((sum, p) => sum + p.salary, 0)
    const projectedWageBill = currentWageBill - currentPlayer.salary + newSalary
    if (projectedWageBill > managedClub.wageBudget) {
      setWageWarning(`OBS: Lönekostnaderna överstiger budgeten med ${formatCurrency(projectedWageBill - managedClub.wageBudget)}/mån`)
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
    // Pick a random AI club as the "interested buyer"
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
    const updatedGame = {
      ...game,
      transferBids: [...(game.transferBids ?? []), bid],
      pendingEvents: [...(game.pendingEvents ?? []), event],
    }
    useGameStore.setState({ game: updatedGame })
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

  const currentRound = game.fixtures.filter(f => f.status === 'scheduled').sort((a, b) => a.roundNumber - b.roundNumber)[0]?.roundNumber ?? 1

  return (
    <div style={{ padding: '0 12px', paddingTop: 8, overflowY: 'auto', height: '100%', background: 'var(--bg)' }}>

      {/* Scout toast */}
      {scoutMessage && (
        <div className="card-sharp" style={{
          background: 'rgba(196,122,58,0.04)',
          border: '1px solid rgba(196,122,58,0.15)',
          padding: '10px 14px',
          marginBottom: 12,
          fontSize: 13,
          color: 'var(--accent)',
        }}>
          {scoutMessage}
        </div>
      )}

      {/* Active scout assignment */}
      {activeAssignment && (() => {
        const target = game.players.find(p => p.id === activeAssignment.targetPlayerId)
        const targetClub = game.clubs.find(c => c.id === activeAssignment.targetClubId)
        return (
          <div className="card-sharp" style={{ background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.25)', padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            🔍 Scouting pågår: <strong>{target?.firstName} {target?.lastName}</strong> ({targetClub?.name ?? '?'}) · {activeAssignment.roundsRemaining} omgång{activeAssignment.roundsRemaining !== 1 ? 'ar' : ''} kvar
          </div>
        )
      })()}

      {/* Active talent search */}
      {game.activeTalentSearch && !activeAssignment && (
        <div className="card-sharp" style={{ background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.25)', padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          🔎 Scouten är ute på talangspaning. Klar om {game.activeTalentSearch.roundsRemaining} omgång{game.activeTalentSearch.roundsRemaining !== 1 ? 'ar' : ''}.
        </div>
      )}

      {/* Scout budget widget */}
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

      {/* Tabs */}
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
            style={{
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: activeTab === tab.key ? 600 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab description */}
      {({ marknad: 'Spelare som är tillgängliga för transfer just nu.',
          scouting: 'Utvärdera spelare eller sök nya talanger.',
          contracts: 'Förläng avtal med dina spelare.',
          freeagents: 'Kontraktslösa spelare. Ingen transfersumma.',
          sell: 'Sälj spelare från din trupp.',
      } as Record<string, string>)[activeTab] && (
        <p style={{
          padding: '6px 16px 10px',
          fontSize: 11,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          borderBottom: '1px solid var(--border)',
          marginBottom: 10,
        }}>
          {({ marknad: 'Spelare som är tillgängliga för transfer just nu.',
              scouting: 'Utvärdera spelare eller sök nya talanger.',
              contracts: 'Förläng avtal med dina spelare.',
              freeagents: 'Kontraktslösa spelare. Ingen transfersumma.',
              sell: 'Sälj spelare från din trupp.',
          } as Record<string, string>)[activeTab]}
        </p>
      )}

      {/* Transfer window status banner */}
      <div className="card-sharp card-stagger-1" style={{
        background: windowInfo.status === 'open' ? 'rgba(34,197,94,0.08)' : windowInfo.status === 'winter' ? 'rgba(196,122,58,0.08)' : 'rgba(239,68,68,0.06)',
        border: `1px solid ${windowInfo.status === 'open' ? 'rgba(34,197,94,0.3)' : windowInfo.status === 'winter' ? 'rgba(196,122,58,0.25)' : 'rgba(239,68,68,0.2)'}`,
        padding: '12px 14px',
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: windowInfo.status === 'open' ? 'var(--success)' : windowInfo.status === 'winter' ? 'var(--accent)' : 'var(--danger)', marginBottom: 4 }}>
          {windowInfo.status === 'open' ? '🟢' : windowInfo.status === 'winter' ? '🟡' : '🔴'} {windowInfo.label}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{windowInfo.description}</p>
      </div>

      {/* Marknad — available players grouped by reason */}
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
                  {group.players.slice(0, 10).map((player, i) => {
                    const club = game.clubs.find(c => c.id === player.clubId)
                    const report = scoutReports[player.id]
                    const isScouted = !!report
                    const estimatedCA = report?.estimatedCA
                    const isBargain = isScouted && estimatedCA && player.marketValue > 0 && (estimatedCA / (player.marketValue / 5000)) > 1.3
                    return (
                      <div key={player.id} style={{
                        display: 'flex', alignItems: 'center', padding: '10px 14px',
                        borderBottom: i < Math.min(group.players.length, 10) - 1 ? '1px solid var(--border)' : 'none',
                        gap: 10,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                            {player.firstName} {player.lastName}
                            {isBargain && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>⭐ Fynd</span>}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {positionShort(player.position)} · {player.age} år · {club?.shortName ?? '?'} · {isScouted ? `Styrka ~${estimatedCA}` : 'Styrka ?'} · MV {formatValue(player.marketValue)}
                          </p>
                        </div>
                        {windowOpen && (
                          <button
                            onClick={() => setBiddingPlayerId(player.id)}
                            className="btn btn-outline"
                            style={{ flexShrink: 0, padding: '5px 10px', fontSize: 11, fontWeight: 600 }}
                          >
                            💰 Bud
                          </button>
                        )}
                        {!isScouted && (
                          <button
                            onClick={() => !activeAssignment && scoutBudget > 0 && handleScout(player)}
                            disabled={!!activeAssignment || scoutBudget <= 0}
                            className={`btn ${!activeAssignment && scoutBudget > 0 ? 'btn-ghost' : 'btn-ghost'}`}
                            style={{ flexShrink: 0, padding: '5px 8px', fontSize: 11, opacity: !activeAssignment && scoutBudget > 0 ? 1 : 0.5 }}
                          >
                            🔍
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Scouting section */}
      {activeTab === 'scouting' && <div className="card-stagger-2" style={{ marginBottom: 24 }}>
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
                    onClick={() => setBiddingPlayerId(player.id)}
                    className="btn btn-outline"
                    style={{
                      flexShrink: 0,
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      marginLeft: 4,
                    }}
                  >
                    💰 Bud
                  </button>
                )}
                {!isScounted && (
                  <button
                    onClick={() => canScout && handleScout(player)}
                    disabled={!canScout}
                    className={`btn ${canScout ? 'btn-outline' : 'btn-ghost'}`}
                    style={{
                      flexShrink: 0,
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: canScout ? 'pointer' : 'not-allowed',
                      opacity: canScout ? 1 : 0.5,
                    }}
                  >
                    {activeAssignment ? '⏳ Scout upptagen' : scoutBudget <= 0 ? '❌ Ingen budget' : '🔍 Utvärdera'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>}

      {/* Scout reports section */}
      {activeTab === 'scouting' && Object.keys(scoutReports).length > 0 && (() => {
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
                const windowOpen = getTransferWindowStatus(game.currentDate).status !== 'closed'
                return (
                  <div
                    key={report.playerId}
                    style={{
                      padding: '12px 14px',
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
                        onClick={() => setBiddingPlayerId(report.playerId)}
                        className="btn btn-outline"
                        style={{
                          flexShrink: 0,
                          padding: '5px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
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

      {/* Spaning (Talent Search) section — merged into scouting tab */}
      {activeTab === 'scouting' && (
        <div className="card-stagger-2" style={{ marginBottom: 24 }}>
          {/* Explainer */}
          <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              🔎 <strong style={{ color: 'var(--text-primary)' }}>Spaning</strong> skickar ut din scout för att hitta okända spelare som matchar dina kriterier. Tar 2 omgångar. Skiljer sig från <em>Scouting</em> som utvärderar kända spelare.
            </p>
          </div>

          {/* Scout busy with evaluation */}
          {game.activeScoutAssignment && (
            <div className="card-sharp" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>
              Scouten är upptagen med en utvärdering. Klar om {game.activeScoutAssignment.roundsRemaining} omgång{game.activeScoutAssignment.roundsRemaining !== 1 ? 'ar' : ''}.
            </div>
          )}

          {/* Active search status */}
          {game.activeTalentSearch && (
            <div className="card-sharp" style={{ background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.25)', padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
              🔍 Scout ute och letar... {game.activeTalentSearch.roundsRemaining} omgång{game.activeTalentSearch.roundsRemaining !== 1 ? 'ar' : ''} kvar
            </div>
          )}

          {/* Search form */}
          {!game.activeTalentSearch && (
            <div className="card-round" style={{ padding: '16px', marginBottom: 16 }}>
              <SectionLabel>Ny talangspaning</SectionLabel>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Position</label>
                <select
                  value={spaningPosition}
                  onChange={e => setSpanningPosition(e.target.value)}
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
                  onChange={e => setSpanningMaxAge(Number(e.target.value))}
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
                  onChange={e => setSpanningMaxSalary(Number(e.target.value))}
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
                  const result = startTalentSearch(spaningPosition, spaningMaxAge, spaningMaxSalary, currentRound)
                  if (result.success) {
                    setScoutMessage('Spaning igång! Rapport om 2 omgångar.')
                    setTimeout(() => setScoutMessage(null), 4000)
                  } else {
                    setScoutMessage(result.error ?? 'Kunde inte starta spaning.')
                    setTimeout(() => setScoutMessage(null), 3000)
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

          {/* Latest talent search results */}
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
                      <div key={suggestion.playerId} style={{ padding: '12px 14px', borderBottom: index < latestResult.players.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 2 }}>
                            {player ? `${player.firstName} ${player.lastName}` : suggestion.playerId}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                            {player ? positionShort(player.position) + ' · ' : ''}{club?.name ?? '?'} · {player ? `${player.age} år` : ''} · Styrka ~{suggestion.estimatedCA}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{suggestion.scoutNotes}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                          {player && !isAlreadyScouted && (
                            <button
                              onClick={() => player && handleScout(player)}
                              disabled={!!activeAssignment || scoutBudget <= 0}
                              className={`btn ${(!activeAssignment && scoutBudget > 0) ? 'btn-outline' : 'btn-ghost'}`}
                              style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: (!activeAssignment && scoutBudget > 0) ? 'pointer' : 'not-allowed', opacity: (!activeAssignment && scoutBudget > 0) ? 1 : 0.5 }}
                            >
                              {activeAssignment ? '⏳ Scout upptagen' : scoutBudget <= 0 ? '❌ Ingen budget' : '🔍 Utvärdera'}
                            </button>
                          )}
                          {windowOpen && player && managedClub && (
                            <button
                              onClick={() => setBiddingPlayerId(suggestion.playerId)}
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
      )}

      {/* Wage budget warning banner */}
      {wageWarning && (
        <div style={{
          background: 'rgba(196,122,58,0.12)', border: '1px solid rgba(196,122,58,0.4)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>⚠️ {wageWarning}</p>
          <button onClick={() => setWageWarning(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Expiring contracts section */}
      {activeTab === 'contracts' && <div className="card-stagger-2" style={{ marginBottom: 24 }}>
        <SectionLabel>Utgående kontrakt</SectionLabel>
        {expiringPlayers.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '12px 0' }}>Inga kontrakt utgår snart.</p>
        ) : (
          <div className="card-round" style={{ overflow: 'hidden' }}>
            {expiringPlayers.map((player, index) => (
              <div key={player.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: index < expiringPlayers.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.firstName} {player.lastName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {positionShort(player.position)} · {formatValue(player.marketValue)} · {formatCurrency(player.salary)}/mån · t.o.m. {player.contractUntilSeason}
                  </p>
                </div>
                <button
                  onClick={() => setRenewingPlayerId(player.id)}
                  className="btn btn-outline"
                  style={{ flexShrink: 0, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
                >
                  Förläng
                </button>
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* Free agents section */}
      {activeTab === 'freeagents' && <div className="card-stagger-2">
        <SectionLabel>Fria agenter</SectionLabel>
        {freeAgents.length === 0 ? (
          <div className="card-round" style={{ padding: '20px 16px' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Inga fria agenter tillgängliga just nu. Fria agenter dyker upp vid säsongsslut.</p>
          </div>
        ) : (
          <div className="card-round" style={{ overflow: 'hidden' }}>
            {freeAgents.map((agent, index) => (
              <div key={agent.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: index < freeAgents.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {agent.firstName} {agent.lastName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {positionShort(agent.position)} · Styrka {scoutReports[agent.id] ? `~${scoutReports[agent.id].estimatedCA}` : '?'} · {formatCurrency(agent.salary)}/mån
                  </p>
                </div>
                <button
                  onClick={() => windowOpen && handleSignFreeAgent(agent.id)}
                  disabled={!windowOpen}
                  className={`btn ${windowOpen ? 'btn-copper' : 'btn-ghost'}`}
                  style={{ flexShrink: 0, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: windowOpen ? 'pointer' : 'not-allowed', opacity: windowOpen ? 1 : 0.6 }}
                >
                  Värva
                </button>
              </div>
            ))}
          </div>
        )}
      </div>}

      {activeTab === 'sell' && <div className="card-stagger-2" style={{ marginBottom: 24 }}>
        <SectionLabel>Sätt spelare till salu</SectionLabel>
        {!windowOpen && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Transferfönstret är stängt. Försäljning möjlig sommaren och vintern.</p>
        )}
        <div className="card-round" style={{ overflow: 'hidden' }}>
          {managedClubPlayers.sort((a, b) => b.currentAbility - a.currentAbility).map((player, index) => (
            <div key={player.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: index < managedClubPlayers.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
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
      </div>}

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
