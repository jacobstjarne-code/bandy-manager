/**
 * CommentaryFeedStalvallen.tsx — Stålvallen commentary feed
 *
 * FIX-19: feed-head, higher contrast, goal border-left
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
  // FIX-48
  matchDone?: boolean
  endResult?: string       // "Forsbacka 9 — 8 Skutskär"
  endSummary?: string      // 1-2 meningar
  endArenaMeta?: string    // "SCHAKTVALLEN · OMG. 2"
  onSeeSummary?: () => void
}

interface FeedEndRowProps {
  result: string
  summary: string
  arenaMeta: string
  onSeeSummary: () => void
}

function FeedEndRow({ result, summary, arenaMeta, onSeeSummary }: FeedEndRowProps) {
  return (
    <div className="feed-end-row">
      <div className="end-head">
        <span className="ft-pill">SLUT</span>
        <span className="end-meta">{arenaMeta}</span>
      </div>
      <div className="end-score"><strong>{result}</strong></div>
      <div className="end-summary">{summary}</div>
      <button className="end-cta" onClick={onSeeSummary}>
        Se sammanfattning →
      </button>
    </div>
  )
}

interface TagStyle {
  label: string
  bg: string
  color: string
}

const TAG_STYLES: Record<TagType, TagStyle> = {
  goal:       { label: 'MÅL',     bg: 'var(--copper)',          color: 'var(--bg-leather-dk)' },
  penalty:    { label: 'STRAFF',  bg: 'var(--copper)',          color: 'var(--bg-leather-dk)' },
  suspension: { label: 'UTV',     bg: 'rgba(255,170,0,0.15)',   color: 'var(--led-amber)' },
  freekick:   { label: 'FRISLAG', bg: 'rgba(255,170,0,0.15)',   color: 'var(--led-amber)' },
  save:       { label: 'RÄDD',    bg: 'rgba(102,255,51,0.12)',  color: 'var(--led-green)' },
  shot:       { label: 'SKOTT',   bg: 'rgba(255,255,255,0.05)', color: 'rgba(245,241,235,0.4)' },
  pass:       { label: 'PASS',    bg: 'rgba(255,255,255,0.05)', color: 'rgba(245,241,235,0.4)' },
  sub:        { label: 'BYTE',    bg: 'rgba(255,255,255,0.05)', color: 'rgba(245,241,235,0.4)' },
  break:      { label: 'SLUTET', bg: 'rgba(255,170,0,0.15)',   color: 'var(--led-amber)' },
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

export function CommentaryFeedStalvallen({ rows, autoScroll = true, matchDone, endResult, endSummary, endArenaMeta, onSeeSummary }: CommentaryFeedStalvallenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevLength = useRef(rows.length)

  useEffect(() => {
    if (!autoScroll) return
    if (rows.length !== prevLength.current && containerRef.current) {
      containerRef.current.scrollTop = 0
    }
    prevLength.current = rows.length
  }, [rows.length, autoScroll])

  return (
    <div ref={containerRef} className="commentary-feed">
      {/* Feed head — FIX-38D: COMMENTARY → MATCHFLÖDE */}
      <div className="commentary-feed-head">
        <span className="live">MATCHFLÖDE</span>
        <span style={{ color: 'rgba(245,241,235,0.45)', letterSpacing: '1.5px' }}>
          SCROLL ↑
        </span>
      </div>

      {/* FIX-48: Slut-rad — FÖRSTA i feeden */}
      {matchDone && endResult && onSeeSummary && (
        <FeedEndRow
          result={endResult}
          summary={endSummary ?? 'Matchen är slut.'}
          arenaMeta={endArenaMeta ?? ''}
          onSeeSummary={onSeeSummary}
        />
      )}

      {rows.map((row, i) => {
        if (row.kind === 'atmosphere') {
          return (
            <div key={i} className="commentary-row-atmosphere">
              <span className="commentary-row-atmosphere-min">—</span>
              {/* FIX-38B: --text-quote-light for regular row text, FIX-38C: font-body (sans-serif) */}
              <span className="commentary-row-atmosphere-text" style={{ color: 'var(--text-quote-light)', fontFamily: 'var(--font-body)' }}>{row.text}</span>
            </div>
          )
        }

        const isGoalRow = row.tag === 'goal' || row.tag === 'penalty'
        return (
          <div
            key={i}
            className={`commentary-row-event${isGoalRow ? ' goal' : ''}`}
          >
            <span className="commentary-event-minute">{row.minute}&apos;</span>
            <div className="commentary-event-body">
              <div className="commentary-event-header">
                <Tag type={row.tag} />
                {row.meta && (
                  <span className="commentary-event-meta">{row.meta}</span>
                )}
              </div>
              {/* FIX-38B: --text-quote-light for regular row text, FIX-38C: font-body (sans-serif) */}
              <div className="commentary-event-text" style={{ color: 'var(--text-quote-light)', fontFamily: 'var(--font-body)' }}>
                {row.text}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
