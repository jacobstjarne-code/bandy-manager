/**
 * ScoreboardStalvallen.tsx — Stålvallen scoreboard
 *
 * 5-modul board-system: bezel → main → pen → text → line
 * copper = managed club  |  steel = opponent
 */
import { useEffect, useRef, useState } from 'react'
import { SevenSegText } from './sevenSegment'

export interface ScoreboardEvent {
  minute: number
  type: 'goal' | 'pen'
  team: 'home' | 'away'
}

export interface PenaltyEntry {
  team: 'home' | 'away'
  num: number
  name: string
  secondsLeft: number
}

export interface ScoreboardStalvallenProps {
  homeCode: string
  awayCode: string
  homeScore: number
  awayScore: number
  /** Which side is the managed club — determines copper vs steel colouring */
  managedSide: 'home' | 'away' | null
  period: 'HL1' | 'HL2' | 'OT' | 'FT' | 'FT · ETT'
  minute: number
  second: number
  penalties: PenaltyEntry[]
  ticker: string[]
  events: ScoreboardEvent[]
  isPlayoffFinal?: boolean
  finalTier?: string
  showNowMarker?: boolean
  penaltyFinalScore?: { home: number; away: number }
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function ScoreboardStalvallen({
  homeCode,
  awayCode,
  homeScore,
  awayScore,
  managedSide,
  period,
  minute,
  second: _second,
  penalties,
  ticker,
  events,
  isPlayoffFinal,
  finalTier,
  showNowMarker = true,
  penaltyFinalScore,
}: ScoreboardStalvallenProps) {
  // Score-flash state — triggers on score change
  const [flashSide, setFlashSide] = useState<'home' | 'away' | null>(null)
  const prevHome = useRef(homeScore)
  const prevAway = useRef(awayScore)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (homeScore > prevHome.current) {
      setFlashSide('home')
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlashSide(null), 4000)
    } else if (awayScore > prevAway.current) {
      setFlashSide('away')
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlashSide(null), 4000)
    }
    prevHome.current = homeScore
    prevAway.current = awayScore
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [homeScore, awayScore])

  const homeColor = managedSide === 'home' ? 'var(--led-us)' : 'var(--led-them)'
  const awayColor = managedSide === 'away' ? 'var(--led-us)' : 'var(--led-them)'

  const homePens = penalties.filter(p => p.team === 'home')
  const awayPens = penalties.filter(p => p.team === 'away')
  const hasPenalties = penalties.length > 0

  const isFT = period === 'FT' || period === 'FT · ETT'
  const isOT = period === 'OT'
  const maxMinutes = isOT ? 105 : 90

  return (
    <div className="scoreboard-root">
      {/* SM-FINAL / playoff band */}
      {isPlayoffFinal && (
        <div className="scoreboard-final-band">
          <span className="scoreboard-final-band-label">SM-FINAL</span>
          {finalTier && (
            <span className="scoreboard-final-band-tier">{finalTier}</span>
          )}
        </div>
      )}

      {/* Bezel wrap — 5 modules inside */}
      <div className="board-system">

        {/* Module 1: Main score — V1 layout: klocka mitten */}
        <div className={`module-main${flashSide ? ` score-flash-${flashSide}` : ''}`}>
          {penaltyFinalScore && (period === 'FT' || period === 'FT · ETT') && (
            <div className="penalty-final-row">
              <span className="penalty-final-label">STRAFF</span>
              <span className="penalty-final-score">{penaltyFinalScore.home}–{penaltyFinalScore.away}</span>
            </div>
          )}
          <div className="main-row">
            {/* Home */}
            <div className="team-col home">
              <span className="team-code" style={{ color: homeColor }}>{homeCode}</span>
              <span className="team-score-mount">
                <SevenSegText
                  text={String(homeScore)}
                  size="lg"
                  color={homeColor}
                  glowColor={flashSide === 'home' ? 'rgba(255,170,0,0.7)' : undefined}
                />
              </span>
            </div>

            {/* Clock block — mitten */}
            <div className="clock-block">
              <span className="period-mark">{period}</span>
              <span className="time-mount">
                <SevenSegText text={pad2(minute)} size="md" color="var(--led-red)" />
              </span>
            </div>

            {/* Away */}
            <div className="team-col away">
              <span className="team-code" style={{ color: awayColor }}>{awayCode}</span>
              <span className="team-score-mount">
                <SevenSegText
                  text={String(awayScore)}
                  size="lg"
                  color={awayColor}
                  glowColor={flashSide === 'away' ? 'rgba(255,170,0,0.7)' : undefined}
                />
              </span>
            </div>
          </div>
        </div>

        {/* Module 2: Penalty strip — animates in/out */}
        <div className={`module-pen${hasPenalties ? ' active' : ''}`}>
          <div className={`pen-slot home${homePens[0] ? '' : ' empty'}`}>
            {homePens[0] && (
              <>
                <span className="pen-mark">▲</span>
                <span className="pen-num">#{homePens[0].num}</span>
                <span className="pen-name">{homePens[0].name}</span>
                <span className="pen-time">
                  {pad2(Math.floor(homePens[0].secondsLeft / 60))}:{pad2(homePens[0].secondsLeft % 60)}
                </span>
              </>
            )}
          </div>
          <div className="pen-divider" />
          <div className={`pen-slot away${awayPens[0] ? '' : ' empty'}`}>
            {awayPens[0] && (
              <>
                <span className="pen-mark">▲</span>
                <span className="pen-num">#{awayPens[0].num}</span>
                <span className="pen-name">{awayPens[0].name}</span>
                <span className="pen-time">
                  {pad2(Math.floor(awayPens[0].secondsLeft / 60))}:{pad2(awayPens[0].secondsLeft % 60)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Module 3: Rolling LED text — CSS animation, no JS interval */}
        <div className="module-text">
          <div className="module-text-track">
            {ticker.map((segment, i) => (
              <span key={i} className={i % 2 === 1 ? 'dim' : ''}>
                {segment}
              </span>
            ))}
          </div>
        </div>

        {/* Module 4: Timeline */}
        <div className="module-line">
          <div className="line-head">
            <span className="line-title">MATCHEN</span>
          </div>
          <div className="timeline">
            <span className="tl-half" />

            {/* Tick marks at 15, 30, 60 */}
            {[15, 30, 60].map(tick => {
              const pct = (tick / maxMinutes) * 100
              return (
                <span key={tick}>
                  <span className="tl-tick" style={{ left: `${pct}%` }} />
                  <span className="tl-tick-label" style={{ left: `${pct}%` }}>{tick}</span>
                </span>
              )
            })}

            {/* Penalty bands */}
            {penalties.map((p, i) => {
              const startPct = (Math.max(0, minute - p.secondsLeft / 60) / maxMinutes) * 100
              const endPct = (minute / maxMinutes) * 100
              return (
                <span
                  key={`pen-${i}`}
                  className="tl-pen"
                  style={{ left: `${startPct}%`, width: `${Math.max(1, endPct - startPct)}%` }}
                />
              )
            })}

            {/* Goal marks */}
            {events.map((ev, i) => {
              const pct = (ev.minute / maxMinutes) * 100
              return (
                <span key={`g-${i}`}>
                  <span className={`tl-goal ${ev.team}`} style={{ left: `${pct}%` }} />
                  <span className={`tl-goal-cap ${ev.team}`} style={{ left: `${pct}%` }} />
                </span>
              )
            })}

            {/* Now marker */}
            {showNowMarker && !isFT && (
              <span
                className="tl-now"
                style={{ left: `${Math.min((minute / maxMinutes) * 100, 98)}%` }}
              />
            )}
          </div>
        </div>

      </div>{/* end .board-system */}
    </div>
  )
}
