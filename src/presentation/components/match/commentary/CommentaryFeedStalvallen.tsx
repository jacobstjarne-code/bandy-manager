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
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-mono)',
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: '1px',
      padding: '2px 5px',
      borderRadius: 2,
      background: s.bg,
      color: s.color,
      textTransform: 'uppercase',
      flexShrink: 0,
    }}>
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
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'linear-gradient(180deg, var(--bg-leather-dk) 0%, #211e1a 100%)',
        minHeight: 0,
      }}
    >
      {rows.map((row, i) => {
        if (row.kind === 'atmosphere') {
          return (
            <div key={i} style={{
              padding: '6px 16px',
              borderBottom: '1px solid rgba(196,122,58,0.04)',
              animation: 'fadeInUp 250ms ease-out both',
            }}>
              <span style={{
                fontStyle: 'italic',
                fontSize: 11,
                color: 'rgba(245,241,235,0.35)',
                lineHeight: 1.4,
                fontFamily: 'var(--font-display)',
              }}>
                {row.text}
              </span>
            </div>
          )
        }

        const tagStyle = TAG_STYLES[row.tag]
        return (
          <div key={i} style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(196,122,58,0.06)',
            background: tagStyle.rowBg ?? 'transparent',
            animation: 'fadeInUp 250ms ease-out both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Minute column — fixed 32px */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--led-amber)',
                minWidth: 32,
                flexShrink: 0,
              }}>
                {row.minute}&apos;
              </span>

              <Tag type={row.tag} />

              {row.meta && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'rgba(245,241,235,0.45)',
                  flexShrink: 0,
                }}>
                  {row.meta}
                </span>
              )}
            </div>

            <div style={{ marginTop: 3, paddingLeft: 40 }}>
              <span style={{
                fontSize: 12,
                lineHeight: 1.4,
                color: row.tag === 'goal' || row.tag === 'penalty'
                  ? 'rgba(245,241,235,0.9)'
                  : 'rgba(245,241,235,0.65)',
                fontWeight: row.tag === 'goal' ? 500 : 400,
              }}>
                {row.text}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
