import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { simulateMatchStepByStep, type MatchStep } from '../../domain/services/matchSimulator'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { MatchEventType, WeatherCondition, IceQuality } from '../../domain/enums'
import { getWeatherEmoji, getIceQualityLabel } from '../../domain/services/weatherService'
import { getRivalry } from '../../domain/data/rivalries'

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

function eventIcon(type: MatchEventType): string {
  if (type === MatchEventType.Goal) return '🔴'
  if (type === MatchEventType.YellowCard) return '⚠️'
  if (type === MatchEventType.RedCard) return '🚫'
  if (type === MatchEventType.Save) return '🧤'
  if (type === MatchEventType.Corner) return '📐'
  return ''
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

export function MatchLiveScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { game, advance, saveLiveMatchResult } = useGameStore()

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

  const [steps, setSteps] = useState<MatchStep[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [isPaused, setIsPaused] = useState(false)
  const [isFastForward, setIsFastForward] = useState(false)
  const [showHalftime, setShowHalftime] = useState(false)
  const [matchDone, setMatchDone] = useState(false)
  // Score flash state
  const [homeScoreFlash, setHomeScoreFlash] = useState(false)
  const [awayScoreFlash, setAwayScoreFlash] = useState(false)
  const prevHomeScore = useRef(0)
  const prevAwayScore = useRef(0)

  const feedRef = useRef<HTMLDivElement>(null)

  // Pre-generate all 60 steps on mount
  useEffect(() => {
    if (!fixture || !homeLineup || !awayLineup || !game) return

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
    const gen = simulateMatchStepByStep({
      fixture,
      homeLineup,
      awayLineup,
      homePlayers,
      awayPlayers,
      homeAdvantage: 0.05,
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
    advance()
    navigate('/game/match', { state: { showReport: true } })
  }

  if (!fixture || !homeLineup || !awayLineup) {
    return (
      <div style={{ padding: 20, color: 'var(--text-secondary)' }}>
        Ingen matchdata tillgänglig.
      </div>
    )
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
        {/* Clock ring with minute display */}
        <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto' }}>
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
                {s.commentary}
              </span>
            </div>
          )
        })}
      </div>

      {/* Halftime modal */}
      {showHalftime && !matchDone && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '80px',
          zIndex: 200,
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '28px 24px',
            textAlign: 'center',
            minWidth: 260,
          }}>
            <p style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-muted)',
              marginBottom: 16,
            }}>
              Halvtid
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(homeClubName, 12)}</p>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{halftimeStep?.homeScore ?? homeScore}</span>
              </div>
              <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>—</span>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(awayClubName, 12)}</p>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{halftimeStep?.awayScore ?? awayScore}</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              <p>Skott: {halftimeStep?.shotsHome ?? 0} — {halftimeStep?.shotsAway ?? 0}</p>
              <p style={{ marginTop: 4 }}>Hörnor: {halftimeStep?.cornersHome ?? 0} — {halftimeStep?.cornersAway ?? 0}</p>
            </div>
            <button
              onClick={() => {
                setShowHalftime(false)
                setCurrentStep(prev => prev + 1)
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 'var(--radius)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Andra halvlek →
            </button>
          </div>
        </div>
      )}

      {/* Match done overlay */}
      {matchDone && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '60px',
          zIndex: 200,
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '28px 24px',
            textAlign: 'center',
            minWidth: 280,
            maxWidth: 340,
            width: '90%',
          }}>
            <p style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-muted)',
              marginBottom: 16,
            }}>
              Slutresultat
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(homeClubName, 12)}</p>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{homeScore}</span>
              </div>
              <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>—</span>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(awayClubName, 12)}</p>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{awayScore}</span>
              </div>
            </div>

            {/* Goal scorers */}
            {(() => {
              const allGoalEvents = steps.flatMap(s =>
                s.events.filter(e => e.type === MatchEventType.Goal)
              )
              if (allGoalEvents.length === 0) return null
              return (
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
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
              )
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => {
                  advance()
                  navigate('/game')
                }}
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
                Dags för nästa match →
              </button>
              <button
                onClick={handleSeeReport}
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
                Se matchrapport →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
