import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { simulateMatchStepByStep, simulateSecondHalf, type MatchStep } from '../../domain/services/matchSimulator'
import type { Tactic } from '../../domain/entities/Club'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { MatchEventType, TacticMentality, TacticTempo, TacticPress } from '../../domain/enums'
import { getRivalry } from '../../domain/data/rivalries'
import { computePlayerRatings } from '../utils/matchRatings'
import { playSound, isMuted, toggleMute } from '../audio/soundEffects'
import { PhaseOverlay } from '../components/match/PhaseOverlay'
import { FinalIntroScreen } from '../components/match/FinalIntroScreen'
import { HalftimeModal } from '../components/match/HalftimeModal'
import { MatchDoneOverlay } from '../components/match/MatchDoneOverlay'
import { CeremonyCupFinal } from '../components/match/CeremonyCupFinal'
import { CeremonySmFinal } from '../components/match/CeremonySmFinal'
import { SubstitutionModal } from '../components/match/SubstitutionModal'
import { Scoreboard } from '../components/match/Scoreboard'
import { MatchControls } from '../components/match/MatchControls'
import { CommentaryFeed } from '../components/match/CommentaryFeed'

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
  const { game, saveLiveMatchResult, advance } = useGameStore()

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
  const [homeScoreFlash, setHomeScoreFlash] = useState(false)
  const [awayScoreFlash, setAwayScoreFlash] = useState(false)
  const prevHomeScore = useRef(0)
  const prevAwayScore = useRef(0)

  const feedRef = useRef<HTMLDivElement>(null)
  const hasSimulated = useRef(false)

  useEffect(() => {
    if (!fixture || !game) return
    const liveFixture = game.fixtures.find(f => f.id === fixture.id)
    if (liveFixture?.status === 'completed') {
      navigate('/game', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    requestAnimationFrame(() => {
      feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [currentStep])

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
      />

      <CommentaryFeed
        displayedSteps={displayedSteps}
        currentMatchStep={currentMatchStep}
        matchWeather={matchWeather}
        liveSubs={liveSubs}
        fixture={fixture}
        game={game}
        feedRef={feedRef}
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
        />
      )}

      {showOvertimeOverlay && <PhaseOverlay phase="overtime" />}
      {showPenaltiesOverlay && <PhaseOverlay phase="penalties" />}

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
          onContinue={() => { navigate('/game/review', { replace: true }) }}
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
