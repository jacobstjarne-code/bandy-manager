// gold reserveras för SM-final/Cup-final — se designsystem regel 4
export type ScoreBlockVariant = 'win' | 'loss' | 'draw' | 'derby' | 'gold' | 'subtle'

interface ScoreBlockProps {
  score: string
  label?: string
  variant?: ScoreBlockVariant
  compact?: boolean
}

export const MAX_LABEL_LENGTH = 11

export function ScoreBlock({ score, label, variant, compact }: ScoreBlockProps) {
  const cls = [
    'score-block',
    variant ?? '',
    compact ? 'compact' : '',
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
