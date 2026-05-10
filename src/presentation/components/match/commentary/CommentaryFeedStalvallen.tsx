/**
 * CommentaryFeedStalvallen.tsx — Stålvallen commentary feed
 *
 * BATCH A-02. Operator-register on dark leather surface.
 * Atmosphere rows var 4-6 entries, no tag/minute.
 * Auto-scroll to bottom on new row (most recent = newest at bottom).
 */
import { useEffect, useRef } from 'react'

export type TagType =
  | 'goal'
  | 'penalty'
  | 'suspension'
  | 'freekick'
  | 'save'
  | 'shot'
  | 'pass'
  | 'sub'
  | 'break'

export type FeedRow =
  | { kind: 'event'; minute: number; tag: TagType; team?: 'home' | 'away'; meta?: string; text: string }
  | { kind: 'atmosphere'; text: string }

interface CommentaryFeedStalvallenProps {
  rows: FeedRow[]
  autoScroll?: boolean
}

interface TagStyle {
  label: string
  bg: string
  color: string
  rowBg?: string
}

const TAG_STYLES: Record<TagType, TagStyle> = {
  goal:       { label: 'MÅL',    bg: 'var(--copper)',         color: 'var(--bg-leather-dk)', rowBg: 'rgba(196,122,58,0.1)' },
  penalty:    { label: 'STRAFF', bg: 'var(--copper)',         color: 'var(--bg-leather-dk)' },
  suspension: { label: 'UTV',    bg: 'rgba(255,170,0,0.15)',  color: 'var(--led-amber)' },
  freekick:   { label: 'FRISLAG',bg: 'rgba(255,170,0,0.15)',  color: 'var(--led-amber)' },
  save:       { label: 'RÄDD',   bg: 'rgba(102,255,51,0.12)', color: 'var(--led-green)' },
  shot:       { label: 'SKOTT',  bg: 'rgba(255,255,255,0.05)',color: 'rgba(245,241,235,0.4)' },
  pass:       { label: 'PASS',   bg: 'rgba(255,255,255,0.05)',color: 'rgba(245,241,235,0.4)' },
  sub:        { label: 'BYTE',   bg: 'rgba(255,255,255,0.05)',color: 'rgba(245,241,235,0.4)' },
  break:      { label: 'SLUTET', bg: 'rgba(255,170,0,0.15)',  color: 'var(--led-amber)' },
}

function Tag({ type }: { type: TagType }) {
  const s = TAG_STYLES[type]
  return (
    <span
      className="commentary-tag"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

export function CommentaryFeedStalvallen({ rows, autoScroll = true }: CommentaryFeedStalvallenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevLength = useRef(rows.length)

  useEffect(() => {
    if (!autoScroll) return
    if (rows.length !== prevLength.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
    prevLength.current = rows.length
  }, [rows.length, autoScroll])

  return (
    <div ref={containerRef} className="commentary-feed">
      {rows.map((row, i) => {
        if (row.kind === 'atmosphere') {
          return (
            <div key={i} className="commentary-row-atmosphere">
              <span className="commentary-row-atmosphere-text">{row.text}</span>
            </div>
          )
        }

        const tagStyle = TAG_STYLES[row.tag]
        const isGoalRow = row.tag === 'goal' || row.tag === 'penalty'
        return (
          <div
            key={i}
            className="commentary-row-event"
            style={{ background: tagStyle.rowBg ?? 'transparent' }}
          >
            <div className="commentary-event-header">
              <span className="commentary-event-minute">{row.minute}&apos;</span>
              <Tag type={row.tag} />
              {row.meta && (
                <span className="commentary-event-meta">{row.meta}</span>
              )}
            </div>
            <div className="commentary-event-body">
              <span
                className="commentary-event-text"
                style={{
                  color: isGoalRow ? 'rgba(245,241,235,0.9)' : 'rgba(245,241,235,0.65)',
                  fontWeight: row.tag === 'goal' ? 500 : 400,
                }}
              >
                {row.text}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
