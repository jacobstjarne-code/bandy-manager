import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ArrowRight, TriangleAlert } from 'lucide-react'
import { useGameStore } from '../../store/gameStore'
import { computeContractMinSalary, computeLeaguePositionAverages } from '../../../domain/services/economyService'
import { getAvailableContractTerms, resolveContractTermSponsors } from '../../../domain/services/contractNegotiationService'
import type { ContractTermOffer } from '../../../domain/services/contractNegotiationService'
import { positionShort, formatValue, formatSalary, formatContractUntil } from '../../utils/formatters'
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

  function handleRenew(playerId: string, newSalary: number, years: number, terms: ContractTermOffer) {
    if (!game) return
    const club = game.clubs.find(c => c.id === game.managedClubId)
    if (!club) return
    const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const currentPlayer = squadPlayers.find(p => p.id === playerId)
    if (!currentPlayer) return
    // Själva förhandlingsutfallet ägs av transferActions/domänservicen.
    // Komponenten räknar bara lönebudgetens varning före bekräftelse.
    const currentWageBill = squadPlayers.reduce((sum, p) => sum + p.salary, 0)
    const projectedWageBill = currentWageBill - currentPlayer.salary + newSalary
    const weeklyEquiv = Math.round(projectedWageBill / 4)
    const wouldExceed = weeklyEquiv > club.wageBudget

    const doRenew = () => {
      const result = renewContract(playerId, newSalary, years, terms)
      if (!result.success) {
        setRenewError(result.error ?? 'Kunde inte förlänga kontraktet')
        return
      }
      if (result.wageWarning) {
        setWageWarning(`OBS: Lönekostnaderna överstiger budgeten med ${formatSalary(result.wageWarning)}`)
      }
      setRenewingPlayerId(null)
      setRenewError(null)
      // C-T8 (SPEC_FORHANDLING_TERMER_2026-09-04) §6 — en termaccept ersätter
      // den generiska bekräftelsen, en rad per accepterad term.
      setRenewConfirmText(
        result.termMessages && result.termMessages.length > 0
          ? result.termMessages.join(' ')
          : `Kontrakt förlängt till ${game.currentSeason + years}`
      )
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
    <div className="card-stagger-2 transfers-section">
      {renewConfirmText && (
        <div className="transfers-state-success-strong transfers-renew-confirm">
          <p className="transfers-renew-confirm-text">{renewConfirmText}</p>
        </div>
      )}
      {wageWarning && (
        <div className="transfers-state-copper-strong transfers-wage-warning">
          <p className="transfers-wage-warning-text"><TriangleAlert size={14} aria-hidden="true" />{wageWarning}</p>
          <button onClick={() => setWageWarning(null)} className="transfers-wage-warning-close"><X size={12} /></button>
        </div>
      )}
      {/* B1-nav Fas 3: ingång till transfermarknaden (säsongstabbarna bor på /game/transfers,
          som bara är permanent i navet när fönstret är öppet). */}
      <button
        onClick={() => navigate('/game/transfers')}
        className="transfers-market-link"
      >
        <span>Transfermarknaden — marknad, scouting, fria, sälj</span>
        <ArrowRight size={15} className="transfers-market-link-icon" />
      </button>

      <SectionLabel>Utgående kontrakt</SectionLabel>
      {expiringPlayers.length === 0 ? (
        <p className="transfers-contract-empty">Inga kontrakt utgår snart.</p>
      ) : (
        <div className="card-sharp transfers-card-clipped">
          {expiringPlayers.map((player, index) => (
            <div key={player.id} className={`transfers-list-row ${index < expiringPlayers.length - 1 ? 'transfers-row-divider' : ''}`}>
              <div className="transfers-list-content">
                <p className="transfers-list-name">
                  {player.firstName} {player.lastName}
                </p>
                <p className="transfers-list-meta">
                  {positionShort(player.position)} · {formatValue(player.marketValue)} · {formatSalary(player.salary)} · {formatContractUntil(player.contractUntilSeason)}
                </p>
              </div>
              <button onClick={() => setRenewingPlayerId(player.id)} className="btn btn-outline transfers-btn-sm transfers-btn-sm--compact">
                Förläng
              </button>
            </div>
          ))}
        </div>
      )}

      {renewingPlayer && (() => {
        const club = game.clubs.find(c => c.id === game.managedClubId)
        const leagueAverages = computeLeaguePositionAverages(game)
        const minSalary = club ? computeContractMinSalary(renewingPlayer, club, leagueAverages) : 0
        const availableTerms = club ? getAvailableContractTerms(game, club, renewingPlayer) : []
        const { jobGuaranteeSponsor, imageRightsSponsor } = resolveContractTermSponsors(game)
        return (
          <RenewContractModal
            player={renewingPlayer}
            currentSeason={game.currentSeason}
            minSalary={minSalary}
            error={renewError}
            onClose={() => { setRenewingPlayerId(null); setRenewError(null) }}
            onConfirm={handleRenew}
            availableTerms={availableTerms}
            jobGuaranteeSponsor={jobGuaranteeSponsor}
            imageRightsSponsor={imageRightsSponsor}
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
