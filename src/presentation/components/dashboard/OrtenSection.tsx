import type { Moment } from '../../../domain/entities/SaveGame'
import { SectionLabel } from '../SectionLabel'

const SOURCE_EMOJI: Record<string, string> = {
  derby:            '⚔️',
  captain_crisis:   '📣',
  nemesis_signed:   '🤝',
  mecenat_costshare: '💼',
  sponsor_reaction: '📢',
  star_injury:      '🩹',
  mecenat_left:     '👋',
  transfer_story:   '↗️',
}

function matchdayAge(momentMatchday: number, currentMatchday: number): string {
  const diff = currentMatchday - momentMatchday
  if (diff <= 0) return 'denna omgång'
  if (diff === 1) return 'förra omgången'
  return `${diff} omgångar sedan`
}

interface Props {
  moments: Moment[]
  currentMatchday: number
}

export function OrtenSection({ moments, currentMatchday }: Props) {
  if (moments.length === 0) return null

  return (
    <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
      <SectionLabel style={{ marginBottom: 8 }}>🏘 ORTEN</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {moments.slice(0, 5).map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
              {SOURCE_EMOJI[m.source] ?? '📍'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>
                {m.title}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 2px', lineHeight: 1.45, fontFamily: 'var(--font-body)' }}>
                {m.body}
              </p>
              <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)' }}>
                {matchdayAge(m.matchday, currentMatchday)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
