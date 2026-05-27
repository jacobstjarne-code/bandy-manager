// gold reserveras för SM-final/Cup-final — se designsystem regel 4
export type ScoreBlockVariant = 'win' | 'loss' | 'draw' | 'derby' | 'gold' | 'subtle'
export type ScoreBlockSize = 'compact' | 'default' | 'hero'

interface ScoreBlockProps {
  score: string
  label?: string
  variant?: ScoreBlockVariant
  size?: ScoreBlockSize
  /** @deprecated Använd size="compact" */
  compact?: boolean
  light?: boolean
}

export const MAX_LABEL_LENGTH = 11

export function ScoreBlock({ score, label, variant, size, compact, light }: ScoreBlockProps) {
  const resolvedSize = size ?? (compact ? 'compact' : 'default')
  const cls = [
    'score-block',
    variant ?? '',
    resolvedSize !== 'default' ? resolvedSize : '',
    light ? 'light' : '',
  ].filter(Boolean).join(' ')

  // Labels över 11 tecken utelämnas per designsystem regel 3
  const visibleLabel = label && label.length <= MAX_LABEL_LENGTH ? label : undefined

  return (
    <div className={cls}>
      <div className="score-block-num tabular">{score}</div>
      {visibleLabel && <div className="score-block-label">{visibleLabel}</div>}
    </div>
  )
}
