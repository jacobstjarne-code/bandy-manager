interface TabBarProps<T extends string> {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}

export function TabBar<T extends string>({ tabs, active, onChange }: TabBarProps<T>) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '8px 10px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-surface)',
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              padding: '6px 4px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '1.2px',
              color: isActive ? 'var(--text-light)' : 'var(--text-muted)',
              background: isActive ? 'var(--accent)' : 'transparent',
              border: isActive ? 'none' : '1px solid var(--border)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
