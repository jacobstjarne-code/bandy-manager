import type { SaveGame } from '../../entities/SaveGame'
import type { ComponentType } from 'react'
import type { SeasonPhase } from '../../data/seasonPhases'
import type { PlayoffSeriesContext } from './playoffSeriesContext'

export type CardTier = 'primary' | 'secondary' | 'minimal'

export type TriggerFn = (game: SaveGame) => boolean

/** String-union mirrors portalEscalationResolver.EscalationSubState — kept here to avoid application→domain import. */
type EscalationSubState = 'sakrat' | 'farozon' | 'mittfalt' | 'bottenstrid' | null

export interface CardRenderProps {
  game: SaveGame
  /** Pre-computed by PortalScreen — avoids repeated getPlayoffSeriesContext calls. */
  playoffCtx?: PlayoffSeriesContext | null
  /** Pre-computed by PortalScreen — avoids repeated getEscalationSubState calls. */
  escalationSubState?: EscalationSubState | null
}

export interface DashboardCard {
  /** Stabil identifierare. Används för deterministisk slumpning vid tie. */
  id: string

  /** Vilken zon i Portal kortet kan dyka upp i. */
  tier: CardTier

  /** Prioritet inom tier. Högre vinner. 0-100. */
  weight: number

  /**
   * Faser då kortet inte ska visas alls (hård suppression).
   * Används för kort som inte hör hemma i slutspel (kafferum, journalist, etc).
   */
  suppressIn?: SeasonPhase[]

  /**
   * Alla triggers måste returnera true för att kortet ska vara eligible.
   * En trigger som alltid returnerar true gör kortet alltid eligible (default-fallback).
   */
  triggers: TriggerFn[]

  /**
   * Renderingskomponent för kortet. Får game-state som prop.
   * Komponenten får INTE känna till weight/triggers eller importera från denna fil.
   */
  Component: ComponentType<CardRenderProps>

  /** Designs typnamn — sätts av inboxToPortal för story-slot golv/rotation. */
  kind?: string

  /** Stripe-token för story-slot-rendering. */
  stripe?: string
}

// CARD_BAG fylls dynamiskt av fillCardBag() — kallas en gång vid appstart
// för att undvika circular imports (komponenter → services → bag → komponenter)
export let CARD_BAG: DashboardCard[] = []

export function setCardBag(cards: DashboardCard[]): void {
  CARD_BAG = cards
}
