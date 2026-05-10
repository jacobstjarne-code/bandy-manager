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
    return (
      <div className="pen-slot empty" style={{
        flex: 1, padding: '4px 8px', borderRadius: 4,
        background: 'rgba(255,255,255,0.03)',
        border: '1px dashed rgba(255,255,255,0.08)',
        minHeight: 28,
      }} />
    )
  }
  const mm = Math.floor(entry.secondsLeft / 60)
  const ss = entry.secondsLeft % 60
  return (
    <div className="pen-slot" style={{
      flex: 1, padding: '4px 8px', borderRadius: 4,
      background: 'rgba(255,170,0,0.08)',
      border: '1px solid rgba(255,170,0,0.25)',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ color: 'var(--led-amber)', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>▲</span>
      <span style={{ color: 'var(--led-amber)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{entry.num}</span>
      <span style={{ color: 'rgba(245,241,235,0.7)', fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.name}
      </span>
      <span style={{ color: 'var(--led-amber)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>
        {pad2(mm)}:{pad2(ss)}
      </span>
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
    <div
      style={{
        background: 'var(--bg-leather-dk)',
        borderBottom: '2px solid rgba(196,122,58,0.3)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {/* Scanline texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.018) 3px, rgba(255,255,255,0.018) 4px)',
      }} />

      {/* SM-FINAL band */}
      {isPlayoffFinal && (
        <div style={{
          background: 'rgba(196,122,58,0.15)',
          borderBottom: '1px solid rgba(196,122,58,0.2)',
          padding: '4px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
            letterSpacing: '3px', color: 'var(--copper)',
            textTransform: 'uppercase',
          }}>SM-FINAL</span>
          {finalTier && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(196,122,58,0.6)', letterSpacing: '1px' }}>
              {finalTier}
            </span>
          )}
        </div>
      )}

      {/* Main score module */}
      <div
        className={`module-main${flashSide ? ` score-flash-${flashSide}` : ''}`}
        style={{
          background: '#0A0908',
          margin: '8px 10px 0',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8,
        }}
      >
        {/* Home */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
            letterSpacing: '2px', color: homeColor, textTransform: 'uppercase',
            opacity: 0.85,
          }}>{homeCode}</span>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ color: 'var(--led-red)', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>·</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <SevenSegText text={pad2(minute)} size="md" color="var(--led-amber)" />
            <SevenSegColon size="md" color="var(--led-amber)" />
            <SevenSegText text={pad2(second)} size="md" color="var(--led-amber)" />
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
            letterSpacing: '2px',
            background: isFT ? 'rgba(196,122,58,0.2)' : 'rgba(255,170,0,0.12)',
            color: isFT ? 'var(--copper)' : 'var(--led-amber)',
            padding: '2px 6px', borderRadius: 3,
            border: `1px solid ${isFT ? 'rgba(196,122,58,0.3)' : 'rgba(255,170,0,0.2)'}`,
          }}>{period}</span>
        </div>

        {/* Away */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
            letterSpacing: '2px', color: awayColor, textTransform: 'uppercase',
            opacity: 0.85,
          }}>{awayCode}</span>
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
        <div style={{
          margin: '4px 10px 0',
          display: 'flex', gap: 6,
        }}>
          <PenSlot entry={homePens[0] ?? null} />
          <PenSlot entry={awayPens[0] ?? null} />
        </div>
      )}

      {/* Ticker text */}
      <div style={{
        margin: '4px 0 0',
        padding: '3px 0',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        overflow: 'hidden',
        height: 20,
      }}>
        <div style={{
          display: 'flex', gap: 32, whiteSpace: 'nowrap',
          transform: isFT ? 'none' : `translateX(${tickerOffset % (tickerFull.length * 7.5)}px)`,
          transition: isFT ? 'none' : 'none',
          padding: '0 12px',
        }}>
          {[tickerFull, tickerFull].map((t, ri) => (
            <span key={ri} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: '14px' }}>
              {t.split('·').map((seg, i) => (
                <span key={i} style={{ color: i % 2 === 0 ? 'rgba(245,241,235,0.75)' : 'rgba(245,241,235,0.35)' }}>
                  {seg.trim()}{i < t.split('·').length - 1 ? ' · ' : ''}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{
        margin: '4px 10px 8px',
        height: 22,
        background: 'var(--line-bg)',
        borderRadius: 3,
        border: '1px solid var(--line-stroke)',
        position: 'relative',
        overflow: 'visible',
      }}>
        {/* Tick marks */}
        {[15, 30, 60, 75].map(tick => {
          const pct = (tick / maxMinutes) * 100
          return (
            <div key={tick} style={{
              position: 'absolute', left: `${pct}%`, top: 0, bottom: 0,
              width: 1, background: 'var(--line-tick)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 6, fontFamily: 'var(--font-mono)', color: 'var(--line-text)', position: 'absolute', bottom: -9 }}>
                {tick}
              </span>
            </div>
          )
        })}

        {/* Halftime line */}
        <div style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0,
          width: 1, background: 'rgba(255,255,255,0.2)',
        }} />

        {/* Penalty bands */}
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

        {/* Goal marks */}
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

        {/* Now marker */}
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
