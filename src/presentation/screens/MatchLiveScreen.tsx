import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { simulateMatchStepByStep, type MatchStep } from '../../domain/services/matchSimulator'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import type { PlayoffBracket } from '../../domain/entities/Playoff'
import type { Club } from '../../domain/entities/Club'
import { MatchEventType, WeatherCondition, IceQuality } from '../../domain/enums'
import { getWeatherEmoji, getIceQualityLabel } from '../../domain/services/weatherService'
import { getRivalry } from '../../domain/data/rivalries'
import { eventIcon } from '../utils/formatters'

function GoldConfetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: (i * 37 + 11) % 100,
    delay: (i * 0.17) % 3,
    duration: 3 + (i * 0.13) % 3,
    color: i % 3 === 0 ? '#C9A84C' : i % 3 === 1 ? '#F0F4F8' : '#FFD700',
    size: 6 + (i % 6),
  }))
  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes goldPulse {
          0%, 100% { text-shadow: 0 0 20px rgba(201,168,76,0.4); }
          50% { text-shadow: 0 0 40px rgba(201,168,76,0.8), 0 0 60px rgba(201,168,76,0.4); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.6,
              background: p.color,
              borderRadius: 2,
              animation: `confettiFall ${p.duration}s ${p.delay}s infinite linear`,
            }}
          />
        ))}
      </div>
    </>
  )
}

interface LocationState {
  fixture: Fixture
  homeLineup: TeamSelection
  awayLineup: TeamSelection
  homeClubName: string
  awayClubName: string
  isManaged: boolean
  matchWeather?: MatchWeather
}

function SnowOverlay() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: 3 + Math.random() * 3,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 4 + Math.random() * 4,
    opacity: 0.3 + Math.random() * 0.3,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10px',
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'white',
            opacity: p.opacity,
            animation: `snowfall ${p.duration}s ${p.delay}s infinite linear`,
          }}
        />
      ))}
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function getFinalJourney(bracket: PlayoffBracket, clubId: string, clubs: Club[]): string {
  const qf = bracket.quarterFinals?.find(s => s.winnerId === clubId)
  const sf = bracket.semiFinals?.find(s => s.winnerId === clubId)
  const qfLoserId = qf ? (qf.homeClubId === clubId ? qf.awayClubId : qf.homeClubId) : null
  const sfLoserId = sf ? (sf.homeClubId === clubId ? sf.awayClubId : sf.homeClubId) : null
  const qfLoser = qfLoserId ? clubs.find(c => c.id === qfLoserId)?.name : null
  const sfLoser = sfLoserId ? clubs.find(c => c.id === sfLoserId)?.name : null
  if (qfLoser && sfLoser) return `Slog ut ${qfLoser} i KF och ${sfLoser} i SF`
  if (sfLoser) return `Slog ut ${sfLoser} i SF`
  return 'Klarade sig till finalen'
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

  const [steps, setSteps] = useState<MatchStep[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [isPaused, setIsPaused] = useState(false)
  const [isFastForward, setIsFastForward] = useState(false)
  const [showHalftime, setShowHalftime] = useState(false)
  const [matchDone, setMatchDone] = useState(false)
  // SM-final ceremony slide (0 = not showing, 1 = final score, 2 = champion, 3 = MVP)
  const [ceremonySlide, setCeremonySlide] = useState(0)
  // SM-final pre-match intro slide (0 = not showing, 1/2/3 = intro slides)
  const [finalIntroSlide, setFinalIntroSlide] = useState(() => isSmFinal ? 1 : 0)
  // Score flash state
  const [homeScoreFlash, setHomeScoreFlash] = useState(false)
  const [awayScoreFlash, setAwayScoreFlash] = useState(false)
  const prevHomeScore = useRef(0)
  const prevAwayScore = useRef(0)

  const feedRef = useRef<HTMLDivElement>(null)
  const hasSimulated = useRef(false)

  // Pre-generate all 60 steps on mount
  useEffect(() => {
    if (hasSimulated.current) return
    if (!fixture || !homeLineup || !awayLineup || !game) return
    hasSimulated.current = true

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
    const gen = simulateMatchStepByStep({
      fixture,
      homeLineup,
      awayLineup,
      homePlayers,
      awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : 0.05,
      seed: Date.now(),
      weather: matchWeather?.weather,
      homeClubName: homeClubName || undefined,
      awayClubName: awayClubName || undefined,
      rivalry: rivalry ?? undefined,
    })
    const allSteps: MatchStep[] = []
    for (const step of gen) {
      allSteps.push(step)
    }
    setSteps(allSteps)
    setCurrentStep(0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance ceremony from slide 1 to slide 2 after 3 seconds
  useEffect(() => {
    if (ceremonySlide !== 1) return
    const timer = setTimeout(() => setCeremonySlide(2), 3000)
    return () => clearTimeout(timer)
  }, [ceremonySlide])

  // Save live match result to game state when match is done
  useEffect(() => {
    if (!matchDone || !fixture || !homeLineup || !awayLineup || steps.length === 0) return
    const lastStep = steps[steps.length - 1]
    const allEvents = steps.flatMap(s => s.events)

    // Build player ratings: starters start at 6.5, adjust for goals/assists/cards
    const playerRatings: Record<string, number> = {}
    const allStarters = [
      ...(homeLineup.startingPlayerIds ?? []),
      ...(awayLineup.startingPlayerIds ?? []),
    ]
    for (const id of allStarters) playerRatings[id] = 6.5
    for (const e of allEvents) {
      if (!e.playerId) continue
      if (e.type === MatchEventType.Goal) playerRatings[e.playerId] = Math.min(10, (playerRatings[e.playerId] ?? 6.5) + 1.5)
      if (e.type === MatchEventType.YellowCard) playerRatings[e.playerId] = Math.max(1, (playerRatings[e.playerId] ?? 6.5) - 0.5)
      if (e.type === MatchEventType.RedCard) playerRatings[e.playerId] = Math.max(1, (playerRatings[e.playerId] ?? 6.5) - 1.5)
    }
    const potmId = Object.entries(playerRatings).sort((a, b) => b[1] - a[1])[0]?.[0]

    const possession = 50
    const report = {
      playerRatings,
      shotsHome: lastStep.shotsHome,
      shotsAway: lastStep.shotsAway,
      cornersHome: lastStep.cornersHome,
      cornersAway: lastStep.cornersAway,
      penaltiesHome: 0,
      penaltiesAway: 0,
      possessionHome: possession,
      possessionAway: 100 - possession,
      playerOfTheMatchId: potmId,
    }
    saveLiveMatchResult(
      fixture.id,
      lastStep.homeScore,
      lastStep.awayScore,
      allEvents,
      report,
      homeLineup,
      awayLineup,
    )
  }, [matchDone]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll feed to top (newest events at top)
  useEffect(() => {
    requestAnimationFrame(() => {
      feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [currentStep])

  // Score flash detection
  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return
    const step = steps[currentStep]
    if (step.homeScore > prevHomeScore.current) {
      setHomeScoreFlash(true)
      setTimeout(() => setHomeScoreFlash(false), 2000)
    }
    if (step.awayScore > prevAwayScore.current) {
      setAwayScoreFlash(true)
      setTimeout(() => setAwayScoreFlash(false), 2000)
    }
    prevHomeScore.current = step.homeScore
    prevAwayScore.current = step.awayScore
  }, [currentStep, steps])

  // Playback loop
  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return
    if (isPaused && !isFastForward) return

    const step = steps[currentStep]

    // Check for halftime
    if (step.step === 30 && !isFastForward) {
      setShowHalftime(true)
      return
    }

    const delay = isFastForward
      ? 50
      : step.intensity === 'high'
      ? 2200
      : step.intensity === 'medium'
      ? 1200
      : 1400

    const timer = setTimeout(() => {
      if (currentStep + 1 >= steps.length) {
        setMatchDone(true)
        if (isSmFinal) {
          setCeremonySlide(1)
        }
      } else {
        setCurrentStep(prev => prev + 1)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [currentStep, isPaused, isFastForward, steps])

  function handleAbort() {
    if (window.confirm('Avbryt matchen? Resultatet sparas inte.')) {
      navigate(-1)
    }
  }

  function handleSeeReport() {
    navigate('/game/match', { state: { showReport: true }, replace: true })
  }

  if (!fixture || !homeLineup || !awayLineup) {
    return (
      <div style={{ padding: 20, color: 'var(--text-secondary)' }}>
        Ingen matchdata tillgänglig.
      </div>
    )
  }

  // SM-final pre-match intro slides
  if (isSmFinal && finalIntroSlide > 0) {
    const bracket = game?.playoffBracket
    const clubs = game?.clubs ?? []
    const season = game?.currentSeason ?? fixture.season
    const homeStanding = game?.standings.find(s => s.clubId === fixture.homeClubId)
    const awayStanding = game?.standings.find(s => s.clubId === fixture.awayClubId)
    const weatherEmoji = matchWeather ? getWeatherEmoji(matchWeather.weather.condition) : ''

    if (finalIntroSlide === 1) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'linear-gradient(180deg, #050d18 0%, #0D1B2A 60%, #091526 100%)',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <GoldConfetti />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 72, marginBottom: 24 }}>🏆</div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#C9A84C',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>SM-FINALEN</h1>
            <p style={{ fontSize: 16, color: '#8A9BB0', marginBottom: 4 }}>Studenternas IP, Uppsala</p>
            <p style={{ fontSize: 14, color: '#6a7d8f', marginBottom: 4 }}>Säsong {season}</p>
            {weatherEmoji && (
              <p style={{ fontSize: 13, color: '#6a7d8f', marginBottom: 32 }}>{weatherEmoji} {matchWeather?.weather.condition}</p>
            )}
            <button
              onClick={() => setFinalIntroSlide(2)}
              style={{
                padding: '14px 32px',
                background: '#C9A84C',
                border: 'none',
                borderRadius: 12,
                color: '#0D1B2A',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '1px',
              }}
            >
              NÄSTA →
            </button>
          </div>
        </div>
      )
    }

    if (finalIntroSlide === 2) {
      const homeJourney = bracket ? getFinalJourney(bracket, fixture.homeClubId, clubs) : ''
      const awayJourney = bracket ? getFinalJourney(bracket, fixture.awayClubId, clubs) : ''
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: '#0D1B2A',
          padding: '24px 16px',
          overflowY: 'auto',
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#C9A84C',
            textAlign: 'center',
            marginBottom: 24,
          }}>
            LAGPRESENTATION
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {/* Home club */}
            <div style={{
              flex: 1,
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: 12,
              padding: '16px 12px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#F0F4F8', marginBottom: 8 }}>
                {truncate(homeClubName, 14)}
              </p>
              {homeStanding && (
                <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 8 }}>
                  Plats {homeStanding.position} i serien
                </p>
              )}
              <p style={{ fontSize: 11, color: '#6a7d8f', lineHeight: 1.4 }}>{homeJourney}</p>
            </div>
            {/* Away club */}
            <div style={{
              flex: 1,
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: 12,
              padding: '16px 12px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#F0F4F8', marginBottom: 8 }}>
                {truncate(awayClubName, 14)}
              </p>
              {awayStanding && (
                <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 8 }}>
                  Plats {awayStanding.position} i serien
                </p>
              )}
              <p style={{ fontSize: 11, color: '#6a7d8f', lineHeight: 1.4 }}>{awayJourney}</p>
            </div>
          </div>
          <button
            onClick={() => setFinalIntroSlide(3)}
            style={{
              padding: '14px',
              background: '#C9A84C',
              border: 'none',
              borderRadius: 12,
              color: '#0D1B2A',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            NÄSTA →
          </button>
        </div>
      )
    }

    if (finalIntroSlide === 3) {
      const homeStarters = homeLineup.startingPlayerIds
        .map(id => game?.players.find(p => p.id === id))
        .filter(Boolean)
      const awayStarters = awayLineup.startingPlayerIds
        .map(id => game?.players.find(p => p.id === id))
        .filter(Boolean)
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: '#0D1B2A',
          padding: '24px 16px',
          overflowY: 'auto',
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#C9A84C',
            textAlign: 'center',
            marginBottom: 24,
          }}>
            STARTELVOR
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
                {truncate(homeClubName, 14)}
              </p>
              {homeStarters.map((p, i) => p && (
                <p key={i} style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 4, textAlign: 'center' }}>
                  {p.firstName} {p.lastName}
                </p>
              ))}
            </div>
            <div style={{ width: 1, background: 'rgba(201,168,76,0.15)' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
                {truncate(awayClubName, 14)}
              </p>
              {awayStarters.map((p, i) => p && (
                <p key={i} style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 4, textAlign: 'center' }}>
                  {p.firstName} {p.lastName}
                </p>
              ))}
            </div>
          </div>
          <button
            onClick={() => setFinalIntroSlide(0)}
            style={{
              padding: '16px',
              background: '#C9A84C',
              border: 'none',
              borderRadius: 12,
              color: '#0D1B2A',
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '1px',
            }}
          >
            ⚡ SPELA FINALEN
          </button>
        </div>
      )
    }
  }

  const currentMatchStep = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null
  const displayedSteps = currentStep >= 0 ? steps.slice(0, currentStep + 1) : []
  const currentMinute = currentMatchStep?.minute ?? 0
  const homeScore = currentMatchStep?.homeScore ?? 0
  const awayScore = currentMatchStep?.awayScore ?? 0
  const halftimeStep = steps.find(s => s.step === 30)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button
          onClick={handleAbort}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 14,
            fontWeight: 500,
            padding: '4px 8px',
          }}
        >
          ← Avbryt
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setIsPaused(prev => !prev)}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              fontSize: 14,
            }}
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
              padding: '6px 12px',
              fontSize: 14,
            }}
          >
            ⏩
          </button>
        </div>
      </div>

      {/* Scoreboard */}
      <div style={{
        background: rivalry
          ? 'linear-gradient(180deg, rgba(200,50,30,0.08) 0%, #0a1520 10%, #122235 100%)'
          : 'linear-gradient(180deg, #0a1520 0%, #122235 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '16px',
        textAlign: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Floodlight glow top-left */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 120, height: 80,
          background: 'radial-gradient(ellipse at top left, rgba(180,210,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>
        {/* Floodlight glow top-right */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 120, height: 80,
          background: 'radial-gradient(ellipse at top right, rgba(180,210,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          marginBottom: 4,
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, textAlign: 'right' }}>
            {truncate(homeClubName, 10)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              key={`home-${homeScore}`}
              style={{
                fontSize: 48,
                fontWeight: 800,
                lineHeight: 1,
                color: homeScoreFlash ? 'var(--color-accent)' : 'var(--text-primary)',
                transition: 'color 0.3s ease',
                textShadow: homeScoreFlash ? '0 0 20px var(--color-accent)' : 'none',
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum"',
                animation: homeScoreFlash ? 'scaleFlash 400ms ease-out both' : undefined,
              }}
            >
              {homeScore}
            </span>
            <span style={{ fontSize: 24, color: 'var(--text-muted)', fontWeight: 300 }}>—</span>
            <span
              key={`away-${awayScore}`}
              style={{
                fontSize: 48,
                fontWeight: 800,
                lineHeight: 1,
                color: awayScoreFlash ? 'var(--color-accent)' : 'var(--text-primary)',
                transition: 'color 0.3s ease',
                textShadow: awayScoreFlash ? '0 0 20px var(--color-accent)' : 'none',
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum"',
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
        {/* Derby badge */}
        {rivalry && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: 99,
            background: 'linear-gradient(90deg, rgba(220,50,30,0.2), rgba(201,168,76,0.2))',
            border: '1px solid rgba(220,100,30,0.4)',
            fontSize: 11,
            fontWeight: 700,
            color: '#ff7040',
            marginTop: 6,
            marginBottom: 4,
          }}>
            🔥 {rivalry.name} {'🔥'.repeat(Math.min(rivalry.intensity ?? 1, 3))}
          </div>
        )}
        {/* Clock ring with minute display */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', margin: '0 auto' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)' }}>
              <circle cx="24" cy="24" r="20" fill="none" stroke="#1e3450" strokeWidth="2"/>
              <circle cx="24" cy="24" r="20" fill="none" stroke="#C9A84C" strokeWidth="2"
                strokeDasharray={`${(currentMinute / 90) * 125.7} 125.7`}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
                style={{ transition: 'stroke-dasharray 600ms ease-out' }}
              />
            </svg>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, paddingTop: 4 }}>
              {matchDone ? 'Slutresultat' : `${currentMinute}'`}
            </div>
          </div>
          {rivalry && !matchDone && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#ff7040',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginLeft: 8,
            }}>
              DERBY
            </span>
          )}
        </div>
        {matchWeather && (
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {getWeatherEmoji(matchWeather.weather.condition)}{' '}
            {matchWeather.weather.temperature > 0 ? '+' : ''}{matchWeather.weather.temperature}°
            {' · '}
            <span style={{
              color: matchWeather.weather.iceQuality === IceQuality.Poor ? 'var(--danger)' : 'inherit'
            }}>
              {getIceQualityLabel(matchWeather.weather.iceQuality)}
            </span>
            {matchWeather.weather.temperature <= -15 && ' ❄'}
          </div>
        )}
      </div>

      {/* Match intensity indicator */}
      {currentMatchStep && (
        <div style={{
          height: 3,
          background: '#0d1e33',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
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
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
          position: 'relative',
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

          let borderLeft = 'none'
          let background = 'transparent'
          let fontSize = 13
          let fontWeight: number | string = 400
          let color = 'var(--text-secondary)'
          let paddingLeft = 16
          let boxShadow: string | undefined = undefined

          const isDerby = s.isDerbyComment || s.commentary.toLowerCase().includes('derby')

          const hasCornerGoal = s.events.some(e => e.type === MatchEventType.Goal && e.isCornerGoal)

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

          // Pick icon for highest priority event
          const primaryEvent = s.events.find(e =>
            e.type === MatchEventType.Goal ||
            e.type === MatchEventType.RedCard ||
            e.type === MatchEventType.YellowCard ||
            e.type === MatchEventType.Save ||
            e.type === MatchEventType.Corner
          )
          const icon = primaryEvent ? eventIcon(primaryEvent.type) : ''

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: `8px 16px 8px ${paddingLeft}px`,
                borderLeft,
                background,
                gap: 8,
                animation: 'fadeInUp 250ms ease-out both',
                boxShadow,
              }}
            >
              <span style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                minWidth: 28,
                paddingTop: 1,
                flexShrink: 0,
              }}>
                {s.minute}'
              </span>
              {icon && (
                <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
              )}
              <span style={{ fontSize, fontWeight, color, lineHeight: 1.4 }}>
                {hasCornerGoal ? `📐 HÖRNMÅL! ${s.commentary}` : s.commentary}
              </span>
            </div>
          )
        })}
      </div>

      {/* Halftime modal */}
      {showHalftime && !matchDone && (() => {
        const htSteps = steps.slice(0, 31)
        const htEvents = htSteps.flatMap(s => s.events)
        const htHomeGoals = halftimeStep?.homeScore ?? homeScore
        const htAwayGoals = halftimeStep?.awayScore ?? awayScore
        const htHomeSuspensions = htEvents.filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.homeClubId).length
        const htAwaySuspensions = htEvents.filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.awayClubId).length

        // Best player so far
        const htStarters = [...(homeLineup.startingPlayerIds ?? []), ...(awayLineup.startingPlayerIds ?? [])]
        const htRatings: Record<string, number> = {}
        for (const id of htStarters) htRatings[id] = 6.5
        for (const e of htEvents) {
          if (!e.playerId) continue
          if (e.type === MatchEventType.Goal) htRatings[e.playerId] = Math.min(10, (htRatings[e.playerId] ?? 6.5) + 1.5)
          if (e.type === MatchEventType.RedCard) htRatings[e.playerId] = Math.max(1, (htRatings[e.playerId] ?? 6.5) - 1.5)
        }
        const [bestId] = Object.entries(htRatings).sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
        const bestPlayer = bestId ? game?.players.find(p => p.id === bestId) : undefined
        const bestPlayerName = bestPlayer ? `${bestPlayer.firstName} ${bestPlayer.lastName}` : null

        const managedIsHome = fixture.homeClubId === game?.managedClubId
        const managedGoals = managedIsHome ? htHomeGoals : htAwayGoals
        const oppGoals = managedIsHome ? htAwayGoals : htHomeGoals
        const diff = managedGoals - oppGoals
        const analysis =
          diff >= 2 ? 'Stark insats. Fortsätt kontrollera tempot.' :
          diff === 1 ? 'Ledningen är skör. Var uppmärksam defensivt.' :
          diff === 0 ? 'Jämnt — allt avgörs i andra halvlek.' :
          diff === -1 ? 'Hänger med. En omgång kan vända det.' :
          'Tufft läge. Överväg taktikbyte.'

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '60px',
            zIndex: 200,
          }}>
            <div style={{
              background: isSmFinal ? '#0D1B2A' : 'var(--bg-surface)',
              border: isSmFinal ? '1px solid rgba(201,168,76,0.4)' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px 20px',
              textAlign: 'center',
              minWidth: 260,
              maxWidth: 330,
              width: '90%',
            }}>
              <p style={{
                fontSize: isSmFinal ? 13 : 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: isSmFinal ? '#C9A84C' : 'var(--text-muted)',
                marginBottom: 14,
              }}>
                ⏸ {isSmFinal ? 'HALVTID — SM-FINAL' : 'HALVTID'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(homeClubName, 12)}</p>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>{htHomeGoals}</span>
                </div>
                <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>—</span>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(awayClubName, 12)}</p>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>{htAwayGoals}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, textAlign: 'left', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Skott:</span>
                  <span>{halftimeStep?.shotsHome ?? 0} — {halftimeStep?.shotsAway ?? 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Hörnor:</span>
                  <span>{halftimeStep?.cornersHome ?? 0} — {halftimeStep?.cornersAway ?? 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Utvisningar:</span>
                  <span>{htHomeSuspensions} — {htAwaySuspensions}</span>
                </div>
              </div>
              {bestPlayerName && (
                <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(201,168,76,0.06)', borderRadius: 8, border: '1px solid rgba(201,168,76,0.15)' }}>
                  <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, marginBottom: 2 }}>⭐ Matchens spelare hittills</p>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{bestPlayerName}</p>
                  {bestPlayer?.position && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bestPlayer.position}</p>}
                </div>
              )}
              <p style={{
                fontSize: 12,
                color: '#8A9BB0',
                fontStyle: 'italic',
                marginBottom: 16,
                lineHeight: 1.5,
              }}>
                💬 "{analysis}"
              </p>
              {isSmFinal && (
                <p style={{
                  fontSize: 11,
                  color: '#8A9BB0',
                  fontStyle: 'italic',
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}>
                  Laget samlas i omklädningsrummet. Det är 30 minuter kvar till SM-guld.
                </p>
              )}
              <button
                onClick={() => {
                  setShowHalftime(false)
                  setCurrentStep(prev => prev + 1)
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isSmFinal ? '#C9A84C' : 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  color: isSmFinal ? '#0D1B2A' : '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {isSmFinal ? 'ANDRA HALVLEK →' : 'Andra halvlek →'}
              </button>
            </div>
          </div>
        )
      })()}

      {/* Match done overlay — normal matches */}
      {matchDone && !isSmFinal && (() => {
        const allGoalEvents = steps.flatMap(s =>
          s.events.filter(e => e.type === MatchEventType.Goal)
        )
        const lastStep = steps[steps.length - 1]
        const managedIsHome = fixture.homeClubId === game?.managedClubId
        const managedGoals = managedIsHome ? homeScore : awayScore
        const oppGoals = managedIsHome ? awayScore : homeScore
        const resultColor = managedGoals > oppGoals ? '#22c55e' : managedGoals < oppGoals ? '#ef4444' : '#eab308'

        // Best player from all starters
        const allStarters = [...(homeLineup.startingPlayerIds ?? []), ...(awayLineup.startingPlayerIds ?? [])]
        const finalRatings: Record<string, number> = {}
        for (const id of allStarters) finalRatings[id] = 6.5
        const allEvents = steps.flatMap(s => s.events)
        for (const e of allEvents) {
          if (!e.playerId) continue
          if (e.type === MatchEventType.Goal) finalRatings[e.playerId] = Math.min(10, (finalRatings[e.playerId] ?? 6.5) + 1.5)
          if (e.type === MatchEventType.YellowCard) finalRatings[e.playerId] = Math.max(1, (finalRatings[e.playerId] ?? 6.5) - 0.5)
          if (e.type === MatchEventType.RedCard) finalRatings[e.playerId] = Math.max(1, (finalRatings[e.playerId] ?? 6.5) - 1.5)
        }
        const managedStarters = (managedIsHome ? homeLineup.startingPlayerIds : awayLineup.startingPlayerIds) ?? []
        const [bestId, bestRating] = Object.entries(finalRatings)
          .filter(([id]) => managedStarters.includes(id))
          .sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
        const bestPlayer = bestId ? game?.players.find(p => p.id === bestId) : undefined

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '50px',
            zIndex: 200,
            overflowY: 'auto',
          }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: `2px solid ${resultColor}`,
              borderRadius: 'var(--radius)',
              padding: '24px 20px',
              textAlign: 'center',
              minWidth: 280,
              maxWidth: 340,
              width: '90%',
              boxShadow: `0 0 30px ${resultColor}22`,
            }}>
              <p style={{
                fontSize: 13,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: resultColor,
                marginBottom: 14,
              }}>
                SLUTSIGNAL
              </p>
              {fixture.isCup && (
                <p style={{ fontSize: 12, color: '#C9A84C', fontWeight: 700, marginBottom: 8 }}>
                  🏆 Svenska Cupen
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(homeClubName, 12)}</p>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>{homeScore}</span>
                </div>
                <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>—</span>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(awayClubName, 12)}</p>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>{awayScore}</span>
                </div>
              </div>

              {/* Goal scorers */}
              {allGoalEvents.length > 0 && (
                <div style={{ marginBottom: 14, textAlign: 'left' }}>
                  {allGoalEvents.map((e, i) => {
                    const isHome = e.clubId === fixture.homeClubId
                    const foundPlayer = e.playerId ? game?.players.find(p => p.id === e.playerId) : undefined
                    const playerName = foundPlayer ? `${foundPlayer.firstName} ${foundPlayer.lastName}` : ''
                    return (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: isHome ? 'flex-start' : 'flex-end',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        marginBottom: 3,
                      }}>
                        <span>{e.minute}' 🔴 {playerName}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Match facts */}
              {lastStep && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, textAlign: 'left', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Skott:</span>
                    <span>{lastStep.shotsHome} — {lastStep.shotsAway}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Hörnor:</span>
                    <span>{lastStep.cornersHome} — {lastStep.cornersAway}</span>
                  </div>
                </div>
              )}

              {/* Best player */}
              {bestPlayer && (
                <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(201,168,76,0.06)', borderRadius: 8, border: '1px solid rgba(201,168,76,0.15)' }}>
                  <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, marginBottom: 2 }}>⭐ Matchens spelare</p>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {bestPlayer.firstName} {bestPlayer.lastName}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {bestPlayer.position} · {typeof bestRating === 'number' ? bestRating.toFixed(1) : '–'}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleSeeReport}
                  style={{
                    padding: '14px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Se rapport →
                </button>
                <button
                  onClick={() => navigate('/game', { replace: true })}
                  style={{
                    padding: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Fortsätt →
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* SM-final ceremony — Slide 1: Final score */}
      {isSmFinal && ceremonySlide === 1 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#0D1B2A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
        }}>
          <p style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#C9A84C',
            marginBottom: 24,
          }}>
            SM-FINAL
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 8 }}>{truncate(homeClubName, 14)}</p>
              <span style={{ fontSize: 64, fontWeight: 900, color: '#F0F4F8' }}>{homeScore}</span>
            </div>
            <span style={{ fontSize: 32, color: '#4A6080' }}>—</span>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 8 }}>{truncate(awayClubName, 14)}</p>
              <span style={{ fontSize: 64, fontWeight: 900, color: '#F0F4F8' }}>{awayScore}</span>
            </div>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#F0F4F8', letterSpacing: '1px' }}>
            SLUTSIGNAL!
          </p>
        </div>
      )}

      {/* SM-final ceremony — Slide 2: Champion celebration */}
      {isSmFinal && ceremonySlide === 2 && (() => {
        const managedClubId = game?.managedClubId
        const managedIsHome = fixture.homeClubId === managedClubId
        const managedScore = managedIsHome ? homeScore : awayScore
        const opponentScore = managedIsHome ? awayScore : homeScore
        const managedWon = managedScore > opponentScore
        const season = game?.currentSeason ?? fixture.season
        const clubName = managedIsHome ? homeClubName : awayClubName

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: '#0D1B2A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            overflow: 'hidden',
          }}>
            <style>{`
              @keyframes confettiFall {
                0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
              }
              @keyframes goldPulse {
                0%, 100% { text-shadow: 0 0 20px rgba(201,168,76,0.4); }
                50% { text-shadow: 0 0 40px rgba(201,168,76,0.8), 0 0 60px rgba(201,168,76,0.4); }
              }
            `}</style>
            {managedWon && <GoldConfetti />}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
              {managedWon ? (
                <>
                  <div style={{ fontSize: 80, marginBottom: 16 }}>🏆</div>
                  <h1 style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: '#C9A84C',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                    animation: 'goldPulse 2s ease-in-out infinite',
                  }}>
                    SVENSKA MÄSTARE!
                  </h1>
                  <p style={{ fontSize: 18, color: '#F0F4F8', fontWeight: 700, marginBottom: 4 }}>
                    {clubName}
                  </p>
                  <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 32 }}>
                    Vi vann SM-guld {season}!
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 60, marginBottom: 16 }}>🥈</div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: '#8A9BB0', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
                    SILVER
                  </h1>
                  <p style={{ fontSize: 15, color: '#F0F4F8', marginBottom: 4 }}>
                    Ni kämpade väl.
                  </p>
                  <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 32 }}>
                    Silvermedaljörer {season}.
                  </p>
                </>
              )}
              <button
                onClick={() => setCeremonySlide(3)}
                style={{
                  padding: '14px 32px',
                  background: managedWon ? '#C9A84C' : '#1e3450',
                  border: 'none',
                  borderRadius: 12,
                  color: managedWon ? '#0D1B2A' : '#F0F4F8',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Matchens spelare →
              </button>
            </div>
          </div>
        )
      })()}

      {/* SM-final ceremony — Slide 3: MVP */}
      {isSmFinal && ceremonySlide === 3 && (() => {
        // Find player with highest rating
        const allStarters = [
          ...(homeLineup?.startingPlayerIds ?? []),
          ...(awayLineup?.startingPlayerIds ?? []),
        ]
        const playerRatings: Record<string, number> = {}
        for (const id of allStarters) playerRatings[id] = 6.5
        const allEvents = steps.flatMap(s => s.events)
        for (const e of allEvents) {
          if (!e.playerId) continue
          if (e.type === MatchEventType.Goal) playerRatings[e.playerId] = Math.min(10, (playerRatings[e.playerId] ?? 6.5) + 1.5)
          if (e.type === MatchEventType.YellowCard) playerRatings[e.playerId] = Math.max(1, (playerRatings[e.playerId] ?? 6.5) - 0.5)
          if (e.type === MatchEventType.RedCard) playerRatings[e.playerId] = Math.max(1, (playerRatings[e.playerId] ?? 6.5) - 1.5)
        }
        const [mvpId, mvpRating] = Object.entries(playerRatings).sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
        const mvpPlayer = mvpId ? game?.players.find(p => p.id === mvpId) : undefined
        const mvpName = mvpPlayer ? `${mvpPlayer.firstName} ${mvpPlayer.lastName}` : 'Okänd spelare'
        const mvpPos = mvpPlayer?.position ?? ''

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: '#0D1B2A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
          }}>
            <div style={{ textAlign: 'center', padding: '0 24px' }}>
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#C9A84C',
                marginBottom: 24,
              }}>
                MATCHENS SPELARE
              </p>
              <div style={{ fontSize: 56, marginBottom: 16 }}>⭐</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#F0F4F8', marginBottom: 8 }}>
                {mvpName}
              </h2>
              {mvpPos && (
                <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {mvpPos}
                </p>
              )}
              <p style={{ fontSize: 32, fontWeight: 800, color: '#C9A84C', marginBottom: 32 }}>
                {typeof mvpRating === 'number' ? mvpRating.toFixed(1) : '–'}
              </p>
              <button
                onClick={() => navigate('/game/champion', { replace: true })}
                style={{
                  padding: '16px 32px',
                  background: '#C9A84C',
                  border: 'none',
                  borderRadius: 12,
                  color: '#0D1B2A',
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Säsongsavslutning →
              </button>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
