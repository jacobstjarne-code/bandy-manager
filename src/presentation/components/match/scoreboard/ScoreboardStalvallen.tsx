/**
 * ScoreboardStalvallen.tsx — Stålvallen scoreboard
 *
 * BATCH A-01. Standalone scoreboard module.
 * Shared between MatchLiveScreen (live) and MatchReportView (FT).
 *
 * copper = managed club  |  steel = opponent
 */
import { useEffect, useRef, useState } from 'react'
import { SevenSegText, SevenSegColon } from './sevenSegment'

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
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function PenSlot({ entry }: { entry: PenaltyEntry | null }) {
  if (!entry) {
    return <div className="pen-slot empty" />
  }
  const mm = Math.floor(entry.secondsLeft / 60)
  const ss = entry.secondsLeft % 60
  return (
    <div className="pen-slot">
      <span className="pen-slot-arrow">▲</span>
      <span className="pen-slot-num">#{entry.num}</span>
      <span className="pen-slot-name">{entry.name}</span>
      <span className="pen-slot-timer">{pad2(mm)}:{pad2(ss)}</span>
    </div>
  )
}

export function ScoreboardStalvallen({
  homeCode,
  awayCode,
  homeScore,
  awayScore,
  managedSide,
  period,
  minute,
  second,
  penalties,
  ticker,
  events,
  isPlayoffFinal,
  finalTier,
  showNowMarker = true,
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

  // Ticker animation
  const [tickerOffset, setTickerOffset] = useState(0)
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    const isFT = period === 'FT' || period === 'FT · ETT'
    if (isFT) return
    tickerRef.current = setInterval(() => {
      setTickerOffset(prev => prev - 1)
    }, 80)
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current)
    }
  }, [period])

  const homeColor = managedSide === 'home' ? 'var(--copper)' : 'var(--steel)'
  const awayColor = managedSide === 'away' ? 'var(--copper)' : 'var(--steel)'

  const homePens = penalties.filter(p => p.team === 'home')
  const awayPens = penalties.filter(p => p.team === 'away')
  const hasPenalties = penalties.length > 0

  const isFT = period === 'FT' || period === 'FT · ETT'
  const isOT = period === 'OT'
  const maxMinutes = isOT ? 105 : 90

  // Ticker text — join and repeat for scroll
  const tickerFull = ticker.join('  ·  ')

  return (
    <div className="scoreboard-root">
      {/* Scanline texture */}
      <div className="scoreboard-scanlines" />

      {/* SM-FINAL band */}
      {isPlayoffFinal && (
        <div className="scoreboard-final-band">
          <span className="scoreboard-final-band-label">SM-FINAL</span>
          {finalTier && (
            <span className="scoreboard-final-band-tier">{finalTier}</span>
          )}
        </div>
      )}

      {/* Main score module */}
      <div className={`module-main${flashSide ? ` score-flash-${flashSide}` : ''}`}>
        {/* Home */}
        <div className="scoreboard-team-home">
          <span className="scoreboard-team-code" style={{ color: homeColor }}>{homeCode}</span>
          <div className={flashSide === 'home' ? 'score-flash-active' : ''}>
            <SevenSegText
              text={String(homeScore)}
              size="lg"
              color={homeColor}
              glowColor={flashSide === 'home' ? 'rgba(255,170,0,0.7)' : undefined}
            />
          </div>
        </div>

        {/* Center — period + time */}
        <div className="scoreboard-center">
          <div>
            <span className="scoreboard-period-dot">·</span>
          </div>
          <div className="scoreboard-clock-row">
            <SevenSegText text={pad2(minute)} size="md" color="var(--led-amber)" />
            <SevenSegColon size="md" color="var(--led-amber)" />
            <SevenSegText text={pad2(second)} size="md" color="var(--led-amber)" />
          </div>
          <span className={`scoreboard-period-tag ${isFT ? 'scoreboard-period-tag-ft' : 'scoreboard-period-tag-live'}`}>
            {period}
          </span>
        </div>

        {/* Away */}
        <div className="scoreboard-team-away">
          <span className="scoreboard-team-code" style={{ color: awayColor }}>{awayCode}</span>
          <div className={flashSide === 'away' ? 'score-flash-active' : ''}>
            <SevenSegText
              text={String(awayScore)}
              size="lg"
              color={awayColor}
              glowColor={flashSide === 'away' ? 'rgba(255,170,0,0.7)' : undefined}
            />
          </div>
        </div>
      </div>

      {/* Penalty strip */}
      {hasPenalties && (
        <div className="pen-strip">
          <PenSlot entry={homePens[0] ?? null} />
          <PenSlot entry={awayPens[0] ?? null} />
        </div>
      )}

      {/* Ticker text */}
      <div className="scoreboard-ticker-wrap">
        <div
          className="scoreboard-ticker-inner"
          style={{
            transform: isFT ? 'none' : `translateX(${tickerOffset % (tickerFull.length * 7.5)}px)`,
          }}
        >
          {[tickerFull, tickerFull].map((t, ri) => (
            <span key={ri} className="scoreboard-ticker-text">
              {t.split('·').map((seg, i) => (
                <span key={i} className={i % 2 === 0 ? 'scoreboard-ticker-seg-primary' : 'scoreboard-ticker-seg-secondary'}>
                  {seg.trim()}{i < t.split('·').length - 1 ? ' · ' : ''}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="scoreboard-timeline">
        {/* Tick marks */}
        {[15, 30, 60, 75].map(tick => {
          const pct = (tick / maxMinutes) * 100
          return (
            <div key={tick} className="scoreboard-tick" style={{ left: `${pct}%` }}>
              <span className="scoreboard-tick-label">{tick}</span>
            </div>
          )
        })}

        {/* Halftime line */}
        <div className="scoreboard-halftime-line" />

        {/* Penalty bands — dynamic positioning stays inline */}
        {penalties.map((p, i) => {
          const startPct = (Math.max(0, minute - p.secondsLeft / 60) / maxMinutes) * 100
          const endPct = (minute / maxMinutes) * 100
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${startPct}%`,
              width: `${Math.max(1, endPct - startPct)}%`,
              top: p.team === 'home' ? 0 : '50%',
              height: '50%',
              background: 'repeating-linear-gradient(45deg, rgba(255,170,0,0.12) 0px, rgba(255,170,0,0.12) 1px, transparent 1px, transparent 3px)',
            }} />
          )
        })}

        {/* Goal marks — dynamic positioning stays inline */}
        {events.map((ev, i) => {
          const pct = (ev.minute / maxMinutes) * 100
          const isHome = ev.team === 'home'
          const color = isHome ? 'var(--home-mark)' : 'var(--away-mark)'
          return (
            <div key={i} style={{
              position: 'absolute', left: `${pct}%`,
              top: isHome ? -5 : undefined,
              bottom: isHome ? undefined : -5,
              transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: color,
                boxShadow: `0 0 4px ${color}`,
                flexShrink: 0,
              }} />
              <div style={{
                width: 1, height: '100%',
                background: color, opacity: 0.5, flexShrink: 0,
                position: 'absolute', top: isHome ? 6 : undefined, bottom: isHome ? undefined : 6,
                left: '50%', transform: 'translateX(-50%)',
              }} />
            </div>
          )
        })}

        {/* Now marker — dynamic positioning stays inline */}
        {showNowMarker && !isFT && (() => {
          const pct = (minute / maxMinutes) * 100
          return (
            <div style={{
              position: 'absolute',
              left: `${Math.min(pct, 98)}%`,
              top: -4, bottom: -4,
              width: 2,
              background: 'var(--now-mark)',
              boxShadow: '0 0 6px var(--now-mark)',
              borderRadius: 1,
            }} />
          )
        })()}
      </div>
    </div>
  )
}
