import { DifficultyTag } from './DifficultyTag'

interface Props {
  name: string
  /** Samma svårighetsgrad som OfferCard visar — hela 12-klubbslistan ska kunna
      jämföras, inte bara de tre föreslagna (audit 2026-08-29). */
  difficulty: 'easy' | 'medium' | 'hard'
  isSelected: boolean
  alignment: 'left' | 'center' | 'right'
  onClick: () => void
}

const JUSTIFY: Record<Props['alignment'], string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
}

export function ClubListItem({ name, difficulty, isSelected, alignment, onClick }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: JUSTIFY[alignment],
        marginBottom: 4,
      }}
    >
      <button
        onClick={onClick}
        style={{
          background: isSelected ? 'var(--bg-dark-elevated)' : 'var(--bg-dark-surface)',
          border: `1px solid ${isSelected ? 'var(--match-gold)' : 'var(--bg-leather)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '7px 14px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 12,
          color: isSelected ? 'var(--text-light)' : 'var(--text-light-secondary)',
          fontWeight: 600,
          boxShadow: isSelected ? '0 0 12px color-mix(in srgb, var(--match-gold) 25%, transparent)' : 'none',
          transition: 'all 0.15s',
          fontFamily: 'var(--font-body)',
        }}
      >
        {name}
        <DifficultyTag difficulty={difficulty} />
      </button>
    </div>
  )
}
