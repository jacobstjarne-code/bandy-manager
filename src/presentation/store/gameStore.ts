import { useState, useEffect } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { SaveGame, RoundSummaryData, Sponsor } from '../../domain/entities/SaveGame'
import type { Tactic } from '../../domain/entities/Club'
import type { TrainingFocus } from '../../domain/entities/Training'
import type { MatchEvent, TeamSelection, MatchReport } from '../../domain/entities/Fixture'
import { FixtureStatus, PlayoffStatus, InboxItemType, PlayerPosition } from '../../domain/enums'
import { createNewGame } from '../../application/useCases/createNewGame'
import { detectSceneTrigger } from '../../domain/services/sceneTriggerService'
import { buildSeasonCalendar } from '../../domain/services/scheduleGenerator'
import { resolveEvent as resolveEventFn } from '../../domain/services/eventService'
import { resolveSponsorCounter } from '../../domain/services/sponsorCounterService'
import { promoteFromQueue } from '../../domain/services/decisionBudgetService'
import { type AdvanceResult } from '../../application/useCases/advanceToNextEvent'
import { setLineup } from '../../application/useCases/setLineup'
import { generateDetailedAnalysis } from '../../domain/services/opponentAnalysisService'
import { diffTactics } from '../utils/tacticData'
import { loadSaveGame, migrateLocalStorageIfNeeded, saveSaveGame, snapshotSave } from '../../infrastructure/persistence/saveGameStorage'
import { subscribeToSaveWrites } from '../../infrastructure/persistence/saveConflictChannel'
import { applyFinanceChange } from '../../domain/services/economyService'
import { applyLeadershipAction } from '../../domain/services/leadershipService'
import { canStartBuild, startFacilityBuild, canDecommission, decommissionFacilityNode, getFinancingOptions, DECOMMISSION_COMMUNITY_STANDING_COST, FACILITY_NODE_DEFS, type FinancingContext } from '../../domain/services/facilityService'
import type { FacilityFinancingMode } from '../../domain/entities/Community'
import { captureFacilityBuildDecision } from '../../domain/services/seasonDecisionCaptureService'

import { matchActions } from './actions/matchActions'
import { trainingActions } from './actions/trainingActions'
import { transferActions } from './actions/transferActions'
import { academyActions } from './actions/academyActions'
import { gameFlowActions } from './actions/gameFlowActions'
import { periodisationActions } from './actions/periodisationActions'
import { careerBreakActions } from './actions/careerBreakActions'
import { computeCardStaleTracking } from '../../domain/services/portal/portalBuilder'
import { safeStandingPosition } from '../../domain/services/standingsService'
import { getCsPoliticianGrantBonus } from '../../domain/services/communityStandingScaling'

export type SaveActionResult = { success: boolean; error?: string }

// GAP-1: ErrorBoundary "Till huvudmenyn" sätter denna flagga (synkront, localStorage) före
// full reload. Vid nästa boot rensar onRehydrateStorage de UI-drivande pending-fälten så att
// ett save-state-inducerat renderingsfel inte återkommer i en loop. Synkron localStorage =
// ingen IndexedDB-write-race mot reload.
export const RECOVER_PENDING_FLAG = 'bandy-recover-pending'

function clearPendingFlows(game: SaveGame): SaveGame {
  return {
    ...game,
    pendingScreen: null,
    pendingScene: undefined,
    pendingEvents: [],
    pendingFollowUps: undefined,
    pendingWeeklyDecision: undefined,
    pendingPressConference: undefined,
    pendingCSPress: undefined,
    pendingRefereeMeeting: undefined,
    pendingRetirementDecision: undefined,
  }
}

interface GameState {
  game: SaveGame | null
  isLoading: boolean
  lastAdvanceResult: AdvanceResult | null
  roundSummary: RoundSummaryData | null
  // C1 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24): "senast
  // bekräftad sparningstid" — sätts ENDAST efter att saveSaveGame() faktiskt
  // returnerat success:true, aldrig optimistiskt vid anropstillfället.
  // lastSaveError sätts vid varje misslyckad sparning (manuell ELLER
  // autosave) och rensas vid nästa lyckade — GameHeader.tsx visar den.
  lastConfirmedSaveAt: string | null
  lastSaveError: string | null
  // M2 (audit 5c9a7a8, 2026-08-24): sätts true när EN AV TVÅ saker händer —
  // (a) denna flik försökte spara och fick conflict:true tillbaka
  // (saveSaveGame har redan avvisat skrivningen, ingen dataförlust skedde),
  // eller (b) en annan flik broadcastar att den skrivit en nyare revision av
  // SAMMA save (subscribeToSaveWrites nedan) — upptäcks direkt, inte först
  // vid nästa misslyckade sparförsök. Rensas ALDRIG automatiskt: en flik som
  // hamnat här kan inte längre spara säkert (dess lokala state är per
  // definition bakom), enda säkra vägen framåt är att ladda om och läsa den
  // faktiska nyaste kopian. SaveConflictModal.tsx är den blockerande ytan.
  saveConflict: boolean

  // Actions
  newGame: (managerName: string, clubId: string) => void
  // 3.3 (SLUTTEST_KO.md, 2026-08-17) Kontrakt A — nollställer store:t utan att
  // röra IndexedDB-posten. Gör att huvudmenyns hasSave blir korrekt false utan
  // att "SE KARRIÄREN"-flödet (som fångar game i route-state FÖRE detta
  // anrop) tappar sin data. Multi-slot (2026-08-22): newGame:s tidigare
  // ovillkorade delete-all-loop är borttagen — IndexedDB-posten för en
  // avfyrad karriär rensas alltså aldrig automatiskt längre, vilket nu är
  // KORREKT beteende (den ska kunna dyka upp i SaveManagerScreen efteråt),
  // inte en kvarglömd rensning.
  clearFiredGame: () => void
  // O13 (DOM_TRANARMARKNADEN_2026-08-26) — tränarmarknadens tre steg, i
  // domens ordning. Se careerBreakActions.ts.
  startCareerBreak: () => SaveGame | null
  revealCareerMarket: () => void
  acceptCareerOffer: (clubId: string) => boolean
  loadGame: (id: string) => Promise<boolean>
  // Multi-slot (2026-08-22): byte MELLAN två befintliga karriärer, från
  // SaveManagerScreen. Persisterar den utgående karriären till sin egen
  // id-nycklade save-plats FÖRST — annars vore ett byte bort och sen
  // tillbaka en dataförlust av allt spelat sedan senaste explicita saveGame().
  // loadGame(id) är no-op om id redan är den aktiva karriären (se dess egen
  // guard), så switchToSave är säker att anropa även på den redan aktiva.
  switchToSave: (id: string) => Promise<boolean>
  advance: (suppressMatchNavigation?: boolean) => AdvanceResult | null
  setPlayerLineup: (startingPlayerIds: string[], benchPlayerIds: string[], captainPlayerId?: string, autoSelected?: boolean) => { success: boolean; error?: string }
  updateTactic: (tactic: Tactic) => void
  setTacticAdvancedMode: (advanced: boolean) => Promise<SaveActionResult>
  setTraining: (focus: TrainingFocus) => void
  markOnboardingComplete: () => Promise<SaveActionResult>
  // M1: se implementationens kommentar (create()-blocket nedan) för varför.
  advanceOnboardingToTilltrade: () => Promise<SaveActionResult>
  setTilltradeStep: (step: 1 | 2 | 3 | 4) => Promise<SaveActionResult>
  saveGame: () => Promise<SaveActionResult>
  dismissHint: (screenId: string) => void
  updateMatchMode: (mode: 'full' | 'commentary' | 'quicksim' | 'silent') => Promise<SaveActionResult>
  markInboxRead: (itemId: string) => void
  markAllInboxRead: () => void
  startEvaluation: (playerId: string, clubId: string, sameRegion: boolean, hasPlayedAgainst?: boolean) => { success: boolean; error?: string }
  toggleScoutShortlist: (playerId: string) => void
  placeOutgoingBid: (playerId: string, offerAmount: number, offeredSalary: number, contractYears: number) => { success: boolean; error?: string }
  renewContract: (playerId: string, newSalary: number, years: number) => { success: boolean; error?: string; wageWarning?: number }
  signFreeAgent: (agentId: string) => { success: boolean; error?: string }
  listPlayerForSale: (playerId: string) => { success: boolean; error?: string }
  respondToIncomingBid: (bidId: string, choiceId: string) => { success: boolean; error?: string }
  // HIGH 6 (Jacobs körorder 2026-08-31): madeByPlayer obligatorisk, ingen
  // default — se eventResolver.ts:s resolveEvent för rotorsak/regel.
  resolveEvent: (eventId: string, choiceId: string, madeByPlayer: boolean) => void
  // DOM_SPONSOR_MOTBUD_2026-08-31.md: enkelrunda motbud, utanför den
  // generiska choices/effect-dispatchen (Y är fri inmatning, inte ett
  // fördefinierat val). Delad i preview (rullar tärningen, ingen mutation)
  // + commit (applicerar utfallet) — se gameStore.ts:s implementation för
  // rotorsaken (undviker att modalen unmountas innan spelaren läst svaret).
  previewSponsorCounter: (eventId: string, requestedWeeklyIncome: number) => import('../../domain/services/sponsorCounterService').SponsorCounterResult | null
  commitSponsorCounter: (eventId: string, requestedWeeklyIncome: number, outcome: import('../../domain/services/sponsorCounterService').SponsorCounterOutcome) => void
  saveLiveMatchResult: (fixtureId: string, homeScore: number, awayScore: number, events: MatchEvent[], report: MatchReport, homeLineup: TeamSelection, awayLineup: TeamSelection, overtimeResult?: 'home' | 'away', penaltyResult?: { home: number; away: number }, attendance?: number, halftimeDecision?: import('../components/match/HalftimeModal').PauseLean) => void
  markMatchStarted: (fixtureId: string, homeLineup?: import('../../domain/entities/Fixture').TeamSelection, awayLineup?: import('../../domain/entities/Fixture').TeamSelection) => void
  simulateAbandonedMatch: (fixtureId: string) => void
  concedeWalkover: (fixtureId: string) => void
  clearSeasonSummary: () => void
  resolveContractDemands: (resolutions: Record<string, 'met' | 'skipped'>) => void
  clearBoardMeeting: () => void
  requestDetailedAnalysis: (opponentClubId: string, fixtureId: string) => { success: boolean; error?: string }
  startTalentSearch: (position: string, maxAge: number, maxSalary: number, currentRound: number) => { success: boolean; error?: string }
  talkToPlayer: (playerId: string, choice: 'encourage' | 'demand' | 'future', currentRound: number) => { moraleChange: number; formChange: number; feedback: string; inboxTriggered: boolean }
  useLeadershipAction: (playerId: string, action: import('../../domain/services/leadershipService').LeadershipAction, currentRound: number) => { feedback: string } | null
  clearPreSeason: () => void
  clearHalfTimeSummary: () => void
  applyHalftimeDecision: (decision: 'lugna' | 'pressa' | 'prata') => void
  clearPlayoffIntro: () => void
  clearQFSummary: () => void
  setPeriodisation: (mode: 'bygg' | 'hall' | 'toppa' | 'vila') => void
  setPlayerPeriodisationOverride: (playerId: string, mode: 'hall' | 'vila' | null) => void
  setBudgetPriority: (priority: 'squad' | 'balanced' | 'youth') => void
  setCaptain: (playerId: string) => void
  interactWithPolitician: (action: 'invite' | 'budget' | 'apply') => { success: boolean; message: string }
  setTransferBudget: (amount: number) => void
  buyScoutRounds: () => void
  recruitVolunteer: (name: string) => void
  startFacilityBuildNode: (nodeId: string, mode?: FacilityFinancingMode) => { success: boolean; error?: string }
  decommissionFacilityNode: (nodeId: string) => { success: boolean; error?: string }
  activateCommunity: (key: string, level: string) => { success: boolean; error?: string }
  upgradeAcademy: () => { success: boolean; error?: string }
  upgradeFacilities: () => { success: boolean; error?: string }
  promoteYouthPlayer: (youthPlayerId: string) => { success: boolean; error?: string; timing?: 'early' | 'good' | 'late' }
  assignMentor: (seniorPlayerId: string, youthPlayerId: string) => { success: boolean; error?: string }
  removeMentor: (youthPlayerId: string) => void
  loanOutPlayer: (playerId: string, destinationClubName: string, rounds: number) => { success: boolean; error?: string }
  recallLoan: (playerId: string) => void
  startTrainingProject: (type: string, intensity: 'normal' | 'hard') => { success: boolean; error?: string }
  cancelTrainingProject: (projectId: string) => void
  seekSponsor: () => { success: boolean; sponsor?: Sponsor; error?: string }
  simulateRemainingStep: () => AdvanceResult | null
  clearRoundSummary: () => void
  // O3 (DOM_EGET_SASONGSMAL_2026-08-17.md): valfri goal-param, se
  // gameFlowActions.ts:s implementation för semantik (undefined = "inget
  // särskilt i år", ett giltigt svar).
  passSeasonTransition: (goal?: { type: import('../../domain/entities/SeasonSummary').SeasonGoalType; referenceId?: string; trackedPlayerIds?: string[] }) => void
  markScreenVisited: (screen: string) => void
  dismissBeat: (beatKey: string, beatId?: string) => void
  markAnslagSeen: (key: import('../../domain/services/anslagService').AnslagKey) => void
  resolveWeeklyDecision: (choice: 'A' | 'B') => void
  completeScene: (sceneId: import('../../domain/entities/Scene').SceneId, choiceId?: string) => void
  triggerCoffeeRoomScene: () => void
  triggerJournalistScene: () => void
  markPhaseAcknowledged: (phase: import('../../domain/data/seasonPhases').PortalPhase) => void
  recordPortalShown: (cardIds: string[], storySlotKind?: string) => void
  resolveRetirementDecision: (playerId: string, choice: 'thank' | 'respect' | 'invite') => { retired: boolean; response: string }
  markAnniversaryAcknowledged: (eventId: string) => void
  resolveAnnandagsVal: (val: 'A' | 'B' | 'C' | 'D') => void
  dismissCallupModal: () => void
  updateMatchLaddningBand: (data: { matchday: number; streakLength: number; stateType: 'winning_streak' | 'losing_streak' } | null) => void
  // M2: SaveConflictModal.tsx:s enda knapp. Se implementationens kommentar
  // för VARFÖR ett rakt window.location.reload() inte räcker här.
  resolveSaveConflict: () => Promise<void>
}

const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const val = await idbGet<string>(name)
    return val ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name)
  },
}

// C1 (5c9a7a8, 2026-08-24): läste tidigare på att saveSaveGame() skulle
// KASTA vid fel — den svalde istället allt internt och returnerade
// Promise<void>, så catch-blocket här var död kod och detta returnerade
// alltid success:true. saveSaveGame() returnerar nu en riktig SaveWriteResult
// (se saveGameStorage.ts) — inget try/catch behövs, resultatet propageras rakt av.
function persistGameSnapshot(
  game: SaveGame | null,
  set: (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void
): Promise<SaveActionResult> {
  if (!game) return Promise.resolve({ success: false, error: 'Inget spel laddat' })
  return saveSaveGame(game).then(result => {
    if (result.success) {
      // M2: skriv tillbaka den nya revisionen in i store:ts `game`, annars
      // konfliktar denna fliks EGET nästa sparförsök med sig självt (dess
      // in-memory game.revision skulle annars stå kvar på det gamla värdet
      // för alltid, medan disken redan gått vidare). Funktionell set —
      // slår ihop mot AKTUELLT state, inte det game-snapshot som fanns när
      // detta anrop startade, så en action som hunnit köra under tiden
      // saveSaveGame() väntade på IndexedDB inte skrivs över.
      set(state => ({
        lastConfirmedSaveAt: new Date().toISOString(),
        lastSaveError: null,
        game: state.game && state.game.id === game.id ? { ...state.game, revision: result.newRevision } : state.game,
      }))
    } else if (result.conflict) {
      // M2: INTE ett lagringsfel — skrivningen avvisades medvetet av
      // compare-and-swap. lastSaveError hade fått GameHeader-toasten att
      // visa och sen tysta sig efter 2.4s, som om spelaren bara kunde
      // trycka spara igen. Det kan de inte: denna fliks state är bakom,
      // varje nytt försök avvisas likadant tills omladdning. saveConflict
      // rensas aldrig automatiskt — se GameState-fältets kommentar.
      set({ saveConflict: true })
    } else {
      set({ lastSaveError: result.error ?? 'Kunde inte spara spelet' })
    }
    return result
  })
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      game: null,
      isLoading: false,
      lastAdvanceResult: null,
      roundSummary: null,
      lastConfirmedSaveAt: null,
      lastSaveError: null,
      saveConflict: false,

      newGame: (managerName, clubId) => {
        // U7 (SLUTTEST_KO.md, 2026-08-17): snapshot av den aktiva karriären
        // FÖRE bytet — samma skyddsnät som loadSaveGame:s pre_migration-
        // snapshot. Fire-and-forget (newGame är synkron); ett misslyckat
        // snapshot ska aldrig blockera flödet.
        //
        // Multi-slot (2026-08-22, releasegrind): den tidigare koden raderade
        // ALLA befintliga saves här ("radera-alla-loopen") — det var det som
        // gjorde en-spelare-i-taget till en inbyggd begränsning, inte bara ett
        // UI-val. En spelare som ville prova en ny klubb var tvungen att
        // radera sin gamla karriär. bandy_save_index/bandy_save_<id> är redan
        // ett riktigt uuid-nycklat multi-save-index (saveGameStorage.ts) —
        // saves kan redan samexistera säkert på disk, ingenting kolliderar.
        // Enda kravet: den UTGÅENDE karriären måste persisteras till sin egen
        // save-plats INNAN vi byter, annars är snapshotet save-väljaren
        // (SaveManagerScreen) senare laddar inaktuellt. Se switchToSave
        // nedan för samma mönster vid byte MELLAN två befintliga karriärer.
        const activeGame = get().game
        if (activeGame) {
          void snapshotSave('pre_newgame', activeGame)
          // C1 (5c9a7a8, 2026-08-24): fire-and-forget (newGame är synkron) —
          // men "fire-and-forget" fick tidigare INGEN signal alls vid fel,
          // eftersom saveSaveGame() svalde sina egna undantag. Nu explicit
          // console.error om den utgående karriären inte hann persisteras,
          // istf en tyst void som aldrig kunde upptäckas.
          void saveSaveGame(activeGame).then(r => {
            if (!r.success) console.error('newGame: kunde inte spara utgående karriär innan byte:', r.error)
          })
        }
        // O10-uppföljning (2026-08-26, Jacobs fynd): newGame() skickade
        // ALDRIG ett seed till createNewGame() — worldSeed föll tillbaka
        // till konstanten 42 för VARJE karriär som startats via appen,
        // sedan K4 (19 aug) fram tills nu. Alla live-careers har delat
        // exakt samma värld i en vecka, oavsiktligt. Analys-/stresstest-
        // skripten i scripts/ berörs INTE (de anropar createNewGame direkt
        // med egna varierande seeds, aldrig via gameStore) — se
        // RAPPORT_SEED_BAKATVERIFIERING_2026-08-26.md. Fix: ett riktigt
        // slumpat seed per ny, fristående karriär.
        const randomSeed = Math.floor(Math.random() * 2 ** 31)
        let game = createNewGame({ managerName, clubId, seed: randomSeed })
        // Trigga inledande scen (board_meeting) vid säsong 1 / matchday 0.
        // advanceToNextEvent kör samma logik vid varje runda men vid newGame
        // har den aldrig körts än — explicit trigger här.
        const sceneId = detectSceneTrigger(game)
        if (sceneId) {
          game = { ...game, pendingScene: { sceneId, triggeredAt: game.currentDate } }
        }
        set({ game, lastAdvanceResult: null })
        // Multi-slot (2026-08-22, Jacobs rättning): persistera den NYA
        // karriären till bandy_save_index REDAN HÄR, inte först vid
        // markOnboardingComplete(). En karriär skapad men avbruten före
        // tillträde-onboardingen slutförs låg annars osynlig i väljaren för
        // alltid — inget senare tillfälle skulle någonsin indexera den, och
        // spelarens arbete (klubbval, spelarnamn) fanns kvar på disk men gick
        // inte att nå. En ofärdig karriär SYNS i väljaren nu (SaveGameSummary
        // bär bara managerName/clubName/season/lastSavedAt, inga onboarding-
        // beroende fält) — AppRouter.tsx:96 skickar redan korrekt vidare till
        // /tilltrade om spelaren väljer en icke-onboardad save.
        void saveSaveGame(game).then(r => {
          if (r.success) {
            // M2: samma resonemang som persistGameSnapshot — utan detta
            // står den nya karriärens in-memory game.revision kvar på sitt
            // ursprungsvärde för alltid, och NÄSTA sparning (saveGame,
            // autosave, vad som helst) skulle avvisas som en falsk
            // konflikt mot sin egen just skrivna revision.
            set(state => ({
              lastConfirmedSaveAt: new Date().toISOString(),
              lastSaveError: null,
              game: state.game && state.game.id === game.id ? { ...state.game, revision: r.newRevision } : state.game,
            }))
          } else {
            console.error('newGame: kunde inte spara ny karriär:', r.error)
            set({ lastSaveError: r.error ?? 'Kunde inte spara' })
          }
        })
      },

      clearFiredGame: () => {
        set({ game: null })
      },

      loadGame: async (id) => {
        const { game } = get()
        if (game !== null && game.id === id) return true
        const loaded = await loadSaveGame(id)
        if (!loaded) return false
        // Migrate old club names — strip suffixes like BK, IF, GoIF, IK, FK
        // Migrate Midfielder position → Half (merged positions)
        // Legacy matchday migration — fixtures from before matchday field was added (pre-B11)
        // NOTE: buildSeasonCalendar here is a ONE-TIME legacy migration, not on-demand use (B11 T3).
        // After B11, game.seasonCalendar is the single source of truth for all date lookups.
        if (loaded.fixtures.some((f: any) => f.matchday === undefined)) {
          const CUP_MATCHDAYS: Record<number, number> = { 1: 3, 2: 8, 3: 13, 4: 19 }
          const calendar = buildSeasonCalendar(loaded.currentSeason)
          loaded.fixtures = loaded.fixtures.map((f: any) => {
            if (f.matchday !== undefined) return f
            if (f.isCup) {
              const match = loaded.cupBracket?.matches.find((m: any) => m.fixtureId === f.id)
              const cupRound = match?.round ?? (f.roundNumber >= 100 ? f.roundNumber - 100 : 1)
              return { ...f, matchday: CUP_MATCHDAYS[cupRound as number] ?? f.roundNumber }
            }
            if (f.roundNumber > 22) {
              // Playoff: matchday = roundNumber + 4 (liga 22 = matchday 26, so round 23 → matchday 27)
              return { ...f, matchday: f.roundNumber + 4 }
            }
            const slot = calendar.find((s: any) => s.type === 'league' && s.leagueRound === f.roundNumber)
            return { ...f, matchday: slot?.matchday ?? f.roundNumber }
          })
        }

        // Migrate currentMatchday — saves before A1-fix saknar fältet
        if (loaded.currentMatchday === undefined || loaded.currentMatchday === null) {
          const completedMatchdays = loaded.fixtures
            .filter((f: any) => f.status === 'completed')
            .map((f: any) => f.matchday ?? 0)
          loaded.currentMatchday = completedMatchdays.length > 0
            ? Math.max(...completedMatchdays)
            : 0
        }

        const migrated = {
          ...loaded,
          phaseMarksSeen: loaded.phaseMarksSeen ?? [],
          sourceCooldowns: loaded.sourceCooldowns ?? {},
          clubs: loaded.clubs.map((c: any) => {
            const tactic = c.activeTactic ?? {}
            // Migrate positionAssignments (playerId → FormationSlot) → lineupSlots (slotId → playerId)
            if (tactic.positionAssignments && !tactic.lineupSlots) {
              const lineupSlots: Record<string, string | null> = {}
              for (const [pid, slot] of Object.entries(tactic.positionAssignments as Record<string, { id: string }>)) {
                lineupSlots[slot.id] = pid
              }
              tactic.lineupSlots = lineupSlots
              delete tactic.positionAssignments
            }
            return {
              ...c,
              name: c.name.replace(/\s+(BK|IF|GoIF|IK|FK|SK)$/i, '').trim(),
              shortName: c.shortName.replace(/\s+(BK|IF|GoIF|IK|FK|SK)$/i, '').trim(),
              activeTactic: tactic,
            }
          }),
          players: loaded.players.map((p: any) =>
            (p.position as string) === 'midfielder'
              ? { ...p, position: PlayerPosition.Half }
              : p
          ),
        }
        set({ game: migrated, lastAdvanceResult: null })
        return true
      },

      switchToSave: async (id) => {
        const { game } = get()
        if (game) {
          // C1 (5c9a7a8, 2026-08-24): en misslyckad sparning här fick tidigare
          // ingen konsekvens alls — bytet fortsatte, och den utgående karriärens
          // ospardade framsteg försvann tyst när loadGame(id) skrev över store:t.
          // Avbryt bytet om vi inte kan bekräfta att den är säker.
          const result = await saveSaveGame(game)
          if (!result.success) {
            console.error('switchToSave: kunde inte spara utgående karriär, avbryter bytet:', result.error)
            set({ lastSaveError: result.error ?? 'Kunde inte spara' })
            return false
          }
          set({ lastConfirmedSaveAt: new Date().toISOString(), lastSaveError: null })
        }
        return get().loadGame(id)
      },

      setPlayerLineup: (startingPlayerIds, benchPlayerIds, captainPlayerId, autoSelected) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        const result = setLineup({ game, clubId: game.managedClubId, startingPlayerIds, benchPlayerIds, captainPlayerId, autoSelected })
        if (result.success) {
          set({ game: result.game })
          return { success: true }
        }
        return { success: false, error: result.error }
      },

      updateTactic: (tactic) => {
        const { game } = get()
        if (!game) return
        const updatedClubs = game.clubs.map(c =>
          c.id === game.managedClubId ? { ...c, activeTactic: tactic } : c
        )
        // O15 (2026-08-18/19): "Vad du ändrat i år"-loggning. Baslinjen är INTE
        // föregående updateTactic-anrop, utan tactic-snapshotet från senast SPELADE
        // matchens TeamSelection (samma källa som getTacticDeltaLine använder för
        // standardlägets delta-rad) — så en ångrad ändring inom samma omgång inte
        // lämnar en spökrad, och en riktig ändring alltid visar rätt slutvärde.
        let tacticChangeLog = game.tacticChangeLog
        const lastFixture = game.lastCompletedFixtureId
          ? game.fixtures.find(f => f.id === game.lastCompletedFixtureId)
          : undefined
        const baselineTactic = lastFixture
          ? (lastFixture.homeClubId === game.managedClubId ? lastFixture.homeLineup : lastFixture.awayLineup)?.tactic
          : undefined
        if (baselineTactic) {
          const diffs = diffTactics(baselineTactic, tactic)
          const matchday = game.currentMatchday
          const withoutThisMatchday = (tacticChangeLog ?? []).filter(e => e.matchday !== matchday)
          tacticChangeLog = diffs.length > 0
            ? [...withoutThisMatchday, { matchday, changes: diffs }]
            : withoutThisMatchday
        }
        set({ game: { ...game, clubs: updatedClubs, tacticChangeLog } })
      },

      // O15 (2026-08-18/19, DOM 1b): "annars är standardläget inte progressiv
      // disclosure utan en spärr man måste öppna varje vecka" (Jacob) — samma
      // persistGameSnapshot-mönster som updateMatchMode, så växlar spelaren till
      // Avancerat en gång står det kvar över reload/session, inte bara i minnet.
      setTacticAdvancedMode: async (advanced) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        if ((game.tacticAdvancedMode ?? false) === advanced) return { success: true }
        const updated = { ...game, tacticAdvancedMode: advanced }
        set({ game: updated })
        return persistGameSnapshot(updated, set)
      },

      markOnboardingComplete: async () => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        const updated = { ...game, onboardingComplete: true }
        set({ game: updated })
        return persistGameSnapshot(updated, set)
      },

      // M1 (audit 5c9a7a8, 2026-08-24): ArrivalScene.tsx:s onComplete anropar
      // denna FÖRE navigate('/tilltrade') — utan den persisterade routern
      // ingen aning om Ankomsten var klar, och skickade en avbruten spelare
      // rakt till /tilltrade vid nästa indirekta ruttinträde (byte av save),
      // hoppade över hela Ankomsten istf att återuppta den.
      advanceOnboardingToTilltrade: async () => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        const updated = { ...game, onboardingScreen: 'tilltrade' as const }
        set({ game: updated })
        return persistGameSnapshot(updated, set)
      },

      // M1: TilltradeScreen.tsx:s fyra F-steg låg tidigare bara i lokal
      // useState — ett avbrott (byte till annan save och tillbaka) dumpade
      // spelaren på steg 1 igen, oavsett var de faktiskt var. Anropas vid
      // varje setStep(), inte bara vid F4.
      setTilltradeStep: async (step) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        const updated = { ...game, tilltradeStep: step }
        set({ game: updated })
        return persistGameSnapshot(updated, set)
      },

      saveGame: async () => {
        return persistGameSnapshot(get().game, set)
      },

      // M2: ETT rakt window.location.reload() räcker INTE här, trots att
      // det är precis vad ErrorBoundary.tsx gör för sin "Ladda om"-knapp.
      // Skillnaden: Zustands EGEN persist-middleware (indexedDBStorage
      // ovan, nyckel "bandy-game-store") är en HELT SEPARAT skrivväg från
      // saveSaveGame()s CAS-skyddade "bandy_save_<id>" — den skriver på
      // VARJE set()-anrop, utan revisionskoll. En flik som just blivit
      // avvisad av compare-and-swap har ändå fortsatt trigga egna set()-
      // anrop (t.ex. set({saveConflict:true}) självt), som skriver DENNA
      // fliks STALE game-objekt till "bandy-game-store" — möjligen EFTER
      // den andra flikens nyare skrivning dit. Ett reload som bara läser
      // "bandy-game-store" kan alltså återuppliva exakt samma race CAS
      // skulle stoppa, en nivå längre ner. Lösningen: läs uttryckligen den
      // AUKTORITATIVA kopian (bandy_save_<id>, CAS-skyddad) via
      // loadSaveGame() och skriv in den i store:t FÖRST — det set()-anropet
      // skriver i sin tur rätt data till "bandy-game-store" igen — och
      // reloada SEDAN, som en sista helhets-återställning av all annan
      // in-memory UI-state (route, transienta flaggor) utöver game.
      resolveSaveConflict: async () => {
        const { game } = get()
        if (game) {
          const authoritative = await loadSaveGame(game.id)
          if (authoritative) set({ game: authoritative, saveConflict: false })
        }
        window.location.reload()
      },

      dismissHint: (screenId) => {
        set(s => {
          if (!s.game) return s
          const prev = s.game.dismissedHints ?? []
          if (prev.includes(screenId)) return s
          return { game: { ...s.game, dismissedHints: [...prev, screenId] } }
        })
      },

      updateMatchMode: async (mode) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        if (game.preferredMatchMode === mode) return { success: true }
        const updated = { ...game, preferredMatchMode: mode }
        set({ game: updated })
        return persistGameSnapshot(updated, set)
      },

      markInboxRead: (itemId) => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, inbox: game.inbox.map(i => i.id === itemId ? { ...i, isRead: true } : i) } })
      },

      markAllInboxRead: () => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, inbox: game.inbox.map(i => ({ ...i, isRead: true })) } })
      },

      resolveEvent: (eventId, choiceId, madeByPlayer) => {
        const { game } = get()
        if (!game) return
        const afterResolve = resolveEventFn(game, eventId, choiceId, undefined, madeByPlayer)
        const afterPromote = (afterResolve.deferredDecisions ?? []).length > 0
          ? promoteFromQueue(afterResolve)
          : afterResolve
        set({ game: afterPromote })
      },

      // Delad i preview (rullar tärningen, RÖR INTE state) + commit (applicerar
      // ett REDAN AVGJORT utfall). Rotorsak till uppdelningen: en direkt
      // mutation på "skicka motbud" (walked_away/accepted) tar bort eventet ur
      // pendingEvents omedelbart — PortalEventSlot väljer då en NY primary och
      // EventCardInline (som äger modalen) unmountas innan spelaren hunnit LÄSA
      // slutbeskedet. Preview låter modalen visa resultatet först; commit körs
      // när spelaren stänger modalen (se SponsorCounterModal/EventCardInline).
      previewSponsorCounter: (eventId, requestedWeeklyIncome) => {
        const { game } = get()
        if (!game) return null
        const event = (game.pendingEvents ?? []).find(e => e.id === eventId)
        if (!event?.sponsorData) return null
        let original: import('../../domain/entities/Sponsor').Sponsor
        try {
          original = JSON.parse(event.sponsorData)
        } catch {
          return null
        }
        return resolveSponsorCounter(
          requestedWeeklyIncome,
          original.weeklyIncome,
          original.personality ?? 'local',
          game.communityStanding ?? 50,
          Math.random,
        )
      },

      commitSponsorCounter: (eventId, requestedWeeklyIncome, outcome) => {
        const { game } = get()
        if (!game) return
        if (outcome === 'stood_firm') {
          // Originalet finns kvar oförändrat (domens SKYDDAT-punkt) — inget
          // state att ändra, spelaren kan fortfarande trycka Acceptera/Avslå.
          return
        }
        const event = (game.pendingEvents ?? []).find(e => e.id === eventId)
        if (!event?.sponsorData) return
        let original: import('../../domain/entities/Sponsor').Sponsor
        try {
          original = JSON.parse(event.sponsorData)
        } catch {
          return
        }

        if (outcome === 'walked_away') {
          set({
            game: {
              ...game,
              pendingEvents: (game.pendingEvents ?? []).filter(e => e.id !== eventId),
              resolvedEventIds: [...(game.resolvedEventIds ?? []), eventId].slice(-200),
              inbox: [...game.inbox, {
                id: `inbox_sponsor_counter_walked_${original.id}`,
                date: game.currentDate,
                type: InboxItemType.BoardFeedback,
                title: '[Opus]',
                body: '[Opus]',
                isRead: false,
              }],
            },
          })
          return
        }

        // accepted: samma acceptSponsor-väg som ett vanligt accept, bara med
        // Y i stället för X — patchar event.sponsorData + 'accept'-choicets
        // sponsorData innan resolveEvent körs, så den befintliga, testade
        // acceptSponsor-hanteringen (inbox, game.sponsors) återanvänds rakt av.
        const higherOffer = { ...original, weeklyIncome: requestedWeeklyIncome }
        const patchedEvent = {
          ...event,
          sponsorData: JSON.stringify(higherOffer),
          choices: event.choices.map(c =>
            c.id === 'accept' ? { ...c, effect: { ...c.effect, sponsorData: JSON.stringify(higherOffer) } } : c
          ),
        }
        const patchedGame = {
          ...game,
          pendingEvents: (game.pendingEvents ?? []).map(e => e.id === eventId ? patchedEvent : e),
        }
        const afterResolve = resolveEventFn(patchedGame, eventId, 'accept', undefined, true)
        set({ game: afterResolve })
      },

      requestDetailedAnalysis: (opponentClubId, fixtureId) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        if (game.scoutBudget <= 0) return { success: false, error: 'Scoutbudgeten är slut' }
        const opponent = game.clubs.find(c => c.id === opponentClubId)
        if (!opponent) return { success: false, error: 'Klubb hittades inte' }
        const opponentPlayers = game.players.filter(p => p.clubId === opponentClubId)
        const analysis = generateDetailedAnalysis(opponent, opponentPlayers, game.standings, game.fixtures, fixtureId)
        set({
          game: {
            ...game,
            scoutBudget: game.scoutBudget - 1,
            opponentAnalyses: { ...(game.opponentAnalyses ?? {}), [opponentClubId]: analysis },
          }
        })
        return { success: true }
      },

      talkToPlayer: (playerId, choice, currentRound) => {
        const { game } = get()
        if (!game) return { moraleChange: 0, formChange: 0, feedback: '', inboxTriggered: false }
        const player = game.players.find(p => p.id === playerId)
        if (!player) return { moraleChange: 0, formChange: 0, feedback: '', inboxTriggered: false }

        let moraleChange = 0
        let formChange = 0
        let feedback = ''
        let inboxTriggered = false
        const name = player.firstName

        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

        if (choice === 'encourage') {
          moraleChange = 5
          formChange = 2
          const trait = player.trait
          const highForm = player.form >= 65
          const lowForm = player.form < 35
          const pool = trait === 'hungrig'
            ? [
                `${name}: "Det ger bränsle. Jag är inte klar än."`,
                `${name}: "Tack. Men jag vill ha mer — det är bara en början."`,
                `${name}: "Bra att du ser det. Nu kör vi."`,
              ]
            : trait === 'veteran'
            ? [
                `${name}: "Det betyder mer än du tror, efter alla år."`,
                `${name}: "Jag har hört det förut — men från dig sitter det."`,
                `${name}: "Tack. Jag vet fortfarande vad jag är värd."`,
              ]
            : trait === 'joker'
            ? [
                `${name}: "Äntligen lite uppskattning! Jag brukar bara höra om mina utvisningar."`,
                `${name}: "Tack chef. Ska fira med en fullträff nästa match."`,
                `${name}: "Hörde du det? Chefen gillar mig." *(vänd mot omklädningsrummet)*`,
              ]
            : trait === 'lokal'
            ? [
                `${name}: "Det är därför man spelar — för den här klubben, inte för pengarna."`,
                `${name}: "Jag är hemma här. Det räcker för mig."`,
                `${name}: "Tack. Den här orten betyder allt."`,
              ]
            : trait === 'ledare'
            ? [
                `${name}: "Laget hör det också — det är bra för hela gruppen."`,
                `${name}: "Tack. Vi är på rätt väg, jag känner det."`,
                `${name}: "Det ger mig energi att driva de andra framåt."`,
              ]
            : highForm
            ? [
                `${name}: "Tack, det värmer."`,
                `${name}: "Känslan är bra just nu — vi håller den."`,
                `${name}: "Bra att du ser det. Jag är i bra slag."`,
              ]
            : lowForm
            ? [
                `${name}: "Tack… jag kämpar, men jag ger inte upp."`,
                `${name}: "Det behövde jag höra. Jag hittar tillbaka."`,
                `${name}: "Inte lätt just nu, men det hjälper att du säger det."`,
              ]
            : [
                `${name}: "Tack, det värmer."`,
                `${name}: "Uppskattat — jag gör mitt bästa."`,
                `${name}: "Bra att höra. Jag kör på."`,
                `${name}: "Det ger lite extra."`,
                `${name}: "Tack. Vi tar en match i taget."`,
              ]
          feedback = pick(pool)
        } else if (choice === 'demand') {
          if (player.form >= 50) {
            moraleChange = 3
            formChange = 5
            feedback = pick([
              `${name}: "Jag ska bevisa att du har rätt."`,
              `${name}: "Okej. Jag höjer nivån."`,
              `${name}: "Förstått. Mer av mig härnäst."`,
              `${name}: "Det är just det jag behöver höra."`,
            ])
          } else {
            moraleChange = -5
            formChange = -2
            feedback = pick([
              `${name}: "Jag vet inte om jag orkar mer..."`,
              `${name}: "Jag försöker. Det är tyngre än det ser ut."`,
              `${name}: "Krav hjälper inte just nu, men jag hör dig."`,
            ])
          }
        } else if (choice === 'future') {
          const seasons = player.contractUntilSeason - game.currentSeason
          if (seasons > 2) {
            moraleChange = 3
            feedback = pick([
              `${name}: "Jag trivs bra här, inga planer på att lämna."`,
              `${name}: "Det här är min klubb. Självklart stannar jag."`,
              `${name}: "Vi är inne i något bra — jag vill vara med hela vägen."`,
            ])
          } else if (seasons === 1) {
            moraleChange = -3
            feedback = pick([
              `${name}: "Jag behöver veta vad som gäller. Kontraktet går ut snart."`,
              `${name}: "Det börjar bli dags att prata förlängning på allvar."`,
              `${name}: "Jag vill stanna — men jag behöver ett konkret erbjudande."`,
            ])
            inboxTriggered = true
          } else {
            moraleChange = -8
            feedback = pick([
              `${name}: "Jag har inte hört ett ord om förlängning. Det säger mig allt."`,
              `${name}: "Ska jag läsa in något i den här tystnaden?"`,
              `${name}: "Om inget händer snart börjar jag titta mig omkring."`,
            ])
            inboxTriggered = true
          }
        }

        // Add narrative entry for the conversation
        const narrativeTexts: Record<string, string[]> = {
          encourage: [
            'Tränaren kallade till möte. Han tror på mig.',
            'Chefen tog sig tid att prata. Det gav energi.',
            'Fick beröm av tränaren. Bra tajming.',
          ],
          demand: player.form >= 50
            ? ['Tränaren kräver mer av mig. Utmaningen gillar jag.', 'Chefen skärpte till sig. Dags att leverera.']
            : ['Tränaren är missnöjd. Svårt att höra när formen sviker.', 'Press ovanifrån. Inte lätt just nu.'],
          future: inboxTriggered
            ? ['Pratade med chefen om framtiden. Ovissheten tär.', 'Kontrakt och framtid på tapeten. Inget besked ännu.']
            : ['Tränaren bekräftade att jag är med i planerna. Skönt.', 'Framtiden känns trygg här. Går att fokusera på spelet.'],
        }
        const narrativePool = narrativeTexts[choice] ?? []
        const narrativeText = narrativePool[Math.floor(Math.random() * narrativePool.length)]
        const narrativeEntry = narrativeText ? {
          season: game.currentSeason,
          matchday: game.fixtures.filter(f => f.status === 'completed').length,
          text: narrativeText,
          type: 'storyline' as const,
        } : null

        const updatedPlayers = game.players.map(p =>
          p.id === playerId
            ? {
                ...p,
                morale: Math.max(0, Math.min(100, p.morale + moraleChange)),
                form: Math.max(0, Math.min(100, p.form + formChange)),
                diary: narrativeEntry
                  ? [...(p.diary ?? []), narrativeEntry].slice(-20)
                  : p.diary,
              }
            : p
        )

        const updatedConversations = {
          ...(game.playerConversations ?? {}),
          [playerId]: currentRound,
        }

        let updatedInbox = game.inbox
        if (inboxTriggered) {
          updatedInbox = [
            {
              id: `inbox_talk_${playerId}_${Date.now()}`,
              date: game.currentDate,
              type: InboxItemType.ContractExpiring,
              title: `${player.firstName} ${player.lastName} vill ha besked`,
              body: `${player.firstName} ${player.lastName} har uttryckt oro kring sin framtid i klubben. Kontraktet löper ut om kort.`,
              relatedPlayerId: playerId,
              isRead: false,
            },
            ...updatedInbox,
          ]
        }

        set({ game: { ...game, players: updatedPlayers, playerConversations: updatedConversations, inbox: updatedInbox } })
        return { moraleChange, formChange, feedback, inboxTriggered }
      },

      setBudgetPriority: (priority) => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, budgetPriority: priority } })
      },

      useLeadershipAction: (playerId, action, currentRound) => {
        const { game } = get()
        if (!game) return null
        const result = applyLeadershipAction(game, playerId, action, currentRound)
        if (!result) return null

        let updatedPlayers = game.players.map(p =>
          p.id === playerId ? { ...p, ...result.playerUpdates } : p
        )
        if (result.affectedPlayerIds && result.affectedMoraleChange != null) {
          updatedPlayers = updatedPlayers.map(p =>
            result.affectedPlayerIds!.includes(p.id)
              ? { ...p, morale: Math.max(0, Math.min(100, p.morale + result.affectedMoraleChange!)) }
              : p
          )
        }

        const updatedLeadershipActions = [
          ...(game.leadershipActions ?? []).filter(
            a => !(a.playerId === playerId && a.action === action)
          ),
          result.leadershipEntry,
        ]

        set({ game: { ...game, players: updatedPlayers, leadershipActions: updatedLeadershipActions } })
        return { feedback: result.feedback }
      },

      setCaptain: (playerId: string) => {
        const { game } = get()
        if (!game) return
        // Apply +3 morale to the new captain
        const updatedPlayers = game.players.map(p =>
          p.id === playerId
            ? { ...p, morale: Math.min(100, p.morale + 3) }
            : p
        )
        set({ game: { ...game, captainPlayerId: playerId, players: updatedPlayers } })
      },

      setTransferBudget: (amount: number) => {
        const { game } = get()
        if (!game) return
        const updatedClubs = game.clubs.map(c =>
          c.id === game.managedClubId ? { ...c, transferBudget: Math.max(0, amount) } : c
        )
        set({ game: { ...game, clubs: updatedClubs } })
      },

      buyScoutRounds: () => {
        const { game } = get()
        if (!game) return
        const club = game.clubs.find(c => c.id === game.managedClubId)
        if (!club || club.finances < 15000) return
        const updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, -15000)
        set({ game: { ...game, clubs: updatedClubs, scoutBudget: (game.scoutBudget ?? 10) + 5 } })
      },

      recruitVolunteer: (name: string) => {
        const { game } = get()
        if (!game) return
        const existing = game.volunteers ?? []
        if (existing.includes(name)) return
        set({ game: { ...game, volunteers: [...existing, name] } })
      },

      // B1 §2/§3 — nya modellens bygg-action MED finansiering. Drar kostnaden ur kassan
      // (buggen i nuvarande kod: ingen caller drog den). Löpande tillgänglig.
      startFacilityBuildNode: (nodeId: string, mode: FacilityFinancingMode = 'club') => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel' }
        const club = game.clubs.find(c => c.id === game.managedClubId)
        if (!club) return { success: false, error: 'Ingen klubb' }
        const state = game.facilityState ?? { builtNodeIds: [] }
        const can = canStartBuild(nodeId, state)
        if (!can.ok) return { success: false, error: can.reason ?? 'Kan inte byggas' }
        const def = FACILITY_NODE_DEFS.find(d => d.id === nodeId)
        if (!def) return { success: false, error: 'Okänd nod' }

        const pol = game.localPolitician
        const activeMecenat = (game.mecenater ?? []).find(m => m.isActive && m.wealth >= 3 && m.happiness >= 50)
        const ctx: FinancingContext = {
          relationship: pol?.relationship ?? 0,
          standing: game.communityStanding ?? 50,
          mecenat: activeMecenat ? { name: activeMecenat.name, willing: true } : undefined,
        }
        const chosen = getFinancingOptions(def, ctx).find(o => o.mode === mode)
        if (!chosen || !chosen.available) return { success: false, error: chosen?.reason ?? 'Finansiering ej tillgänglig' }
        if (club.finances < chosen.clubCost) return { success: false, error: `Otillräcklig kassa (kräver ${Math.round(chosen.clubCost / 1000)} tkr ur kassan)` }

        // MEDIUM 13b (audit 2026-08-29): "Värmestugan blev färdig ungefär vid
        // ligaomgång fem" trots `8 omgångar att bygga`.
        //
        // Rotorsak: skrivningen och läsningen använde två olika skalor. Här
        // stämplades `startedMatchday` med högsta AVKLARADE ligaomgångens
        // roundNumber (1–22), medan båda läsvägarna — advanceFacilityState
        // (communityProcessor.ts) och getFacilityNodeViews (FacilityScreen/
        // FacilityTree) — jämför mot den globala matchdagen, som ligger före
        // ligaomgången så snart cupomgångar flikats in. etaMatchday hamnade
        // därför flera omgångar för tidigt, och cooldown-prickarna startade
        // delvis ifyllda (currentMatchday − startedMatchday var redan > 0 vid
        // byggstart). Den andra byggingången (gameFlowActions.ts:786) och
        // save-migrationen använde matchdagen hela tiden — det här stället var
        // ensamt om fel skala.
        const newState = startFacilityBuild(nodeId, state, game.currentMatchday)
        const updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, -chosen.clubCost)

        let updatedPol = pol
        if (mode === 'kommun' && pol) updatedPol = { ...pol, relationship: Math.min(100, pol.relationship + 8) }
        let updatedMecenater = game.mecenater ?? []
        if (mode === 'mecenat' && activeMecenat) {
          updatedMecenater = updatedMecenater.map(m =>
            m.id === activeMecenat.id
              ? { ...m, silentShout: Math.min(100, (m.silentShout ?? 0) + 10), totalContributed: (m.totalContributed ?? 0) + chosen.contribution }
              : m
          )
        }

        // HIGH 6 (auditen 2026-08-29): anläggningsbygget är ett av säsongens
        // beslut men går aldrig via resolveEvent — det finns varken GameEvent
        // eller choiceId här. Kandidaten fångas därför med den parallella
        // infångaren, och läggs på seasonDecisionCandidates i exakt samma form
        // som eventResolver.ts:s händelsebaserade väg gör.
        const gameAfter: SaveGame = { ...game, facilityState: newState, clubs: updatedClubs, localPolitician: updatedPol ?? game.localPolitician, mecenater: updatedMecenater }
        const decisionCandidate = captureFacilityBuildDecision(game, gameAfter, nodeId, chosen.clubCost)
        set({
          game: decisionCandidate
            ? { ...gameAfter, seasonDecisionCandidates: [...(gameAfter.seasonDecisionCandidates ?? []), decisionCandidate] }
            : gameAfter,
        })
        return { success: true }
      },

      // O17 del 3 (DOM_ANLAGGNINGSTRADETS_SLUT_2026-08-17.md §3) — avveckla en
      // byggd nod. communityStanding faller (varsel-mallens punkt 4/5: två
      // system pekar isär) — det lokala priset för att stänga något folk märkt.
      decommissionFacilityNode: (nodeId: string) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel' }
        const state = game.facilityState ?? { builtNodeIds: [] }
        const can = canDecommission(nodeId, state)
        if (!can.ok) return { success: false, error: can.reason ?? 'Kan inte avvecklas' }

        const newState = decommissionFacilityNode(nodeId, state)
        const newStanding = Math.max(0, (game.communityStanding ?? 50) - DECOMMISSION_COMMUNITY_STANDING_COST)

        set({ game: { ...game, facilityState: newState, communityStanding: newStanding } })
        return { success: true }
      },

      interactWithPolitician: (action: 'invite' | 'budget' | 'apply'): { success: boolean; message: string } => {
        const { game } = get()
        if (!game || !game.localPolitician) return { success: false, message: 'Ingen kommunföreträdare.' }

        const pol = game.localPolitician
        const club = game.clubs.find(c => c.id === game.managedClubId)!
        const lastInteraction = game.politicianLastInteraction ?? {}
        const currentRound = game.fixtures
          .filter(f => f.status === 'completed' && !f.isCup)
          .reduce((max, f) => Math.max(max, f.roundNumber), 0)

        if (action === 'invite') {
          // Cooldown: 5 rounds between invites. Note: invite stored as round number (may be 0)
          if (lastInteraction.invite !== undefined && currentRound - lastInteraction.invite < 5) {
            return { success: false, message: `Vänta till omgång ${lastInteraction.invite + 5}.` }
          }
          // Seasonal cap: max 2 invites per season
          const invitesThisSeason = lastInteraction.inviteCountThisSeason ?? 0
          if (lastInteraction.inviteSeasonStart === game.currentSeason && invitesThisSeason >= 2) {
            return { success: false, message: 'Bjudit in maximalt antal gånger den här säsongen.' }
          }
          let boost = 5 + Math.floor(Math.random() * 4)
          // Agenda-bonus. LÄST-FÖRE-INITIERING (PASTAENDEKARTAN, 2026-08-26):
          // safeStandingPosition ger null om klubben ännu inte spelat en
          // ligamatch denna säsong, istf en alfabetisk skuggposition.
          const managedPosition = safeStandingPosition(game.standings, game.managedClubId)
          if (pol.agenda === 'prestige' && managedPosition !== null && managedPosition <= 4) boost += 3
          if (pol.agenda === 'youth' && game.communityActivities?.bandySchool) boost += 2
          const newRel = Math.min(100, pol.relationship + boost)
          const updatedPol = { ...pol, relationship: newRel }
          const newInviteCount = lastInteraction.inviteSeasonStart === game.currentSeason
            ? (lastInteraction.inviteCountThisSeason ?? 0) + 1
            : 1
          set({ game: {
            ...game,
            localPolitician: updatedPol,
            politicianLastInteraction: {
              ...lastInteraction,
              invite: currentRound,
              inviteSeasonStart: game.currentSeason,
              inviteCountThisSeason: newInviteCount,
            },
            inbox: [{
              id: `inbox_pol_invite_${currentRound}_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.KommunBidrag,
              title: `${pol.name} på besök`,
              body: `${pol.name} tackade ja till inbjudan och såg matchen. "Imponerande engagemang från publiken." Relationen stärktes.`,
              isRead: false,
            }, ...game.inbox],
          }})
          return { success: true, message: `${pol.name} uppskattar inbjudan! Relation +${boost}.` }
        }

        if (action === 'budget') {
          if (lastInteraction.budget && lastInteraction.budgetSeason === game.currentSeason) {
            return { success: false, message: 'Ni har redan presenterat budget denna säsong.' }
          }
          const positive = club.finances > 0
          const relChange = positive ? 3 + Math.floor(Math.random() * 3) : -(3 + Math.floor(Math.random() * 3))
          const newRel = Math.max(0, Math.min(100, pol.relationship + relChange))
          const updatedPol = { ...pol, relationship: newRel }
          const msg = positive
            ? `${pol.name} nickar godkännande. "Sund ekonomi. Det gillar jag." Relation +${relChange}.`
            : `${pol.name} ser bekymrad ut. "Den här ekonomin oroar mig." Relation ${relChange}.`
          set({ game: {
            ...game,
            localPolitician: updatedPol,
            politicianLastInteraction: { ...lastInteraction, budget: currentRound, budgetSeason: game.currentSeason },
            inbox: [{
              id: `inbox_pol_budget_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.KommunBidrag,
              title: positive ? 'Budgetpresentation gick bra' : 'Budgetpresentation väckte oro',
              body: msg,
              isRead: false,
            }, ...game.inbox],
          }})
          return { success: positive, message: msg }
        }

        if (action === 'apply') {
          if (lastInteraction.apply && lastInteraction.applySeason === game.currentSeason) {
            return { success: false, message: 'Ni har redan ansökt denna säsong.' }
          }
          if (pol.relationship < 50) {
            const relDrop = 3
            const updatedPol = { ...pol, relationship: Math.max(0, pol.relationship - relDrop) }
            set({ game: {
              ...game,
              localPolitician: updatedPol,
              politicianLastInteraction: { ...lastInteraction, apply: currentRound, applySeason: game.currentSeason },
            }})
            return { success: false, message: `${pol.name} avslår: "Relationen är inte stark nog. Jobba på förtroendet först."` }
          }
          let grant = 15000 + Math.floor((pol.relationship - 50) * 700) // 15k-50k baserat på relation
          if (pol.agenda === 'youth' && game.communityActivities?.bandySchool) grant += 20000
          // Tröskelsvepet (fynd #3, Jacobs dom 2026-08-26): var `cs > 70` →
          // fast +10 000 kr, samma 70/71-linje som fyra andra system. Delar
          // nu kurva med kommunstödet (communityStandingScaling.ts).
          grant += getCsPoliticianGrantBonus(game.communityStanding ?? 50)
          if (pol.agenda === 'savings' && Math.random() < 0.5) {
            const updatedPol2 = { ...pol, relationship: Math.max(0, pol.relationship - 3) }
            set({ game: { ...game, localPolitician: updatedPol2, politicianLastInteraction: { ...lastInteraction, apply: currentRound, applySeason: game.currentSeason } } })
            return { success: false, message: `${pol.name} avslår: "Vi måste vara restriktiva med bidrag just nu." Relation -3.` }
          }
          grant = Math.round(grant / 5000) * 5000 // Avrunda till närmaste 5k
          const updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, grant)
          set({ game: {
            ...game,
            clubs: updatedClubs,
            politicianLastInteraction: { ...lastInteraction, apply: currentRound, applySeason: game.currentSeason },
            inbox: [{
              id: `inbox_pol_grant_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.KommunBidrag,
              title: `Extra bidrag beviljat: ${Math.round(grant / 1000)} tkr`,
              body: `${pol.name}: "Ni gör ett bra jobb för orten. Här är ett extra anslag på ${grant.toLocaleString('sv-SE')} kr."`,
              isRead: false,
            }, ...game.inbox],
          }})
          return { success: true, message: `Beviljat! +${Math.round(grant / 1000)} tkr till klubbkassan.` }
        }

        return { success: false, message: 'Okänd handling.' }
      },

      markPhaseAcknowledged: (phase) => {
        set(state => {
          if (!state.game) return state
          const seen = state.game.phaseMarksSeen ?? []
          if (seen.includes(phase)) return state
          return {
            game: {
              ...state.game,
              phaseMarksSeen: [...seen, phase],
            },
          }
        })
      },

      updateMatchLaddningBand: (data) => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, matchLaddningBandShown: data ?? undefined } })
      },

      // U5 (SLUTTEST_KO.md, 2026-08-17): medvetet INTE en narrativeBeatLog-källa.
      // Jacobs dom (2026-08-17): "en logg som bara hälften skriver till är
      // sämre än åtta ärliga mekanismer" gäller ofullständighet av
      // FÖRSUMMELSE — inte en källa som inte hör hemma. cardStaleTracking
      // mäter hur länge ett portalkort legat framme; narrativeBeatLog svarar på
      // när en båge senast hände. Olika frågor. Ett kort som renderades igen
      // är inte en beat, och "kortet roterade ut ur påsen" är ett
      // urvalsbeslut — inte något som hände i spelvärlden. Att kalla det en
      // beat luddar upp kategorin som gör loggen användbar. 8/9 är den
      // slutgiltiga siffran (se narrativeLogService.ts:s huvudkommentar).
      recordPortalShown: (cardIds, storySlotKind) => {
        set(state => {
          if (!state.game) return state
          const current = state.game.cardStaleTracking ?? {}
          const next = computeCardStaleTracking(current, cardIds, state.game.currentMatchday)
          const staleUnchanged = cardIds.every(id => {
            const e = current[id]
            const n = next[id]
            return e?.firstShownAt === n?.firstShownAt && e?.lastShownAt === n?.lastShownAt
          }) && cardIds.length > 0
          const currentUnchanged = storySlotKind === undefined || storySlotKind === state.game.currentStorySlotType
          if (staleUnchanged && currentUnchanged) return state
          const currentStorySlotType = storySlotKind ?? state.game.currentStorySlotType
          return { game: { ...state.game, cardStaleTracking: next, currentStorySlotType } }
        })
      },

      // Action slices — override inline implementations above
      ...matchActions(get, set),
      ...trainingActions(get, set),
      ...transferActions(get, set),
      ...academyActions(get, set),
      ...gameFlowActions(get, set),
      ...periodisationActions(get, set),
      // O13 (DOM_TRANARMARKNADEN_2026-08-26): uppehållet + klubbytet.
      ...careerBreakActions(get, set),
    }),
    {
      name: 'bandy-game-store',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({ game: state.game }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('persist rehydration misslyckades, återställer till tomt spel', error)
        }
        // GAP-1: kraschåterställning — om ErrorBoundary bad om det, rensa pending-flöden
        // INNAN spelet renderas, så ett save-inducerat renderingsfel inte loopar.
        try {
          if (localStorage.getItem(RECOVER_PENDING_FLAG)) {
            if (state?.game) state.game = clearPendingFlows(state.game)
            localStorage.removeItem(RECOVER_PENDING_FLAG)
          }
        } catch { /* localStorage otillgänglig — hoppa över */ }
        // One-time migration: move old localStorage Zustand save to IndexedDB
        if (!state?.game) {
          migrateLocalStorageIfNeeded().catch(() => {})
        }
      },
    }
  )
)

// M2 (audit 5c9a7a8, 2026-08-24): registrerad en gång per flik (modulnivå,
// inte inuti create()-callbacken — den körs om vid varje hot-reload i dev
// annars). Fångar ANDRA flikars skrivningar i realtid, INNAN denna flik
// själv försöker spara och upptäcker konflikten reaktivt via
// persistGameSnapshot/persistAutosave — en stale flik kan annars fortsätta
// spela flera åtgärder på data som redan inte går att spara, och tappa allt
// på en gång. BroadcastChannel levererar aldrig till avsändarens egen
// kontext, så ett mottaget meddelande är alltid från en verkligt annan flik.
subscribeToSaveWrites((msg) => {
  const current = useGameStore.getState().game
  if (current && current.id === msg.saveId && msg.revision > (current.revision ?? 0)) {
    useGameStore.setState({ saveConflict: true })
  }
})

/**
 * Medium 7 (Skutskär-auditen, 2026-08-22): en hård omladdning av en intern
 * speladress (t.ex. /game/history) visade titelskärmen trots giltig
 * sparning. Rot: GameGuard (GameShell.tsx) läste `game` och redirectade
 * till "/" så fort den var `null` — men persist-middlewaren laddar `game`
 * ur IndexedDB ASYNKRONT, så `game` ÄR `null` under det första ögonblicket
 * varje gång, oavsett om en giltig sparning finns. Redirecten hann alltid
 * före hydreringen, och `replace: true` gjorde den permanent — spelaren
 * kunde inte navigera tillbaka till den begärda adressen, bara till "/".
 *
 * `useHasHydrated()` läser Zustand persist-middlewarens egen
 * hydreringsstatus (`useGameStore.persist.hasHydrated()` +
 * `onFinishHydration`-prenumeration) — ingen ny persist-logik, bara en
 * observerbar vy av den som redan finns. Konsumenter väntar med
 * "!game → ingen sparning"-domen tills hydreringen är klar, så en giltig
 * sparning aldrig tolkas som saknad. Den begärda routen "bevaras" per
 * automatik: väntar man i stället för att redirecta bort, ligger
 * webbläsaren redan kvar på rätt adress när hydreringen väl är klar.
 *
 * Konsumenter: `GameGuard` (bara /game/game-over*) och `GameShell` (alla
 * övriga /game/*-rutter — /game/history, /game/match, /game/club m.fl.,
 * se AppRouter.tsx). GameShell fick INTE detta i ursprungsfixet (2026-08-22)
 * — bara GameGuard — trots att GameShell är den faktiska föräldern till
 * routen (/game/history) auditen namngav. Fångat av Skutskär-auditens
 * test 20 (GameShell.test.tsx, 2026-08-24), ~48h senare.
 */
export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useGameStore.persist.hasHydrated())
  useEffect(() => {
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = useGameStore.persist.onFinishHydration(() => setHydrated(true))
    return unsub
  }, [])
  return hydrated
}

// Convenience selectors
export const useManagedClub = () => {
  const game = useGameStore(s => s.game)
  if (!game) return null
  return game.clubs.find(c => c.id === game.managedClubId) ?? null
}

export const useManagedPlayers = () => {
  const game = useGameStore(s => s.game)
  if (!game) return []
  return game.players.filter(p => p.clubId === game.managedClubId)
}

export const useCurrentStanding = () => {
  const game = useGameStore(s => s.game)
  if (!game) return null
  return game.standings.find(s => s.clubId === game.managedClubId) ?? null
}

export const useNextFixture = () => {
  const game = useGameStore(s => s.game)
  if (!game) return null
  return game.fixtures
    .filter(f =>
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
      f.status === 'scheduled'
    )
    .sort((a, b) => a.matchday - b.matchday || (b.isCup ? 1 : 0) - (a.isCup ? 1 : 0))[0] ?? null
}

// Returns true if the managed club has a valid pending lineup (11 starters, no injured)
export const useHasPendingLineup = () => {
  const game = useGameStore(s => s.game)
  if (!game) return false
  const lineup = game.managedClubPendingLineup
  if (!lineup) return false
  const players = game.players
  const starters = lineup.startingPlayerIds.map(id => players.find(p => p.id === id)).filter(Boolean)
  if (starters.length !== 11) return false
  // A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): restGamesRemaining läggs till
  // samma redundanta gate som isInjured/suspensionGamesRemaining redan har
  // här — setLineup.ts avvisar redan detta vid commit, denna check speglar
  // bara samma sanning för badge/advance-knappen.
  return !starters.some(p => p!.isInjured || p!.suspensionGamesRemaining > 0 || (p!.restGamesRemaining ?? 0) > 0)
}

// Returns count of injured players in the pending lineup (for badge)
export const useInjuredInLineup = () => {
  const game = useGameStore(s => s.game)
  if (!game) return 0
  const lineup = game.managedClubPendingLineup
  if (!lineup) return 0
  const players = game.players
  return lineup.startingPlayerIds.filter(id => {
    const p = players.find(pl => pl.id === id)
    return p && (p.isInjured || p.suspensionGamesRemaining > 0 || (p.restGamesRemaining ?? 0) > 0)
  }).length
}

// Returns count of players with expiring contracts (within 1 season)
export const useExpiringContracts = () => {
  const game = useGameStore(s => s.game)
  if (!game) return 0
  return game.players.filter(p =>
    p.clubId === game.managedClubId && p.contractUntilSeason <= game.currentSeason
  ).length
}

// Returns the last completed fixture for the managed club
export const useLastCompletedFixture = () => {
  const game = useGameStore(s => s.game)
  if (!game || !game.lastCompletedFixtureId) return null
  return game.fixtures.find(f => f.id === game.lastCompletedFixtureId) ?? null
}

// Returns the next scheduled fixture round number for managed club
export const useNextRoundNumber = () => {
  const game = useGameStore(s => s.game)
  if (!game) return null
  const next = game.fixtures
    .filter(f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && f.status === 'scheduled')
    .sort((a, b) => a.roundNumber - b.roundNumber)[0]
  return next?.roundNumber ?? null
}

// Returns true when the player can press the advance button
export const useCanAdvance = () => {
  const game = useGameStore(s => s.game)
  if (!game) return false
  if (game.playoffBracket?.status === PlayoffStatus.Completed) return true
  const hasScheduled = game.fixtures.some(f => f.status === FixtureStatus.Scheduled)
  if (!hasScheduled) return true
  const hasUpcoming = game.fixtures.some(
    f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
         f.status === FixtureStatus.Scheduled
  )
  if (!hasUpcoming) return true
  const lineup = game.managedClubPendingLineup
  if (!lineup) return false
  const starters = lineup.startingPlayerIds
    .map(id => game.players.find(p => p.id === id))
    .filter(Boolean)
  if (starters.length !== 11) return false
  return !starters.some(p => p!.isInjured || p!.suspensionGamesRemaining > 0 || (p!.restGamesRemaining ?? 0) > 0)
}

// Returns count of unread inbox items
export const useUnreadInboxCount = () => {
  const game = useGameStore(s => s.game)
  if (!game) return 0
  return game.inbox.filter(i => !i.isRead).length
}

// Returns the current playoff bracket or null
export const usePlayoffInfo = () => {
  const game = useGameStore(s => s.game)
  if (!game || !game.playoffBracket) return null
  return game.playoffBracket
}

const NAV_LOCK_REASONS: Record<string, string> = {
  'season_summary':    'Slutför säsongssammanfattning',
  'board_meeting':     'Slutför styrelsemötet',
  'pre_season':        'Slutför försäsongen',
  'half_time_summary': 'Halvtidssammanfattning väntar',
  'playoff_intro':     'Starta slutspelet',
  'qf_summary':        'Kvartsfinalsammanfattning väntar',
}

export const useNavigationLock = (): { locked: boolean; reason: string | null } => {
  const pendingScreen = useGameStore(s => s.game?.pendingScreen ?? null)
  const reason = pendingScreen ? (NAV_LOCK_REASONS[pendingScreen] ?? 'Slutför pågående flöde') : null
  return { locked: !!pendingScreen, reason }
}
