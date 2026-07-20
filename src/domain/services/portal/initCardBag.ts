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
  nextMatchIsCupFinal,
  nextMatchIsFarewellMatch,
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
import { CupFinalPrimary } from '../../../presentation/components/portal/primary/CupFinalPrimary'
import { FarewellMatchPrimary } from '../../../presentation/components/portal/primary/FarewellMatchPrimary'
import { TransferDeadlinePrimary } from '../../../presentation/components/portal/primary/TransferDeadlinePrimary'
import { PatronDemandPrimary } from '../../../presentation/components/portal/primary/PatronDemandPrimary'
import { EventPrimary } from '../../../presentation/components/portal/primary/EventPrimary'

// Secondary components
import { SourceSecondaryCard } from '../../../presentation/components/portal/secondary/SourceSecondaryCard'
import React from 'react'
import { TabellSecondary } from '../../../presentation/components/portal/secondary/TabellSecondary'
import { EkonomiSecondary } from '../../../presentation/components/portal/secondary/EkonomiSecondary'
import { InjuryStatusSecondary } from '../../../presentation/components/portal/secondary/InjuryStatusSecondary'
import { OpenBidsSecondary } from '../../../presentation/components/portal/secondary/OpenBidsSecondary'
import { OpponentFormSecondary } from '../../../presentation/components/portal/secondary/OpponentFormSecondary'
import { KlackenSecondary } from '../../../presentation/components/portal/secondary/KlackenSecondary'
import { CoffeeRoomSecondary } from '../../../presentation/components/portal/secondary/CoffeeRoomSecondary'
import { JournalistSecondary } from '../../../presentation/components/portal/secondary/JournalistSecondary'
import { SeasonSignatureSecondary } from '../../../presentation/components/portal/secondary/SeasonSignatureSecondary'
import { StreakSecondary } from '../../../presentation/components/portal/secondary/StreakSecondary'
import { WeeklyDecisionSecondary } from '../../../presentation/components/portal/secondary/WeeklyDecisionSecondary'
import { RetirementDecisionSecondary } from '../../../presentation/components/portal/secondary/RetirementDecisionSecondary'
import { ActiveArcsSecondary } from '../../../presentation/components/portal/secondary/ActiveArcsSecondary'
import { BoardObjectivesSecondary } from '../../../presentation/components/portal/secondary/BoardObjectivesSecondary'
import { WatchOthersSecondary } from '../../../presentation/components/portal/secondary/WatchOthersSecondary'
import { LandslagsFranvaroSecondary } from '../../../presentation/components/portal/secondary/LandslagsFranvaroSecondary'
import { DeferredQueueSecondary } from '../../../presentation/components/portal/secondary/DeferredQueueSecondary'
import { BurnoutMark } from '../../../presentation/components/portal/BurnoutMark'
import { EfterklangSecondary } from '../../../presentation/components/portal/secondary/EfterklangSecondary'
import { pickEfterklang } from '../portal/pickEfterklang'
import { shouldShowBurnoutMark } from '../managerProfileService'
import { SpectatorPrimary } from '../../../presentation/components/portal/primary/SpectatorPrimary'
import type { CardRenderProps } from './dashboardCardBag'
import { getCoffeeRoomScene } from '../coffeeRoomService'
import { getStreakState } from '../../data/roundCharacter'
import { shouldShowJournalistCard } from '../journalistVisibilityService'
import { isManagedClubSpectator } from '../../data/seasonPhases'
import { FixtureStatus } from '../../enums'

// Minimal components
import { SquadStatusMinimal } from '../../../presentation/components/portal/minimal/SquadStatusMinimal'
import { FormStatusMinimal } from '../../../presentation/components/portal/minimal/FormStatusMinimal'
import { KlackenMoodMinimal } from '../../../presentation/components/portal/minimal/KlackenMoodMinimal'
import { EconomyMinimal } from '../../../presentation/components/portal/minimal/EconomyMinimal'

function makeSourceCard(source: 'kommunen' | 'mecenat' | 'lokaltidningen') {
  return function SourceCard({ game }: CardRenderProps) {
    return React.createElement(SourceSecondaryCard, { source, game })
  }
}

const PORTAL_CARDS: DashboardCard[] = [
  // ── PRIMARY TIER ──────────────────────────────────────────────
  {
    id: 'next_match_smfinal',
    tier: 'primary',
    weight: 100,
    triggers: [nextMatchIsSMFinal],
    Component: SMFinalPrimary,
  },
  // B2 (2026-07-19): cupfinalen hade färdig ceremoni (cupFinalVictoryScene,
  // cupanslagens "Pokalen är vår") men föll till next_match (vikt 10) i
  // förväg. Vikt strax under SM-finalen, som beställt.
  {
    id: 'next_match_cupfinal',
    tier: 'primary',
    weight: 98,
    triggers: [nextMatchIsCupFinal],
    Component: CupFinalPrimary,
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
  // B2 (2026-07-19): avskedsmatchens ceremoni byggdes i pool 2
  // (MatchLaddningScene) men portalen varnade aldrig att den var på väg.
  // Vikt strax över derbyt (80) — ett en-gång-per-karriär-ögonblick väger
  // tyngre narrativt än en återkommande rivalmatch, även om det inte har
  // samma tabellstakes.
  {
    id: 'next_match_farewell',
    tier: 'primary',
    weight: 82,
    triggers: [nextMatchIsFarewellMatch],
    Component: FarewellMatchPrimary,
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
    id: 'spectator_primary',
    tier: 'primary',
    weight: 50,
    triggers: [
      (game) => isManagedClubSpectator(game),
      (game) => !game.fixtures.some(f =>
        f.status === FixtureStatus.Scheduled &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
      ),
    ],
    Component: SpectatorPrimary,
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
    id: 'board_objectives',
    tier: 'secondary',
    weight: 40,
    triggers: [(game) => (game.boardObjectives ?? []).filter(o => o.status !== 'met').length > 0],
    Component: BoardObjectivesSecondary,
  },
  {
    id: 'weekly_decision',
    tier: 'secondary',
    weight: 85,
    triggers: [(game) => !!game.pendingWeeklyDecision],
    Component: WeeklyDecisionSecondary,
  },
  {
    id: 'retirement_decision',
    tier: 'secondary',
    weight: 90,  // high priority when active
    triggers: [(game) => !!game.pendingRetirementDecision],
    Component: RetirementDecisionSecondary,
  },
  {
    id: 'source_kommunen_cooldown',
    tier: 'secondary',
    weight: 84,
    triggers: [(game) => (game.sourceCooldowns?.['kommunen']?.roundsLeft ?? 0) > 0],
    Component: makeSourceCard('kommunen'),
  },
  {
    id: 'source_mecenat_cooldown',
    tier: 'secondary',
    weight: 83,
    triggers: [(game) => (game.sourceCooldowns?.['mecenat']?.roundsLeft ?? 0) > 0],
    Component: makeSourceCard('mecenat'),
  },
  {
    id: 'source_lokaltidningen_cooldown',
    tier: 'secondary',
    weight: 82,
    triggers: [(game) => (game.sourceCooldowns?.['lokaltidningen']?.roundsLeft ?? 0) > 0],
    Component: makeSourceCard('lokaltidningen'),
  },
  {
    id: 'active_arcs',
    tier: 'secondary',
    weight: 80,
    triggers: [(game) => (game.activeArcs ?? []).filter(a => a.type !== 'derby_echo' && a.phase !== 'resolving').length > 0],
    Component: ActiveArcsSecondary,
  },
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
    weight: 20,
    triggers: [alwaysTrue],
    Component: TabellSecondary,
  },
  {
    id: 'ekonomi',
    tier: 'secondary',
    weight: 18,
    triggers: [alwaysTrue],
    Component: EkonomiSecondary,
  },
  {
    id: 'coffee_room_card',
    tier: 'secondary',
    weight: 60,
    suppressIn: ['playoff'],
    triggers: [(game) => getCoffeeRoomScene(game) !== null],
    Component: CoffeeRoomSecondary,
  },
  {
    id: 'journalist_card',
    tier: 'secondary',
    weight: 65,
    suppressIn: ['playoff'],
    triggers: [shouldShowJournalistCard],
    Component: JournalistSecondary,
  },
  {
    id: 'season_signature_card',
    tier: 'secondary',
    weight: 40,
    suppressIn: ['playoff'],
    triggers: [(game) => {
      const sig = game.currentSeasonSignature
      return !!sig && sig.id !== 'calm_season'
    }],
    Component: SeasonSignatureSecondary,
  },
  {
    id: 'streak_card',
    tier: 'secondary',
    weight: 58,
    suppressIn: ['playoff'],
    triggers: [(game) => getStreakState(game) !== null],
    Component: StreakSecondary,
  },
  {
    id: 'watch_others',
    tier: 'secondary',
    weight: 75,
    triggers: [(game) => isManagedClubSpectator(game)],
    Component: WatchOthersSecondary,
  },
  // C-MK1 — BurnoutMark: danger-tonad, visas när tränaren är utbränd 2+ omgångar i rad
  {
    id: 'burnout_mark',
    tier: 'secondary',
    weight: 95,
    triggers: [(game) => {
      const profile = game.managerProfile
      return !!profile && shouldShowBurnoutMark(profile)
    }],
    Component: BurnoutMark,
  },
  // C-SY1#1 — Efterklang: memory-eko, max 2 minnen, --cold stripe
  {
    id: 'efterklang',
    tier: 'secondary',
    weight: 75,
    triggers: [(game) => pickEfterklang(game, 1).length > 0],
    Component: EfterklangSecondary,
  },

  // C-K1 — Landslagsuttagning: visa under VM-uppehållet
  {
    id: 'landslag_franvaro',
    tier: 'secondary',
    weight: 80,
    triggers: [(game) => {
      const camp = game.activeNationalTeamCamp
      if (!camp) return false
      return game.players.some(p => camp.playerIds.includes(p.id) && p.clubId === game.managedClubId)
    }],
    Component: LandslagsFranvaroSecondary,
  },

  // §D avbrottsbudget — beslut i kö, synliggörs på portalen
  {
    id: 'deferred_queue',
    tier: 'secondary',
    weight: 45,
    triggers: [(game) => (game.deferredDecisions?.length ?? 0) > 0],
    Component: DeferredQueueSecondary,
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
