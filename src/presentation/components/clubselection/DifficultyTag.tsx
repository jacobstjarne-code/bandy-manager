interface Props {
  difficulty: 'easy' | 'medium' | 'hard'
}

const LABEL: Record<Props['difficulty'], string> = {
  easy: 'LÄTT',
  medium: 'MEDEL',
  hard: 'SVÅR',
}

const COLOR: Record<Props['difficulty'], string> = {
  easy: 'var(--success)',
  medium: 'var(--gold)',
  hard: 'var(--danger)',
}

export function DifficultyTag({ difficulty }: Props) {
  const color = COLOR[difficulty]
  return (
    <span
      style={{
        fontSize: 8,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        padding: '3px 7px',
        borderRadius: 3,
        fontWeight: 700,
        flexShrink: 0,
        marginLeft: 10,
        color,
        border: `1px solid ${color}`,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
      }}
    >
      {LABEL[difficulty]}
    </span>
  )
}
