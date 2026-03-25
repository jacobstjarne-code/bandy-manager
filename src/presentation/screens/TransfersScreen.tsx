import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { PlayerPosition } from '../../domain/enums'
import type { Player } from '../../domain/entities/Player'
import { saveSaveGame } from '../../infrastructure/persistence/saveGameStorage'
import { getTransferWindowStatus } from '../../domain/services/transferWindowService'
import { getScoutReportAge } from '../../domain/services/scoutingService'

function formatCurrency(n: number): string {
  return n.toLocaleString('sv-SE') + ' kr'
}

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

function positionShort(pos: PlayerPosition): string {
  const map: Record<PlayerPosition, string> = {
    [PlayerPosition.Goalkeeper]: 'MV',
    [PlayerPosition.Defender]: 'DEF',
    [PlayerPosition.Half]: 'HALF',
    [PlayerPosition.Midfielder]: 'MID',
    [PlayerPosition.Forward]: 'FWD',
  }
  return map[pos] ?? pos
}

interface RenewModalProps {
  player: Player
  currentSeason: number
  onClose: () => void
  onConfirm: (playerId: string, newSalary: number, years: number) => void
}

function RenewContractModal({ player, currentSeason, onClose, onConfirm }: RenewModalProps) {
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
        padding: '24px 20px',
        width: '100%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Förläng kontrakt</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', width: 32, height: 32, fontSize: 16 }}>✕</button>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 20, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Nuvarande: {formatCurrency(player.salary)}/mån · kontrakt t.o.m. säsong {player.contractUntilSeason}
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
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', background: years === y ? 'var(--accent)' : 'var(--bg-elevated)', border: '1px solid ' + (years === y ? 'var(--accent)' : 'var(--border)'), color: years === y ? '#fff' : 'var(--text-secondary)', fontSize: 15, fontWeight: 600 }}
              >
                {y} år
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Nytt slutdatum: säsong {currentSeason + years}</p>
        </div>
        <button onClick={() => onConfirm(player.id, newSalary, years)} style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600 }}>
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
  const [offeredSalary, setOfferedSalary] = useState(player.salary)
  const [contractYears, setContractYears] = useState(3)
  const canAfford = managedClub.transferBudget >= offerAmount

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end', maxWidth: 430, margin: '0 auto',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: '16px 16px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none', padding: '24px 20px', width: '100%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Lägg bud</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', width: 32, height: 32, fontSize: 16 }}>✕</button>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 16, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
          Marknadsvärde: {formatValue(player.marketValue)} · Transferbudget: {formatValue(managedClub.transferBudget)}
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
              <button key={y} onClick={() => setContractYears(y)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', background: contractYears === y ? 'var(--accent)' : 'var(--bg-elevated)', border: '1px solid ' + (contractYears === y ? 'var(--accent)' : 'var(--border)'), color: contractYears === y ? '#fff' : 'var(--text-secondary)', fontSize: 15, fontWeight: 600 }}>
                {y} år
              </button>
            ))}
          </div>
        </div>
        {!canAfford && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>Otillräcklig transferbudget</p>}
        <button
          onClick={() => canAfford && onConfirm(player.id, offerAmount, offeredSalary, contractYears)}
          disabled={!canAfford}
          style={{ width: '100%', padding: '14px', background: canAfford ? 'var(--accent)' : 'var(--bg-elevated)', color: canAfford ? '#fff' : 'var(--text-muted)', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600, border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed', opacity: canAfford ? 1 : 0.5 }}>
          Lägg bud
        </button>
      </div>
    </div>
  )
}

export function TransfersScreen() {
  const game = useGameStore(s => s.game)
  const startScout = useGameStore(s => s.startScout)
  const placeOutgoingBid = useGameStore(s => s.placeOutgoingBid)
  const [renewingPlayerId, setRenewingPlayerId] = useState<string | null>(null)
  const [scoutMessage, setScoutMessage] = useState<string | null>(null)
  const [biddingPlayerId, setBiddingPlayerId] = useState<string | null>(null)

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
    const updatedPlayers = game.players.map(p =>
      p.id === playerId ? { ...p, contractUntilSeason: game.currentSeason + years, salary: newSalary } : p
    )
    const updatedGame = { ...game, players: updatedPlayers }
    useGameStore.setState({ game: updatedGame })
    saveSaveGame(updatedGame)
    setRenewingPlayerId(null)
  }

  function handleSignFreeAgent(agentId: string) {
    if (!game) return
    const updatedPlayers = game.players.map(p => p.id === agentId ? { ...p, clubId: game.managedClubId } : p)
    const updatedFreeAgents = game.transferState.freeAgents.filter(p => p.id !== agentId)
    const updatedGame = { ...game, players: updatedPlayers, transferState: { ...game.transferState, freeAgents: updatedFreeAgents } }
    useGameStore.setState({ game: updatedGame })
    saveSaveGame(updatedGame)
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
    const result = startScout(player.id, player.clubId, sameRegion)
    if (result.success) {
      const rounds = sameRegion ? 1 : 2
      setScoutMessage(`Scout utsänd till ${targetClub?.name ?? 'okänd klubb'}. Rapport om ${rounds} omgång${rounds > 1 ? 'ar' : ''}.`)
      setTimeout(() => setScoutMessage(null), 4000)
    } else {
      setScoutMessage(result.error ?? 'Kunde inte skicka scout.')
      setTimeout(() => setScoutMessage(null), 3000)
    }
  }

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Transfers</h2>
        <span style={{ fontSize: 12, color: scoutBudget > 3 ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 600 }}>
          🔍 {scoutBudget} scouts kvar
        </span>
      </div>

      {/* Scout toast */}
      {scoutMessage && (
        <div style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--accent)' }}>
          {scoutMessage}
        </div>
      )}

      {/* Active scout assignment */}
      {activeAssignment && (() => {
        const target = game.players.find(p => p.id === activeAssignment.targetPlayerId)
        const targetClub = game.clubs.find(c => c.id === activeAssignment.targetClubId)
        return (
          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            🔍 Scouting pågår: <strong>{target?.firstName} {target?.lastName}</strong> ({targetClub?.name ?? '?'}) · {activeAssignment.roundsRemaining} omgång{activeAssignment.roundsRemaining !== 1 ? 'ar' : ''} kvar
          </div>
        )
      })()}

      {/* Transfer window status banner */}
      <div style={{
        background: windowInfo.status === 'open' ? 'rgba(34,197,94,0.08)' : windowInfo.status === 'winter' ? 'rgba(59,130,246,0.08)' : 'rgba(239,68,68,0.06)',
        border: `1px solid ${windowInfo.status === 'open' ? 'rgba(34,197,94,0.3)' : windowInfo.status === 'winter' ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.2)'}`,
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: windowInfo.status === 'open' ? 'var(--success)' : windowInfo.status === 'winter' ? '#60a5fa' : 'var(--danger)', marginBottom: 4 }}>
          {windowInfo.status === 'open' ? '🟢' : windowInfo.status === 'winter' ? '🔵' : '🔴'} {windowInfo.label}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{windowInfo.description}</p>
      </div>

      {/* Scouting section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', margin: 0 }}>
            Scouting — andra lag
          </p>
          <span style={{ fontSize: 12, color: scoutBudget > 3 ? 'var(--text-secondary)' : 'var(--danger)', fontWeight: 600 }}>
            Scoutbudget: {scoutBudget} kvar
          </span>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
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
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.firstName} {player.lastName}
                    {isScounted && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)' }}>🔍</span>}
                    {isStale && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--danger)', fontWeight: 400 }}>Föråldrad</span>}
                    {reportAge === 'aging' && !isStale && <span style={{ marginLeft: 6, fontSize: 10, color: '#f59e0b', fontWeight: 400 }}>1 säsong sedan</span>}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                    {positionShort(player.position)} · {club?.name ?? '?'} · {formatValue(player.marketValue)} ·{' '}
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
                    style={{
                      flexShrink: 0,
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.35)',
                      color: 'var(--success)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
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
                    style={{
                      flexShrink: 0,
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: canScout ? 'rgba(59,130,246,0.12)' : 'var(--bg-elevated)',
                      border: `1px solid ${canScout ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                      color: canScout ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: canScout ? 'pointer' : 'not-allowed',
                      opacity: canScout ? 1 : 0.5,
                    }}
                  >
                    🔍 Scouta
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Scout reports section */}
      {Object.keys(scoutReports).length > 0 && (() => {
        const reportEntries = Object.values(scoutReports)
        return (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 12 }}>
              Scoutrapporter ({reportEntries.length})
            </p>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {reportEntries.map((report, index) => {
                const reportPlayer = game.players.find(p => p.id === report.playerId)
                const reportClub = game.clubs.find(c => c.id === report.clubId)
                const age = getScoutReportAge(report, game.currentSeason, report.scoutedSeason)
                const freshnessLabel = age === 'fresh' ? 'Färsk' : age === 'aging' ? 'Gammal' : 'Inaktuell'
                const freshnessColor = age === 'fresh' ? 'var(--success)' : age === 'aging' ? '#f59e0b' : 'var(--danger)'
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
                    </div>
                    {windowOpen && reportPlayer && managedClub && (
                      <button
                        onClick={() => setBiddingPlayerId(report.playerId)}
                        style={{
                          flexShrink: 0,
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(34,197,94,0.1)',
                          border: '1px solid rgba(34,197,94,0.35)',
                          color: 'var(--success)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
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

      {/* Expiring contracts section */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 12 }}>
          Utgående kontrakt
        </p>
        {expiringPlayers.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '12px 0' }}>Inga kontrakt utgår snart.</p>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {expiringPlayers.map((player, index) => (
              <div key={player.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: index < expiringPlayers.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.firstName} {player.lastName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {positionShort(player.position)} · {formatValue(player.marketValue)} · {formatCurrency(player.salary)}/mån · t.o.m. {player.contractUntilSeason}
                  </p>
                </div>
                <button onClick={() => setRenewingPlayerId(player.id)} style={{ flexShrink: 0, padding: '6px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
                  Förläng
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Free agents section */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 12 }}>
          Fria agenter
        </p>
        {freeAgents.length === 0 ? (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 16px' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Inga fria agenter tillgängliga just nu. Fria agenter dyker upp vid säsongsslut.</p>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {freeAgents.map((agent, index) => (
              <div key={agent.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: index < freeAgents.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {agent.firstName} {agent.lastName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {positionShort(agent.position)} · Styrka {Math.round(agent.currentAbility)} · {formatCurrency(agent.salary)}/mån
                  </p>
                </div>
                <button
                  onClick={() => windowOpen && handleSignFreeAgent(agent.id)}
                  disabled={!windowOpen}
                  style={{ flexShrink: 0, padding: '6px 12px', background: windowOpen ? 'var(--accent)' : 'var(--bg-elevated)', border: windowOpen ? 'none' : '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: windowOpen ? '#fff' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: windowOpen ? 'pointer' : 'not-allowed', opacity: windowOpen ? 1 : 0.6 }}
                >
                  Värva
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {renewingPlayer && (
        <RenewContractModal
          player={renewingPlayer}
          currentSeason={game.currentSeason}
          onClose={() => setRenewingPlayerId(null)}
          onConfirm={handleRenew}
        />
      )}

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
