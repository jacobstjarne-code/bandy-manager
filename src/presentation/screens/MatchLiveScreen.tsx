import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { simulateMatchStepByStep, simulateSecondHalf, simulateFromMidMatch, type MatchStep } from '../../domain/services/matchSimulator'
import type { MatchPhaseContext } from '../../domain/services/matchUtils'
import type { Tactic } from '../../domain/entities/Club'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { MatchEventType, TacticMentality, TacticTempo, TacticPress, PlayerPosition } from '../../domain/enums'
import { getRivalry } from '../../domain/data/rivalries'
import { computePlayerRatings } from '../utils/matchRatings'
import { playSound, isMuted, toggleMute } from '../audio/soundEffects'
import { PhaseOverlay } from '../components/match/PhaseOverlay'
import { FinalIntroScreen } from '../components/match/FinalIntroScreen'
import { HalftimeModal } from '../components/match/HalftimeModal'
import { CeremonyCupFinal } from '../components/match/CeremonyCupFinal'
import { CeremonySmFinal } from '../components/match/CeremonySmFinal'
import { SubstitutionModal } from '../components/match/SubstitutionModal'
import { Scoreboard } from '../components/match/Scoreboard'
import { MatchControls } from '../components/match/MatchControls'
import { CommentaryFeed } from '../components/match/CommentaryFeed'
import { resolveCorner } from '../../domain/services/cornerInteractionService'
import type { CornerZone, CornerDelivery } from '../../domain/services/cornerInteractionService'
import { CornerInteraction } from '../components/match/CornerInteraction'
import { resolvePenalty, resolveAIPenaltyKeeperDive } from '../../domain/services/penaltyInteractionService'
import type { PenaltyDirection, PenaltyHeight } from '../../domain/services/penaltyInteractionService'
import { PenaltyInteraction } from '../components/match/PenaltyInteraction'
import { resolveCounter } from '../../domain/services/counterAttackInteractionService'
import type { CounterChoice } from '../../domain/services/counterAttackInteractionService'
import { CounterInteraction } from '../components/match/CounterInteraction'
import { resolveFreeKick } from '../../domain/services/freeKickInteractionService'
import type { FreeKickChoice } from '../../domain/services/freeKickInteractionService'
import { FreeKickInteraction } from '../components/match/FreeKickInteraction'
import type { PressChoice } from '../../domain/services/lastMinutePressService'
import { LastMinutePress } from '../components/match/LastMinutePress'
import { TacticChangeModal } from '../components/match/TacticChangeModal'
import { mulberry32 } from '../../domain/utils/random'
import { FirstVisitHint } from '../components/FirstVisitHint'

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

  const [steps, setSteps] = useState<MatchStep[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [isPaused, setIsPaused] = useState(false)
  const [isFastForward, setIsFastForward] = useState(false)
  const [showHalftime, setShowHalftime] = useState(false)
  const [matchDone, setMatchDone] = useState(false)
  const [showOvertimeOverlay, setShowOvertimeOverlay] = useState(false)
  const [showPenaltiesOverlay, setShowPenaltiesOverlay] = useState(false)
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
  const [liveSubs, setLiveSubs] = useState<{ outId: string; inId: string; minute: number }[]>([])
  const [showSubModal, setShowSubModal] = useState(false)
  const [ceremonySlide, setCeremonySlide] = useState(0)
  const [finalIntroSlide, setFinalIntroSlide] = useState(() => isSmFinal ? 1 : isCupFinal ? 1 : 0)
  const [homeScoreFlash, setHomeScoreFlash] = useState(false)
  const [awayScoreFlash, setAwayScoreFlash] = useState(false)
  const prevHomeScore = useRef(0)
  const prevAwayScore = useRef(0)

  const [activeCorner, setActiveCorner] = useState<import('../../domain/services/cornerInteractionService').CornerInteractionData | null>(null)
  const [cornerOutcome, setCornerOutcome] = useState<import('../../domain/services/cornerInteractionService').CornerOutcome | null>(null)

  const [activePenalty, setActivePenalty] = useState<import('../../domain/services/penaltyInteractionService').PenaltyInteractionData | null>(null)
  const [penaltyOutcome, setPenaltyOutcome] = useState<import('../../domain/services/penaltyInteractionService').PenaltyOutcome | null>(null)

  const [activeCounter, setActiveCounter] = useState<import('../../domain/services/counterAttackInteractionService').CounterInteractionData | null>(null)
  const [counterOutcome, setCounterOutcome] = useState<import('../../domain/services/counterAttackInteractionService').CounterOutcome | null>(null)

  const [activeFreeKick, setActiveFreeKick] = useState<import('../../domain/services/freeKickInteractionService').FreeKickInteractionData | null>(null)
  const [freeKickOutcome, setFreeKickOutcome] = useState<import('../../domain/services/freeKickInteractionService').FreeKickOutcome | null>(null)

  const [activeLastMinutePress, setActiveLastMinutePress] = useState<import('../../domain/services/lastMinutePressService').LastMinutePressData | null>(null)

  const lastMinutePressResolved = useRef(false)

  const feedRef = useRef<HTMLDivElement>(null)
  const hasSimulated = useRef(false)

  useEffect(() => {
    if (!fixture || !game) return
    const liveFixture = game.fixtures.find(f => f.id === fixture.id)
    if (liveFixture?.status === 'completed') {
      navigate('/game', { replace: true })
      return
    }
    // Match was started but not finished — user navigated away mid-match
    if (liveFixture?.matchStartedAt && liveFixture.status === 'scheduled') {
      navigate('/game', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasSimulated.current) return
    if (!fixture || !homeLineup || !awayLineup || !game) return
    hasSimulated.current = true
    markMatchStarted(fixture.id)

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
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
    })
    const allSteps: MatchStep[] = []
    for (const step of gen) allSteps.push(step)
    setSteps(allSteps)
    if (!isSmFinal && !isCupFinal) {
      setCurrentStep(0)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ceremonySlide !== 1) return
    const timer = setTimeout(() => setCeremonySlide(2), 3000)
    return () => clearTimeout(timer)
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

    const report = {
      playerRatings,
      shotsHome: lastStep.shotsHome,
      shotsAway: lastStep.shotsAway,
      cornersHome: lastStep.cornersHome,
      cornersAway: lastStep.cornersAway,
      penaltiesHome: penaltyResult?.home ?? 0,
      penaltiesAway: penaltyResult?.away ?? 0,
      possessionHome: 50,
      possessionAway: 50,
      playerOfTheMatchId: potmId,
    }
    saveLiveMatchResult(
      fixture.id, lastStep.homeScore, lastStep.awayScore,
      allEvents, report, homeLineup, awayLineup, overtimeResult, penaltyResult,
      fixture.attendance,
    )
    advance(true)
  }, [matchDone]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (matchDone) return
    requestAnimationFrame(() => {
      feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [currentStep, matchDone])

  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return
    const step = steps[currentStep]
    const prevHome = prevHomeScore.current
    const prevAway = prevAwayScore.current
    prevHomeScore.current = step.homeScore
    prevAwayScore.current = step.awayScore

    const managedIsHomeForSound = fixture?.homeClubId === game?.managedClubId
    if (step.homeScore > prevHome) {
      setHomeScoreFlash(true)
      setTimeout(() => setHomeScoreFlash(false), 2000)
      playSound('goal')
      if (managedIsHomeForSound) playSound('goalHit')
    }
    if (step.awayScore > prevAway) {
      setAwayScoreFlash(true)
      setTimeout(() => setAwayScoreFlash(false), 2000)
      playSound('goal')
      if (!managedIsHomeForSound) playSound('goalHit')
    }

    if (step.homeScore === prevHomeScore.current && step.awayScore === prevAwayScore.current) {
      const hasRedCard = step.events.some(e => e.type === MatchEventType.RedCard)
      const hasYellow = step.events.some(e => e.type === MatchEventType.YellowCard)
      const hasSave = step.events.some(e => e.type === MatchEventType.Save)
      const hasCorner = step.events.some(e => e.type === MatchEventType.Corner)
      if (hasRedCard || hasYellow) playSound('card')
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
        // Always stop and show halftime modal — turn off FF so second half plays at normal speed
        setIsFastForward(false)
        setShowHalftime(true)
        return
      }
      // Second half already generated — fall through and continue stepping
    }

    // Interactive corner — pause and show UI (skip in commentary mode)
    if (step.cornerInteractionData && !isFastForward && !activeCorner && !isCommentaryMode) {
      setActiveCorner(step.cornerInteractionData)
      setCornerOutcome(null)
      return
    }

    // Interactive penalty — pause and show UI (skip in commentary mode)
    if (step.penaltyInteractionData && !isFastForward && !activePenalty && !isCommentaryMode) {
      setActivePenalty(step.penaltyInteractionData)
      setPenaltyOutcome(null)
      return
    }

    // Counter-attack interaction — pause and show UI (skip in commentary mode)
    if (step.counterInteractionData && !isFastForward && !activeCounter && !isCommentaryMode) {
      setActiveCounter(step.counterInteractionData)
      setCounterOutcome(null)
      return
    }

    // Free kick interaction — pause and show UI (skip in commentary mode)
    if (step.freeKickInteractionData && !isFastForward && !activeFreeKick && !isCommentaryMode) {
      setActiveFreeKick(step.freeKickInteractionData)
      setFreeKickOutcome(null)
      return
    }

    // Last-minute press — pause once when triggered (skip in commentary mode)
    if (step.lastMinutePressData && !isFastForward && !activeLastMinutePress && !lastMinutePressResolved.current && !isCommentaryMode) {
      setActiveLastMinutePress(step.lastMinutePressData)
      return
    }

    if (step.phase === 'overtime' && prevPhase.current !== 'overtime' && !isFastForward) {
      prevPhase.current = 'overtime'
      setShowOvertimeOverlay(true)
      return // wait for user to click "Spela förlängning"
    }
    if (step.phase === 'overtime') prevPhase.current = 'overtime'

    if (step.phase === 'penalties' && prevPhase.current !== 'penalties' && !isFastForward) {
      prevPhase.current = 'penalties'
      setShowPenaltiesOverlay(true)
      return // wait for user to click "Påbörja straffläggning"
    }
    if (step.phase === 'penalties') prevPhase.current = 'penalties'

    // Sprint C pacing: goal = long pause, save = medium, late game = faster
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
        setCurrentStep(prev => prev + 1)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [currentStep, isPaused, isFastForward, steps])

  function handleCornerChoice(zone: CornerZone, delivery: CornerDelivery) {
    if (!activeCorner || !game || !fixture) return

    const managedIsHome = fixture.homeClubId === game.managedClubId
    const allPlayers = game.players
    const attackers = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.homeClubId)
      : allPlayers.filter(p => p.clubId === fixture.awayClubId)
    const defenders = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.awayClubId)
      : allPlayers.filter(p => p.clubId === fixture.homeClubId)

    const cornerTaker = attackers.find(p => p.id === activeCorner.cornerTakerId) ?? attackers[0]
    const rushers = activeCorner.rusherIds.map(id => attackers.find(p => p.id === id)).filter(Boolean) as typeof attackers
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
      activeCorner.opponentPenaltyKill,
      activeCorner.isHome,
      sgMood,
      rand,
    )

    setCornerOutcome(outcome)

    const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
    const minute = activeCorner.minute

    setSteps(prev => prev.map((s, idx) => {
      if (idx < currentStep) return s
      if (idx === currentStep) {
        const event = outcome.type === 'goal'
          ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: outcome.scorerId,
              description: outcome.description, isCorner: true }
          : { type: MatchEventType.Save, minute, clubId: managedClubId,
              description: outcome.description }
        return { ...s, events: [...s.events, event as MatchStep['events'][0]],
          commentary: outcome.description, commentaryType: (outcome.type === 'goal' ? 'goal' : 'situation') as MatchStep['commentaryType'] }
      }
      if (outcome.type === 'goal') {
        return managedIsHome ? { ...s, homeScore: s.homeScore + 1 } : { ...s, awayScore: s.awayScore + 1 }
      }
      return s
    }))

    if (outcome.type === 'goal') {
      playSound('goal')
      playSound('goalHit')
      if (managedIsHome) {
        setHomeScoreFlash(true)
        setTimeout(() => setHomeScoreFlash(false), 2000)
      } else {
        setAwayScoreFlash(true)
        setTimeout(() => setAwayScoreFlash(false), 2000)
      }
    }

    // After 1.5s, clear corner state and advance step
    setTimeout(() => {
      setActiveCorner(null)
      setCornerOutcome(null)
      setCurrentStep(prev => prev + 1)
    }, 1500)
  }

  function handlePenaltyChoice(dir: PenaltyDirection, height: PenaltyHeight) {
    if (!activePenalty || !fixture || !game) return

    const managedIsHome = fixture.homeClubId === game.managedClubId
    const rand = mulberry32(Date.now())
    const keeperDive = resolveAIPenaltyKeeperDive('offensive', rand)
    const outcome = resolvePenalty(activePenalty, dir, height, keeperDive, rand)
    setPenaltyOutcome(outcome)

    const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
    const oppClubId = managedIsHome ? fixture.awayClubId : fixture.homeClubId
    const shooterId = activePenalty.shooterId
    const shooterLast = activePenalty.shooterName.split(' ').slice(-1)[0]
    const keeperLast = activePenalty.keeperName.split(' ').slice(-1)[0]
    const minute = activePenalty.minute

    setSteps(prev => prev.map((s, idx) => {
      if (idx < currentStep) return s
      if (idx === currentStep) {
        const event = outcome.type === 'goal'
          ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: shooterId,
              description: `Straffmål av ${shooterLast}.`, isPenalty: true }
          : outcome.type === 'save'
          ? { type: MatchEventType.Save, minute, clubId: oppClubId,
              description: `Straffräddning! ${keeperLast} läser skottet.` }
          : { type: MatchEventType.Save, minute, clubId: managedClubId,
              description: `Straffen utanför! ${shooterLast} missade målet.` }
        return { ...s, events: [...s.events, event as MatchStep['events'][0]],
          commentary: event.description, commentaryType: (outcome.type === 'goal' ? 'goal' : 'critical') as MatchStep['commentaryType'] }
      }
      if (outcome.type === 'goal') {
        return managedIsHome ? { ...s, homeScore: s.homeScore + 1 } : { ...s, awayScore: s.awayScore + 1 }
      }
      return s
    }))

    if (outcome.type === 'goal') {
      playSound('goal')
      playSound('goalHit')
      if (managedIsHome) {
        setHomeScoreFlash(true)
        setTimeout(() => setHomeScoreFlash(false), 2000)
      } else {
        setAwayScoreFlash(true)
        setTimeout(() => setAwayScoreFlash(false), 2000)
      }
    }

    setTimeout(() => {
      setActivePenalty(null)
      setPenaltyOutcome(null)
      setCurrentStep(prev => prev + 1)
    }, 1500)
  }

  function handleCounterChoice(choice: CounterChoice) {
    if (!activeCounter || !fixture || !game) return
    const managedIsHome = fixture.homeClubId === game.managedClubId
    const allPlayers = game.players
    const attackers = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.homeClubId)
      : allPlayers.filter(p => p.clubId === fixture.awayClubId)
    const defenders = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.awayClubId)
      : allPlayers.filter(p => p.clubId === fixture.homeClubId)

    const runner = attackers.find(p => p.id === activeCounter.runnerId) ?? attackers[0]
    const support = attackers.find(p => p.id === activeCounter.supportId) ?? attackers[1]
    const gk = defenders.find(p => p.position === PlayerPosition.Goalkeeper)

    const rand = mulberry32(Date.now())
    const outcome = resolveCounter(choice, runner, support, gk, rand)
    setCounterOutcome(outcome)

    const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
    const minute = activeCounter.minute

    setSteps(prev => prev.map((s, idx) => {
      if (idx < currentStep) return s
      if (idx === currentStep) {
        const event = outcome.type === 'goal'
          ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: outcome.scorerId,
              description: outcome.description }
          : { type: MatchEventType.Save, minute, clubId: managedClubId,
              description: outcome.description }
        return { ...s, events: [...s.events, event as MatchStep['events'][0]],
          commentary: outcome.description, commentaryType: (outcome.type === 'goal' ? 'goal' : 'situation') as MatchStep['commentaryType'] }
      }
      if (outcome.type === 'goal') {
        return managedIsHome ? { ...s, homeScore: s.homeScore + 1 } : { ...s, awayScore: s.awayScore + 1 }
      }
      return s
    }))

    if (outcome.type === 'goal') {
      playSound('goal')
      playSound('goalHit')
      if (managedIsHome) { setHomeScoreFlash(true); setTimeout(() => setHomeScoreFlash(false), 2000) }
      else { setAwayScoreFlash(true); setTimeout(() => setAwayScoreFlash(false), 2000) }
    }

    setTimeout(() => {
      setActiveCounter(null)
      setCounterOutcome(null)
      setCurrentStep(prev => prev + 1)
    }, 1500)
  }

  function handleFreeKickChoice(choice: FreeKickChoice) {
    if (!activeFreeKick || !fixture || !game) return
    const managedIsHome = fixture.homeClubId === game.managedClubId
    const allPlayers = game.players
    const defenders = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.awayClubId)
      : allPlayers.filter(p => p.clubId === fixture.homeClubId)
    const attackers = managedIsHome
      ? allPlayers.filter(p => p.clubId === fixture.homeClubId)
      : allPlayers.filter(p => p.clubId === fixture.awayClubId)

    const kicker = attackers.find(p => p.id === activeFreeKick.kickerId) ?? attackers[0]
    const gk = defenders.find(p => p.position === PlayerPosition.Goalkeeper)

    const rand = mulberry32(Date.now())
    const outcome = resolveFreeKick(choice, kicker, gk, activeFreeKick, rand)
    setFreeKickOutcome(outcome)

    const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
    const minute = activeFreeKick.minute

    setSteps(prev => prev.map((s, idx) => {
      if (idx < currentStep) return s
      if (idx === currentStep) {
        const event = outcome.type === 'goal'
          ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: activeFreeKick.kickerId,
              description: outcome.description }
          : { type: MatchEventType.Save, minute, clubId: managedClubId,
              description: outcome.description }
        return { ...s, events: [...s.events, event as MatchStep['events'][0]],
          commentary: outcome.description, commentaryType: (outcome.type === 'goal' ? 'goal' : 'situation') as MatchStep['commentaryType'] }
      }
      if (outcome.type === 'goal') {
        return managedIsHome ? { ...s, homeScore: s.homeScore + 1 } : { ...s, awayScore: s.awayScore + 1 }
      }
      return s
    }))

    if (outcome.type === 'goal') {
      playSound('goal')
      playSound('goalHit')
      if (managedIsHome) { setHomeScoreFlash(true); setTimeout(() => setHomeScoreFlash(false), 2000) }
      else { setAwayScoreFlash(true); setTimeout(() => setAwayScoreFlash(false), 2000) }
    }

    setTimeout(() => {
      setActiveFreeKick(null)
      setFreeKickOutcome(null)
      setCurrentStep(prev => prev + 1)
    }, 1500)
  }

  function handleLastMinutePressChoice(_choice: PressChoice) {
    // The modifiers are applied in matchStepByStep — here we just dismiss the UI and continue
    lastMinutePressResolved.current = true
    setActiveLastMinutePress(null)
    setCurrentStep(prev => prev + 1)
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

    // Apply halftime choice boost to managed club players
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
    setTacticChanged(true)
    setShowHalftime(false)
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

    // Inject tactic commentary as a synthetic step at current position
    const commentStep: MatchStep = {
      ...currentMatchStep,
      step: currentStep,
      events: [],
      commentary: commentText,
      commentaryType: 'tactical',
    }

    const kept = steps.slice(0, currentStep)
    console.log('[applyQuickTactic] steps before:', steps.length, 'currentStep:', currentStep)
    console.log('[applyQuickTactic] kept:', kept.length, 'commentStep.homeScore:', commentStep.homeScore, 'newRemainder:', newRemainder.length)
    console.log('[applyQuickTactic] first newRemainder step:', newRemainder[0])
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
  const currentMinute = currentMatchStep?.minute ?? 0
  const homeScore = currentMatchStep?.homeScore ?? 0
  const awayScore = currentMatchStep?.awayScore ?? 0

  const homeClub = fixture ? game?.clubs.find(c => c.id === fixture.homeClubId) : undefined
  const awayClub = fixture ? game?.clubs.find(c => c.id === fixture.awayClubId) : undefined
  const homeShort = (homeClub?.shortName ?? homeClubName).substring(0, 6)
  const awayShort = (awayClub?.shortName ?? awayClubName).substring(0, 6)

  function handleLiveSub(outId: string, inId: string) {
    setLiveSubs(prev => [...prev, { outId, inId, minute: currentMinute }])
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

      <Scoreboard
        homeShort={homeShort}
        awayShort={awayShort}
        homeScore={homeScore}
        awayScore={awayScore}
        homeScoreFlash={homeScoreFlash}
        awayScoreFlash={awayScoreFlash}
        currentMinute={currentMinute}
        matchDone={matchDone}
        rivalry={rivalry}
        matchWeather={matchWeather}
        currentMatchStep={currentMatchStep}
        displayedSteps={displayedSteps}
        fixture={fixture}
        game={game}
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

      {game && !(game.dismissedHints ?? []).includes('matchLive') && (
        <FirstVisitHint
          screenId="matchLive"
          text="Matchen rullar automatiskt. Vid hörnor får du välja — titta efter hörn-kortet i feeden."
          onDismiss={() => useGameStore.getState().dismissHint('matchLive')}
        />
      )}

      <CommentaryFeed
        displayedSteps={displayedSteps}
        currentMatchStep={currentMatchStep}
        matchWeather={matchWeather}
        liveSubs={liveSubs}
        fixture={fixture}
        game={game}
        feedRef={feedRef}
        matchDone={matchDone && !isSmFinal && !isCupFinal}
        managedIsHome={managedIsHomeForSubs}
        onNavigateToReview={() => navigate('/game/review', { replace: true })}
        cornerNode={
          activeCorner ? (
            <CornerInteraction
              data={activeCorner}
              outcome={cornerOutcome}
              onChoose={handleCornerChoice}
            />
          ) : activePenalty ? (
            <PenaltyInteraction
              data={activePenalty}
              outcome={penaltyOutcome}
              onChoose={handlePenaltyChoice}
            />
          ) : activeCounter ? (
            <CounterInteraction
              data={activeCounter}
              outcome={counterOutcome}
              onChoose={handleCounterChoice}
            />
          ) : activeFreeKick ? (
            <FreeKickInteraction
              data={activeFreeKick}
              outcome={freeKickOutcome}
              onChoose={handleFreeKickChoice}
            />
          ) : activeLastMinutePress ? (
            <LastMinutePress
              data={activeLastMinutePress}
              onChoose={handleLastMinutePressChoice}
            />
          ) : undefined
        }
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
          onContinue={() => { setShowHalftime(false); setCurrentStep(prev => prev + 1) }}
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
