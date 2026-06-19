import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ArrowRight } from 'lucide-react'
import { useGameStore } from '../../store/gameStore'
import { positionShort, formatValue, formatSalary } from '../../utils/formatters'
import { SectionLabel } from '../SectionLabel'
import { RenewContractModal } from './RenewContractModal'
import { WageOverrunWarning } from './WageOverrunWarning'
import '../../styles/transfers.css'

interface ContractsTabProps {
  /** Deep-link: öppna renew-modalen direkt för denna spelare (PlayerCard "Förläng"). */
  initialRenewPlayerId?: string | null
  onConsumedDeepLink?: () => void
}

// B1-nav Fas 2: kontraktsförlängningen lyft ur TransfersScreen till en egen komponent
// som bor i Trupp → Värvning. Äger HELA renew-flödet (handleRenew + modal + wage-overrun)
// så det finns EN sanning för kontraktsförlängning. TransfersScreens egen wage-overrun
// behålls för bud — samma delade WageOverrunWarning-komponent, separat per-yta-state.
export function ContractsTab({ initialRenewPlayerId, onConsumedDeepLink }: ContractsTabProps) {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const renewContract = useGameStore(s => s.renewContract)

  const [renewingPlayerId, setRenewingPlayerId] = useState<string | null>(null)
  const [renewError, setRenewError] = useState<string | null>(null)
  const [renewConfirmText, setRenewConfirmText] = useState<string | null>(null)
  const [wageWarning, setWageWarning] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [overrunPct, setOverrunPct] = useState(0)

  useEffect(() => {
    if (initialRenewPlayerId) {
      setRenewingPlayerId(initialRenewPlayerId)
      onConsumedDeepLink?.()
    }
  }, [initialRenewPlayerId, onConsumedDeepLink])

  if (!game) return null

  const managedClubPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const expiringPlayers = managedClubPlayers
    .filter(p => p.contractUntilSeason <= game.currentSeason)
    .sort((a, b) => a.contractUntilSeason - b.contractUntilSeason)
  const renewingPlayer = renewingPlayerId ? game.players.find(p => p.id === renewingPlayerId) ?? null : null

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
      setRenewError(`${currentPlayer.firstName} avslår — kräver minst ${formatSalary(minSalary)}`)
      return
    }
    if (newSalary === minSalary) {
      let rejectChance = 0
      if (currentPlayer.currentAbility > 60) rejectChance += 0.40
      if (currentPlayer.form > 65) rejectChance += 0.20
      if ((currentPlayer.potentialAbility ?? 0) > 70) rejectChance += 0.15
      if (Math.random() < rejectChance) {
        const counterSalary = Math.round(minSalary * 1.15 / 500) * 500
        setRenewError(`${currentPlayer.firstName} avvisar erbjudandet — vill ha minst ${formatSalary(counterSalary)}`)
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
        setWageWarning(`OBS: Lönekostnaderna överstiger budgeten med ${formatSalary(result.wageWarning)}`)
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

  return (
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
      {/* B1-nav Fas 3: ingång till transfermarknaden (säsongstabbarna bor på /game/transfers,
          som bara är permanent i navet när fönstret är öppet). */}
      <button
        onClick={() => navigate('/game/transfers')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          padding: '10px 12px', marginBottom: 12, borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}
      >
        <span>Transfermarknaden — marknad, scouting, fria, sälj</span>
        <ArrowRight size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      </button>

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
                  {positionShort(player.position)} · {formatValue(player.marketValue)} · {formatSalary(player.salary)} · t.o.m. {player.contractUntilSeason}
                </p>
              </div>
              <button onClick={() => setRenewingPlayerId(player.id)} className="btn btn-outline" style={{ flexShrink: 0, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}>
                Förläng
              </button>
            </div>
          ))}
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
