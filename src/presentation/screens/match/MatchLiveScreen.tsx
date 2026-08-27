/**
 * MatchLiveScreen.tsx — top-level orkestrering för live-match
 *
 * Steg 5 (Refactor B) i refactor/livematch-split (SPEC_LIVEMATCH_REFACTOR.md).
 * EN källa för steg-progression — handler-timeouts borttagna.
 * Timer-effekten pausar automatiskt vid aktiv interaktion och fortsätter när cleared.
 */

import { useState, useEffect, useReducer, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore, useManagedClub } from '../../store/gameStore'
import { simulateSecondHalf, simulateFromMidMatch } from '../../../domain/services/matchSimulator'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { MATCH_GOAL_DIFFERENCE_CAP, MATCH_TOTAL_GOAL_CAP } from '../../../domain/services/matchCore'
import { getManagerDisplayName } from '../../../domain/services/managerProfileService'
import type { MatchPhaseContext } from '../../../domain/services/matchUtils'
import type { Tactic } from '../../../domain/entities/Club'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { MatchWeather } from '../../../domain/entities/Weather'
import { MatchEventType, TacticMentality, TacticTempo, TacticPress, PlayerPosition } from '../../../domain/enums'
import { getRivalry } from '../../../domain/data/rivalries'
import { fixtureSeed } from '../../../domain/utils/random'
import { computePlayerRatings } from '../../utils/matchRatings'
import { playSound, isMuted, toggleMute } from '../../audio/soundEffects'
import { PhaseOverlay } from '../../components/match/PhaseOverlay'
import { FinalIntroScreen } from '../../components/match/FinalIntroScreen'
import { HalftimeModal } from '../../components/match/HalftimeModal'
import type { PauseLean } from '../../components/match/HalftimeModal'
import { SentValCard } from '../../components/match/SentValCard'
import { PAUSSNACK } from '../../../domain/data/matchLiveText'
import type { MatchSituation } from '../../../domain/data/matchLiveText'
import { CeremonyCupFinal } from '../../components/match/CeremonyCupFinal'
import { CeremonySmFinal } from '../../components/match/CeremonySmFinal'
import { SubstitutionModal } from '../../components/match/SubstitutionModal'
import { ScoreboardStalvallen } from '../../components/match/scoreboard/ScoreboardStalvallen'
import type { ScoreboardEvent, PenaltyEntry } from '../../components/match/scoreboard/ScoreboardStalvallen'
import { MatchControls } from '../../components/match/MatchControls'
import { CommentaryFeedStalvallen } from '../../components/match/commentary/CommentaryFeedStalvallen'
import type { FeedRow } from '../../components/match/commentary/CommentaryFeedStalvallen'
import { resolveCorner, assistantPickCorner } from '../../../domain/services/cornerInteractionService'
import type { CornerZone, CornerDelivery } from '../../../domain/services/cornerInteractionService'
import { resolvePenalty, resolveAIPenaltyKeeperDive } from '../../../domain/services/penaltyInteractionService'
import type { PenaltyDirection, PenaltyHeight } from '../../../domain/services/penaltyInteractionService'
import { deriveEventText } from './deriveEventText'
import { resolveCounter, assistantPickCounter } from '../../../domain/services/counterAttackInteractionService'
import type { CounterChoice } from '../../../domain/services/counterAttackInteractionService'
import { resolveFreeKick, assistantPickFreeKick } from '../../../domain/services/freeKickInteractionService'
import type { FreeKickChoice } from '../../../domain/services/freeKickInteractionService'
import type { PressChoice } from '../../../domain/services/lastMinutePressService'
import { TacticChangeModal } from '../../components/match/TacticChangeModal'
import { mulberry32, seededPick } from '../../../domain/utils/random'
import { ASSISTANT_FF_LINES } from '../../../domain/data/assistantFFStrings'
import { FirstVisitHint } from '../../components/FirstVisitHint'
import { simulateMatchStepByStep } from '../../../domain/services/matchSimulator'
import { matchReducer, initialMatchState } from './matchReducer'
import { generateMatchStory } from '../../../domain/utils/matchStory'
import { formatArenaName } from '../../../domain/utils/arenaName'
import { LedgerFrame } from '../../components/ledger/LedgerFrame'
import { seasonSpanLabel } from '../../../domain/utils/seasonYear'
import { SiffrorDrawer } from '../../components/match/SiffrorDrawer'
import { InteraktionsDock } from '../../components/match/InteraktionsDock'

interface LocationState {
  fixture: Fixture
  homeLineup: TeamSelection
  awayLineup: TeamSelection
  homeClubName: string
  awayClubName: string
  isManaged: boolean
  matchWeather?: MatchWeather
  matchMode?: 'full' | 'commentary' | 'quicksim'
}

/**
 * PT-9/PT-10 (BACKLOG.md 2026-07-13): unik, stabil seed-bas per interaktionstyp+
 * steg, så att (a) inga två interaktioner i samma match någonsin delar seed
 * (varje `kind` har ett eget 100 000-brett intervall, och `step` — currentStep,
 * dvs. indexet i steps[] — är unikt per interaktionstillfälle), och (b) ingen
 * kollision uppstår med PT-7:s atStep/fromStep-seeds (som ligger i ett lågt
 * heltalsintervall, 0-60).
 *
 * `step` sätts INNAN spelaren (eller, i commentary-mode, motorn) väljer
 * zon/hårdhet/riktning/höjd — seeden beror alltså aldrig på valet. Valet
 * påverkar bara sannolikheten inne i resolve*-funktionerna (PT-9-kinds) eller
 * VILKET värde som väljs ur en array (PT-10-kinds), aldrig vilken slumpsekvens
 * som dras för nästa interaktion (verifierat separat, se BACKLOG).
 *
 * PT-10 lade till kinds för commentary-mode-VALET (fyra) + taktik-kommentaren
 * (kosmetisk) — kedjan val→resolve→utfall är nu deterministisk hela vägen.
 */
type InteractionRandKind =
  | 'corner' | 'cornerVoice' | 'penalty' | 'counter' | 'counterVoice' | 'freekick' | 'freekickVoice'
  | 'cornerZoneChoice' | 'cornerDeliveryChoice' | 'penaltyDirChoice' | 'penaltyHeightChoice'
  | 'counterChoiceCm' | 'freekickChoiceCm' | 'tacticComment'
const INTERACTION_SEED_BASE: Record<InteractionRandKind, number> = {
  corner: 100_000, penalty: 200_000, counter: 300_000, freekick: 400_000,
  cornerVoice: 500_000, counterVoice: 600_000, freekickVoice: 700_000,
  cornerZoneChoice: 800_000, cornerDeliveryChoice: 900_000,
  penaltyDirChoice: 1_000_000, penaltyHeightChoice: 1_100_000,
  counterChoiceCm: 1_200_000, freekickChoiceCm: 1_300_000,
  tacticComment: 1_400_000,
}
function interactionSeed(fixtureId: string, step: number, kind: InteractionRandKind): number {
  return fixtureSeed(fixtureId, INTERACTION_SEED_BASE[kind] + step)
}

/**
 * htTempo/htPress/htMentality här är egna React-statevariabler för
 * paus-taktikreglagen (spelarens LIVE-inställning under matchen) — INTE
 * en proxy för "vilket paussnack valdes" (den kända, redan fixade bugklassen
 * — se pauseLean/effectiveLean nedan, som är den faktiska loggade sanningen).
 * roundNumber används bara som tröskel (quarterfinal-gräns >26) och
 * likhetsjämförelse (samma omgångs andra match) — aldrig för sortering.
 * playoffBracket skickas vidare till ett underliggande visningskomponent,
 * inte för att avgöra vem som blev mästare. Alla tre deklarerade öppet.
 *
 * @cites pauseLean, effectiveLean, setHalftimeDecisionForLog, htTempo, htPress, htMentality, roundNumber, playoffBracket
 */
export function MatchLiveScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { game, saveLiveMatchResult, advance, markMatchStarted, simulateAbandonedMatch } = useGameStore()
  const dismissHint = useGameStore(s => s.dismissHint)
  const managedClub = useManagedClub()

  const state = location.state as LocationState | null
  const fixture = state?.fixture
  const homeLineup = state?.homeLineup
  const awayLineup = state?.awayLineup
  const homeClubName = state?.homeClubName ?? ''
  const awayClubName = state?.awayClubName ?? ''
  const matchWeather = state?.matchWeather ?? (
    fixture ? (game?.matchWeathers ?? []).find(mw => mw.fixtureId === fixture.id) : undefined
  )
  const matchMode = state?.matchMode ?? 'full'
  const isCommentaryMode = matchMode === 'commentary'

  const rivalry = fixture ? getRivalry(fixture.homeClubId, fixture.awayClubId) : null
  const isSmFinal = fixture?.isNeutralVenue === true

  const matchPhase: MatchPhaseContext = (() => {
    if (!fixture || !game) return 'regular'
    if (isSmFinal) return 'final'
    const bracket = game.playoffBracket
    if (!bracket) return 'regular'
    if (bracket.final?.fixtures.includes(fixture.id)) return 'final'
    if (bracket.semiFinals.some(s => s.fixtures.includes(fixture.id))) return 'semifinal'
    if (fixture.roundNumber > 26) return 'quarterfinal'
    return 'regular'
  })()

  const isCupFinal = fixture?.isCup === true && (() => {
    const bracket = game?.cupBracket
    if (!bracket) return false
    const finalMatch = bracket.matches.find(m => m.round === 4)
    return finalMatch?.fixtureId === fixture.id
  })()

  const isBigMatch = isSmFinal || isCupFinal

  // Reducer — EN sanning för score + per-spelare-räknare (steg 4)
  const [matchState, dispatch] = useReducer(matchReducer, initialMatchState)

  const [steps, setSteps] = useState<MatchStep[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [isPaused, setIsPaused] = useState(false)
  const [isFastForward, setIsFastForward] = useState(false)
  const [showHalftime, setShowHalftime] = useState(false)
  const [halftimeModalShown, setHalftimeModalShown] = useState(false)
  const [matchDone, setMatchDone] = useState(false)
  const [showOvertimeOverlay, setShowOvertimeOverlay] = useState(false)
  const [showPenaltiesOverlay, setShowPenaltiesOverlay] = useState(false)
  const [displayedMinute, setDisplayedMinute] = useState(0)
  const prevPhase = useRef<string | undefined>(undefined)

  const [muted, setMuted] = useState(isMuted)

  const [htMentality, setHtMentality] = useState<TacticMentality | null>(null)
  const [htTempo, setHtTempo] = useState<TacticTempo | null>(null)
  const [htPress, setHtPress] = useState<TacticPress | null>(null)
  const [tacticChanged, setTacticChanged] = useState(false)
  const [showTacticQuick, setShowTacticQuick] = useState(false)
  const [tacticChangesUsed, setTacticChangesUsed] = useState(0)
  const MAX_TACTIC_CHANGES = 3
  // Spak B — sent matchningsval (tänds en gång, sent i jämnt läge)
  const [spakBState, setSpakBState] = useState<'idle' | 'active' | 'done'>('idle')
  const [spakBAppearStep, setSpakBAppearStep] = useState<number | null>(null)
  const [htSubs, setHtSubs] = useState<{ outId: string; inId: string }[]>([])
  const [pauseLean, setPauseLean] = useState<PauseLean | null>(null)
  const [halftimeDecisionForLog, setHalftimeDecisionForLog] = useState<PauseLean | null>(null)
  const [showSubModal, setShowSubModal] = useState(false)
  const [ceremonySlide, setCeremonySlide] = useState(0)
  const [finalIntroSlide, setFinalIntroSlide] = useState(() => (isSmFinal || !!isCupFinal) ? 1 : 0)
  const [postIntroFade, setPostIntroFade] = useState(false)
  const [hintVisible, setHintVisible] = useState(() => !(game?.dismissedHints ?? []).includes('matchLive'))
  const [siffrorOpen, setSiffrorOpen] = useState(false)
  const prevHomeScore = useRef(0)
  const prevAwayScore = useRef(0)

  const [activeCorner, setActiveCorner] = useState<import('../../../domain/services/cornerInteractionService').CornerInteractionData | null>(null)
  const [cornerOutcome, setCornerOutcome] = useState<import('../../../domain/services/cornerInteractionService').CornerOutcome | null>(null)

  const [activePenalty, setActivePenalty] = useState<import('../../../domain/services/penaltyInteractionService').PenaltyInteractionData | null>(null)
  const [penaltyOutcome, setPenaltyOutcome] = useState<import('../../../domain/services/penaltyInteractionService').PenaltyOutcome | null>(null)

  const [activeCounter, setActiveCounter] = useState<import('../../../domain/services/counterAttackInteractionService').CounterInteractionData | null>(null)
  const [counterOutcome, setCounterOutcome] = useState<import('../../../domain/services/counterAttackInteractionService').CounterOutcome | null>(null)

  const [activeFreeKick, setActiveFreeKick] = useState<import('../../../domain/services/freeKickInteractionService').FreeKickInteractionData | null>(null)
  const [freeKickOutcome, setFreeKickOutcome] = useState<import('../../../domain/services/freeKickInteractionService').FreeKickOutcome | null>(null)

  const [activeLastMinutePress, setActiveLastMinutePress] = useState<import('../../../domain/services/lastMinutePressService').LastMinutePressData | null>(null)

  const lastMinutePressResolved = useRef(false)

  const hasSimulated = useRef(false)

  useEffect(() => {
    if (!fixture || !game) return
    const liveFixture = game.fixtures.find(f => f.id === fixture.id)
    if (liveFixture?.status === 'completed') {
      navigate('/game', { replace: true })
      return
    }
    // Övergiven match (started i tidigare session, aldrig slutförd — t.ex. reload mitt i):
    // återställ via assistenten, bryt soft-lock-loopen.
    if (liveFixture?.matchStartedAt && liveFixture.status === 'scheduled') {
      simulateAbandonedMatch(fixture.id)
      // advance()-flytten (Audit-syntes yta 5, 2026-07-07): till skillnad från matchDone-
      // effekten nedan (rad ~333, som redan kör advance(true) innan "TILL GRANSKNING"-
      // knappen ens blir klickbar) satte den här återhämtningsvägen ALDRIG roundSummary
      // eller körde omgångsprocessningen — simulateAbandonedMatch gör bara själva
      // matchsimuleringen. Utan denna rad var GranskaScreens mount-effekt den ENDA
      // platsen som täckte just den här vägen.
      advance(true)
      navigate('/game/review', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasSimulated.current) return
    if (!fixture || !homeLineup || !awayLineup || !game) return
    hasSimulated.current = true
    markMatchStarted(fixture.id, homeLineup, awayLineup)

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
    const homeClubObj = game.clubs.find(c => c.id === fixture.homeClubId)
    // Use stored seasonCalendar — single source of truth
    const storedCal = game.seasonCalendar ?? []
    const liveSlot = storedCal.find(s => s.matchday === fixture.matchday)
    const gen = simulateMatchStepByStep({
      fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : undefined,
      // PT-7 (BACKLOG.md 2026-07-10): Date.now() gjorde live-matcher irreproducerbara
      // — bröt projektets seed-disciplin och försvårade PT-3-sekvensutredningen.
      // fixtureSeed(fixture.id) matchar konventionen i matchActions.ts/matchEngine.ts.
      seed: fixtureSeed(fixture.id),
      weather: matchWeather?.weather,
      homeClubName: homeClubName || undefined,
      awayClubName: awayClubName || undefined,
      isPlayoff: matchPhase !== 'regular',
      matchPhase,
      rivalry: rivalry ?? undefined,
      storylines: game.storylines?.map(s => ({ playerId: s.playerId, type: s.type, displayText: s.displayText })),
      managedIsHome: fixture.homeClubId === game.managedClubId,
      captainPlayerId: game.captainPlayerId,
      fanFavoritePlayerId: game.supporterGroup?.favoritePlayerId,
      supporterContext: game.supporterGroup ? {
        mood: game.supporterGroup.mood,
        members: game.supporterGroup.members,
        leaderName: game.supporterGroup.leader.name,
      } : undefined,
      ownScandalThisSeason: (game.scandalHistory ?? []).some(s =>
        s.season === game.currentSeason &&
        s.affectedClubId === game.managedClubId &&
        s.type !== 'small_absurdity'
      ),
      arenaName: homeClubObj?.arenaName,
      isAnnandagen: !!liveSlot?.isAnnandagen,
      isNyarsbandy: !!liveSlot?.isNyarsbandy,
      isCupFinalhelgen: !!liveSlot?.isCupFinalhelgen,
      hallInomhus: fixture.homeClubId === game.managedClubId && (homeClubObj?.hasIndoorArena ?? false),
      lastRivalSaleMatchday: game.lastRivalSaleMatchday,
      currentMatchday: game.currentMatchday,
    })
    const allSteps: MatchStep[] = []
    for (const step of gen) allSteps.push(step)
    setSteps(allSteps)
    if (!isSmFinal && !isCupFinal) {
      setCurrentStep(0)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Displayed minute — rullar jämnt mellan steg-minuter istället för att hoppa
  // Snap upp till currentStep.minute när stegen ligger före displayed
  useEffect(() => {
    const stepMinute = steps[currentStep]?.minute ?? 0
    if (stepMinute > displayedMinute) {
      setDisplayedMinute(stepMinute)
    }
  }, [currentStep, steps]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tick displayed minute +1 every 1000ms toward next step's minute (FIX-34)
  useEffect(() => {
    if (isPaused || isFastForward || matchDone) return
    if (activeCorner || activePenalty || activeCounter || activeFreeKick || activeLastMinutePress) return
    if (showHalftime || showOvertimeOverlay || showPenaltiesOverlay) return
    const interval = setInterval(() => {
      setDisplayedMinute(m => {
        const nextStep = steps[currentStep + 1]
        if (!nextStep) return m  // at last step — don't increment past it
        return Math.min(m + 1, nextStep.minute)
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [currentStep, steps, isPaused, isFastForward, matchDone, activeCorner, activePenalty, activeCounter, activeFreeKick, activeLastMinutePress, showHalftime, showOvertimeOverlay, showPenaltiesOverlay])

  useEffect(() => {
    if (ceremonySlide !== 1) return
    let mounted = true
    const timer = setTimeout(() => { if (mounted) setCeremonySlide(2) }, 3000)
    return () => { mounted = false; clearTimeout(timer) }
  }, [ceremonySlide])

  useEffect(() => {
    if (ceremonySlide !== 2) return
    const lastStep = steps[steps.length - 1]
    if (!lastStep || !game) return
    const managedIsHome = fixture?.homeClubId === game.managedClubId
    const managedGoals = managedIsHome ? lastStep.homeScore : lastStep.awayScore
    const oppGoals = managedIsHome ? lastStep.awayScore : lastStep.homeScore
    const penStep = steps.find(s => s.penaltyDone && s.penaltyFinalResult)
    const penResult = penStep?.penaltyFinalResult
    const managedWon = penResult
      ? (managedIsHome ? penResult.home > penResult.away : penResult.away > penResult.home)
      : managedGoals > oppGoals
    if (managedWon) playSound('champagne')
  }, [ceremonySlide]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (matchDone) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Matchen pågår. Lämnar du nu simuleras resten automatiskt.'
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [matchDone])

  useEffect(() => {
    if (!matchDone || !fixture || !homeLineup || !awayLineup || steps.length === 0) return
    const lastStep = steps[steps.length - 1]
    const allEvents = steps.flatMap(s => s.events)

    const allStarters = [...(homeLineup.startingPlayerIds ?? []), ...(awayLineup.startingPlayerIds ?? [])]
    const playerRatings = computePlayerRatings(allStarters, allEvents)
    const potmId = Object.entries(playerRatings).sort((a, b) => b[1] - a[1])[0]?.[0]

    const otStep = steps.find(s => s.phase === 'overtime' && s.overtimeResult)
    const penStep = steps.find(s => s.penaltyDone && s.penaltyFinalResult)
    const overtimeResult = otStep?.overtimeResult
    const penaltyResult = penStep?.penaltyFinalResult

    const savesHome = allEvents.filter(e => e.type === MatchEventType.Save && e.clubId === fixture.homeClubId).length
    const savesAway = allEvents.filter(e => e.type === MatchEventType.Save && e.clubId === fixture.awayClubId).length
    const report = {
      playerRatings,
      shotsHome: lastStep.shotsHome,
      shotsAway: lastStep.shotsAway,
      onTargetHome: lastStep.onTargetHome ?? 0,
      onTargetAway: lastStep.onTargetAway ?? 0,
      savesHome,
      savesAway,
      cornersHome: lastStep.cornersHome,
      cornersAway: lastStep.cornersAway,
      penaltiesHome: penaltyResult?.home ?? 0,
      penaltiesAway: penaltyResult?.away ?? 0,
      possessionHome: lastStep.shotsHome + lastStep.shotsAway > 0
        ? Math.round((lastStep.shotsHome / (lastStep.shotsHome + lastStep.shotsAway)) * 100) : 50,
      possessionAway: lastStep.shotsHome + lastStep.shotsAway > 0
        ? Math.round((lastStep.shotsAway / (lastStep.shotsHome + lastStep.shotsAway)) * 100) : 50,
      playerOfTheMatchId: potmId,
    }
    saveLiveMatchResult(
      fixture.id, lastStep.homeScore, lastStep.awayScore,
      allEvents, report, homeLineup, awayLineup, overtimeResult, penaltyResult,
      fixture.attendance, halftimeDecisionForLog ?? undefined,
    )
    advance(true)
  }, [matchDone]) // eslint-disable-line react-hooks/exhaustive-deps



  // FIX-37: auto-dismiss hint after 12s with CSS fade
  useEffect(() => {
    if (!hintVisible) return
    const t = setTimeout(() => setHintVisible(false), 12000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Halvtids-guard — explicit trigger för halvtidsmodal (steg 5)
  // Säkerställer att modalen visas även om timer-effekten av någon orsak hoppar förbi step 30
  const inSecondHalf = steps.length > 31
  useEffect(() => {
    if (currentStep >= 30 && !inSecondHalf && !halftimeModalShown) {
      setHalftimeModalShown(true)
      setShowHalftime(true)
      setIsPaused(true)
    }
  }, [currentStep, inSecondHalf, halftimeModalShown]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return
    const step = steps[currentStep]
    const prevHome = prevHomeScore.current
    const prevAway = prevAwayScore.current
    prevHomeScore.current = step.homeScore
    prevAwayScore.current = step.awayScore

    const managedIsHomeForSound = fixture?.homeClubId === game?.managedClubId
    if (step.homeScore > prevHome) {
      playSound('goal')
      if (managedIsHomeForSound) playSound('goalHit')
    }
    if (step.awayScore > prevAway) {
      playSound('goal')
      if (!managedIsHomeForSound) playSound('goalHit')
    }

    if (step.homeScore === prevHomeScore.current && step.awayScore === prevAwayScore.current) {
      const hasRedCard = step.events.some(e => e.type === MatchEventType.Suspension)
      const hasSave = step.events.some(e => e.type === MatchEventType.Save)
      const hasCorner = step.events.some(e => e.type === MatchEventType.Corner)
      if (hasRedCard) playSound('card')
      else if (hasSave) playSound('save')
      else if (hasCorner) playSound('corner')
    }

    if (step.step === 0) playSound('matchStart')
    if (step.step === 30) playSound('whistle')
    if (step.step === 60) playSound('finalWhistle')
    if (step.phase === 'overtime' && step.step === 61) playSound('overtime')

    if (step.phase === 'penalties' && step.penaltyRound) {
      if (step.penaltyRound.homeScored || step.penaltyRound.awayScored) {
        playSound('penaltyScore')
      } else {
        playSound('penaltyMiss')
      }
    }
  }, [currentStep, steps])

  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return
    if (isPaused && !isFastForward) return

    const step = steps[currentStep]

    if (step.step === 30) {
      const hasSecondHalf = steps.length > 31
      if (!hasSecondHalf) {
        setIsFastForward(false)
        setShowHalftime(true)
        return
      }
      if (isFastForward) {
        setIsFastForward(false)
      }
    }

    if (step.cornerInteractionData && !activeCorner) {
      if (!isFastForward && !isCommentaryMode) {
        setActiveCorner(step.cornerInteractionData)
        setCornerOutcome(null)
        return
      }
      if (isFastForward) {
        // C-fixens andra halva: rutin-interaktion — assistenten väljer istället för slumpen.
        const cd = step.cornerInteractionData
        const managedIsHome = fixture?.homeClubId === game?.managedClubId
        const attackers = managedIsHome
          ? (game?.players ?? []).filter(p => p.clubId === fixture?.homeClubId)
          : (game?.players ?? []).filter(p => p.clubId === fixture?.awayClubId)
        const defenders = managedIsHome
          ? (game?.players ?? []).filter(p => p.clubId === fixture?.awayClubId)
          : (game?.players ?? []).filter(p => p.clubId === fixture?.homeClubId)
        const cornerTaker = attackers.find(p => p.id === cd.cornerTakerId)
        const topRusher = attackers.find(p => p.id === cd.rusherIds[0])
        const gk = defenders.find(p => p.position === PlayerPosition.Goalkeeper)
        const setup = assistantPickCorner(cd, game?.assistantCoach, cornerTaker, topRusher, gk)
        const pool = ASSISTANT_FF_LINES.corner[setup.zone]
        const voiceLine = pool && pool.length > 0
          ? seededPick(pool, interactionSeed(fixture?.id ?? '', currentStep, 'cornerVoice'))
          : undefined
        handleCornerChoice(setup.zone, setup.delivery, cd, voiceLine)
        return
      }
      // PT-10: commentary-mode — ingen spelare väljer, men motorns val ska ändå
      // vara deterministiskt (situationen — fixture+steg — väljer, inte klockan).
      const zones: CornerZone[] = ['near', 'center', 'far']
      const deliveries: CornerDelivery[] = ['hard', 'low', 'short']
      handleCornerChoice(
        seededPick(zones, interactionSeed(fixture?.id ?? '', currentStep, 'cornerZoneChoice')),
        seededPick(deliveries, interactionSeed(fixture?.id ?? '', currentStep, 'cornerDeliveryChoice')),
        step.cornerInteractionData,
      )
      return
    }

    if (step.penaltyInteractionData && !activePenalty) {
      if (!isFastForward && !isCommentaryMode) {
        setActivePenalty(step.penaltyInteractionData)
        setPenaltyOutcome(null)
        return
      }
      // C-fix: straff är ett högvärt ögonblick — snabbspolning ska INTE slumpa det.
      // Pausa FF och öppna panelen så spelaren väljer. (Commentary-mode saknar
      // spelare som väljer → behåller auto-resolve.)
      if (isFastForward && !isCommentaryMode) {
        setIsFastForward(false)
        setActivePenalty(step.penaltyInteractionData)
        setPenaltyOutcome(null)
        return
      }
      // PT-10: commentary-mode — samma resonemang som hörnan ovan.
      const dirs: PenaltyDirection[] = ['left', 'center', 'right']
      const heights: PenaltyHeight[] = ['low', 'high']
      handlePenaltyChoice(
        seededPick(dirs, interactionSeed(fixture?.id ?? '', currentStep, 'penaltyDirChoice')),
        seededPick(heights, interactionSeed(fixture?.id ?? '', currentStep, 'penaltyHeightChoice')),
        step.penaltyInteractionData,
      )
      return
    }

    if (step.counterInteractionData && !activeCounter) {
      if (!isFastForward && !isCommentaryMode) {
        setActiveCounter(step.counterInteractionData)
        setCounterOutcome(null)
        return
      }
      if (isFastForward) {
        // C-fixens andra halva: rutin-interaktion — assistenten väljer istället för slumpen.
        const cd = step.counterInteractionData
        const choice = assistantPickCounter(cd, game?.assistantCoach)
        const pool = ASSISTANT_FF_LINES.counter[choice]
        const voiceLine = pool && pool.length > 0
          ? seededPick(pool, interactionSeed(fixture?.id ?? '', currentStep, 'counterVoice'))
          : undefined
        handleCounterChoice(choice, cd, voiceLine)
        return
      }
      // PT-10: commentary-mode — samma resonemang som hörnan ovan.
      const choices: CounterChoice[] = ['sprint', 'build', 'earlyBall']
      handleCounterChoice(
        seededPick(choices, interactionSeed(fixture?.id ?? '', currentStep, 'counterChoiceCm')),
        step.counterInteractionData,
      )
      return
    }

    if (step.freeKickInteractionData && !activeFreeKick) {
      if (!isFastForward && !isCommentaryMode) {
        setActiveFreeKick(step.freeKickInteractionData)
        setFreeKickOutcome(null)
        return
      }
      if (isFastForward) {
        // C-fixens andra halva: rutin-interaktion — assistenten väljer istället för slumpen.
        const fd = step.freeKickInteractionData
        const choice = assistantPickFreeKick(fd, game?.assistantCoach)
        const pool = ASSISTANT_FF_LINES.freekick[choice]
        const voiceLine = pool && pool.length > 0
          ? seededPick(pool, interactionSeed(fixture?.id ?? '', currentStep, 'freekickVoice'))
          : undefined
        handleFreeKickChoice(choice, fd, voiceLine)
        return
      }
      // PT-10: commentary-mode — samma resonemang som hörnan ovan.
      const fkChoices: FreeKickChoice[] = ['shoot', 'chipPass', 'layOff']
      handleFreeKickChoice(
        seededPick(fkChoices, interactionSeed(fixture?.id ?? '', currentStep, 'freekickChoiceCm')),
        step.freeKickInteractionData,
      )
      return
    }

    if (step.lastMinutePressData && !activeLastMinutePress && !lastMinutePressResolved.current && !isCommentaryMode) {
      // C-fix: sen press i jämnt läge är ett högvärt ögonblick. I FF hoppades den
      // tidigare tyst över (gaten krävde !isFastForward) — pausa FF och öppna den istället.
      if (isFastForward) setIsFastForward(false)
      setActiveLastMinutePress(step.lastMinutePressData)
      return
    }

    if (step.phase === 'overtime' && prevPhase.current !== 'overtime' && !isFastForward) {
      prevPhase.current = 'overtime'
      setShowOvertimeOverlay(true)
      return
    }
    if (step.phase === 'overtime') prevPhase.current = 'overtime'

    if (step.phase === 'penalties' && prevPhase.current !== 'penalties' && !isFastForward) {
      prevPhase.current = 'penalties'
      setShowPenaltiesOverlay(true)
      return
    }
    if (step.phase === 'penalties') prevPhase.current = 'penalties'

    const hasGoal = step.events.some(e => e.type === MatchEventType.Goal)
    const hasSave = step.events.some(e => e.type === MatchEventType.Save)
    const hasSuspension = step.events.some(e => e.type === MatchEventType.Suspension)
    const isLate = step.step >= 55
    const isTight = step.step >= 50 && step.homeScore === step.awayScore
    const baseDelay = isFastForward
      ? 50
      : step.phase === 'penalties'
      ? 2000
      : hasGoal
      ? 3500
      : hasSuspension
      ? 2000
      : hasSave
      ? 1800
      : isTight
      ? 1000
      : isLate
      ? 1100
      : step.intensity === 'high'
      ? 2200
      : step.intensity === 'medium'
      ? 1200
      : 1400
    const delay = isCommentaryMode && !isFastForward ? Math.round(baseDelay * 0.5) : baseDelay

    const timer = setTimeout(() => {
      if (currentStep + 1 >= steps.length) {
        setMatchDone(true)
        if (isSmFinal || isCupFinal) setCeremonySlide(1)
      } else {
        const nextStep = steps[currentStep + 1]
        if (nextStep) {
          // Dispatch absoluta värden från nästa steg till reducer (steg 4)
          dispatch({
            type: 'STEP_DELTA',
            delta: {
              homeScore: nextStep.homeScore,
              awayScore: nextStep.awayScore,
              shotsHome: nextStep.shotsHome,
              shotsAway: nextStep.shotsAway,
              onTargetHome: nextStep.onTargetHome,
              onTargetAway: nextStep.onTargetAway,
              cornersHome: nextStep.cornersHome,
              cornersAway: nextStep.cornersAway,
              homeActiveSuspensions: nextStep.activeSuspensions.homeCount,
              awayActiveSuspensions: nextStep.activeSuspensions.awayCount,
            },
          })
        }
        setCurrentStep(prev => prev + 1)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [currentStep, isPaused, isFastForward, steps])

  function regenerateRemainderWithUpdatedScore(
    newHomeScore: number,
    newAwayScore: number,
    atStep: number,
  ): MatchStep[] | null {
    if (!game || !fixture || !homeLineup || !awayLineup) return null
    const managedIsHome = fixture.homeClubId === game.managedClubId
    const currentStepData = steps[atStep]
    if (!currentStepData) return null

    const fromStep = atStep + 1
    const inSecondHalf = fromStep >= 31

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)

    const gen = simulateFromMidMatch({
      fixture, homeLineup, awayLineup,
      homePlayers, awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : undefined,
      // PT-7: fixtureSeed(fixture.id, atStep) — deterministisk per fixture+ingreppspunkt,
      // istf Date.now() som gjorde regenereringen irreproducerbar (BACKLOG.md 2026-07-10).
      seed: fixtureSeed(fixture.id, atStep),
      weather: matchWeather?.weather,
      homeClubName: homeClubName || undefined,
      awayClubName: awayClubName || undefined,
      rivalry: rivalry ?? undefined,
      initialHomeScore: newHomeScore,
      initialAwayScore: newAwayScore,
      initialShotsHome: currentStepData.shotsHome,
      initialShotsAway: currentStepData.shotsAway,
      initialCornersHome: currentStepData.cornersHome,
      initialCornersAway: currentStepData.cornersAway,
      initialHomeSuspensions: currentStepData.activeSuspensions.homeCount,
      initialAwaySuspensions: currentStepData.activeSuspensions.awayCount,
      managedIsHome,
      storylines: game.storylines?.map(s => ({ playerId: s.playerId, type: s.type, displayText: s.displayText })),
    }, fromStep, inSecondHalf)

    const newRemainder: MatchStep[] = []
    for (const s of gen) newRemainder.push(s)
    return newRemainder
  }

  function interactiveCanScore(homeScore: number, awayScore: number, managedIsHome: boolean): boolean {
    if (homeScore + awayScore >= MATCH_TOTAL_GOAL_CAP) return false
    const newDiff = managedIsHome ? homeScore + 1 - awayScore : awayScore + 1 - homeScore
    return Math.abs(newDiff) <= MATCH_GOAL_DIFFERENCE_CAP
  }

  function handleCornerChoice(zone: CornerZone, delivery: CornerDelivery, inlineData?: import('../../../domain/services/cornerInteractionService').CornerInteractionData, assistantVoiceLine?: string) {
    const cornerData = inlineData ?? activeCorner
    if (!cornerData || !game || !fixture) return

    const managedIsHome = fixture.homeClubId === game.managedClubId
    const allPlayers = game.players
    const attackers = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.homeClubId)
      : allPlayers.filter(p => p.clubId === fixture.awayClubId)
    const defenders = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.awayClubId)
      : allPlayers.filter(p => p.clubId === fixture.homeClubId)

    const cornerTaker = attackers.find(p => p.id === cornerData.cornerTakerId) ?? attackers[0]
    const rushers = cornerData.rusherIds.map(id => attackers.find(p => p.id === id)).filter(Boolean) as typeof attackers
    const gk = defenders.find(p => p.position === PlayerPosition.Goalkeeper)
    const defOutfield = defenders.filter(p => p.position !== PlayerPosition.Goalkeeper)

    const rand = mulberry32(interactionSeed(fixture.id, currentStep, 'corner'))
    const sgMood = game.supporterGroup?.mood ?? 50
    const outcome = resolveCorner(
      { zone, delivery },
      cornerTaker,
      rushers,
      defOutfield,
      gk,
      cornerData.opponentPenaltyKill,
      cornerData.isHome,
      sgMood,
      rand,
    )

    setCornerOutcome(outcome)

    const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
    const minute = cornerData.minute

    // Dispatch till reducer — reducer äger score + cap-kontroll (steg 4)
    if (outcome.type === 'goal' && outcome.scorerId) {
      dispatch({
        type: 'INTERACTIVE_GOAL',
        clubId: managedClubId,
        playerId: outcome.scorerId,
        isPenalty: false,
        attackingHome: managedIsHome,
      })
    }

    // Uppdatera steps för commentary-feed (score-mutation borttagen — reducer äger score)
    setSteps(prev => {
      const updatedCurrent = prev.map((s, idx) => {
        if (idx !== currentStep) return s
        const event = outcome.type === 'goal'
          ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: outcome.scorerId,
              description: outcome.description, isCorner: true }
          : { type: MatchEventType.Save, minute, clubId: managedClubId,
              description: outcome.description }
        const capAllows = outcome.type !== 'goal' || interactiveCanScore(s.homeScore, s.awayScore, managedIsHome)
        const newHomeScore = capAllows && outcome.type === 'goal' && managedIsHome ? s.homeScore + 1 : s.homeScore
        const newAwayScore = capAllows && outcome.type === 'goal' && !managedIsHome ? s.awayScore + 1 : s.awayScore
        return { ...s, cornerInteractionData: undefined, homeScore: newHomeScore, awayScore: newAwayScore,
          events: [...s.events, event as MatchStep['events'][0]],
          commentary: outcome.description, commentaryType: (capAllows && outcome.type === 'goal' ? 'goal' : 'situation') as MatchStep['commentaryType'],
          assistantVoiceLine }
      })
      if (outcome.type !== 'goal') return updatedCurrent
      const cur = updatedCurrent[currentStep]
      const newRemainder = regenerateRemainderWithUpdatedScore(cur.homeScore, cur.awayScore, currentStep)
      if (!newRemainder) return updatedCurrent
      return [...updatedCurrent.slice(0, currentStep + 1), ...newRemainder]
    })

    if (outcome.type === 'goal') {
      playSound('goal')
      playSound('goalHit')
    }

    // Steg 5: delay 1500ms so revealed outcome stays visible before next step (FIX-35)
    // Commentary mode: timer effect handles advancement after setSteps re-triggers it; skip setCurrentStep here
    // B-3: vid mål — linjera dismiss mot tavlans flash (4000ms, ScoreboardStalvallen)
    // så panelen inte glider ner medan siffran fortfarande blinkar.
    setTimeout(() => {
      setActiveCorner(null)
      setCornerOutcome(null)
      if (!isCommentaryMode) setCurrentStep(prev => prev + 1)
    }, isFastForward ? 0 : outcome.type === 'goal' ? 4000 : 2500)
  }

  function handlePenaltyChoice(dir: PenaltyDirection, height: PenaltyHeight, inlineData?: import('../../../domain/services/penaltyInteractionService').PenaltyInteractionData) {
    const penData = inlineData ?? activePenalty
    if (!penData || !fixture || !game) return

    const managedIsHome = fixture.homeClubId === game.managedClubId
    const rand = mulberry32(interactionSeed(fixture.id, currentStep, 'penalty'))
    const keeperDive = resolveAIPenaltyKeeperDive('offensive', rand)
    const outcome = resolvePenalty(penData, dir, height, keeperDive, rand)
    setPenaltyOutcome(outcome)

    const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
    const oppClubId = managedIsHome ? fixture.awayClubId : fixture.homeClubId
    const shooterId = penData.shooterId
    const shooterLast = penData.shooterName.split(' ').slice(-1)[0]
    const keeperLast = penData.keeperName.split(' ').slice(-1)[0]
    const minute = penData.minute

    // Dispatch till reducer (steg 4)
    if (outcome.type === 'goal') {
      dispatch({
        type: 'INTERACTIVE_GOAL',
        clubId: managedClubId,
        playerId: shooterId,
        isPenalty: true,
        attackingHome: managedIsHome,
      })
    }
    // Note: INTERACTIVE_SAVE för straff utelämnat — PenaltyInteractionData saknar keeperId

    setSteps(prev => {
      const updatedCurrent = prev.map((s, idx) => {
        if (idx !== currentStep) return s
        const event = outcome.type === 'goal'
          ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: shooterId,
              description: `Straffmål av ${shooterLast}.`, isPenalty: true }
          : outcome.type === 'save'
          ? { type: MatchEventType.Save, minute, clubId: oppClubId,
              description: `Straffräddning! ${keeperLast} läser skottet.` }
          : { type: MatchEventType.Save, minute, clubId: managedClubId,
              description: `Straffen utanför! ${shooterLast} missade målet.` }
        const capAllows = outcome.type !== 'goal' || interactiveCanScore(s.homeScore, s.awayScore, managedIsHome)
        const newHomeScore = capAllows && outcome.type === 'goal' && managedIsHome ? s.homeScore + 1 : s.homeScore
        const newAwayScore = capAllows && outcome.type === 'goal' && !managedIsHome ? s.awayScore + 1 : s.awayScore
        return { ...s, penaltyInteractionData: undefined, homeScore: newHomeScore, awayScore: newAwayScore,
          events: [...s.events, event as MatchStep['events'][0]],
          commentary: event.description, commentaryType: (capAllows && outcome.type === 'goal' ? 'goal' : 'critical') as MatchStep['commentaryType'] }
      })
      if (outcome.type !== 'goal') return updatedCurrent
      const cur = updatedCurrent[currentStep]
      const newRemainder = regenerateRemainderWithUpdatedScore(cur.homeScore, cur.awayScore, currentStep)
      if (!newRemainder) return updatedCurrent
      return [...updatedCurrent.slice(0, currentStep + 1), ...newRemainder]
    })

    if (outcome.type === 'goal') {
      playSound('goal')
      playSound('goalHit')
    }

    // Steg 5: delay 1500ms so revealed outcome stays visible before next step (FIX-35)
    // Commentary mode: timer effect handles advancement after setSteps re-triggers it; skip setCurrentStep here
    // B-3: vid mål — linjera dismiss mot tavlans flash (4000ms, ScoreboardStalvallen)
    // så panelen inte glider ner medan siffran fortfarande blinkar.
    setTimeout(() => {
      setActivePenalty(null)
      setPenaltyOutcome(null)
      if (!isCommentaryMode) setCurrentStep(prev => prev + 1)
    }, isFastForward ? 0 : outcome.type === 'goal' ? 4000 : 2500)
  }

  function handleCounterChoice(choice: CounterChoice, inlineData?: import('../../../domain/services/counterAttackInteractionService').CounterInteractionData, assistantVoiceLine?: string) {
    const counterData = inlineData ?? activeCounter
    if (!counterData || !fixture || !game) return
    const managedIsHome = fixture.homeClubId === game.managedClubId
    const allPlayers = game.players
    const attackers = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.homeClubId)
      : allPlayers.filter(p => p.clubId === fixture.awayClubId)
    const defenders = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.awayClubId)
      : allPlayers.filter(p => p.clubId === fixture.homeClubId)

    const runner = attackers.find(p => p.id === counterData.runnerId) ?? attackers[0]
    const support = attackers.find(p => p.id === counterData.supportId) ?? attackers[1]
    const gk = defenders.find(p => p.position === PlayerPosition.Goalkeeper)

    const rand = mulberry32(interactionSeed(fixture.id, currentStep, 'counter'))
    const outcome = resolveCounter(choice, runner, support, gk, rand)
    setCounterOutcome(outcome)

    const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
    const minute = counterData.minute

    // Dispatch till reducer (steg 4)
    if (outcome.type === 'goal' && outcome.scorerId) {
      dispatch({
        type: 'INTERACTIVE_GOAL',
        clubId: managedClubId,
        playerId: outcome.scorerId,
        isPenalty: false,
        attackingHome: managedIsHome,
      })
    }

    setSteps(prev => {
      const updatedCurrent = prev.map((s, idx) => {
        if (idx !== currentStep) return s
        const event = outcome.type === 'goal'
          ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: outcome.scorerId,
              description: outcome.description }
          : { type: MatchEventType.Save, minute, clubId: managedClubId,
              description: outcome.description }
        const capAllows = outcome.type !== 'goal' || interactiveCanScore(s.homeScore, s.awayScore, managedIsHome)
        const newHomeScore = capAllows && outcome.type === 'goal' && managedIsHome ? s.homeScore + 1 : s.homeScore
        const newAwayScore = capAllows && outcome.type === 'goal' && !managedIsHome ? s.awayScore + 1 : s.awayScore
        return { ...s, counterInteractionData: undefined, homeScore: newHomeScore, awayScore: newAwayScore,
          events: [...s.events, event as MatchStep['events'][0]],
          commentary: outcome.description, commentaryType: (capAllows && outcome.type === 'goal' ? 'goal' : 'situation') as MatchStep['commentaryType'],
          assistantVoiceLine }
      })
      if (outcome.type !== 'goal') return updatedCurrent
      const cur = updatedCurrent[currentStep]
      const newRemainder = regenerateRemainderWithUpdatedScore(cur.homeScore, cur.awayScore, currentStep)
      if (!newRemainder) return updatedCurrent
      return [...updatedCurrent.slice(0, currentStep + 1), ...newRemainder]
    })

    if (outcome.type === 'goal') {
      playSound('goal')
      playSound('goalHit')
    }

    // Steg 5: delay 1500ms so revealed outcome stays visible before next step (FIX-35)
    // Commentary mode: timer effect handles advancement after setSteps re-triggers it; skip setCurrentStep here
    // B-3: vid mål — linjera dismiss mot tavlans flash (4000ms, ScoreboardStalvallen)
    // så panelen inte glider ner medan siffran fortfarande blinkar.
    setTimeout(() => {
      setActiveCounter(null)
      setCounterOutcome(null)
      if (!isCommentaryMode) setCurrentStep(prev => prev + 1)
    }, isFastForward ? 0 : outcome.type === 'goal' ? 4000 : 2500)
  }

  function handleFreeKickChoice(choice: FreeKickChoice, inlineData?: import('../../../domain/services/freeKickInteractionService').FreeKickInteractionData, assistantVoiceLine?: string) {
    const fkData = inlineData ?? activeFreeKick
    if (!fkData || !fixture || !game) return
    const managedIsHome = fixture.homeClubId === game.managedClubId
    const allPlayers = game.players
    const defenders = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.awayClubId)
      : allPlayers.filter(p => p.clubId === fixture.homeClubId)
    const attackers = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.homeClubId)
      : allPlayers.filter(p => p.clubId === fixture.awayClubId)

    const kicker = attackers.find(p => p.id === fkData.kickerId) ?? attackers[0]
    const gk = defenders.find(p => p.position === PlayerPosition.Goalkeeper)

    const rand = mulberry32(interactionSeed(fixture.id, currentStep, 'freekick'))
    const outcome = resolveFreeKick(choice, kicker, gk, fkData, rand)
    setFreeKickOutcome(outcome)

    const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
    const minute = fkData.minute

    // Dispatch till reducer (steg 4)
    if (outcome.type === 'goal') {
      dispatch({
        type: 'INTERACTIVE_GOAL',
        clubId: managedClubId,
        playerId: fkData.kickerId,
        isPenalty: false,
        attackingHome: managedIsHome,
      })
    }

    setSteps(prev => {
      const updatedCurrent = prev.map((s, idx) => {
        if (idx !== currentStep) return s
        const event = outcome.type === 'goal'
          ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: fkData.kickerId,
              description: outcome.description }
          : { type: MatchEventType.Save, minute, clubId: managedClubId,
              description: outcome.description }
        const capAllows = outcome.type !== 'goal' || interactiveCanScore(s.homeScore, s.awayScore, managedIsHome)
        const newHomeScore = capAllows && outcome.type === 'goal' && managedIsHome ? s.homeScore + 1 : s.homeScore
        const newAwayScore = capAllows && outcome.type === 'goal' && !managedIsHome ? s.awayScore + 1 : s.awayScore
        return { ...s, freeKickInteractionData: undefined, homeScore: newHomeScore, awayScore: newAwayScore,
          events: [...s.events, event as MatchStep['events'][0]],
          commentary: outcome.description, commentaryType: (capAllows && outcome.type === 'goal' ? 'goal' : 'situation') as MatchStep['commentaryType'],
          assistantVoiceLine }
      })
      if (outcome.type !== 'goal') return updatedCurrent
      const cur = updatedCurrent[currentStep]
      const newRemainder = regenerateRemainderWithUpdatedScore(cur.homeScore, cur.awayScore, currentStep)
      if (!newRemainder) return updatedCurrent
      return [...updatedCurrent.slice(0, currentStep + 1), ...newRemainder]
    })

    if (outcome.type === 'goal') {
      playSound('goal')
      playSound('goalHit')
    }

    // Steg 5: delay 1500ms so revealed outcome stays visible before next step (FIX-35)
    // Commentary mode: timer effect handles advancement after setSteps re-triggers it; skip setCurrentStep here
    // B-3: vid mål — linjera dismiss mot tavlans flash (4000ms, ScoreboardStalvallen)
    // så panelen inte glider ner medan siffran fortfarande blinkar.
    setTimeout(() => {
      setActiveFreeKick(null)
      setFreeKickOutcome(null)
      if (!isCommentaryMode) setCurrentStep(prev => prev + 1)
    }, isFastForward ? 0 : outcome.type === 'goal' ? 4000 : 2500)
  }

  function handleLastMinutePressChoice(_choice: PressChoice) {
    lastMinutePressResolved.current = true
    // delay 1500ms so revealed outcome stays visible before next step (FIX-35)
    setTimeout(() => {
      setActiveLastMinutePress(null)
      setCurrentStep(prev => prev + 1)
    }, isFastForward ? 0 : 2500)
  }

  function handleApplyTactic() {
    if (!fixture || !homeLineup || !awayLineup || !game) return
    const managedIsHome = fixture.homeClubId === game.managedClubId
    const currentTactic = managedIsHome ? homeLineup.tactic : awayLineup.tactic
    const updatedTactic: Tactic = {
      ...currentTactic,
      mentality: htMentality ?? currentTactic.mentality,
      tempo: htTempo ?? currentTactic.tempo,
      press: htPress ?? currentTactic.press,
    }

    const applySubstitutions = (lineup: TeamSelection): TeamSelection => {
      if (!htSubs.length) return lineup
      const starters = [...lineup.startingPlayerIds]
      const bench = [...lineup.benchPlayerIds]
      for (const sub of htSubs) {
        const outIdx = starters.indexOf(sub.outId)
        const inIdx = bench.indexOf(sub.inId)
        if (outIdx >= 0 && inIdx >= 0) {
          starters[outIdx] = sub.inId
          bench[inIdx] = sub.outId
        }
      }
      return { ...lineup, tactic: lineup.tactic, startingPlayerIds: starters, benchPlayerIds: bench }
    }

    const updatedHome = managedIsHome
      ? applySubstitutions({ ...homeLineup, tactic: updatedTactic })
      : homeLineup
    const updatedAway = !managedIsHome
      ? applySubstitutions({ ...awayLineup, tactic: updatedTactic })
      : awayLineup
    const halftimeStep = steps.find(s => s.step === 30)
    let homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    let awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)

    // Spak A — pausvalets effekt. effectiveLean = spelarens val, annars lägets default (index 0).
    const htHome = halftimeStep?.homeScore ?? 0
    const htAway = halftimeStep?.awayScore ?? 0
    const managedDiff = managedIsHome ? htHome - htAway : htAway - htHome
    const htSituation: MatchSituation = managedDiff < 0 ? 'behind' : managedDiff === 0 ? 'level' : 'leading'
    const effectiveLean: PauseLean = pauseLean ?? PAUSSNACK[htSituation][0].lean

    // H2-uppföljning (5c9a7a8, 2026-08-24): loggade tidigare en 'lugna'/
    // 'pressa'/'prata'-klassificering härledd ur htTempo/htPress/htMentality
    // — de HELT ANDRA taktikreglagen på samma pausskärm, oberoende av
    // spelarens faktiska paussnack (effectiveLean, satt av PAUSSNACK-valet
    // ovan). Loggar nu effectiveLean rakt av — primärt beslut-ID, se
    // Fixture.ts:s ManagerChoiceEntry-kommentar.
    setHalftimeDecisionForLog(effectiveLean)

    // Morale/sharpness — den osynliga delen (behålls additivt, SPEC A1). Den synliga
    // delen (postBreakUrgency-luten) ligger i pauseLean nedan.
    {
      const moraleDelta = effectiveLean === 'calm' ? 5 : 2
      const sharpnessDelta = effectiveLean === 'push' ? 8 : 0
      const applyBoost = (players: typeof homePlayers) =>
        players.map(p => ({
          ...p,
          morale: Math.min(100, Math.max(0, p.morale + moraleDelta)),
          sharpness: Math.min(100, Math.max(0, p.sharpness + sharpnessDelta)),
        }))
      if (managedIsHome) homePlayers = applyBoost(homePlayers)
      else awayPlayers = applyBoost(awayPlayers)
    }

    const gen = simulateSecondHalf({
      fixture, homeLineup: updatedHome, awayLineup: updatedAway,
      homePlayers, awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : undefined,
      // PT-7: fixtureSeed(fixture.id, 31) — 31 är halvtidssteget (samma gräns som
      // steps.slice(0,31)/setCurrentStep(31) nedan), deterministiskt istf Date.now().
      seed: fixtureSeed(fixture.id, 31),
      weather: matchWeather?.weather,
      homeClubName: homeClubName || undefined,
      awayClubName: awayClubName || undefined,
      rivalry: rivalry ?? undefined,
      initialHomeScore: halftimeStep?.homeScore ?? 0,
      initialAwayScore: halftimeStep?.awayScore ?? 0,
      initialShotsHome: halftimeStep?.shotsHome ?? 0,
      initialShotsAway: halftimeStep?.shotsAway ?? 0,
      initialCornersHome: halftimeStep?.cornersHome ?? 0,
      initialCornersAway: halftimeStep?.cornersAway ?? 0,
      initialHomeSuspensions: halftimeStep?.activeSuspensions.homeCount ?? 0,
      initialAwaySuspensions: halftimeStep?.activeSuspensions.awayCount ?? 0,
      substitutions: htSubs.length > 0 ? htSubs.map(s => ({ outId: s.outId, inId: s.inId })) : undefined,
      managedIsHome,
      pauseLean: effectiveLean,
      storylines: game.storylines?.map(s => ({ playerId: s.playerId, type: s.type, displayText: s.displayText })),
    })
    const firstHalf = steps.slice(0, 31)
    const newSecondHalf: MatchStep[] = []
    for (const s of gen) newSecondHalf.push(s)
    setSteps([...firstHalf, ...newSecondHalf])
    // Återställ reducer till halvtidsstatus (utvisningar nollställs, scores bevaras)
    dispatch({
      type: 'RESET_FROM_HALFTIME',
      state: {
        initialHomeScore: halftimeStep?.homeScore ?? 0,
        initialAwayScore: halftimeStep?.awayScore ?? 0,
        initialShotsHome: halftimeStep?.shotsHome ?? 0,
        initialShotsAway: halftimeStep?.shotsAway ?? 0,
        initialCornersHome: halftimeStep?.cornersHome ?? 0,
        initialCornersAway: halftimeStep?.cornersAway ?? 0,
        initialHomeSuspensions: 0,
        initialAwaySuspensions: 0,
      },
    })
    setTacticChanged(true)
    setShowHalftime(false)
    setIsPaused(false)
    setCurrentStep(31)
  }

  function applyQuickTactic(optId: string) {
    if (!game || !fixture || !homeLineup || !awayLineup || !currentMatchStep) return
    if (tacticChangesUsed >= MAX_TACTIC_CHANGES) return

    const managedIsHome = fixture.homeClubId === game.managedClubId
    const currentTactic = managedIsHome ? homeLineup.tactic : awayLineup.tactic
    const updatedTactic: Tactic = { ...currentTactic }
    if (optId === 'tempo_high') updatedTactic.tempo = TacticTempo.High
    else if (optId === 'tempo_low') updatedTactic.tempo = TacticTempo.Low
    else if (optId === 'attack') updatedTactic.mentality = TacticMentality.Offensive
    else if (optId === 'defend') updatedTactic.mentality = TacticMentality.Defensive

    const newHome = managedIsHome ? { ...homeLineup, tactic: updatedTactic } : homeLineup
    const newAway = !managedIsHome ? { ...awayLineup, tactic: updatedTactic } : awayLineup

    const fromStep = currentStep + 1
    const inSecondHalf = fromStep >= 31

    const tacticCommentary: Record<string, string[]> = {
      tempo_high: ['Tränaren viftar in spelarna. Tempot höjs.', 'Nya direktiv från bänken — nu ska det gå fort.'],
      tempo_low: ['Tränaren signalerar lugn. Sänk tempot.', 'Kontroll. Tränaren vill se tålamod.'],
      attack: ['Tränaren skickar upp laget. Allt framåt!', 'Anfallspress. Backlinjen flyttar upp.'],
      defend: ['Tränaren sjunker ner. Försvara ledningen.', 'Alla bakom bollen.'],
    }
    const comments = tacticCommentary[optId] ?? []
    // PT-10: kosmetisk (bara kommentarstext) — seedas ändå, determinism överallt
    // är enklare att hålla än determinism med undantag.
    const commentText = comments.length > 0
      ? seededPick(comments, interactionSeed(fixture.id, currentStep, 'tacticComment'))
      : ''

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)

    const gen = simulateFromMidMatch({
      fixture, homeLineup: newHome, awayLineup: newAway,
      homePlayers, awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : undefined,
      // PT-7: fixtureSeed(fixture.id, fromStep) — deterministisk per fixture+ingreppspunkt,
      // istf Date.now() (BACKLOG.md 2026-07-10).
      seed: fixtureSeed(fixture.id, fromStep),
      weather: matchWeather?.weather,
      homeClubName: homeClubName || undefined,
      awayClubName: awayClubName || undefined,
      rivalry: rivalry ?? undefined,
      initialHomeScore: currentMatchStep.homeScore,
      initialAwayScore: currentMatchStep.awayScore,
      initialShotsHome: currentMatchStep.shotsHome,
      initialShotsAway: currentMatchStep.shotsAway,
      initialCornersHome: currentMatchStep.cornersHome,
      initialCornersAway: currentMatchStep.cornersAway,
      initialHomeSuspensions: currentMatchStep.activeSuspensions.homeCount,
      initialAwaySuspensions: currentMatchStep.activeSuspensions.awayCount,
      managedIsHome,
      storylines: game.storylines?.map(s => ({ playerId: s.playerId, type: s.type, displayText: s.displayText })),
    }, fromStep, inSecondHalf)

    const newRemainder: MatchStep[] = []
    for (const s of gen) newRemainder.push(s)

    const commentStep: MatchStep = {
      ...currentMatchStep,
      step: currentStep,
      events: [],
      commentary: commentText,
      commentaryType: 'tactical',
    }

    const kept = steps.slice(0, currentStep)
    setSteps([...kept, commentStep, ...newRemainder])
    setTacticChangesUsed(prev => prev + 1)
    setTacticChanged(true)
    setShowTacticQuick(false)
    setIsFastForward(false)
    setIsPaused(false)
  }

  // Spak B — gate: tänds EN gång, sent (lateFactor) i jämnt läge, om taktikbyte finns kvar.
  // Pressbar → no-op undviks genom att kräva creditsLeft i gaten.
  useEffect(() => {
    if (spakBState !== 'idle' || matchDone) return
    const cs = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null
    if (!cs) return
    const late = (cs.lateFactor ?? 0) >= 0.5
    const even = Math.abs(cs.homeScore - cs.awayScore) <= 1
    const creditsLeft = tacticChangesUsed < MAX_TACTIC_CHANGES
    if (late && even && creditsLeft) {
      setSpakBState('active')
      setSpakBAppearStep(currentStep)
    }
  }, [currentStep, steps, matchDone, spakBState, tacticChangesUsed])

  // Spak B — lämnar feeden efter N steg om spelaren inte rör det (resolvar passivt).
  useEffect(() => {
    if (spakBState === 'active' && spakBAppearStep !== null && currentStep > spakBAppearStep + 4) {
      setSpakBState('done')
    }
  }, [currentStep, spakBState, spakBAppearStep])

  function handleSpakB(choice: 'push' | 'shut') {
    setSpakBState('done')
    applyQuickTactic(choice === 'push' ? 'attack' : 'defend')
  }

  if (!fixture || !homeLineup || !awayLineup) {
    return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Ingen matchdata tillgänglig.</div>
  }

  if (isSmFinal && finalIntroSlide > 0) {
    return (
      <FinalIntroScreen
        variant="sm"
        slide={finalIntroSlide}
        onNext={() => setFinalIntroSlide(prev => prev + 1)}
        onStart={() => { setPostIntroFade(true); setFinalIntroSlide(0); setCurrentStep(0) }}
        homeClubName={homeClubName}
        awayClubName={awayClubName}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
        season={game?.currentSeason ?? fixture.season}
        matchWeather={matchWeather}
        bracket={game?.playoffBracket ?? undefined}
        homeStanding={game?.standings.find(s => s.clubId === fixture.homeClubId)}
        awayStanding={game?.standings.find(s => s.clubId === fixture.awayClubId)}
        clubs={game?.clubs ?? []}
        players={game?.players ?? []}
        fixture={fixture}
        game={game ?? undefined}
        tier="gold"
      />
    )
  }

  if (!isSmFinal && isCupFinal && finalIntroSlide > 0) {
    return (
      <FinalIntroScreen
        variant="cup"
        slide={finalIntroSlide}
        onNext={() => setFinalIntroSlide(prev => prev + 1)}
        onStart={() => { setPostIntroFade(true); setFinalIntroSlide(0); setCurrentStep(0) }}
        homeClubName={homeClubName}
        awayClubName={awayClubName}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
        season={game?.currentSeason ?? fixture.season}
        matchWeather={matchWeather}
        clubs={game?.clubs ?? []}
        players={game?.players ?? []}
        fixture={fixture}
      />
    )
  }

  const currentMatchStep = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null
  const displayedSteps = currentStep >= 0 ? steps.slice(0, currentStep + 1) : []
  const penaltyFinalScore = (() => {
    const penStep = displayedSteps.find(s => s.penaltyDone && s.penaltyFinalResult)
    return penStep?.penaltyFinalResult ?? undefined
  })()
  // MomentumBar (ärlig): homeInitiative-kadens från visade steg (homeShort/awayShort finns nedan)
  const momentumHistory = displayedSteps.map(s => s.homeInitiative ?? 0.5)
  // Score läses från reducer-state — EN sanning (steg 4)
  const homeScore = matchState.homeScore
  const awayScore = matchState.awayScore

  const homeClub = fixture ? game?.clubs.find(c => c.id === fixture.homeClubId) : undefined
  const awayClub = fixture ? game?.clubs.find(c => c.id === fixture.awayClubId) : undefined
  const homeShort = (homeClub?.shortName ?? homeClubName).toUpperCase()
  const awayShort = (awayClub?.shortName ?? awayClubName).toUpperCase()

  function handleLiveSub(_outId: string, _inId: string) {
    setShowSubModal(false)
    setIsPaused(false)
  }

  function handleToggleFastForward() {
    const newFF = !isFastForward
    // C-fix: högvärda interaktioner (straff, sen press) får ALDRIG tyst-förkastas av FF.
    // Är en sådan aktiv när spelaren slår på FF — vägra tända FF, låt panelen stå kvar.
    if (newFF && (activePenalty || activeLastMinutePress)) {
      return
    }
    setIsFastForward(newFF)
    if (newFF && (activeCorner || activeCounter || activeFreeKick)) {
      setActiveCorner(null)
      setCornerOutcome(null)
      setActiveCounter(null)
      setCounterOutcome(null)
      setActiveFreeKick(null)
      setFreeKickOutcome(null)
      setCurrentStep(prev => prev + 1)
    }
  }

  const managedIsHomeForSubs = fixture ? fixture.homeClubId === game?.managedClubId : false
  const managedLineup = managedIsHomeForSubs ? homeLineup : awayLineup
  const managedStarterPlayers = managedLineup
    ? (game?.players ?? []).filter(p => managedLineup.startingPlayerIds?.includes(p.id))
    : []
  const managedBenchPlayers = managedLineup
    ? (game?.players ?? []).filter(p => managedLineup.benchPlayerIds?.includes(p.id))
    : []

  // ── Stålvallen scoreboard computed values ────────────────────────────────
  const managedSide: 'home' | 'away' = fixture.homeClubId === game?.managedClubId ? 'home' : 'away'

  const period = (() => {
    if (matchDone) return 'FT' as const
    if (currentMatchStep?.phase === 'overtime') return 'OT' as const
    if (currentStep < 30) return 'HL1' as const
    return 'HL2' as const
  })()

  const finalTier = (() => {
    if (isCupFinal) return 'CUPFINAL'
    if (matchPhase === 'final') return 'SM-FINAL'
    if (matchPhase === 'semifinal') return 'SEMIFINAL'
    if (matchPhase === 'quarterfinal') return 'KVARTSFINAL'
    return undefined
  })()

  const scoreboardEvents: ScoreboardEvent[] = displayedSteps.flatMap(s =>
    s.events
      .filter(e => e.type === MatchEventType.Goal)
      .map(e => ({
        minute: e.minute ?? s.minute ?? 0,
        type: (e.isPenaltyGoal ? 'pen' : 'goal') as 'goal' | 'pen',
        team: (e.clubId === fixture.homeClubId ? 'home' : 'away') as 'home' | 'away',
      }))
  )

  const scoreboardPenalties: PenaltyEntry[] = (() => {
    if (!currentMatchStep || !game) return []
    const currentMin = currentMatchStep.minute
    const allEventsSoFar = displayedSteps.flatMap(s => s.events)
    const playerById = new Map(game.players.map(p => [p.id, p]))
    return allEventsSoFar
      .filter(e => e.type === MatchEventType.Suspension && currentMin - (e.minute ?? 0) < 10)
      .map(e => {
        const p = e.playerId ? playerById.get(e.playerId) : null
        const elapsed = currentMin - (e.minute ?? 0)
        const remaining = Math.max(0, 10 - elapsed)
        return {
          team: (e.clubId === fixture.homeClubId ? 'home' : 'away') as 'home' | 'away',
          num: p?.shirtNumber ?? 0,
          name: p ? `${p.firstName[0]}. ${p.lastName}` : '?',
          secondsLeft: remaining * 60,
        }
      })
      .filter(pe => pe.secondsLeft > 0)
  })()

  // ── Feed rows for CommentaryFeedStalvallen ───────────────────────────────
  const feedPlayers = game?.players ?? []

  // M7: penalty shootout rows — one row per round, newest-first after reversing
  const penaltyFeedRows: FeedRow[] = displayedSteps
    .filter(s => s.phase === 'penalties' && s.penaltyRound)
    .map(s => {
      const pr = s.penaltyRound!
      const homeLast = pr.homeShooterName.split(' ').pop() ?? pr.homeShooterName
      const awayLast = pr.awayShooterName.split(' ').pop() ?? pr.awayShooterName
      const homeIcon = pr.homeScored ? '✅' : '❌'
      const awayIcon = pr.awayScored ? '✅' : '❌'
      const total = `${s.penaltyHomeTotal ?? 0}–${s.penaltyAwayTotal ?? 0}`
      return {
        kind: 'event' as const,
        tag: 'penalty' as const,
        minute: s.minute,
        text: `Omg. ${pr.round}: ${homeLast} ${homeIcon} · ${awayLast} ${awayIcon} — ${total}`,
      }
    })

  // Grepp 2: atmosfäriska rader i feeden (inte ticker på scoreboarden).
  // recentGoals utelämnas — de är redan goal-events i feedRows.
  const atmosphereFeedRows: FeedRow[] = (() => {
    const rows: FeedRow[] = []
    const w = matchWeather?.weather
    if (w) {
      const condLabel: Record<string, string> = {
        clear: 'Klart', overcast: 'Mulet', lightSnow: 'Snöfall',
        heavySnow: 'Snöoväder', fog: 'Dimma', thaw: 'Töväder',
      }
      const cond = condLabel[w.condition] ?? ''
      const wind = w.windStrength >= 3 ? `, vind ${w.windStrength} m/s` : ''
      const temp = `${w.temperature > 0 ? '+' : ''}${w.temperature}°`
      const attendance = fixture.attendance
        ? ` · Publik ${fixture.attendance.toLocaleString('sv-SE')}` : ''
      rows.push({ kind: 'atmosphere', text: `${temp} · ${cond}${wind}${attendance}` })
    } else if (fixture.attendance) {
      rows.push({ kind: 'atmosphere', text: `Publik ${fixture.attendance.toLocaleString('sv-SE')}` })
    }
    const otherResults = (game?.fixtures ?? [])
      .filter(f =>
        f.id !== fixture.id &&
        !f.isCup &&
        f.roundNumber === fixture.roundNumber &&
        f.homeScore !== undefined && f.awayScore !== undefined &&
        f.status === 'completed'
      )
      .slice(0, 3)
      .map(f => {
        const h = game?.clubs.find(c => c.id === f.homeClubId)?.shortName ?? '?'
        const a = game?.clubs.find(c => c.id === f.awayClubId)?.shortName ?? '?'
        return `${h} ${f.homeScore}–${f.awayScore} ${a}`
      })
    if (otherResults.length > 0) {
      rows.push({ kind: 'atmosphere', text: otherResults.join(' · ') })
    }
    return rows
  })()

  const feedRows: FeedRow[] = [
    ...atmosphereFeedRows,
    ...displayedSteps
      .filter(s =>
        s.phase !== 'penalties' && (
          s.commentary?.trim() ||
          s.events.some(e =>
            e.type === MatchEventType.Goal ||
            e.type === MatchEventType.Suspension ||
            e.type === MatchEventType.Save
          )
        )
      )
      .flatMap((s): FeedRow[] => {
        // Assistentens röstrad (FF-assisterade corner/counter/frislag) ska visas FÖRE
        // utfallsraden. Ordningen här är avsiktligt [utfall, röstrad] — hela feedRows
        // reverse:as längst ner (senaste överst), så den lokala ordningen speglas och
        // röstraden hamnar ovanför/före utfallsraden i den slutliga renderingen.
        const assistantRow = s.assistantVoiceLine
          ? [{ kind: 'atmosphere' as const, text: s.assistantVoiceLine }]
          : []
        const goalEvent = s.events.find(e => e.type === MatchEventType.Goal)
        if (goalEvent) {
          const team = goalEvent.clubId === fixture.homeClubId ? 'home' as const : 'away' as const
          return [{
            kind: 'event' as const,
            tag: (goalEvent.isPenaltyGoal ? 'penalty' : 'goal') as 'penalty' | 'goal',
            minute: s.minute,
            team,
            text: deriveEventText(s.commentary, goalEvent, 'Mål', feedPlayers),
          }, ...assistantRow]
        }
        const suspEvent = s.events.find(e => e.type === MatchEventType.Suspension)
        if (suspEvent) {
          const team = suspEvent.clubId === fixture.homeClubId ? 'home' as const : 'away' as const
          return [{
            kind: 'event' as const,
            tag: 'suspension' as const,
            minute: s.minute,
            team,
            text: deriveEventText(s.commentary, suspEvent, 'Utvisning', feedPlayers),
          }, ...assistantRow]
        }
        const saveEvent = s.events.find(e => e.type === MatchEventType.Save)
        if (saveEvent) {
          const team = saveEvent.clubId === fixture.homeClubId ? 'home' as const : 'away' as const
          return [{
            kind: 'event' as const,
            tag: 'save' as const,
            minute: s.minute,
            team,
            text: deriveEventText(s.commentary, saveEvent, 'Räddning', feedPlayers),
          }, ...assistantRow]
        }
        return [{ kind: 'atmosphere' as const, text: s.commentary ?? '' }, ...assistantRow]
      }),
    ...penaltyFeedRows,
  ].reverse()

  // FIX-48: FeedEndRow data
  const savedFixture = (matchDone && game && fixture)
    ? game.fixtures.find(f => f.id === fixture.id) ?? fixture
    : null
  const endResult = savedFixture
    ? `${homeClubName} ${savedFixture.homeScore} — ${savedFixture.awayScore} ${awayClubName}`
    : ''
  const endSummary = (savedFixture && game)
    ? generateMatchStory(savedFixture, game)
    : 'Matchen är slut.'
  const endArenaMeta = (() => {
    if (!savedFixture) return ''
    const homeClubForArena = game?.clubs.find(c => c.id === savedFixture.homeClubId)
    const arenaRaw = homeClubForArena?.arenaName ?? ''
    const arena = arenaRaw ? formatArenaName(arenaRaw).toUpperCase() : ''
    const omg = savedFixture.roundNumber <= 22 ? ` · OMG. ${savedFixture.roundNumber}` : ''
    return `${arena}${omg}`
  })()

  const spelStamp = (() => {
    if (matchDone) return { label: 'TILL GRANSKNING →', onClick: () => navigate('/game/review', { replace: true }) }
    if (showHalftime) return { label: 'PAUSSNACK →', onClick: () => {} } // modal täcker stampen; onClick når aldrig spelaren
    return null
  })()

  return (
    <LedgerFrame
      clubId={managedClub?.id ?? ''}
      clubName={managedClub?.name ?? ''}
      managerName={game ? getManagerDisplayName(game) : ''}
      season={seasonSpanLabel(game?.currentSeason ?? fixture.season)}
      round={fixture.matchday}
      phase="spela"
      stamp={spelStamp}
      liveScore={{
        homeName: homeClub?.name ?? homeClubName,
        awayName: awayClub?.name ?? awayClubName,
        homeScore,
        awayScore,
      }}
      style={postIntroFade ? { animation: 'fadeIn 300ms ease-out both' } : undefined}
      dock={
        <>
          <SiffrorDrawer
            open={siffrorOpen}
            onClose={() => setSiffrorOpen(false)}
            currentMatchStep={currentMatchStep}
            momentumHistory={momentumHistory}
            homeShort={homeShort}
            awayShort={awayShort}
          />
          <InteraktionsDock
            activeCorner={activeCorner}
            cornerOutcome={cornerOutcome}
            onCorner={handleCornerChoice}
            activePenalty={activePenalty}
            penaltyOutcome={penaltyOutcome}
            onPenalty={handlePenaltyChoice}
            activeCounter={activeCounter}
            counterOutcome={counterOutcome}
            onCounter={handleCounterChoice}
            activeFreeKick={activeFreeKick}
            freeKickOutcome={freeKickOutcome}
            onFreeKick={handleFreeKickChoice}
            activeLastMinutePress={activeLastMinutePress}
            onLastMinutePress={handleLastMinutePressChoice}
            coach={game?.assistantCoach ?? undefined}
          />
        </>
      }
    >
      {showSubModal && (
        <SubstitutionModal
          starters={managedStarterPlayers}
          bench={managedBenchPlayers}
          onConfirm={handleLiveSub}
          onClose={() => { setShowSubModal(false); setIsPaused(false) }}
        />
      )}

      <ScoreboardStalvallen
        homeCode={homeShort}
        awayCode={awayShort}
        homeScore={homeScore}
        awayScore={awayScore}
        managedSide={managedSide}
        period={period}
        minute={displayedMinute}
        second={0}
        penalties={scoreboardPenalties}
        events={scoreboardEvents}
        isPlayoffFinal={matchPhase === 'final'}
        finalTier={finalTier}
        showNowMarker={!matchDone}
        penaltyFinalScore={penaltyFinalScore}
      />

      <MatchControls
        isPaused={isPaused}
        isFastForward={isFastForward}
        matchDone={matchDone}
        muted={muted}
        onTogglePause={() => setIsPaused(prev => !prev)}
        onToggleFastForward={handleToggleFastForward}
        onOpenSubModal={() => { setIsPaused(true); setShowSubModal(true) }}
        onToggleMute={() => { toggleMute(); setMuted(isMuted()) }}
        onOpenSiffror={() => setSiffrorOpen(true)}
        onOpenTacticQuick={() => { setIsFastForward(false); setIsPaused(true); setShowTacticQuick(true) }}
        tacticChangesLeft={MAX_TACTIC_CHANGES - tacticChangesUsed}
        tacticGlow={spakBState === 'active'}
      />

      {showTacticQuick && !matchDone && (
        <TacticChangeModal
          changesLeft={MAX_TACTIC_CHANGES - tacticChangesUsed}
          onChoose={applyQuickTactic}
          onClose={() => { setShowTacticQuick(false); setIsPaused(false) }}
        />
      )}

      {game && hintVisible && (
        <div style={{ opacity: hintVisible ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: hintVisible ? 'auto' : 'none' }}>
          <FirstVisitHint
            screenId="matchLive"
            text="Matchen rullar automatiskt. Vid hörnor får du välja — titta efter hörn-kortet i feeden."
            onDismiss={() => { setHintVisible(false); dismissHint('matchLive') }}
          />
        </div>
      )}

      {(() => {
        const refereeId = fixture?.refereeId
        const referee = refereeId ? game?.referees?.find(r => r.id === refereeId) : undefined
        if (!referee) return null
        return (
          <div style={{ padding: '4px 14px', background: 'var(--bg-leather-dk)', borderBottom: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
            <span className="h-micro" style={{ color: 'color-mix(in srgb, var(--ink-muted) 60%, transparent)' }}>
              DOMARE: {referee.firstName} {referee.lastName} ({referee.homeTown})
            </span>
          </div>
        )
      })()}

      {/* Interaktionspaneler — dockade (InteraktionsDock i dock-sloten), inte inline.
          Flyttade ut ur feed-flödet så hörnor m.fl. inte reflowar feeden. */}

      {spakBState === 'active' && currentMatchStep && !matchDone && (
        <SentValCard
          minute={currentMatchStep.minute}
          onPush={() => handleSpakB('push')}
          onShut={() => handleSpakB('shut')}
        />
      )}

      <CommentaryFeedStalvallen
        rows={feedRows}
        autoScroll={true}
        matchDone={matchDone && !isSmFinal && !isCupFinal}
        endResult={endResult}
        endSummary={endSummary}
        endArenaMeta={endArenaMeta}
      />

      {showHalftime && !matchDone && (
        <HalftimeModal
          fixture={fixture}
          homeClubName={homeClubName}
          awayClubName={awayClubName}
          homeLineup={homeLineup}
          awayLineup={awayLineup}
          steps={steps}
          managedClubId={game?.managedClubId}
          isBigMatch={isBigMatch}
          isSmFinal={isSmFinal}
          isCupFinal={!!isCupFinal}
          players={game?.players ?? []}
          htMentality={htMentality}
          htTempo={htTempo}
          htPress={htPress}
          onSetMentality={setHtMentality}
          onSetTempo={setHtTempo}
          onSetPress={setHtPress}
          tacticChanged={tacticChanged}
          htSubs={htSubs}
          onHtSubsChange={setHtSubs}
          managedLineup={fixture.homeClubId === game?.managedClubId ? homeLineup : awayLineup}
          allPlayers={game?.players ?? []}
          onApplyTactic={handleApplyTactic}
          onContinue={handleApplyTactic}
          pauseLean={pauseLean}
          onPauseLean={setPauseLean}
        />
      )}

      {showOvertimeOverlay && (
        <PhaseOverlay
          phase="overtime"
          onContinue={() => { setShowOvertimeOverlay(false); setCurrentStep(prev => prev + 1) }}
        />
      )}
      {showPenaltiesOverlay && (
        <PhaseOverlay
          phase="penalties"
          onContinue={() => { setShowPenaltiesOverlay(false); setCurrentStep(prev => prev + 1) }}
        />
      )}

      {!isSmFinal && isCupFinal && ceremonySlide >= 1 && (
        <CeremonyCupFinal
          slide={ceremonySlide as 1 | 2}
          homeClubName={homeClubName}
          awayClubName={awayClubName}
          homeScore={homeScore}
          awayScore={awayScore}
          fixture={fixture}
          managedClubId={game?.managedClubId}
          season={game?.currentSeason ?? fixture.season}
          clubs={game?.clubs ?? []}
          cupBracket={game?.cupBracket ?? undefined}
          onNavigate={() => navigate('/game', { replace: true })}
        />
      )}

      {isSmFinal && ceremonySlide >= 1 && (
        <CeremonySmFinal
          slide={ceremonySlide as 1 | 2 | 3}
          homeClubName={homeClubName}
          awayClubName={awayClubName}
          homeScore={homeScore}
          awayScore={awayScore}
          fixture={fixture}
          managedClubId={game?.managedClubId}
          season={game?.currentSeason ?? fixture.season}
          steps={steps}
          homeLineup={homeLineup}
          awayLineup={awayLineup}
          players={game?.players ?? []}
          onAdvance={() => setCeremonySlide(3)}
          onNavigate={() => navigate('/game/champion', { replace: true })}
        />
      )}

    </LedgerFrame>
  )
}
