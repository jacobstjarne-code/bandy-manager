import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { Mecenat } from '../../../../domain/entities/Mecenat'
import type { PendingDemand } from '../../../../domain/entities/Demand'

/**
 * Synlighetsfix (2026-07-21) — samma mönster som PatronDemandPrimary.tsx,
 * anpassat till att Mecenat är flertal (game.mecenater), inte singular
 * (game.patron) — därav secondary-tier istf primary (som bara rymmer ett
 * kort). Visar den mecenat vars krav går ut snarast, om flera väntar.
 *
 * R1-kedjan: krav skapas (eventProcessor.ts, demandEngine.ts delad motor)
 * → mec.pendingDemand satt → detta kortet (mecenatHasPendingDemand-triggern,
 * ovillkorad av happiness/patience) → spelaren kan agera (matcha villkoret
 * innan deadlineRound) → utfall vid deadline (samma eventProcessor.ts-block,
 * ±15 happiness/patience, demands-historik vid misslyckande).
 */

export interface MecenatDemandCard {
  mec: Mecenat
  demand: PendingDemand
  roundsLeft: number
  otherCount: number
}

/** Exporterad för test — plockar mecenaten vars krav går ut snarast, om flera väntar. */
export function pickMecenatDemandCard(game: SaveGame): MecenatDemandCard | null {
  const currentMatchday = game.currentMatchday ?? 0
  const withDemand = (game.mecenater ?? [])
    .filter(m => m.isActive && m.pendingDemand !== undefined)
    .sort((a, b) => a.pendingDemand!.deadlineRound - b.pendingDemand!.deadlineRound)

  const mec = withDemand[0]
  if (!mec || !mec.pendingDemand) return null

  return {
    mec,
    demand: mec.pendingDemand,
    roundsLeft: Math.max(0, mec.pendingDemand.deadlineRound - currentMatchday),
    otherCount: withDemand.length - 1,
  }
}

export function MecenatDemandSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const card = pickMecenatDemandCard(game)
  if (!card) return null
  const { mec, demand, roundsLeft, otherCount } = card

  return (
    <div
      className="card-tap"
      onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
      style={{
        background: 'var(--bg-portal-surface)',
        borderLeft: '2px solid var(--danger)',
        padding: '10px 12px',
        borderRadius: '0 6px 6px 0',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          fontSize: 8,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--danger)',
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        👤 {mec.name.toUpperCase()} KRÄVER
      </div>
      <div className="h-quote h-quote-light" style={{ lineHeight: 1.5, marginBottom: 4 }}>
        {demand.description}
      </div>
      <div className="h-micro" style={{ color: 'var(--text-muted)' }}>
        {roundsLeft > 0 ? `${roundsLeft} omg kvar` : 'Avgörs nu'}
        {otherCount > 0 && ` · +${otherCount} till väntar`}
      </div>
    </div>
  )
}
