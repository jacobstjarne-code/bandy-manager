import type { CardRenderProps } from '../portalTypes'

/** Minimal-kort: klackens stämning inför derby. */
export function KlackenMoodMinimal({ game }: CardRenderProps) {
  const sg = game.supporterGroup
  if (!sg) return null

  const moodLabel = sg.mood >= 80
    ? 'peppad'
    : sg.mood >= 60
    ? 'redo'
    : sg.mood >= 40
    ? 'avvaktande'
    : 'tyst'

  const moodColor = sg.mood >= 60 ? 'var(--success)' : 'var(--text-muted)'

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        color: 'var(--text-muted)',
        fontSize: 8,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}>
        Klacken
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        color: moodColor,
        fontSize: 13,
        fontWeight: 600,
      }}>
        {moodLabel}
      </div>
    </div>
  )
}
