import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { simulateMatchStepByStep, simulateSecondHalf, type MatchStep } from '../../domain/services/matchSimulator'
import type { Tactic } from '../../domain/entities/Club'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { MatchEventType, WeatherCondition, IceQuality, TacticMentality, TacticTempo, TacticPress } from '../../domain/enums'
import { getWeatherEmoji, getIceQualityLabel } from '../../domain/services/weatherService'
import { getRivalry } from '../../domain/data/rivalries'
import { eventIcon } from '../utils/formatters'
import { getEventAlignment } from './matchLiveHelpers'
import { computePlayerRatings } from '../utils/matchRatings'
import { playSound, isMuted, toggleMute } from '../audio/soundEffects'
import { SnowOverlay } from '../components/match/SnowOverlay'
import { PhaseOverlay } from '../components/match/PhaseOverlay'
import { FinalIntroScreen } from '../components/match/FinalIntroScreen'
import { HalftimeModal } from '../components/match/HalftimeModal'
import { StatsFooter, calculateLiveStats } from '../components/match/StatsFooter'
import { MomentumBar } from '../components/match/MomentumBar'
import { MatchDoneOverlay, type PressQuestion } from '../components/match/MatchDoneOverlay'
import { CeremonyCupFinal } from '../components/match/CeremonyCupFinal'
import { CeremonySmFinal } from '../components/match/CeremonySmFinal'
import { SubstitutionModal } from '../components/match/SubstitutionModal'
import { generatePressConference } from '../../domain/services/pressConferenceService'
import { mulberry32 } from '../../domain/utils/random'

interface LocationState {
  fixture: Fixture
  homeLineup: TeamSelection
  awayLineup: TeamSelection
  homeClubName: string
  awayClubName: string
  isManaged: boolean
  matchWeather?: MatchWeather
}

export function MatchLiveScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { game, saveLiveMatchResult, applyPressChoice, advance } = useGameStore()

  const state = location.state as LocationState | null
  const fixture = state?.fixture
  const homeLineup = state?.homeLineup
  const awayLineup = state?.awayLineup
  const homeClubName = state?.homeClubName ?? ''
  const awayClubName = state?.awayClubName ?? ''
  const matchWeather = state?.matchWeather ?? (
    fixture ? (game?.matchWeathers ?? []).find(mw => mw.fixtureId === fixture.id) : undefined
  )

  const rivalry = fixture ? getRivalry(fixture.homeClubId, fixture.awayClubId) : null
  const isSmFinal = fixture?.isNeutralVenue === true

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
  const [htSubs, setHtSubs] = useState<{ outId: string; inId: string }[]>([])
  const [liveSubs, setLiveSubs] = useState<{ outId: string; inId: string; minute: number }[]>([])
  const [showSubModal, setShowSubModal] = useState(false)
  const [ceremonySlide, setCeremonySlide] = useState(0)
  const [finalIntroSlide, setFinalIntroSlide] = useState(() => isSmFinal ? 1 : isCupFinal ? 1 : 0)
  const [pressQuestion, setPressQuestion] = useState<PressQuestion | null>(null)
  const [homeScoreFlash, setHomeScoreFlash] = useState(false)
  const [awayScoreFlash, setAwayScoreFlash] = useState(false)
  const prevHomeScore = useRef(0)
  const prevAwayScore = useRef(0)

  const feedRef = useRef<HTMLDivElement>(null)
  const hasSimulated = useRef(false)

  // Bug 3: If fixture already completed (browser back), redirect away
  useEffect(() => {
    if (!fixture || !game) return
    const liveFixture = game.fixtures.find(f => f.id === fixture.id)
    if (liveFixture?.status === 'completed') {
      navigate('/game', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-generate all steps on mount
  useEffect(() => {
    if (hasSimulated.current) return
    if (!fixture || !homeLineup || !awayLineup || !game) return
    hasSimulated.current = true

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
    const gen = simulateMatchStepByStep({
      fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : 0.05,
      seed: Date.now(),
      weather: matchWeather?.weather,
      homeClubName: homeClubName || undefined,
      awayClubName: awayClubName || undefined,
      rivalry: rivalry ?? undefined,
      storylines: game.storylines?.map(s => ({ playerId: s.playerId, type: s.type, displayText: s.displayText })),
    })
    const allSteps: MatchStep[] = []
    for (const step of gen) allSteps.push(step)
    setSteps(allSteps)
    if (!isSmFinal && !isCupFinal) {
      setCurrentStep(0)
    }
    // For finals: currentStep stays -1 until FinalIntroScreen onStart fires
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance ceremony slide 1 → 2 after 3s
  useEffect(() => {
    if (ceremonySlide !== 1) return
    const timer = setTimeout(() => setCeremonySlide(2), 3000)
    return () => clearTimeout(timer)
  }, [ceremonySlide])

  // Champagne sound on ceremony slide 2 win
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

  // Save live match result when done
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

    // Generate press conference question for normal matches (not finals — they have ceremony)
    if (!isSmFinal && !isCupFinal && game) {
      const completedFixture = { ...fixture, homeScore: lastStep.homeScore, awayScore: lastStep.awayScore, status: 'completed' as const }
      const pressSeed = fixture.id.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0)
      const pressRand = mulberry32(pressSeed + (game.currentSeason ?? 2025) * 17)
      const pressEvent = generatePressConference(completedFixture as typeof fixture, game, pressRand)
      if (pressEvent) {
        const journalist = pressEvent.title.replace('🎤 Presskonferens — ', '')
        const question = pressEvent.body.replace(/^"|"$/g, '')
        setPressQuestion({
          journalist,
          question,
          choices: pressEvent.choices.map(c => ({
            id: c.id,
            label: c.label,
            moraleEffect: (c.effect as { value: number }).value ?? 0,
            mediaQuote: (c.effect as { mediaQuote?: string }).mediaQuote ?? '',
          })),
        })
      }
    }

    // Always run advance — finals need economy/injuries/events too
    advance(true) // suppressMatchNavigation — we handle navigation ourselves
  }, [matchDone]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll feed
  useEffect(() => {
    requestAnimationFrame(() => {
      feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [currentStep])

  // Score flash + event sounds
  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return
    const step = steps[currentStep]

    const prevHome = prevHomeScore.current
    const prevAway = prevAwayScore.current
    prevHomeScore.current = step.homeScore
    prevAwayScore.current = step.awayScore

    if (step.homeScore > prevHome) {
      setHomeScoreFlash(true)
      setTimeout(() => setHomeScoreFlash(false), 2000)
      playSound('goal')
    }
    if (step.awayScore > prevAway) {
      setAwayScoreFlash(true)
      setTimeout(() => setAwayScoreFlash(false), 2000)
      playSound('goal')
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

    if (step.step === 30) playSound('whistle')
    if (step.step === 60) playSound('whistle')
    if (step.phase === 'overtime' && step.step === 61) playSound('overtime')

    if (step.phase === 'penalties' && step.penaltyRound) {
      if (step.penaltyRound.homeScored || step.penaltyRound.awayScored) {
        playSound('penaltyScore')
      } else {
        playSound('penaltyMiss')
      }
    }
  }, [currentStep, steps])

  // Playback loop
  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return
    if (isPaused && !isFastForward) return

    const step = steps[currentStep]

    if (step.step === 30 && !isFastForward) {
      setShowHalftime(true)
      return
    }

    if (step.phase === 'overtime' && prevPhase.current !== 'overtime' && !isFastForward) {
      prevPhase.current = 'overtime'
      setShowOvertimeOverlay(true)
      const timer = setTimeout(() => setShowOvertimeOverlay(false), 3000)
      return () => clearTimeout(timer)
    }
    if (step.phase === 'overtime') prevPhase.current = 'overtime'

    if (step.phase === 'penalties' && prevPhase.current !== 'penalties' && !isFastForward) {
      prevPhase.current = 'penalties'
      setShowPenaltiesOverlay(true)
      const timer = setTimeout(() => setShowPenaltiesOverlay(false), 3000)
      return () => clearTimeout(timer)
    }
    if (step.phase === 'penalties') prevPhase.current = 'penalties'

    const delay = isFastForward
      ? 50
      : step.phase === 'penalties'
      ? 2000
      : step.intensity === 'high'
      ? 2200
      : step.intensity === 'medium'
      ? 1200
      : 1400

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

  // Avbryt removed — once match starts, you're committed

  function handleSeeReport() {
    navigate('/game/match', { state: { showReport: true }, replace: true })
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

    // Apply substitutions to managed team's lineup
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
    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
    const gen = simulateSecondHalf({
      fixture, homeLineup: updatedHome, awayLineup: updatedAway,
      homePlayers, awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : 0.05,
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

  if (!fixture || !homeLineup || !awayLineup) {
    return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Ingen matchdata tillgänglig.</div>
  }

  // SM-final pre-match intro
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

  // Cup final pre-match intro
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

  // NOTE: Live substitutions don't affect the pre-computed match simulation outcome,
  // but are stored and shown in the commentary feed.
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
      {/* LED Scoreboard */}
      <div style={{
        background: 'var(--led-bg)',
        borderRadius: 8,
        border: '3px solid var(--led-border)',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
        padding: '12px 16px',
        margin: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
      }}>
        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontFamily: 'Courier New, monospace', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: '1.5px', margin: '0 0 2px', textTransform: 'uppercase' }}>
              {homeShort} <span style={{ color: 'var(--led-time)', fontSize: 12, fontWeight: 700 }}>H</span>
            </p>
            <span
              key={`home-${homeScore}`}
              style={{
                display: 'block',
                fontFamily: 'Courier New, monospace', fontWeight: 900, fontSize: 56,
                color: homeScoreFlash ? 'var(--led-score-flash)' : 'var(--led-score)',
                textShadow: homeScoreFlash
                  ? '0 0 20px rgba(255,153,0,0.8), 0 0 40px rgba(255,153,0,0.4)'
                  : '0 0 10px rgba(255,26,26,0.6), 0 0 20px rgba(255,26,26,0.3)',
                lineHeight: 1, letterSpacing: '4px',
                transition: 'color 0.3s ease, text-shadow 0.3s ease',
                animation: homeScoreFlash ? 'scaleFlash 400ms ease-out both' : undefined,
              }}
            >
              {homeScore}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--led-score)', fontSize: 28, fontWeight: 900, opacity: 0.7, fontFamily: 'Courier New, monospace', lineHeight: 1 }}>–</span>
            <span style={{
              fontFamily: 'Courier New, monospace', fontWeight: 700, fontSize: 22,
              color: 'var(--led-time)',
              textShadow: '0 0 8px rgba(204,255,0,0.5)',
              lineHeight: 1,
            }}>
              {matchDone ? 'FT' : `${currentMinute}'`}
            </span>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontFamily: 'Courier New, monospace', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: '1.5px', margin: '0 0 2px', textTransform: 'uppercase' }}>
              <span style={{ color: 'var(--led-time)', fontSize: 12, fontWeight: 700 }}>G</span> {awayShort}
            </p>
            <span
              key={`away-${awayScore}`}
              style={{
                display: 'block',
                fontFamily: 'Courier New, monospace', fontWeight: 900, fontSize: 56,
                color: awayScoreFlash ? 'var(--led-score-flash)' : 'var(--led-score)',
                textShadow: awayScoreFlash
                  ? '0 0 20px rgba(255,153,0,0.8), 0 0 40px rgba(255,153,0,0.4)'
                  : '0 0 10px rgba(255,26,26,0.6), 0 0 20px rgba(255,26,26,0.3)',
                lineHeight: 1, letterSpacing: '4px',
                transition: 'color 0.3s ease, text-shadow 0.3s ease',
                animation: awayScoreFlash ? 'scaleFlash 400ms ease-out both' : undefined,
              }}
            >
              {awayScore}
            </span>
          </div>
        </div>
        {rivalry && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
            borderRadius: 99, background: 'rgba(220,50,30,0.2)',
            border: '1px solid rgba(220,100,30,0.4)', fontSize: 10, fontWeight: 700, color: 'var(--led-warn)',
          }}>
            🔥 {rivalry.name}
          </div>
        )}
        {matchWeather && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: 'Courier New, monospace' }}>
            {getWeatherEmoji(matchWeather.weather.condition)}{' '}
            {matchWeather.weather.temperature > 0 ? '+' : ''}{matchWeather.weather.temperature}°
            {' · '}
            <span style={{ color: matchWeather.weather.iceQuality === IceQuality.Poor ? 'var(--led-warn)' : 'inherit' }}>
              {getIceQualityLabel(matchWeather.weather.iceQuality)}
            </span>
            {matchWeather.weather.temperature <= -15 && ' ❄'}
          </p>
        )}

        {/* Suspensions — inside scoreboard like a real bandy board */}
        {(() => {
          const hasSusp = currentMatchStep &&
            (currentMatchStep.activeSuspensions.homeCount > 0 ||
             currentMatchStep.activeSuspensions.awayCount > 0)
          if (!currentMatchStep) return null
          const allEventsSoFar = displayedSteps.flatMap(s => s.events)
          const currentMin = currentMatchStep.minute
          const homeSusp = allEventsSoFar
            .filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.homeClubId && currentMin - e.minute < 10)
            .map(e => {
              const p = e.playerId ? (game?.players ?? []).find(pl => pl.id === e.playerId) : null
              const remaining = 10 - (currentMin - e.minute)
              return p?.shirtNumber != null ? `#${p.shirtNumber} (${remaining}\u2032)` : '?'
            })
          const awaySusp = allEventsSoFar
            .filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.awayClubId && currentMin - e.minute < 10)
            .map(e => {
              const p = e.playerId ? (game?.players ?? []).find(pl => pl.id === e.playerId) : null
              const remaining = 10 - (currentMin - e.minute)
              return p?.shirtNumber != null ? `#${p.shirtNumber} (${remaining}\u2032)` : '?'
            })
          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
              width: '100%', padding: '4px 0 0',
              fontSize: 11, fontWeight: 700, fontFamily: 'Courier New, monospace',
              color: 'var(--led-warn)',
              minHeight: 20,
              opacity: hasSusp ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}>
              {/* Same 3-column layout as score row: home | center | away */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                {homeSusp.length > 0 && <span>⚠ {homeSusp.join(' ')}</span>}
              </div>
              <div style={{ width: 60, flexShrink: 0 }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                {awaySusp.length > 0 && <span>{awaySusp.join(' ')} ⚠</span>}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Match controls container */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 16px',
      }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 'auto' }}>
          🏛️ Match
        </span>
        <button
          onClick={() => setIsPaused(prev => !prev)}
          className="btn btn-ghost"
          style={{ padding: '6px 12px', fontSize: 14 }}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button
          onClick={() => setIsFastForward(prev => !prev)}
          className={`btn ${isFastForward ? 'btn-copper' : 'btn-ghost'}`}
          style={{ padding: '6px 12px', fontSize: 14 }}
        >
          ⏩
        </button>
        {!matchDone && (
          <button
            onClick={() => { setIsPaused(true); setShowSubModal(true) }}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: 14 }}
          >
            🔄
          </button>
        )}
        <button
          onClick={() => { toggleMute(); setMuted(isMuted()) }}
          className="btn btn-ghost"
          style={{ padding: '6px 10px', fontSize: 14 }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Momentum bar (replaces old intensity bar) */}
      {currentMatchStep && (
        <MomentumBar
          homeActions={currentMatchStep.shotsHome + currentMatchStep.cornersHome}
          awayActions={currentMatchStep.shotsAway + currentMatchStep.cornersAway}
          intensity={currentMatchStep.intensity}
        />
      )}

      {/* Live stats */}
      {currentMatchStep && (
        <StatsFooter stats={calculateLiveStats(currentMatchStep)} />
      )}

      </div>{/* end match controls container */}

      {/* Commentary feed */}
      <div
        ref={feedRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '8px 0', position: 'relative',
          background: (() => {
            if (!currentMatchStep) return undefined
            const step = currentMatchStep
            const hasSusp = step.activeSuspensions.homeCount > 0 || step.activeSuspensions.awayCount > 0
            if (hasSusp) return 'rgba(176,80,64,0.03)'
            const isLateAndTight = step.minute >= 55 && Math.abs(step.homeScore - step.awayScore) <= 1
            if (isLateAndTight) return 'rgba(196,122,58,0.04)'
            // Recent momentum from shots
            const recentSteps = displayedSteps.slice(-5)
            const recentHomeShots = recentSteps.length > 1
              ? (recentSteps[recentSteps.length - 1]?.shotsHome ?? 0) - (recentSteps[0]?.shotsHome ?? 0)
              : 0
            const recentAwayShots = recentSteps.length > 1
              ? (recentSteps[recentSteps.length - 1]?.shotsAway ?? 0) - (recentSteps[0]?.shotsAway ?? 0)
              : 0
            if (recentHomeShots >= 3 && recentAwayShots === 0) return 'rgba(196,122,58,0.03)'
            if (recentAwayShots >= 3 && recentHomeShots === 0) return 'rgba(126,179,212,0.03)'
            // Weather override
            if (matchWeather?.weather.condition === WeatherCondition.Fog) return 'linear-gradient(to bottom, rgba(200,210,220,0.04), transparent)'
            if (matchWeather?.weather.condition === WeatherCondition.Thaw) return 'rgba(100,130,160,0.03)'
            return undefined
          })(),
          transition: 'background 2s ease',
        }}
      >
        {matchWeather?.weather.condition === WeatherCondition.HeavySnow && <SnowOverlay />}
        {[...displayedSteps].reverse().flatMap((s, idx) => {
          const hasGoal = s.events.some(e => e.type === MatchEventType.Goal)
          const hasSuspension = s.events.some(e => e.type === MatchEventType.RedCard)
          const hasCorner = s.events.some(e => e.type === MatchEventType.Corner) && !hasGoal
          const hasYellow = s.events.some(e => e.type === MatchEventType.YellowCard)
          const isDerby = s.isDerbyComment || s.commentary.toLowerCase().includes('derby')
          const hasCornerGoal = s.events.some(e => e.type === MatchEventType.Goal && e.isCornerGoal)

          let borderLeft = 'none'
          let background = 'transparent'
          let fontSize = 13
          let fontWeight: number | string = 400
          let color = 'var(--text-secondary)'
          let paddingLeft = 16
          let boxShadow: string | undefined = undefined

          if (hasGoal) {
            background = 'rgba(196, 122, 58, 0.12)'
            borderLeft = '3px solid var(--accent)'
            fontSize = 14
            fontWeight = 600
            color = 'var(--accent)'
            paddingLeft = 12
            boxShadow = 'inset 3px 0 0 var(--accent)'
          } else if (hasSuspension) {
            borderLeft = '3px solid var(--danger)'
            color = 'var(--danger)'
            fontWeight = 500
          } else if (hasYellow) {
            borderLeft = '3px solid var(--warning)'
            color = 'var(--text-primary)'
          } else if (hasCorner) {
            borderLeft = '3px solid rgba(196,122,58,0.4)'
            color = 'var(--text-primary)'
            fontWeight = 500
          } else if (isDerby) {
            borderLeft = '3px solid rgba(220,80,30,0.7)'
            paddingLeft = 8
          }

          const primaryEvent = s.events.find(e =>
            e.type === MatchEventType.Goal || e.type === MatchEventType.RedCard ||
            e.type === MatchEventType.YellowCard || e.type === MatchEventType.Save ||
            e.type === MatchEventType.Corner
          )
          const icon = primaryEvent ? eventIcon(primaryEvent.type) : ''

          // Bug 0.6: Side-align events by team (home=left, away=right)
          // Goals AND suspensions (RedCard) are sided
          const sidedEvent = s.events.find(e =>
            (e.type === MatchEventType.Goal || e.type === MatchEventType.RedCard) && e.clubId
          )
          const isAwayEvent = sidedEvent ? getEventAlignment(sidedEvent.clubId, fixture.homeClubId) === 'away' : false

          const rows: React.ReactNode[] = [
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'flex-start',
                flexDirection: isAwayEvent ? 'row-reverse' : 'row',
                padding: `8px 16px 8px ${paddingLeft}px`,
                borderLeft: isAwayEvent ? 'none' : borderLeft,
                borderRight: isAwayEvent ? borderLeft : 'none',
                background, gap: 8,
                animation: 'fadeInUp 250ms ease-out both',
                boxShadow: isAwayEvent ? (boxShadow ? boxShadow.replace('inset 3px', 'inset -3px') : undefined) : boxShadow,
                textAlign: isAwayEvent ? 'right' : 'left',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28, paddingTop: 1, flexShrink: 0 }}>
                {s.minute}'
              </span>
              {icon && <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>}
              <span style={{ fontSize, fontWeight, color, lineHeight: 1.4 }}>
                {hasCornerGoal ? `📐 HÖRNMÅL! ${s.commentary}` : s.commentary}
              </span>
            </div>
          ]

          // Halftime substitution events (from matchStepByStep, at minute 45)
          s.events.filter(e => e.type === MatchEventType.Substitution).forEach((e, si) => {
            rows.push(
              <div
                key={`htsub-${idx}-${si}`}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '6px 16px', gap: 8,
                  borderLeft: '3px solid rgba(196,122,58,0.35)',
                  animation: 'fadeInUp 250ms ease-out both',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28, flexShrink: 0 }}>{e.minute}'</span>
                <span style={{ fontSize: 14, flexShrink: 0 }}>🔄</span>
                <span style={{ fontSize: 13, color: 'var(--accent)' }}>{e.description.replace('🔄 ', '')}</span>
              </div>
            )
          })

          // Live substitutions made at this step's minute
          liveSubs.filter(ls => ls.minute === s.minute).forEach((ls, si) => {
            const inPlayer = game?.players.find(p => p.id === ls.inId)
            const outPlayer = game?.players.find(p => p.id === ls.outId)
            const inName = inPlayer ? `${inPlayer.firstName} ${inPlayer.lastName}` : '?'
            const outName = outPlayer ? `${outPlayer.firstName} ${outPlayer.lastName}` : '?'
            rows.push(
              <div
                key={`livesub-${idx}-${si}`}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '6px 16px', gap: 8,
                  borderLeft: '3px solid rgba(196,122,58,0.35)',
                  animation: 'fadeInUp 250ms ease-out both',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28, flexShrink: 0 }}>{ls.minute}'</span>
                <span style={{ fontSize: 14, flexShrink: 0 }}>🔄</span>
                <span style={{ fontSize: 13, color: 'var(--accent)' }}>{inName} IN för {outName}</span>
              </div>
            )
          })

          return rows
        })}
      </div>

      {/* Halftime modal */}
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
        />
      )}

      {/* Phase overlays */}
      {showOvertimeOverlay && <PhaseOverlay phase="overtime" />}
      {showPenaltiesOverlay && <PhaseOverlay phase="penalties" />}

      {/* Normal match done overlay */}
      {matchDone && !isSmFinal && !isCupFinal && (
        <MatchDoneOverlay
          fixture={fixture}
          homeClubName={homeClubName}
          awayClubName={awayClubName}
          homeScore={homeScore}
          awayScore={awayScore}
          homeLineup={homeLineup}
          awayLineup={awayLineup}
          steps={steps}
          managedClubId={game?.managedClubId}
          players={game?.players ?? []}
          pressQuestion={pressQuestion ?? undefined}
          onSeeReport={handleSeeReport}
          onContinue={() => {
            // advance() already called at matchDone — just navigate to result screen
            navigate('/game/match-result', { replace: true })
          }}
          onPressChoice={(moraleEffect, mediaQuote) => applyPressChoice(moraleEffect, mediaQuote)}
        />
      )}

      {/* Cup final ceremony */}
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

      {/* SM-final ceremony */}
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
