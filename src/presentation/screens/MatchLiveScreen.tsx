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
import { eventIcon, truncate } from '../utils/formatters'
import { computePlayerRatings } from '../utils/matchRatings'
import { playSound, isMuted, toggleMute } from '../audio/soundEffects'
import { SnowOverlay } from '../components/match/SnowOverlay'
import { PhaseOverlay } from '../components/match/PhaseOverlay'
import { FinalIntroScreen } from '../components/match/FinalIntroScreen'
import { HalftimeModal } from '../components/match/HalftimeModal'
import { MatchDoneOverlay } from '../components/match/MatchDoneOverlay'
import { CeremonyCupFinal } from '../components/match/CeremonyCupFinal'
import { CeremonySmFinal } from '../components/match/CeremonySmFinal'

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
  const { game, saveLiveMatchResult } = useGameStore()

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
    const finalMatch = bracket.matches.find(m => m.round === 3)
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

  const [showTacticPanel, setShowTacticPanel] = useState(false)
  const [htMentality, setHtMentality] = useState<TacticMentality | null>(null)
  const [htTempo, setHtTempo] = useState<TacticTempo | null>(null)
  const [htPress, setHtPress] = useState<TacticPress | null>(null)
  const [tacticChanged, setTacticChanged] = useState(false)
  const [htSubs, setHtSubs] = useState<{ outId: string; inId: string }[]>([])
  const [ceremonySlide, setCeremonySlide] = useState(0)
  const [finalIntroSlide, setFinalIntroSlide] = useState(() => isSmFinal ? 1 : isCupFinal ? 1 : 0)
  const [homeScoreFlash, setHomeScoreFlash] = useState(false)
  const [awayScoreFlash, setAwayScoreFlash] = useState(false)
  const prevHomeScore = useRef(0)
  const prevAwayScore = useRef(0)

  const feedRef = useRef<HTMLDivElement>(null)
  const hasSimulated = useRef(false)

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
    })
    const allSteps: MatchStep[] = []
    for (const step of gen) allSteps.push(step)
    setSteps(allSteps)
    setCurrentStep(0)
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
    )
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

    if (step.homeScore > prevHomeScore.current) {
      setHomeScoreFlash(true)
      setTimeout(() => setHomeScoreFlash(false), 2000)
      playSound('goal')
    }
    if (step.awayScore > prevAwayScore.current) {
      setAwayScoreFlash(true)
      setTimeout(() => setAwayScoreFlash(false), 2000)
      playSound('goal')
    }
    prevHomeScore.current = step.homeScore
    prevAwayScore.current = step.awayScore

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

  function handleAbort() {
    if (window.confirm('Avbryt matchen? Resultatet sparas inte.')) navigate(-1)
  }

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
    })
    const firstHalf = steps.slice(0, 31)
    const newSecondHalf: MatchStep[] = []
    for (const s of gen) newSecondHalf.push(s)
    setSteps([...firstHalf, ...newSecondHalf])
    setTacticChanged(true)
    setShowTacticPanel(false)
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
        onStart={() => setFinalIntroSlide(0)}
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
        onStart={() => setFinalIntroSlide(0)}
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

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg)', overflow: 'hidden', position: 'relative',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <button
          onClick={handleAbort}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, padding: '4px 8px' }}
        >
          ← Avbryt
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setIsPaused(prev => !prev)}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '6px 12px', fontSize: 14 }}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            onClick={() => setIsFastForward(prev => !prev)}
            style={{
              background: isFastForward ? 'var(--accent)' : 'var(--bg-elevated)',
              border: '1px solid ' + (isFastForward ? 'var(--accent)' : 'var(--border)'),
              borderRadius: 'var(--radius-sm)',
              color: isFastForward ? '#fff' : 'var(--text-primary)',
              padding: '6px 12px', fontSize: 14,
            }}
          >
            ⏩
          </button>
          <button
            onClick={() => { toggleMute(); setMuted(isMuted()) }}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '6px 10px', fontSize: 14 }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Scoreboard */}
      <div style={{
        background: rivalry
          ? 'linear-gradient(180deg, rgba(200,50,30,0.08) 0%, #0a1520 10%, #122235 100%)'
          : 'linear-gradient(180deg, #0a1520 0%, #122235 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '16px', textAlign: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 120, height: 80, background: 'radial-gradient(ellipse at top left, rgba(180,210,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 80, background: 'radial-gradient(ellipse at top right, rgba(180,210,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 4, position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, textAlign: 'right' }}>
            {truncate(homeClubName, 10)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              key={`home-${homeScore}`}
              style={{
                fontSize: 48, fontWeight: 800, lineHeight: 1,
                color: homeScoreFlash ? 'var(--color-accent)' : 'var(--text-primary)',
                transition: 'color 0.3s ease',
                textShadow: homeScoreFlash ? '0 0 20px var(--color-accent)' : 'none',
                fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"',
                animation: homeScoreFlash ? 'scaleFlash 400ms ease-out both' : undefined,
              }}
            >
              {homeScore}
            </span>
            <span style={{ fontSize: 24, color: 'var(--text-muted)', fontWeight: 300 }}>—</span>
            <span
              key={`away-${awayScore}`}
              style={{
                fontSize: 48, fontWeight: 800, lineHeight: 1,
                color: awayScoreFlash ? 'var(--color-accent)' : 'var(--text-primary)',
                transition: 'color 0.3s ease',
                textShadow: awayScoreFlash ? '0 0 20px var(--color-accent)' : 'none',
                fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"',
                animation: awayScoreFlash ? 'scaleFlash 400ms ease-out both' : undefined,
              }}
            >
              {awayScore}
            </span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>
            {truncate(awayClubName, 10)}
          </span>
        </div>
        {rivalry && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
            borderRadius: 99, background: 'linear-gradient(90deg, rgba(220,50,30,0.2), rgba(201,168,76,0.2))',
            border: '1px solid rgba(220,100,30,0.4)', fontSize: 11, fontWeight: 700, color: '#ff7040',
            marginTop: 6, marginBottom: 4,
          }}>
            🔥 {rivalry.name} {'🔥'.repeat(Math.min(rivalry.intensity ?? 1, 3))}
          </div>
        )}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', margin: '0 auto' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)' }}>
              <circle cx="24" cy="24" r="20" fill="none" stroke="#1e3450" strokeWidth="2"/>
              <circle cx="24" cy="24" r="20" fill="none" stroke="#C9A84C" strokeWidth="2"
                strokeDasharray={`${(currentMinute / 90) * 125.7} 125.7`}
                strokeLinecap="round" transform="rotate(-90 24 24)"
                style={{ transition: 'stroke-dasharray 600ms ease-out' }}
              />
            </svg>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, paddingTop: 4 }}>
              {matchDone ? 'Slutresultat' : `${currentMinute}'`}
            </div>
          </div>
          {rivalry && !matchDone && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ff7040', letterSpacing: '2px', textTransform: 'uppercase', marginLeft: 8 }}>
              DERBY
            </span>
          )}
        </div>
        {matchWeather && (
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {getWeatherEmoji(matchWeather.weather.condition)}{' '}
            {matchWeather.weather.temperature > 0 ? '+' : ''}{matchWeather.weather.temperature}°
            {' · '}
            <span style={{ color: matchWeather.weather.iceQuality === IceQuality.Poor ? 'var(--danger)' : 'inherit' }}>
              {getIceQualityLabel(matchWeather.weather.iceQuality)}
            </span>
            {matchWeather.weather.temperature <= -15 && ' ❄'}
          </div>
        )}
      </div>

      {/* Intensity bar */}
      {currentMatchStep && (
        <div style={{ height: 3, background: '#0d1e33', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: currentMatchStep.intensity === 'high' ? '100%' : currentMatchStep.intensity === 'medium' ? '66%' : '33%',
            background: currentMatchStep.intensity === 'high' ? '#C9A84C' : currentMatchStep.intensity === 'medium' ? '#2563EB' : '#1e3450',
            transition: 'width 600ms ease-out, background-color 600ms ease-out',
            borderRadius: '0 2px 2px 0',
          }} />
        </div>
      )}

      {/* Commentary feed */}
      <div
        ref={feedRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '8px 0', position: 'relative',
          background: matchWeather?.weather.condition === WeatherCondition.Fog
            ? 'linear-gradient(to bottom, rgba(200,210,220,0.04), transparent)'
            : matchWeather?.weather.condition === WeatherCondition.Thaw
            ? 'rgba(100,130,160,0.03)'
            : undefined,
        }}
      >
        {matchWeather?.weather.condition === WeatherCondition.HeavySnow && <SnowOverlay />}
        {[...displayedSteps].reverse().map((s, idx) => {
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
            background = 'rgba(201, 168, 76, 0.12)'
            borderLeft = '3px solid var(--color-accent)'
            fontSize = 14
            fontWeight = 600
            color = 'var(--color-accent)'
            paddingLeft = 12
            boxShadow = 'inset 3px 0 0 #C9A84C'
          } else if (hasSuspension) {
            borderLeft = '3px solid var(--danger)'
            color = 'var(--danger)'
            fontWeight = 500
          } else if (hasYellow) {
            borderLeft = '3px solid var(--warning)'
            color = 'var(--text-primary)'
          } else if (hasCorner) {
            borderLeft = '3px solid #60a5fa'
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

          return (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'flex-start',
                padding: `8px 16px 8px ${paddingLeft}px`,
                borderLeft, background, gap: 8,
                animation: 'fadeInUp 250ms ease-out both',
                boxShadow,
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
          )
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
          showTacticPanel={showTacticPanel}
          onShowTacticPanel={setShowTacticPanel}
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
          onSeeReport={handleSeeReport}
          onContinue={() => navigate('/game', { replace: true })}
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
