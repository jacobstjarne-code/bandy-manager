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
import { mecenatHasPendingDemand } from './triggers/mecenatTriggers'
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
import { MecenatDemandSecondary } from '../../../presentation/components/portal/secondary/MecenatDemandSecondary'
import { WeeklyDecisionSecondary } from '../../../presentation/components/portal/secondary/WeeklyDecisionSecondary'
import { RetirementDecisionSecondary } from '../../../presentation/components/portal/secondary/RetirementDecisionSecondary'
import { ActiveArcsSecondary } from '../../../presentation/components/portal/secondary/ActiveArcsSecondary'
import { BoardObjectivesSecondary } from '../../../presentation/components/portal/secondary/BoardObjectivesSecondary'
import { WatchOthersSecondary } from '../../../presentation/components/portal/secondary/WatchOthersSecondary'
import { LandslagsFranvaroSecondary } from '../../../presentation/components/portal/secondary/LandslagsFranvaroSecondary'
import { DeferredQueueSecondary } from '../../../presentation/components/portal/secondary/DeferredQueueSecondary'
import { MonthDecisionsSecondary } from '../../../presentation/components/portal/secondary/MonthDecisionsSecondary'
import { MustDeadlineWarning } from '../../../presentation/components/portal/secondary/MustDeadlineWarning'
import { selectDashboardDecisions, getUpcomingMustDeadlines } from '../decisionTierService'
import { BurnoutMark } from '../../../presentation/components/portal/BurnoutMark'
import { BurnoutReliefMark } from '../../../presentation/components/portal/BurnoutReliefMark'
import { EfterklangSecondary } from '../../../presentation/components/portal/secondary/EfterklangSecondary'
import { pickEfterklang } from '../portal/pickEfterklang'
import { BURNOUT_MARK_FIRED_KEY, BURNOUT_RELIEF_FIRED_KEY, BURNOUT_CLOSE_FIRED_KEY } from '../managerProfileService'
import { wasLoggedThisRound } from '../narrativeLogService'
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
import { BoardPatienceMinimal } from '../../../presentation/components/portal/minimal/BoardPatienceMinimal'

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
    // 2026-07-20 (Jacob): 58 → 67. B4:s egen tes är att funktionären bär
    // intern temperatur och journalisten extern press — sviten ska kännas
    // i klubbhuset INNAN den blir nyhet. Med journalist_card på 65 och
    // streak_card under den (58) kom nyheten före känslan, vilket
    // inverterade motiveringen. 67 sätter ordningen rätt: över
    // journalist_card (65), under injury_status (70).
    weight: 67,
    suppressIn: ['playoff'],
    triggers: [(game) => getStreakState(game) !== null],
    Component: StreakSecondary,
  },
  {
    // Synlighetsfix (2026-07-21) — mec.pendingDemand hade noll UI-konsumenter
    // (spelaren såg bara misslyckande-påminnelsen). Vikt matchar injury_status
    // (70) — en obesvarad mecenat-fråga bär samma brådska som en skada:
    // permanent withdrawal (finansiell straff) är den möjliga konsekvensen.
    id: 'mecenat_demand_unmet',
    tier: 'secondary',
    weight: 70,
    suppressIn: ['playoff'],
    triggers: [mecenatHasPendingDemand],
    Component: MecenatDemandSecondary,
  },
  {
    id: 'watch_others',
    tier: 'secondary',
    weight: 75,
    triggers: [(game) => isManagedClubSpectator(game)],
    Component: WatchOthersSecondary,
  },
  // C-MK1 — BurnoutMark: danger-tonad, visas när tränaren är utbränd 2+ omgångar i rad.
  // HIGH 10-FÖLJDFIX (2026-08-30): triggern läser INTE shouldShowBurnoutMark
  // direkt — roundProcessor stämplar profilens lastShownBurnoutZone i samma
  // steg som beslutet fattas, så en re-körning av samma predikat mot det
  // lagrade tillståndet ger alltid nej (before===after). wasLoggedThisRound
  // läser istället narrativeBeatLog-posten roundProcessor skrev NÄR beaten
  // fyrade — se BURNOUT_MARK_FIRED_KEY:s docstring (managerProfileService.ts).
  {
    id: 'burnout_mark',
    tier: 'secondary',
    weight: 95,
    triggers: [(game) => {
      const profile = game.managerProfile
      return !!profile && wasLoggedThisRound(game, BURNOUT_MARK_FIRED_KEY, game.currentMatchday)
    }],
    Component: BurnoutMark,
  },
  // HIGH 10 (DOM_HIGH10_BURNOUT_BAGE_2026-08-29) — bågens andra halva:
  // lättnad (zonen sjunker) och slut (tillbaka i frisk). Vikt 96, strax över
  // burnout_mark (95) och under presskonferens (98): de tre villkoren kan
  // aldrig vara sanna samtidigt, så ordningen dem emellan är formell — men
  // ett arc-slut ska inte kunna trängas undan av eskaleringskortet om
  // framtida villkorsändringar råkar överlappa. Samma logg-baserade trigger
  // som burnout_mark ovan, av samma anledning.
  {
    id: 'burnout_relief_mark',
    tier: 'secondary',
    weight: 96,
    triggers: [(game) => {
      const profile = game.managerProfile
      if (!profile) return false
      return wasLoggedThisRound(game, BURNOUT_RELIEF_FIRED_KEY, game.currentMatchday) ||
        wasLoggedThisRound(game, BURNOUT_CLOSE_FIRED_KEY, game.currentMatchday)
    }],
    Component: BurnoutReliefMark,
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

  // HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md) — måste-nivåns
  // förvarning (auditens MEDIUM 16). Vikt 97: över burnout-bågen (95/96) och
  // under presskonferensen — en oåterkallelig frist är det tyngsta sekundära
  // budskapet portalen kan bära. Kortet renderar ingenting förrän Opus
  // levererat raden (MustDeadlineWarning returnerar null vid tom text).
  {
    id: 'must_deadline_warning',
    tier: 'secondary',
    weight: 97,
    triggers: [(game) => getUpcomingMustDeadlines(game).length > 0],
    Component: MustDeadlineWarning,
  },
  // HIGH 11 — det ENDA batchade månadskortet ("3 väntar"). Vikt 46, strax
  // över deferred_queue (45): båda är räknekort om beslut som väntar, och det
  // SYNLIGA (månad, går att öppna nu) ska stå före det undanträngda (kön).
  {
    id: 'month_decisions_batch',
    tier: 'secondary',
    weight: 46,
    triggers: [(game) => selectDashboardDecisions(game).batched.length > 0],
    Component: MonthDecisionsSecondary,
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
  // 3.2 (SLUTTEST_KO.md, 2026-08-17): alwaysTrue, inte "bara vid problem" —
  // en spelare måste kunna se Stabilt FÖRE Under press/Ultimatum för att
  // eskaleringen ska vara begriplig, inte bara en varning som dyker upp
  // ur tomma intet. Vikt mellan squad_status och form_status: viktigare än
  // dagsformen, mindre akut än truppens tillgänglighet i normalläge — färgen
  // (danger vid Ultimatum) bär brådskan när det gäller, inte vikten.
  {
    id: 'board_patience_minimal',
    tier: 'minimal',
    weight: 45,
    triggers: [alwaysTrue],
    Component: BoardPatienceMinimal,
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
