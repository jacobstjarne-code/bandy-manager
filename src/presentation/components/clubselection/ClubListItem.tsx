interface Props {
  name: string
  isSelected: boolean
  alignment: 'left' | 'center' | 'right'
  onClick: () => void
}

const JUSTIFY: Record<Props['alignment'], string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
}

export function ClubListItem({ name, isSelected, alignment, onClick }: Props) {
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
          background: isSelected ? 'var(--bg-elevated)' : 'rgba(34,29,24,0.85)',
          backdropFilter: 'blur(4px)',
          border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: 6,
          padding: '7px 14px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 12,
          color: isSelected ? 'var(--text-light)' : 'var(--text-secondary)',
          fontWeight: 600,
          boxShadow: isSelected ? '0 0 12px rgba(212,164,96,0.25)' : 'none',
          transition: 'all 0.15s',
          fontFamily: 'var(--font-body)',
        }}
      >
        {name}
      </button>
    </div>
  )
}
