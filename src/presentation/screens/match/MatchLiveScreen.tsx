/**
 * MatchLiveScreen.tsx — top-level orkestrering för live-match
 *
 * Steg 5 (Refactor B) i refactor/livematch-split (SPEC_LIVEMATCH_REFACTOR.md).
 * EN källa för steg-progression — handler-timeouts borttagna.
 * Timer-effekten pausar automatiskt vid aktiv interaktion och fortsätter när cleared.
 */

import { useState, useEffect, useReducer, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { simulateSecondHalf, simulateFromMidMatch } from '../../../domain/services/matchSimulator'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { MATCH_GOAL_DIFFERENCE_CAP, MATCH_TOTAL_GOAL_CAP } from '../../../domain/services/matchCore'
import type { MatchPhaseContext } from '../../../domain/services/matchUtils'
import type { Tactic } from '../../../domain/entities/Club'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { MatchWeather } from '../../../domain/entities/Weather'
import { MatchEventType, TacticMentality, TacticTempo, TacticPress, PlayerPosition } from '../../../domain/enums'
import { getRivalry } from '../../../domain/data/rivalries'
import { buildSeasonCalendar } from '../../../domain/services/scheduleGenerator'
import { computePlayerRatings } from '../../utils/matchRatings'
import { playSound, isMuted, toggleMute } from '../../audio/soundEffects'
import { PhaseOverlay } from '../../components/match/PhaseOverlay'
import { FinalIntroScreen } from '../../components/match/FinalIntroScreen'
import { HalftimeModal } from '../../components/match/HalftimeModal'
import { CeremonyCupFinal } from '../../components/match/CeremonyCupFinal'
import { CeremonySmFinal } from '../../components/match/CeremonySmFinal'
import { SubstitutionModal } from '../../components/match/SubstitutionModal'
import { ScoreboardStalvallen } from '../../components/match/scoreboard/ScoreboardStalvallen'
import type { ScoreboardEvent } from '../../components/match/scoreboard/ScoreboardStalvallen'
import { MatchControls } from '../../components/match/MatchControls'
import { CommentaryFeedStalvallen } from '../../components/match/commentary/CommentaryFeedStalvallen'
import type { FeedRow } from '../../components/match/commentary/CommentaryFeedStalvallen'
import { resolveCorner } from '../../../domain/services/cornerInteractionService'
import type { CornerZone, CornerDelivery } from '../../../domain/services/cornerInteractionService'
import { CornerInteraction } from '../../components/match/CornerInteraction'
import { resolvePenalty, resolveAIPenaltyKeeperDive } from '../../../domain/services/penaltyInteractionService'
import type { PenaltyDirection, PenaltyHeight } from '../../../domain/services/penaltyInteractionService'
import { PenaltyInteraction } from '../../components/match/PenaltyInteraction'
import { resolveCounter } from '../../../domain/services/counterAttackInteractionService'
import type { CounterChoice } from '../../../domain/services/counterAttackInteractionService'
import { CounterInteraction } from '../../components/match/CounterInteraction'
import { resolveFreeKick } from '../../../domain/services/freeKickInteractionService'
import type { FreeKickChoice } from '../../../domain/services/freeKickInteractionService'
import { FreeKickInteraction } from '../../components/match/FreeKickInteraction'
import type { PressChoice } from '../../../domain/services/lastMinutePressService'
import { LastMinutePress } from '../../components/match/LastMinutePress'
import { TacticChangeModal } from '../../components/match/TacticChangeModal'
import { MatchReportView } from '../../components/match/MatchReportView'
import { mulberry32 } from '../../../domain/utils/random'
import { FirstVisitHint } from '../../components/FirstVisitHint'
import { simulateMatchStepByStep } from '../../../domain/services/matchSimulator'
import { matchReducer, initialMatchState } from './matchReducer'

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

export function MatchLiveScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { game, saveLiveMatchResult, advance, markMatchStarted } = useGameStore()
  const dismissHint = useGameStore(s => s.dismissHint)

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
  const [clockSecond, setClockSecond] = useState(0)
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
  const [htSubs, setHtSubs] = useState<{ outId: string; inId: string }[]>([])
  const [halftimeChoice, setHalftimeChoice] = useState<'calm' | 'angry' | 'tactical' | null>(null)
  const [showSubModal, setShowSubModal] = useState(false)
  const [ceremonySlide, setCeremonySlide] = useState(0)
  const [finalIntroSlide, setFinalIntroSlide] = useState(() => isSmFinal ? 1 : 0)
  const [hintVisible, setHintVisible] = useState(() => !(game?.dismissedHints ?? []).includes('matchLive'))
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
    if (liveFixture?.matchStartedAt && liveFixture.status === 'scheduled') {
      navigate('/game', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // DEBUG steg 1 — verifiera att simulation-effekten triggas
    console.log('[MatchLiveScreen] simulation useEffect trigger', {
      fixtureId: fixture?.id,
      hasHomeLineup: !!homeLineup,
      hasAwayLineup: !!awayLineup,
      homeStarterCount: homeLineup?.startingPlayerIds?.length ?? 0,
      awayStarterCount: awayLineup?.startingPlayerIds?.length ?? 0,
      hasGame: !!game,
      alreadySimulated: hasSimulated.current,
    })
    if (hasSimulated.current) return
    if (!fixture || !homeLineup || !awayLineup || !game) return
    hasSimulated.current = true
    markMatchStarted(fixture.id, homeLineup, awayLineup)

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
    const homeClubObj = game.clubs.find(c => c.id === fixture.homeClubId)
    const seasonCal = buildSeasonCalendar(fixture.season)
    const liveSlot = seasonCal.find(s => s.matchday === fixture.matchday)
    const gen = simulateMatchStepByStep({
      fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : undefined,
      seed: Date.now(),
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
    })
    const allSteps: MatchStep[] = []
    for (const step of gen) allSteps.push(step)
    // DEBUG steg 2 — verifiera simulator-resultat
    console.log('[MatchLiveScreen] simulator result', {
      stepCount: allSteps.length,
      isSmFinal,
      isCupFinal,
      willSetCurrentStep: !isSmFinal && !isCupFinal,
    })
    setSteps(allSteps)
    if (!isSmFinal && !isCupFinal) {
      setCurrentStep(0)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // DEBUG steg 3 — verifiera att steps-uppdatering triggar re-render
  useEffect(() => {
    console.log('[MatchLiveScreen] steps/currentStep updated', {
      stepsLength: steps.length,
      currentStep,
    })
  }, [steps, currentStep])

  // Klock-tick — sekunder rullar 0-59 inom varje match-minute, reset vid nytt step
  useEffect(() => {
    setClockSecond(0)
  }, [currentStep])

  useEffect(() => {
    if (isPaused || isFastForward || matchDone) return
    if (activeCorner || activePenalty || activeCounter || activeFreeKick || activeLastMinutePress) return
    if (showHalftime || showOvertimeOverlay || showPenaltiesOverlay) return
    const interval = setInterval(() => {
      setClockSecond(s => (s + 1) % 60)
    }, 1000)
    return () => clearInterval(interval)
  }, [isPaused, isFastForward, matchDone, activeCorner, activePenalty, activeCounter, activeFreeKick, activeLastMinutePress, showHalftime, showOvertimeOverlay, showPenaltiesOverlay])

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
        if (!nextStep) return m + 1
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
      fixture.attendance,
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
      const hasRedCard = step.events.some(e => e.type === MatchEventType.RedCard)
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
    // DEBUG steg 4 — verifiera att timer-effekten ser rätt steps/currentStep
    console.log('[MatchTimer] effect run', {
      currentStep,
      stepsLength: steps.length,
      isPaused,
      isFastForward,
      willReturn: currentStep < 0 || currentStep >= steps.length || (isPaused && !isFastForward),
    })
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
    }

    if (step.cornerInteractionData && !activeCorner) {
      if (!isFastForward && !isCommentaryMode) {
        setActiveCorner(step.cornerInteractionData)
        setCornerOutcome(null)
        return
      }
      const zones: CornerZone[] = ['near', 'center', 'far']
      const deliveries: CornerDelivery[] = ['hard', 'low', 'short']
      handleCornerChoice(zones[Math.floor(Math.random() * 3)], deliveries[Math.floor(Math.random() * 3)], step.cornerInteractionData)
      return
    }

    if (step.penaltyInteractionData && !activePenalty) {
      if (!isFastForward && !isCommentaryMode) {
        setActivePenalty(step.penaltyInteractionData)
        setPenaltyOutcome(null)
        return
      }
      const dirs: PenaltyDirection[] = ['left', 'center', 'right']
      const heights: PenaltyHeight[] = ['low', 'high']
      handlePenaltyChoice(dirs[Math.floor(Math.random() * 3)], heights[Math.floor(Math.random() * 2)], step.penaltyInteractionData)
      return
    }

    if (step.counterInteractionData && !activeCounter) {
      if (!isFastForward && !isCommentaryMode) {
        setActiveCounter(step.counterInteractionData)
        setCounterOutcome(null)
        return
      }
      const choices: CounterChoice[] = ['sprint', 'build', 'earlyBall']
      handleCounterChoice(choices[Math.floor(Math.random() * 3)], step.counterInteractionData)
      return
    }

    if (step.freeKickInteractionData && !activeFreeKick) {
      if (!isFastForward && !isCommentaryMode) {
        setActiveFreeKick(step.freeKickInteractionData)
        setFreeKickOutcome(null)
        return
      }
      const fkChoices: FreeKickChoice[] = ['shoot', 'chipPass', 'layOff']
      handleFreeKickChoice(fkChoices[Math.floor(Math.random() * 3)], step.freeKickInteractionData)
      return
    }

    if (step.lastMinutePressData && !isFastForward && !activeLastMinutePress && !lastMinutePressResolved.current && !isCommentaryMode) {
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
    const hasSuspension = step.events.some(e => e.type === MatchEventType.RedCard)
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
      seed: Date.now(),
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

  function handleCornerChoice(zone: CornerZone, delivery: CornerDelivery, inlineData?: import('../../../domain/services/cornerInteractionService').CornerInteractionData) {
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

    const rand = mulberry32(Date.now())
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
        return { ...s, homeScore: newHomeScore, awayScore: newAwayScore,
          events: [...s.events, event as MatchStep['events'][0]],
          commentary: outcome.description, commentaryType: (capAllows && outcome.type === 'goal' ? 'goal' : 'situation') as MatchStep['commentaryType'] }
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
    setTimeout(() => {
      setActiveCorner(null)
      setCornerOutcome(null)
      setCurrentStep(prev => prev + 1)
    }, isFastForward ? 0 : 1500)
  }

  function handlePenaltyChoice(dir: PenaltyDirection, height: PenaltyHeight, inlineData?: import('../../../domain/services/penaltyInteractionService').PenaltyInteractionData) {
    const penData = inlineData ?? activePenalty
    if (!penData || !fixture || !game) return

    const managedIsHome = fixture.homeClubId === game.managedClubId
    const rand = mulberry32(Date.now())
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
        return { ...s, homeScore: newHomeScore, awayScore: newAwayScore,
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
    setTimeout(() => {
      setActivePenalty(null)
      setPenaltyOutcome(null)
      setCurrentStep(prev => prev + 1)
    }, isFastForward ? 0 : 1500)
  }

  function handleCounterChoice(choice: CounterChoice, inlineData?: import('../../../domain/services/counterAttackInteractionService').CounterInteractionData) {
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

    const rand = mulberry32(Date.now())
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
        return { ...s, homeScore: newHomeScore, awayScore: newAwayScore,
          events: [...s.events, event as MatchStep['events'][0]],
          commentary: outcome.description, commentaryType: (capAllows && outcome.type === 'goal' ? 'goal' : 'situation') as MatchStep['commentaryType'] }
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
    setTimeout(() => {
      setActiveCounter(null)
      setCounterOutcome(null)
      setCurrentStep(prev => prev + 1)
    }, isFastForward ? 0 : 1500)
  }

  function handleFreeKickChoice(choice: FreeKickChoice, inlineData?: import('../../../domain/services/freeKickInteractionService').FreeKickInteractionData) {
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

    const rand = mulberry32(Date.now())
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
        return { ...s, homeScore: newHomeScore, awayScore: newAwayScore,
          events: [...s.events, event as MatchStep['events'][0]],
          commentary: outcome.description, commentaryType: (capAllows && outcome.type === 'goal' ? 'goal' : 'situation') as MatchStep['commentaryType'] }
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
    setTimeout(() => {
      setActiveFreeKick(null)
      setFreeKickOutcome(null)
      setCurrentStep(prev => prev + 1)
    }, isFastForward ? 0 : 1500)
  }

  function handleLastMinutePressChoice(_choice: PressChoice) {
    lastMinutePressResolved.current = true
    // delay 1500ms so revealed outcome stays visible before next step (FIX-35)
    setTimeout(() => {
      setActiveLastMinutePress(null)
      setCurrentStep(prev => prev + 1)
    }, isFastForward ? 0 : 1500)
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

    if (halftimeChoice === 'calm' || halftimeChoice === 'angry') {
      const moraleDelta = halftimeChoice === 'calm' ? 5 : -3
      const sharpnessDelta = halftimeChoice === 'angry' ? 8 : 0
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
      seed: Date.now(),
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
    const commentText = comments[Math.floor(Math.random() * comments.length)] ?? ''

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)

    const gen = simulateFromMidMatch({
      fixture, homeLineup: newHome, awayLineup: newAway,
      homePlayers, awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : undefined,
      seed: Date.now(),
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

  if (!fixture || !homeLineup || !awayLineup) {
    return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Ingen matchdata tillgänglig.</div>
  }

  if (isSmFinal && finalIntroSlide > 0) {
    return (
      <FinalIntroScreen
        variant="sm"
        slide={finalIntroSlide}
        onNext={() => setFinalIntroSlide(prev => prev + 1)}
        onStart={() => { setFinalIntroSlide(0); setCurrentStep(0) }}
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
      />
    )
  }

  if (!isSmFinal && isCupFinal && finalIntroSlide > 0) {
    return (
      <FinalIntroScreen
        variant="cup"
        slide={finalIntroSlide}
        onNext={() => setFinalIntroSlide(prev => prev + 1)}
        onStart={() => { setFinalIntroSlide(0); setCurrentStep(0) }}
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
  // Score läses från reducer-state — EN sanning (steg 4)
  const homeScore = matchState.homeScore
  const awayScore = matchState.awayScore

  const homeClub = fixture ? game?.clubs.find(c => c.id === fixture.homeClubId) : undefined
  const awayClub = fixture ? game?.clubs.find(c => c.id === fixture.awayClubId) : undefined
  const homeShort = (homeClub?.shortName ?? homeClubName).substring(0, 6)
  const awayShort = (awayClub?.shortName ?? awayClubName).substring(0, 6)

  function handleLiveSub(_outId: string, _inId: string) {
    setShowSubModal(false)
    setIsPaused(false)
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

  // ── Feed rows for CommentaryFeedStalvallen ───────────────────────────────
  const feedRows: FeedRow[] = displayedSteps
    .filter(s =>
      s.commentary?.trim() ||
      s.events.some(e =>
        e.type === MatchEventType.Goal ||
        e.type === MatchEventType.RedCard ||
        e.type === MatchEventType.Save
      )
    )
    .map(s => {
      const goalEvent = s.events.find(e => e.type === MatchEventType.Goal)
      if (goalEvent) {
        const team = goalEvent.clubId === fixture.homeClubId ? 'home' as const : 'away' as const
        return {
          kind: 'event' as const,
          tag: (goalEvent.isPenaltyGoal ? 'penalty' : 'goal') as 'penalty' | 'goal',
          minute: s.minute,
          team,
          text: s.commentary ?? '',
        }
      }
      const suspEvent = s.events.find(e => e.type === MatchEventType.RedCard)
      if (suspEvent) {
        const team = suspEvent.clubId === fixture.homeClubId ? 'home' as const : 'away' as const
        return {
          kind: 'event' as const,
          tag: 'suspension' as const,
          minute: s.minute,
          team,
          text: s.commentary ?? '',
        }
      }
      const saveEvent = s.events.find(e => e.type === MatchEventType.Save)
      if (saveEvent) {
        const team = saveEvent.clubId === fixture.homeClubId ? 'home' as const : 'away' as const
        return {
          kind: 'event' as const,
          tag: 'save' as const,
          minute: s.minute,
          team,
          text: s.commentary ?? '',
        }
      }
      return { kind: 'atmosphere' as const, text: s.commentary ?? '' }
    }).reverse()

  // FIX-36: atmospheric ticker — weather, attendance, recent events, other results
  const atmosphericTicker: string[] = (() => {
    const parts: string[] = []
    const w = matchWeather?.weather
    if (w) {
      const condLabel: Record<string, string> = {
        clear: 'KLART', overcast: 'MULET', lightSnow: 'SNÖFALL',
        heavySnow: 'SNÖOVÄDER', fog: 'DIMMA', thaw: 'TÖVÄDER',
      }
      const cond = condLabel[w.condition] ?? ''
      const wind = w.windStrength >= 3 ? ` · VIND ${w.windStrength}M/S` : ''
      parts.push(`${w.temperature > 0 ? '+' : ''}${w.temperature}° · ${cond}${wind}`)
    }
    if (fixture.attendance) {
      parts.push(`PUBLIK ${fixture.attendance.toLocaleString('sv-SE')}`)
    }
    const recentGoals = displayedSteps
      .flatMap(s => s.events
        .filter(e => e.type === MatchEventType.Goal)
        .map(e => {
          const clubShort = e.clubId === fixture.homeClubId ? homeShort : awayShort
          const scorerLast = e.playerId
            ? (game?.players.find(p => p.id === e.playerId)?.lastName ?? '')
            : ''
          return `${s.minute}' ${scorerLast ? scorerLast.toUpperCase() + ' ' : ''}MÅL ${clubShort}`
        })
      )
      .slice(-3)
    for (const g of recentGoals) parts.push(g)
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
    for (const r of otherResults) parts.push(r)
    return parts.length > 0 ? parts : [`${homeShort} ${homeScore} – ${awayScore} ${awayShort}`]
  })()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg)', overflow: 'hidden', position: 'relative',
    }}>
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
        second={clockSecond}
        penalties={[]}
        ticker={atmosphericTicker}
        events={scoreboardEvents}
        isPlayoffFinal={matchPhase === 'final'}
        finalTier={finalTier}
        showNowMarker={!matchDone}
      />

      <MatchControls
        isPaused={isPaused}
        isFastForward={isFastForward}
        matchDone={matchDone}
        muted={muted}
        currentMatchStep={currentMatchStep}
        onTogglePause={() => setIsPaused(prev => !prev)}
        onToggleFastForward={() => setIsFastForward(prev => !prev)}
        onOpenSubModal={() => { setIsPaused(true); setShowSubModal(true) }}
        onToggleMute={() => { toggleMute(); setMuted(isMuted()) }}
        onOpenTacticQuick={() => { setIsFastForward(false); setIsPaused(true); setShowTacticQuick(true) }}
        tacticChangesLeft={MAX_TACTIC_CHANGES - tacticChangesUsed}
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
          <div style={{ padding: '4px 14px', background: 'var(--bg-leather-dk)', borderBottom: '1px solid rgba(196,122,58,0.1)' }}>
            <span style={{ fontSize: 9, color: 'rgba(245,241,235,0.4)', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
              DOMARE: {referee.firstName} {referee.lastName} ({referee.homeTown})
            </span>
          </div>
        )
      })()}

      {/* Active interaction panels — shown above feed when active */}
      {(activeCorner || activePenalty || activeCounter || activeFreeKick || activeLastMinutePress) && (
        <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
          {activeCorner && (
            <CornerInteraction
              data={activeCorner}
              outcome={cornerOutcome}
              onChoose={handleCornerChoice}
              coach={game?.assistantCoach ?? undefined}
            />
          )}
          {!activeCorner && activePenalty && (
            <PenaltyInteraction
              data={activePenalty}
              outcome={penaltyOutcome}
              onChoose={handlePenaltyChoice}
              coach={game?.assistantCoach ?? undefined}
            />
          )}
          {!activeCorner && !activePenalty && activeCounter && (
            <CounterInteraction
              data={activeCounter}
              outcome={counterOutcome}
              onChoose={handleCounterChoice}
              coach={game?.assistantCoach ?? undefined}
            />
          )}
          {!activeCorner && !activePenalty && !activeCounter && activeFreeKick && (
            <FreeKickInteraction
              data={activeFreeKick}
              outcome={freeKickOutcome}
              onChoose={handleFreeKickChoice}
              coach={game?.assistantCoach ?? undefined}
            />
          )}
          {!activeCorner && !activePenalty && !activeCounter && !activeFreeKick && activeLastMinutePress && (
            <LastMinutePress
              data={activeLastMinutePress}
              onChoose={handleLastMinutePressChoice}
              coach={game?.assistantCoach ?? undefined}
            />
          )}
        </div>
      )}

      <CommentaryFeedStalvallen
        rows={feedRows}
        autoScroll={true}
      />

      {/* Match done — full report overlay (FIX-33) */}
      {matchDone && !isSmFinal && !isCupFinal && game && fixture && (() => {
        const savedFixture = game.fixtures.find(f => f.id === fixture.id) ?? fixture
        return savedFixture.report ? (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, overflowY: 'auto', background: 'var(--bg-leather, #2a2824)' }}>
            <MatchReportView
              fixture={savedFixture}
              game={game}
              onClose={() => navigate('/game/review', { replace: true })}
            />
          </div>
        ) : null
      })()}

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
          halftimeChoice={halftimeChoice}
          onHalftimeChoice={setHalftimeChoice}
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
    </div>
  )
}
