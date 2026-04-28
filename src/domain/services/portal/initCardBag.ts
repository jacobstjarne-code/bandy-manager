/**
 * Fyller CARD_BAG med alla kort.
 * Importeras en gång vid appstart (i App.tsx eller PortalScreen) för att undvika
 * circular imports (komponenter → portal-services → bag → komponenter).
 *
 * Komponenter importeras här (presentation-lager) — OK eftersom detta är
 * ett init-skript, inte ett core-service.
 */

import { setCardBag } from './dashboardCardBag'
import type { DashboardCard } from './dashboardCardBag'

// Triggers
import {
  nextMatchIsSMFinal,
  nextMatchIsDerby,
  nextMatchIsHome,
  nextMatchIsBigGame,
  alwaysTrue,
} from './triggers/matchTriggers'
import {
  hasOpenBids,
  transferDeadlineWithin3Rounds,
} from './triggers/transferTriggers'
import { patronDemandUnmetOver3Rounds } from './triggers/patronTriggers'
import { hasCriticalEvent } from './triggers/eventTriggers'
import { hasInjuredStarters } from './triggers/stateTriggers'

// Primary components
import { NextMatchPrimary } from '../../../presentation/components/portal/primary/NextMatchPrimary'
import { DerbyPrimary } from '../../../presentation/components/portal/primary/DerbyPrimary'
import { SMFinalPrimary } from '../../../presentation/components/portal/primary/SMFinalPrimary'
import { TransferDeadlinePrimary } from '../../../presentation/components/portal/primary/TransferDeadlinePrimary'
import { PatronDemandPrimary } from '../../../presentation/components/portal/primary/PatronDemandPrimary'
import { EventPrimary } from '../../../presentation/components/portal/primary/EventPrimary'

// Secondary components
import { TabellSecondary } from '../../../presentation/components/portal/secondary/TabellSecondary'
import { EkonomiSecondary } from '../../../presentation/components/portal/secondary/EkonomiSecondary'
import { InjuryStatusSecondary } from '../../../presentation/components/portal/secondary/InjuryStatusSecondary'
import { OpenBidsSecondary } from '../../../presentation/components/portal/secondary/OpenBidsSecondary'
import { OpponentFormSecondary } from '../../../presentation/components/portal/secondary/OpponentFormSecondary'
import { KlackenSecondary } from '../../../presentation/components/portal/secondary/KlackenSecondary'
import { CoffeeRoomSecondary } from '../../../presentation/components/portal/secondary/CoffeeRoomSecondary'
import { getCoffeeRoomScene } from '../coffeeRoomService'

// Minimal components
import { SquadStatusMinimal } from '../../../presentation/components/portal/minimal/SquadStatusMinimal'
import { FormStatusMinimal } from '../../../presentation/components/portal/minimal/FormStatusMinimal'
import { KlackenMoodMinimal } from '../../../presentation/components/portal/minimal/KlackenMoodMinimal'
import { EconomyMinimal } from '../../../presentation/components/portal/minimal/EconomyMinimal'

const PORTAL_CARDS: DashboardCard[] = [
  // ── PRIMARY TIER ──────────────────────────────────────────────
  {
    id: 'next_match_smfinal',
    tier: 'primary',
    weight: 100,
    triggers: [nextMatchIsSMFinal],
    Component: SMFinalPrimary,
  },
  {
    id: 'event_critical',
    tier: 'primary',
    weight: 95,
    triggers: [hasCriticalEvent],
    Component: EventPrimary,
  },
  {
    id: 'transfer_deadline_close',
    tier: 'primary',
    weight: 90,
    triggers: [transferDeadlineWithin3Rounds],
    Component: TransferDeadlinePrimary,
  },
  {
    id: 'next_match_derby',
    tier: 'primary',
    weight: 80,
    triggers: [nextMatchIsDerby],
    Component: DerbyPrimary,
  },
  {
    id: 'patron_demand_unmet',
    tier: 'primary',
    weight: 70,
    triggers: [patronDemandUnmetOver3Rounds],
    Component: PatronDemandPrimary,
  },
  {
    id: 'next_match',
    tier: 'primary',
    weight: 10,
    triggers: [alwaysTrue],
    Component: NextMatchPrimary,
  },

  // ── SECONDARY TIER ────────────────────────────────────────────
  {
    id: 'open_bids',
    tier: 'secondary',
    weight: 80,
    triggers: [hasOpenBids],
    Component: OpenBidsSecondary,
  },
  {
    id: 'injury_status',
    tier: 'secondary',
    weight: 70,
    triggers: [hasInjuredStarters],
    Component: InjuryStatusSecondary,
  },
  {
    id: 'opponent_form',
    tier: 'secondary',
    weight: 60,
    triggers: [nextMatchIsBigGame],
    Component: OpponentFormSecondary,
  },
  {
    id: 'klacken',
    tier: 'secondary',
    weight: 50,
    triggers: [nextMatchIsHome],
    Component: KlackenSecondary,
  },
  {
    id: 'tabell',
    tier: 'secondary',
    weight: 30,
    triggers: [alwaysTrue],
    Component: TabellSecondary,
  },
  {
    id: 'ekonomi',
    tier: 'secondary',
    weight: 25,
    triggers: [alwaysTrue],
    Component: EkonomiSecondary,
  },
  {
    id: 'coffee_room_card',
    tier: 'secondary',
    weight: 60,
    triggers: [(game) => getCoffeeRoomScene(game) !== null],
    Component: CoffeeRoomSecondary,
  },

  // ── MINIMAL TIER ──────────────────────────────────────────────
  {
    id: 'klacken_mood_minimal',
    tier: 'minimal',
    weight: 60,
    triggers: [nextMatchIsDerby],
    Component: KlackenMoodMinimal,
  },
  {
    id: 'squad_status',
    tier: 'minimal',
    weight: 50,
    triggers: [alwaysTrue],
    Component: SquadStatusMinimal,
  },
  {
    id: 'form_status',
    tier: 'minimal',
    weight: 40,
    triggers: [alwaysTrue],
    Component: FormStatusMinimal,
  },
  {
    id: 'economy_minimal',
    tier: 'minimal',
    weight: 30,
    triggers: [alwaysTrue],
    Component: EconomyMinimal,
  },
]

let initialized = false

export function initCardBag(): void {
  if (initialized) return
  initialized = true
  setCardBag(PORTAL_CARDS)
}

/** Nollställ bag — för tester som behöver köra initCardBag() mer än en gång. */
export function resetCardBag(): void {
  initialized = false
}
