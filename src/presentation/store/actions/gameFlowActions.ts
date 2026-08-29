import type { SaveGame, RoundSummaryData } from '../../../domain/entities/SaveGame'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import type { SeasonGoalType } from '../../../domain/entities/SeasonSummary'
import type { AnslagKey } from '../../../domain/services/anslagService'
import { findActiveAnniversaries } from '../../../domain/services/clubMemoryService'
import { PendingScreen } from '../../../domain/enums'
import { getCurrentLeagueRound, getFunctionaryPhase, isManagedClubInPlayoff, type PortalPhase } from '../../../domain/data/seasonPhases'
import { shouldShowUpptakt } from '../../../application/services/portalEscalationResolver'
import { clamp } from '../../../domain/utils/clamp'
import { resolveWeeklyDecision as resolveWeeklyDecisionFn } from '../../../domain/services/weeklyDecisionService'
import { generateDetailedAnalysis } from '../../../domain/services/opponentAnalysisService'
import { getNextManagedFixture } from '../../../domain/services/portal/triggers/matchTriggers'
import { RETIREMENT_RESPONSES } from '../../../domain/data/retirementText'
import { promoteFromQueue } from '../../../domain/services/decisionBudgetService'
import { applyFinanceChange } from '../../../domain/services/economyService'
import { canStartBuild, startFacilityBuild, FACILITY_NODE_DEFS } from '../../../domain/services/facilityService'
import { advanceToNextEvent, type AdvanceResult } from '../../../application/useCases/advanceToNextEvent'
import { detectSceneTrigger } from '../../../domain/services/sceneTriggerService'
import { getCoffeeRoomScene } from '../../../domain/services/coffeeRoomService'
import { navigateTo } from '../../navigation/globalNavigate'
import { saveSaveGame } from '../../../infrastructure/persistence/saveGameStorage'
import { logNarrativeBeat, pickPoolIndexAvoidingCooldown, BIRGER_SM_QUOTE_PREFIX, BIRGER_CUP_QUOTE_PREFIX } from '../../../domain/services/narrativeLogService'
import { SM_FINAL_VICTORY_TEMPLATES } from '../../../domain/data/scenes/smFinalVictoryScene'
import { CUP_FINAL_VICTORY_TEMPLATES } from '../../../domain/data/scenes/cupFinalVictoryScene'
import { PIVOTAL_BEAT_IDS } from '../../../domain/data/portalBeats'
import { hasManagedClubFutureFixture } from '../../utils/nextActionCue'
import { applyContractDemandResolutions } from '../../../domain/services/contractDemandService'

interface GetState {
  game: SaveGame | null
  roundSummary: RoundSummaryData | null
  lastAdvanceResult: AdvanceResult | null
  resolveEvent: (eventId: string, choiceId: string) => void
  setPlayerLineup: (startingPlayerIds: string[], benchPlayerIds: string[], captainPlayerId?: string, autoSelected?: boolean) => { success: boolean; error?: string }
  advance: (suppressMatchNavigation?: boolean) => AdvanceResult | null
  resolveWeeklyDecision: (choice: 'A' | 'B') => void
  completeScene: (sceneId: import('../../../domain/entities/Scene').SceneId, choiceId?: string) => void
  triggerCoffeeRoomScene: () => void
  triggerJournalistScene: () => void
  resolveRetirementDecision: (playerId: string, choice: 'thank' | 'respect' | 'invite') => { retired: boolean; response: string }
  markAnniversaryAcknowledged: (eventId: string) => void
  resolveAnnandagsVal: (val: 'A' | 'B' | 'C' | 'D') => void
  dismissCallupModal: () => void
}

type Get = () => GetState
type SetSlice = { game: SaveGame | null; roundSummary: RoundSummaryData | null; lastAdvanceResult: AdvanceResult | null; lastConfirmedSaveAt: string | null; lastSaveError: string | null; saveConflict: boolean }
// C1 (5c9a7a8, 2026-08-24): lastConfirmedSaveAt/lastSaveError tillagda så
// persistAutosave (den vanligaste sparvägen — kör efter nästan varje
// spelaråtgärd) kan surfa ett misslyckande, inte bara logga tyst.
// M2 (2026-08-24): funktionell form tillåten (Partial<SetSlice> | uppdaterare)
// så persistAutosave kan slå ihop game.revision mot AKTUELLT state efter en
// lyckad sparning, istf det snapshot av `game` som fanns när anropet startade.
type Set = (partial: Partial<SetSlice> | ((state: SetSlice) => Partial<SetSlice>)) => void

/**
 * High 3 (Skutskär-auditen, 2026-08-22): playoff-elimineringens tidsbarriär.
 * Ren funktion, exporterad för test — diff mot pre-advance-snapshotet, inte
 * bara "är satt", eftersom `lastPlayoffElimination` ligger kvar satt under
 * RESTEN av säsongen efter elimineringen (nollställs först i
 * seasonEndProcessor.ts). En ren "är satt"-koll hade stoppat auto-loopen
 * permanent, inte bara omgången elimineringen faktiskt inträffade.
 */
export function shouldStopAutoLoopForPlayoffElimination(
  gameBefore: Pick<SaveGame, 'lastPlayoffElimination'>,
  gameAfter: Pick<SaveGame, 'lastPlayoffElimination'>,
): boolean {
  return !gameBefore.lastPlayoffElimination && !!gameAfter.lastPlayoffElimination
}

/**
 * High 3 (Skutskär-auditen, 2026-08-22): namnger perioden när advance()s
 * auto-loop hoppade över fler än en omgång — samma financeLog-poster
 * ekonomifliken redan visar, filtrerade till exakt den perioden. Ren
 * funktion, exporterad för test.
 */
/**
 * Medium 5 (Skutskär-auditen, 2026-08-22): säsongsslutsbarriären. Rensar
 * obesvarade sponsorerbjudanden — de lovar veckointäkt över omgångar som
 * inte längre kommer att spelas — ur pending-kön så fort den hanterade
 * klubben inte har någon egen match kvar, i stället för att vänta på nästa
 * faktiska säsongsrollover (seasonEndProcessor.ts). Ren funktion, exporterad
 * för test. Rör ALDRIG redan resolvade poster eller andra event-typer —
 * bara obesvarade sponsorOffer.
 */
export function clearDatedOffersAtSeasonEnd(pendingEvents: GameEvent[]): GameEvent[] {
  return pendingEvents.filter(e => e.type !== 'sponsorOffer' || e.resolved)
}

export function buildMultiWeekPeriod(
  autoLoops: number,
  firstRoundPlayed: number | null,
  lastRoundPlayed: number | null,
  financeLog: import('../../../domain/services/economyService').FinanceEntry[],
): import('../../../domain/entities/RoundSummary').RoundSummaryMultiWeekPeriod | undefined {
  if (autoLoops <= 0 || firstRoundPlayed == null || lastRoundPlayed == null) return undefined
  return {
    fromRound: firstRoundPlayed,
    toRound: lastRoundPlayed,
    financeLogEntries: financeLog
      .filter(e => e.round >= firstRoundPlayed && e.round <= lastRoundPlayed)
      .map(e => ({ round: e.round, amount: e.amount, label: e.label })),
  }
}

// C1 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24) — värsta
// fyndet i serien. saveSaveGame() svalde tidigare alla undantag och
// returnerade Promise<void>, så try/catch:et här var död kod: en
// misslyckad autosave (privat läge, full kvot, avbruten IndexedDB-
// skrivning) gav ingen som helst signal, varken till spelaren eller
// konsolen. Detta är den VANLIGASTE sparvägen — kör efter nästan varje
// spelaråtgärd (advance/resolveEvent/scener/etc, se anropsställena nedan).
// saveSaveGame() returnerar nu en riktig SaveWriteResult; set() propagerar
// resultatet till store:t så GameHeader.tsx kan visa det.
async function persistAutosave(game: SaveGame, context: string, set: Set): Promise<void> {
  const result = await saveSaveGame(game)
  if (result.success) {
    // M2: se motsvarande kommentar i gameStore.ts:persistGameSnapshot —
    // game.revision måste följa med tillbaka in i store:t, annars
    // konfliktar denna fliks EGEN nästa autosave med sig själv.
    set(state => ({
      lastConfirmedSaveAt: new Date().toISOString(),
      lastSaveError: null,
      game: state.game && state.game.id === game.id ? { ...state.game, revision: result.newRevision } : state.game,
    }))
  } else if (result.conflict) {
    // M2: se motsvarande gren i gameStore.ts:persistGameSnapshot — samma
    // resonemang, denna vägen (autosave) är bara den vanligaste av de två.
    console.error(`Autosave avvisad som konflikt (${context}) — en annan flik har skrivit en nyare version`)
    set({ saveConflict: true })
  } else {
    console.error(`Autosave misslyckades (${context}):`, result.error)
    set({ lastSaveError: result.error ?? `Autosave misslyckades (${context})` })
  }
}

export function gameFlowActions(get: Get, set: Set) {
  return {
    advance: (suppressMatchNavigation?: boolean): AdvanceResult | null => {
      const { game } = get()
      if (!game) return null

      // GAP-1(b): auto-spara pre-advance-state INNAN riskoperationen (round-advance/season-end
      // är de tyngsta vägarna). Kraschar advance så kostar det aldrig mer än omgången som just
      // påbörjades — det senast sparade är giltigt pre-advance-state.
      void persistAutosave(game, 'pre-advance', set)

      const managedClubBefore = game.clubs.find(c => c.id === game.managedClubId)
      const financesBefore = managedClubBefore?.finances ?? 0
      const communityStandingBefore = game.communityStanding ?? 50
      const inboxCountBefore = game.inbox.length

      // Snapshot pendingEvents before any advance — used after auto-loops to prevent
      // intermediate cup-round events from stacking (each auto-iteration adds events,
      // resulting in 7+ decisions piled up at the first managed-fixture round).
      const pendingEventsBeforeAdvance = game.pendingEvents ?? []

      let result = advanceToNextEvent(game)
      const firstRoundPlayed = result.roundPlayed

      // High 3 (Skutskär-auditen, 2026-08-22): utan denna spärr fortsatte
      // auto-loopen nedan genom RESTEN av slutspelet (andra klubbars matcher)
      // direkt efter att den hanterade klubben slogs ut — Granska visade
      // fortfarande den just spelade matchen, men flera veckors löner/
      // världshändelser hade redan summerats till en oförklarad "Ekonomi
      // −100 tkr"-rad, och en omvärldsrad kunde påstå att nästa motståndare
      // väntade trots att säsongen för spelaren redan var slut.
      const justEliminatedFromPlayoff = shouldStopAutoLoopForPlayoffElimination(game, result.game)

      // Auto-advance through matchdays where managed club has no fixture (e.g. cup rounds
      // for other teams after elimination). Without this, every cup round requires a
      // separate advance-click and "omgång 1" re-appears confusingly each time.
      let autoLoops = 0
      while (!justEliminatedFromPlayoff && !result.hasManagedCupMatch && !result.seasonEnded && !result.game.managerFired && autoLoops < 10) {
        const g = result.game
        const scheduledAll = g.fixtures.filter(f => f.status === 'scheduled')
        if (scheduledAll.length === 0) break
        const nextMd = scheduledAll.reduce((min, f) => f.matchday < min ? f.matchday : min, Infinity)
        const managedAtNextMd = scheduledAll.some(
          f => f.matchday === nextMd &&
               (f.homeClubId === g.managedClubId || f.awayClubId === g.managedClubId)
        )
        if (managedAtNextMd) break
        result = advanceToNextEvent(g)
        autoLoops++
      }

      // If we auto-looped, restore pendingEvents to original (unresolved) + only last iteration's
      // new events. Prevents intermediate cup-round event generation from stacking.
      if (autoLoops > 0) {
        const lastIterationNewEvents = result.pendingEvents ?? []
        result = {
          ...result,
          game: {
            ...result.game,
            pendingEvents: [
              ...pendingEventsBeforeAdvance.filter(e => !e.resolved),
              ...lastIterationNewEvents,
            ],
          },
        }
      }

      const multiWeekPeriod = buildMultiWeekPeriod(autoLoops, firstRoundPlayed, result.roundPlayed, result.game.financeLog ?? [])

      // Medium 5 (Skutskär-auditen, 2026-08-22): säsongsslutsbarriären.
      // "Efter uttåget behövde jag hantera spelar-/sponsorkort innan
      // årsboken kunde öppnas" — ett kvarstående sponsorerbjudande lovar
      // veckointäkt över ett antal omgångar som inte längre kommer att
      // spelas. seasonEndProcessor.ts rensar redan pendingEvents wholesale
      // NÄSTA gång säsongsslutet faktiskt processas, men fram tills dess
      // låg det obesvarade kortet kvar och kändes som ett beslut spelaren
      // var tvungen att ta ställning till innan ceremonin. Rensas i samma
      // ögonblick klubben inte har någon egen match kvar — inte bara vid
      // faktisk säsongsrollover.
      if (!hasManagedClubFutureFixture(result.game)) {
        const clearedPendingEvents = clearDatedOffersAtSeasonEnd(result.game.pendingEvents)
        if (clearedPendingEvents.length !== result.game.pendingEvents.length) {
          result = { ...result, game: { ...result.game, pendingEvents: clearedPendingEvents } }
        }
      }

      const resultGame = result.game
      const managedClubAfter = resultGame.clubs.find(c => c.id === resultGame.managedClubId)
      const financesAfter = managedClubAfter?.finances ?? 0
      const communityStandingAfter = resultGame.communityStanding ?? 50
      const newInboxCount = Math.max(0, resultGame.inbox.length - inboxCountBefore)

      const managedFixture = result.roundPlayed !== null
        ? resultGame.fixtures.find(f =>
            (f.homeClubId === resultGame.managedClubId || f.awayClubId === resultGame.managedClubId) &&
            f.status === 'completed' &&
            f.matchday === result.roundPlayed
          )
        : undefined

      let matchResult: string | undefined
      let matchScorers: string[] | undefined

      if (managedFixture) {
        const homeClub = resultGame.clubs.find(c => c.id === managedFixture.homeClubId)
        const awayClub = resultGame.clubs.find(c => c.id === managedFixture.awayClubId)
        matchResult = `${homeClub?.shortName ?? homeClub?.name ?? '?'} ${managedFixture.homeScore}–${managedFixture.awayScore} ${awayClub?.shortName ?? awayClub?.name ?? '?'}`

        const managedPlayerIds = new Set(resultGame.players.filter(p => p.clubId === resultGame.managedClubId).map(p => p.id))
        const goalsByPlayer: Record<string, number> = {}
        const assistsByPlayer: Record<string, number> = {}
        for (const evt of managedFixture.events) {
          if (evt.playerId && managedPlayerIds.has(evt.playerId)) {
            if (evt.type === 'goal') goalsByPlayer[evt.playerId] = (goalsByPlayer[evt.playerId] ?? 0) + 1
            if (evt.type === 'assist') assistsByPlayer[evt.playerId] = (assistsByPlayer[evt.playerId] ?? 0) + 1
          }
        }
        const scorerStrs: string[] = []
        for (const [pid, goals] of Object.entries(goalsByPlayer)) {
          const p = resultGame.players.find(pl => pl.id === pid)
          if (!p) continue
          const assists = assistsByPlayer[pid] ?? 0
          const name = `${p.firstName} ${p.lastName.slice(0, 1)}.`
          if (assists > 0) scorerStrs.push(`${name} ${goals}+${assists}`)
          else scorerStrs.push(`${name} ${goals} mål`)
        }
        if (scorerStrs.length > 0) matchScorers = scorerStrs
      }

      const newlyInjuredPlayers = resultGame.players.filter(p =>
        p.clubId === resultGame.managedClubId &&
        p.isInjured &&
        !game.players.find(op => op.id === p.id)?.isInjured
      )
      const injuries = newlyInjuredPlayers.map(p => {
        const weeks = Math.ceil(p.injuryDaysRemaining / 7)
        return `${p.firstName} ${p.lastName} (${weeks} v.)`
      })

      let temperature: number | undefined
      if (managedFixture) {
        const mw = resultGame.matchWeathers.find(w => w.fixtureId === managedFixture.id)
          ?? game.matchWeathers.find(w => w.fixtureId === managedFixture.id)
        if (mw) temperature = mw.weather.temperature
      }

      const csDelta = communityStandingAfter - communityStandingBefore
      const communityStandingChanges: { reason: string; delta: number }[] = csDelta !== 0
        ? [{ reason: csDelta > 0 ? 'Positiv utveckling' : 'Negativ händelse', delta: csDelta }]
        : []

      const youthInbox = resultGame.inbox.find(i =>
        i.type === 'youthP17' && !game.inbox.find(o => o.id === i.id)
      )
      // AUDIT DEL 3 (2026-08-11): läser strukturerat fält istf title-prefix-
      // parse — title.replace(/^📋 /, '') var en no-op (prefixet fanns
      // aldrig i title), en tidsinställd bugg. Se Inbox.ts:youthMatchSummary.
      const youthMatchResult = youthInbox?.youthMatchSummary

      // Determine display round: use league round number, not matchday
      // For cup-only rounds, show the most recently completed league round + context
      const displayRound = (() => {
        if (managedFixture && !managedFixture.isCup) return managedFixture.roundNumber
        // No managed fixture or it was a cup match: show latest completed league round
        const lastLeagueRound = resultGame.fixtures
          .filter(f => f.status === 'completed' && !f.isCup && f.roundNumber <= 22)
          .reduce((max, f) => Math.max(max, f.roundNumber), 0)
        return lastLeagueRound || result.roundPlayed || 0
      })()

      const summary: RoundSummaryData = {
        round: displayRound,
        date: resultGame.currentDate,
        temperature,
        matchPlayed: !!managedFixture,
        matchResult,
        matchScorers,
        communityStandingBefore,
        communityStandingAfter,
        communityStandingChanges,
        financesBefore,
        financesAfter,
        attendance: managedFixture?.attendance,
        injuries,
        newInboxCount,
        youthMatchResult,
        multiWeekPeriod,
      }

      // B6 — Populera aktiva anniversaries
      const anniversaries = findActiveAnniversaries(result.game)
      const previouslySeen = result.game.anniversariesSeen ?? []
      const freshAnniversaries = anniversaries.filter(a => !previouslySeen.includes(a.eventId))
      const gameWithAnniversaries = freshAnniversaries.length > 0 || (result.game.activeAnniversaries?.length ?? 0) > 0
        ? { ...result.game, activeAnniversaries: freshAnniversaries }
        : result.game

      const gameToSave = { ...gameWithAnniversaries, lastSavedAt: new Date().toISOString() }
      set({ game: gameToSave, lastAdvanceResult: result, roundSummary: summary })
      void persistAutosave(gameToSave, 'advance', set)

      // Märk fas som sedd när spelaren lämnar Portal (trigger i advance).
      // 2026-07-19: migrerad till sjufasmodellen (PortalPhaseMark.tsx) —
      // gamla 'endgame' finns inte längre, ersatt av de fyra fasnamn som
      // faktiskt har en markör (se phaseMarkText.ts).
      const PHASEMARK_PHASES = new Set<PortalPhase>(['annandagen', 'vinterkris', 'våroffensiv', 'slutspurt', 'playoff'])
      const advLigaRound = getCurrentLeagueRound(gameToSave)
      const advIsPlayoff = isManagedClubInPlayoff(gameToSave)
      const advTablePosition = gameToSave.standings.find(s => s.clubId === gameToSave.managedClubId)?.position
        ?? Math.ceil(gameToSave.clubs.length / 2)
      const advPhase: PortalPhase = advIsPlayoff
        ? 'playoff'
        : getFunctionaryPhase(advLigaRound, advTablePosition, gameToSave.clubs.length)
      const advSeen = gameToSave.phaseMarksSeen ?? []
      if (PHASEMARK_PHASES.has(advPhase) && !advSeen.includes(advPhase)) {
        const markedGame = { ...gameToSave, phaseMarksSeen: [...advSeen, advPhase] }
        set({ game: markedGame })
        void persistAutosave(markedGame, 'advance', set)
      }

      // C-SD2: märk upptakt-PhaseMark sedd (engångs per säsong) när spelaren lämnar Portal
      if (shouldShowUpptakt(gameToSave) && gameToSave.upptaktPhaseMarkSeenSeason !== gameToSave.currentSeason) {
        const markedGame = { ...gameToSave, upptaktPhaseMarkSeenSeason: gameToSave.currentSeason }
        set({ game: markedGame })
        void persistAutosave(markedGame, 'advance', set)
      }

      const managerFired = result.game.managerFired
      if (managerFired) {
        navigateTo('/game/game-over', { replace: true })
      } else if (result.seasonEnded) {
        // Navigation handled by DashboardScreen's pendingScreen mechanism — avoids duplicate navigation
        navigateTo('/game/dashboard', { replace: true })
      } else if (!suppressMatchNavigation) {
        const ps = result.game.pendingScreen
        if (ps === PendingScreen.HalfTimeSummary) {
          navigateTo('/game/half-time-summary', { replace: true })
        } else if (ps === PendingScreen.PlayoffIntro) {
          navigateTo('/game/playoff-intro', { replace: true })
        } else if (ps === PendingScreen.QFSummary) {
          navigateTo('/game/qf-summary', { replace: true })
        } else if (result.hasManagedCupMatch) {
          // Managed club has an unplayed match (cup or league) — go to dashboard
          // so user sees between-round info and clicks "Spela omgång X" themselves
          navigateTo('/game/dashboard', { replace: true })
        } else if (summary.matchPlayed) {
          navigateTo('/game/review', { replace: true })
        } else {
          navigateTo('/game/dashboard', { replace: true })
        }
      }

      return result
    },

    clearBoardMeeting: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, pendingScreen: PendingScreen.PreSeason } })
    },

    clearPreSeason: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, pendingScreen: null } })
    },

    clearHalfTimeSummary: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, pendingScreen: null } })
    },

    applyHalftimeDecision: (decision: 'lugna' | 'pressa' | 'prata') => {
      const { game } = get()
      if (!game) return
      const updatedPlayers = game.players.map(p => {
        if (decision === 'lugna') {
          return { ...p, fitness: clamp(p.fitness + 5), morale: clamp(p.morale + 3) }
        }
        if (decision === 'pressa') {
          // 15% chance of minor injury setback for field players
          const injuryHit = p.position !== 'goalkeeper' && Math.random() < 0.15
          return {
            ...p,
            form: clamp(p.form + 10),
            injuryDaysRemaining: injuryHit ? p.injuryDaysRemaining + 3 : p.injuryDaysRemaining,
            isInjured: injuryHit ? true : p.isInjured,
          }
        }
        // 'prata'
        return { ...p, morale: clamp(p.morale + 12) }
      })
      // T3 — store halftime decision for managerChoiceLog in saveLiveMatchResult
      set({ game: { ...game, players: updatedPlayers, pendingScreen: null, lastHalftimeDecision: decision } })
    },

    clearPlayoffIntro: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, pendingScreen: null } })
    },

    clearQFSummary: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, pendingScreen: null } })
    },

    clearSeasonSummary: () => {
      const { game } = get()
      if (!game) return
      // A-H2b (DOM_AH2B_RETENTION_2026-08-28): om säsongsslutet lämnade
      // obemötta marknadskrav att ta ställning till, visas de SAMLAT härnäst
      // (samma pendingScreen-mekanik som redan gate:ar board_meeting-scenen
      // bakom SeasonSummary — attentionRouter.ts prioriterar pendingScreen
      // före pendingScene, så den redan köade styrelsemötesscenen väntar
      // patient tills resolveContractDemands nollställer pendingScreen).
      // Annars: BoardMeeting fires via detectSceneTrigger on säsong 2+, matchday 0
      const hasDemands = (game.pendingContractDemands ?? []).length > 0
      set({ game: { ...game, pendingScreen: hasDemands ? PendingScreen.ContractDemands : null } })
    },

    // A-H2b (DOM_AH2B_RETENTION_2026-08-28), Leg 2: spelarens beslut per
    // obemött marknadskrav. `resolutions` nycklas på playerId — saknad post
    // = obemött (samma som explicit 'skipped', se applyContractDemandResolutions).
    // Möter kravet: lön höjs till minSalary, ingen morale-effekt. Obemött:
    // morale eroderas (UNMET_DEMAND_MORALE_PENALTY), synligt/planeringsbart
    // — spelaren ser missnöjet byggas och kan ändra sig nästa fönster.
    resolveContractDemands: (resolutions: Record<string, 'met' | 'skipped'>) => {
      const { game } = get()
      if (!game) return
      const demands = game.pendingContractDemands ?? []
      const updatedPlayers = applyContractDemandResolutions(game.players, demands, resolutions)
      const updatedGame: SaveGame = {
        ...game,
        players: updatedPlayers,
        pendingContractDemands: undefined,
        pendingScreen: null,
      }
      set({ game: updatedGame })
      void persistAutosave(updatedGame, 'resolveContractDemands', set)
    },

    clearRoundSummary: () => set({ roundSummary: null }),

    // 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18): Jacobs DOM — återinträdesguard
    // hänger på seasonGoalChosenForSeason (O3 tar över samma fält, se
    // kommentaren på SaveGame.seasonGoalChosenForSeason). Töm den ackumulerade
    // eventlistan här — inte i seasonEndProcessor.ts — för nästa säsongs
    // "medan du var borta" ska börja tomt, inte ärva den här säsongens.
    //
    // O3 (DOM_EGET_SASONGSMAL_2026-08-17.md, 2026-08-19): valfri goal-param.
    // undefined = "Inget särskilt i år" (giltigt svar, domen kräver det) —
    // skriver då inget activeSeasonGoal, samma "fältet saknas" som en spelare
    // som aldrig sett O3 (seasonGoalService.deriveGoalOutcomeLine hanterar
    // båda identiskt: "Du lovade ingenting i somras. Det höll du.").
    passSeasonTransition: (goal?: { type: SeasonGoalType; referenceId?: string; trackedPlayerIds?: string[] }) => {
      const { game } = get()
      if (!game) return
      set({
        game: {
          ...game,
          seasonGoalChosenForSeason: game.currentSeason,
          pendingSeasonTransitionEvents: [],
          activeSeasonGoal: goal ? { ...goal, chosenSeason: game.currentSeason } : undefined,
        },
      })
    },

    resolveWeeklyDecision: (choice: 'A' | 'B') => {
      const { game } = get()
      if (!game || !game.pendingWeeklyDecision) return
      const decision = game.pendingWeeklyDecision
      const effects = resolveWeeklyDecisionFn(game, decision, choice)
      const resolvedKey = `${decision.id}_${game.currentSeason}`

      // Cooldown starts from resolution time — ensures at least COOLDOWN rounds between resolution and next generation
      const resolvedMatchday = Math.min(
        ...game.fixtures.filter(f => f.status !== 'completed').map(f => f.matchday),
        Infinity,
      )
      const resolvedRound = isFinite(resolvedMatchday) ? resolvedMatchday : (game.weeklyDecisionLastRound ?? 1)

      // U5 (SLUTTEST_KO.md, 2026-08-17): narrativeBeatLog-skrivväg 2/9. decision.id
      // är redan season-strippad (t.ex. 'away_trip_bus'), inget att härleda.
      let updatedGame: SaveGame = {
        ...game,
        pendingWeeklyDecision: undefined,
        resolvedWeeklyDecisions: [...(game.resolvedWeeklyDecisions ?? []), resolvedKey],
        weeklyDecisionLastRound: Math.max(game.weeklyDecisionLastRound ?? 0, resolvedRound),
        narrativeBeatLog: logNarrativeBeat(game, decision.id, game.currentSeason, resolvedRound, decision.systemhandelse),
      }

      // Apply effects
      for (const effect of effects) {
        if (effect.type === 'finances') {
          const club = updatedGame.clubs.find(c => c.id === updatedGame.managedClubId)
          if (club) {
            updatedGame = {
              ...updatedGame,
              clubs: updatedGame.clubs.map(c =>
                c.id === updatedGame.managedClubId
                  ? { ...c, finances: c.finances + effect.delta }
                  : c
              ),
            }
          }
        } else if (effect.type === 'supporterMood') {
          if (updatedGame.supporterGroup) {
            const newMood = Math.max(0, Math.min(100, updatedGame.supporterGroup.mood + effect.delta))
            updatedGame = { ...updatedGame, supporterGroup: { ...updatedGame.supporterGroup, mood: newMood } }
          }
        } else if (effect.type === 'communityStanding') {
          updatedGame = {
            ...updatedGame,
            communityStanding: Math.max(0, Math.min(100, (updatedGame.communityStanding ?? 50) + effect.delta)),
          }
        } else if (effect.type === 'boardPatience') {
          updatedGame = {
            ...updatedGame,
            boardPatience: Math.max(0, Math.min(100, (updatedGame.boardPatience ?? 70) + effect.delta)),
          }
        } else if (effect.type === 'cornerSkill') {
          updatedGame = {
            ...updatedGame,
            players: updatedGame.players.map(p =>
              p.id === effect.playerId
                ? { ...p, attributes: { ...p.attributes, cornerSkill: Math.min(100, p.attributes.cornerSkill + effect.delta) } }
                : p
            ),
          }
        } else if (effect.type === 'morale') {
          // PC-1: moral-effekten ska träffa p.morale, inte p.form (buggen gjorde att
          // "+5 moral" felaktigt höjde formen). Bara player_weekend_off använder denna gren.
          updatedGame = {
            ...updatedGame,
            players: updatedGame.players.map(p =>
              p.id === effect.playerId
                ? { ...p, morale: Math.max(0, Math.min(100, p.morale + effect.delta)) }
                : p
            ),
          }
        } else if (effect.type === 'fitness') {
          // PC-1: kondition-deltat saknades helt (labeln lovade "−1 kondition").
          updatedGame = {
            ...updatedGame,
            players: updatedGame.players.map(p =>
              p.id === effect.playerId
                ? { ...p, fitness: Math.max(0, Math.min(100, p.fitness + effect.delta)) }
                : p
            ),
          }
        } else if (effect.type === 'cornerRecovery') {
          updatedGame = {
            ...updatedGame,
            players: updatedGame.players.map(p =>
              p.id === effect.playerId
                ? { ...p, attributes: { ...p.attributes, cornerRecovery: Math.min(100, (p.attributes.cornerRecovery ?? 50) + effect.delta) } }
                : p
            ),
          }
        } else if (effect.type === 'scoutNextOpponent') {
          // Fynd 11: drar en scout och genererar detaljerad analys av nästa motståndare
          // (samma logik som requestDetailedAnalysis). Surfas på matchförberedelsen.
          const nextFixture = getNextManagedFixture(updatedGame)
          const oppId = nextFixture
            ? (nextFixture.homeClubId === updatedGame.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId)
            : undefined
          const opponent = oppId ? updatedGame.clubs.find(c => c.id === oppId) : undefined
          if (opponent && nextFixture && (updatedGame.scoutBudget ?? 0) > 0) {
            const oppPlayers = updatedGame.players.filter(p => p.clubId === opponent.id)
            const analysis = generateDetailedAnalysis(opponent, oppPlayers, updatedGame.standings, updatedGame.fixtures, nextFixture.id)
            updatedGame = {
              ...updatedGame,
              scoutBudget: updatedGame.scoutBudget - 1,
              opponentAnalyses: { ...(updatedGame.opponentAnalyses ?? {}), [opponent.id]: analysis },
            }
          }
        }
      }

      const afterPromote = (updatedGame.deferredDecisions ?? []).length > 0
        ? promoteFromQueue(updatedGame)
        : updatedGame
      set({ game: afterPromote })
      void persistAutosave(afterPromote, 'resolveWeeklyDecision', set)
    },

    markScreenVisited: (screen: string) => {
      const { game } = get()
      if (!game) return
      const visited = game.visitedScreensThisRound ?? []
      if (!visited.includes(screen)) {
        set({ game: { ...game, visitedScreensThisRound: [...visited, screen] } })
      }
    },

    dismissBeat: (beatKey: string, beatId?: string) => {
      const { game } = get()
      if (!game) return
      const shown = game.shownBeats ?? []
      if (!shown.includes(beatKey)) {
        // U5 (SLUTTEST_KO.md, 2026-08-17): narrativeBeatLog-skrivväg 3/9. Loggar
        // den råa beatKey:en oskalad (flera keyFn:s bakar redan in `_s{season}`
        // — finkornig strippning är ett senare, medvetet steg per DOM:en).
        let log = logNarrativeBeat(game, beatKey, game.currentSeason, getCurrentLeagueRound(game))
        // U5 forts (2026-08-20): pivotal beats loggar DESSUTOM en post på sitt
        // eget stabila beat.id (utöver den kompositnyckel-baserade posten
        // ovan) — isOnCooldown (portalBeatService.ts) matchar exakt mot
        // semanticKey och kan annars aldrig hitta ett tidigare tillfälle när
        // keyFn bakar in trigger/omgång i nyckeln (t.ex. ripple_consequence).
        if (beatId && PIVOTAL_BEAT_IDS.includes(beatId)) {
          log = logNarrativeBeat({ ...game, narrativeBeatLog: log }, beatId, game.currentSeason, getCurrentLeagueRound(game))
        }
        set({ game: { ...game, shownBeats: [...shown, beatKey], narrativeBeatLog: log } })
      }
    },

    markAnslagSeen: (key: AnslagKey) => {
      const { game } = get()
      if (!game) return
      const seen = game.seenAnslag ?? []
      if (!seen.includes(key)) {
        set({ game: { ...game, seenAnslag: [...seen, key] } })
      }
    },

    markAnniversaryAcknowledged: (eventId: string) => {
      const { game } = get()
      if (!game) return
      const seen = game.anniversariesSeen ?? []
      if (seen.includes(eventId)) return
      const updatedGame: SaveGame = {
        ...game,
        anniversariesSeen: [...seen, eventId],
        activeAnniversaries: (game.activeAnniversaries ?? []).filter(a => a.eventId !== eventId),
      }
      set({ game: updatedGame })
      void persistAutosave(updatedGame, 'markAnniversaryAcknowledged', set)
    },

    simulateRemainingStep: (): AdvanceResult | null => {
      const state = get()
      const { game, resolveEvent, setPlayerLineup, advance } = state
      if (!game) return null
      if ((game.pendingEvents?.length ?? 0) > 0) {
        const event = game.pendingEvents[0]
        // D1-utredningen (2026-08-19): ambienta events (choices.length === 0,
        // se eventQueueService.ts:s isAmbientEvent) gav tidigare
        // event.choices[0] === undefined → .id kraschade. eventResolver.ts:33
        // ignorerar choiceId helt för choice-lösa events (filtrerar bara bort
        // dem ur kön), så valfri sträng funkar — 'ambient_dismiss' matchar
        // AmbientEventRow.tsx:s dismiss-anrop.
        const neutralChoiceId = event.choices.length === 0
          ? 'ambient_dismiss'
          : (event.choices.find(c =>
              c.id.includes('reject') || c.id.includes('decline') || c.id.includes('no') ||
              (c.effect as { type?: string })?.type === 'noOp'
            ) ?? event.choices[0]).id
        resolveEvent(event.id, neutralChoiceId)
        return { game: get().game!, roundPlayed: null, seasonEnded: false }
      }
      if (!game.managedClubPendingLineup) {
        const available = game.players
          .filter(p => p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining <= 0)
          .sort((a, b) => b.currentAbility - a.currentAbility)
        setPlayerLineup(
          available.slice(0, 11).map(p => p.id),
          available.slice(11, 16).map(p => p.id),
          available[0]?.id,
          true,
        )
      }
      return advance(true) // suppress navigation — caller handles it
    },

    completeScene: (sceneId: import('../../../domain/entities/Scene').SceneId, choiceId?: string) => {
      const { game } = get()
      if (!game) return
      const updatedGame: SaveGame = { ...game }
      updatedGame.pendingScene = undefined
      if (sceneId === 'coffee_room') {
        updatedGame.lastCoffeeSceneRound = updatedGame.currentMatchday
        // B9 T1B — spara visade index så nästa scen kan undvika dem
        const coffeeScene = getCoffeeRoomScene(updatedGame)
        if (coffeeScene) {
          updatedGame.lastCoffeeSceneIndices = [...(updatedGame.lastCoffeeSceneIndices ?? []), ...coffeeScene.pickedIndices].slice(-12)
          // U5 (SLUTTEST_KO.md, 2026-08-17): narrativeBeatLog-skrivväg 8/9 — en
          // post per visat poolindex, matchar mekanismens egna syfte
          // (undvik samma kafferumsrad igen).
          for (const idx of coffeeScene.pickedIndices) {
            updatedGame.narrativeBeatLog = logNarrativeBeat(updatedGame, `coffee_pool_${idx}`, updatedGame.currentSeason, getCurrentLeagueRound(updatedGame))
          }
          // D3 — återkomsten visades: ta bort den ur kön, den landar bara en gång.
          if (coffeeScene.consumedReturnQuestionId) {
            updatedGame.coffeeRoomPendingReturns = (updatedGame.coffeeRoomPendingReturns ?? [])
              .filter(p => p.questionId !== coffeeScene.consumedReturnQuestionId)
          }
        }
        // A2/D1-D3 — choiceId format "{questionId}:{answerId}" när spelaren svarat.
        // Svaret pensioneras (ställs aldrig igen) och en återkomst schemaläggs.
        if (choiceId && choiceId.includes(':')) {
          const [questionId, answerId] = choiceId.split(':')
          if ((answerId === 'A' || answerId === 'B') && !(updatedGame.coffeeRoomAnsweredQuestions ?? []).includes(questionId)) {
            updatedGame.coffeeRoomAnsweredQuestions = [...(updatedGame.coffeeRoomAnsweredQuestions ?? []), questionId]
            updatedGame.coffeeRoomAnswers = { ...(updatedGame.coffeeRoomAnswers ?? {}), [questionId]: answerId }
            updatedGame.coffeeRoomPendingReturns = [
              ...(updatedGame.coffeeRoomPendingReturns ?? []),
              { questionId, answerId, answeredMatchday: updatedGame.currentMatchday },
            ]
          }
        }
      } else if (sceneId === 'sm_final_victory' || sceneId === 'cup_final_victory') {
        // A-H4a (SEXSÄSONGSAUDITEN 2026-08-26): loggar Birger-citatets index
        // NÄR SCENEN VISATS (samma skrivmönster som coffee_pool_ ovan) —
        // useSMFinalData.ts/useCupFinalData.ts läser samma logg för att
        // undvika citat på cooldown. Härleder SAMMA index scenen just
        // visade genom att anropa samma rena funktion med samma indata
        // (game-snapshot före denna mutation), istf att tråda index genom props.
        const isSm = sceneId === 'sm_final_victory'
        const templates = isSm ? SM_FINAL_VICTORY_TEMPLATES : CUP_FINAL_VICTORY_TEMPLATES
        const prefix = isSm ? BIRGER_SM_QUOTE_PREFIX : BIRGER_CUP_QUOTE_PREFIX
        const tieBreakSeed = isSm
          ? game.currentSeason * 13 + game.managedClubId.length
          : game.currentSeason * 11 + game.managedClubId.length * 3
        const shownIdx = pickPoolIndexAvoidingCooldown(game, game.currentSeason, templates.birgerQuotes.length, prefix, tieBreakSeed)
        updatedGame.narrativeBeatLog = logNarrativeBeat(updatedGame, `${prefix}${shownIdx}`, updatedGame.currentSeason, getCurrentLeagueRound(updatedGame))
        // Audit 2026-08-29 BLOCKER (cupscenen låser Hem): denna gren loggade
        // bara citatet, la ALDRIG sceneId i shownScenes (jmf default-grenen
        // nedan) — sceneTriggerService.ts re-triggade scenen om och om igen
        // eftersom den aldrig såg som "visad". sm_final_victory hade samma
        // hål, bara mindre synligt eftersom SM-final är sällsyntare.
        updatedGame.shownScenes = [...(updatedGame.shownScenes ?? []), sceneId]
      } else if (sceneId === 'season_signature_reveal') {
        // Track per-season with dedicated field (not SceneId[] — needs season number)
        updatedGame.shownSeasonSignatureRevealSeason = updatedGame.currentSeason
      } else if (sceneId === 'valet') {
        // B1 — per-säsong-stämpel (recurring, shownScenes duger ej — det är engång/spel)
        updatedGame.valetShownSeason = updatedGame.currentSeason
        // choiceId är nodeId vid val, 'decline' eller undefined vid avstå
        if (choiceId && choiceId !== 'decline') {
          const facilityState = updatedGame.facilityState ?? { builtNodeIds: [] }
          const can = canStartBuild(choiceId, facilityState)
          if (can.ok) {
            const def = FACILITY_NODE_DEFS.find(d => d.id === choiceId)
            if (def) {
              updatedGame.clubs = applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, -def.cost)
              updatedGame.facilityState = startFacilityBuild(choiceId, facilityState, updatedGame.currentMatchday)
            }
          }
        }
      } else {
        // U5 (SLUTTEST_KO.md, 2026-08-17): narrativeBeatLog-skrivväg 4/9.
        updatedGame.shownScenes = [...(updatedGame.shownScenes ?? []), sceneId]
        updatedGame.narrativeBeatLog = logNarrativeBeat(updatedGame, sceneId, updatedGame.currentSeason, getCurrentLeagueRound(updatedGame))
      }
      if (choiceId) {
        updatedGame.sceneChoices = {
          ...(updatedGame.sceneChoices ?? {}),
          [sceneId]: choiceId,
        }
      }

      // Kedja scener: efter en scen klickats igenom, kolla om nästa ska trigga.
      // Så board_meeting → sunday_training → cup_intro flyter naturligt utan ett mellansteg via Portal.
      const nextSceneId = detectSceneTrigger(updatedGame)
      if (nextSceneId) {
        updatedGame.pendingScene = { sceneId: nextSceneId, triggeredAt: updatedGame.currentDate }
      }

      set({ game: updatedGame })
      void persistAutosave(updatedGame, 'completeScene', set)
    },

    triggerCoffeeRoomScene: () => {
      const { game } = get()
      if (!game) return
      if (game.pendingScene) return
      const updatedGame: SaveGame = {
        ...game,
        pendingScene: { sceneId: 'coffee_room', triggeredAt: game.currentDate },
      }
      set({ game: updatedGame })
      void persistAutosave(updatedGame, 'triggerCoffeeRoomScene', set)
    },

    triggerJournalistScene: () => {
      const { game } = get()
      if (!game) return
      if (game.pendingScene) return
      const updatedGame: SaveGame = {
        ...game,
        pendingScene: { sceneId: 'journalist_relationship', triggeredAt: game.currentDate },
      }
      set({ game: updatedGame })
      void persistAutosave(updatedGame, 'triggerJournalistScene', set)
    },

    resolveRetirementDecision: (playerId: string, choice: 'thank' | 'respect' | 'invite'): { retired: boolean; response: string } => {
      const { game } = get()
      if (!game) return { retired: false, response: '' }

      const rand = Math.random()
      let retired: boolean
      if (choice === 'thank') retired = rand < 0.9
      else if (choice === 'respect') retired = rand < 0.5
      else retired = rand > 0.7  // 'invite': 30% retire, 70% continue

      const responseKey = `${choice}_${retired ? 'retired' : 'continued'}`
      const pool = RETIREMENT_RESPONSES[responseKey] ?? []
      const response = pool[Math.floor(rand * pool.length)] ?? ''

      // Remove the player from the roster if they retired, or keep them as-is
      const updatedPlayers = retired
        ? game.players.filter(p => p.id !== playerId)
        : game.players

      // Increment retirementCeremonyCounter when a player retires
      const counter = (game.retirementCeremonyCounter ?? 0) + (retired ? 1 : 0)

      // Farewell match: mark next home fixture every 5th retirement
      let updatedFixtures = game.fixtures
      if (retired && counter > 0 && counter % 5 === 0) {
        const nextHome = game.fixtures.find(f =>
          f.status !== 'completed' &&
          f.homeClubId === game.managedClubId &&
          !f.farewellMatchForPlayerId
        )
        if (nextHome) {
          updatedFixtures = game.fixtures.map(f =>
            f.id === nextHome.id ? { ...f, farewellMatchForPlayerId: playerId } : f
          )
        }
      }

      const updatedGame: SaveGame = {
        ...game,
        players: updatedPlayers,
        fixtures: updatedFixtures,
        pendingRetirementDecision: undefined,
        retirementCeremonyCounter: counter,
      }

      set({ game: updatedGame })
      void persistAutosave(updatedGame, 'resolveRetirementDecision', set)

      return { retired, response }
    },

    resolveAnnandagsVal: (val: 'A' | 'B' | 'C' | 'D') => {
      const game = get().game
      if (!game) return

      const managedClub = game.clubs.find(c => c.id === game.managedClubId)
      if (!managedClub) return

      // ── Ekonomiska effekter ───────────────────────────────────────────────
      let updatedClubs = game.clubs
      let updatedMecenater = game.mecenater ?? []
      let pendingAnnandagsGratisentreVal = game.pendingAnnandagsGratisentreVal ?? false

      if (val === 'B') {
        // Julmarknad: dra 15 000 kr från managed clubs cashOnHand (finances)
        updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, -15000)
      }

      if (val === 'C') {
        // Gratisentré: plantera pending-flagga för matchdagen
        pendingAnnandagsGratisentreVal = true
      }

      if (val === 'D') {
        // Mecenat-värd: +20 happiness på aktiv mecenat
        updatedMecenater = (game.mecenater ?? []).map(m =>
          m.isActive ? { ...m, happiness: Math.min(100, m.happiness + 20) } : m
        )
      }

      // ── CS (communityStanding) effekter ──────────────────────────────────
      const csDelta = val === 'B' ? 10 : val === 'C' ? 25 : val === 'D' ? 15 : 0
      const newCS = csDelta > 0
        ? Math.min(100, (game.communityStanding ?? 50) + csDelta)
        : game.communityStanding ?? 50

      // ── Konsekvenskedjor: plantera pending events ─────────────────────────
      const pendingAnnandagsMediaRubrik: SaveGame['pendingAnnandagsMediaRubrik'] = val !== 'A'
        ? { val, triggerRound: (game.currentMatchday ?? 0) + 1 }
        : undefined
      const pendingAnnandagsKlack: SaveGame['pendingAnnandagsKlack'] = val !== 'A'
        ? { val, triggerRound: (game.currentMatchday ?? 0) + 2 }
        : undefined

      const updatedGame: SaveGame = {
        ...game,
        clubs: updatedClubs,
        mecenater: updatedMecenater,
        communityStanding: newCS,
        annandagsValGjort: val,
        pendingAnnandagsVal: false,
        pendingAnnandagsGratisentreVal,
        pendingAnnandagsMediaRubrik,
        pendingAnnandagsKlack,
      }

      set({ game: updatedGame })
      void persistAutosave(updatedGame, 'resolveAnnandagsVal', set)
    },

    // Release-svepet 2026-07-21 (Block 2c) — ren avfärdning, ingen förgrening
    // (jfr resolveAnnandagsVal ovan): CALLUP_MODAL:s enda knapp bekräftar att
    // spelaren sett ceremonin, ändrar inget spelläge. Bonusen är redan
    // applicerad (roundProcessor.ts, vid själva uttagningen).
    dismissCallupModal: () => {
      const { game } = get()
      if (!game || !game.pendingCallupModal) return
      const updatedGame: SaveGame = { ...game, pendingCallupModal: undefined }
      set({ game: updatedGame })
      void persistAutosave(updatedGame, 'dismissCallupModal', set)
    },
  }
}
