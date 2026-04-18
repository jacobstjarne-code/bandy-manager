interface TabBarProps<T extends string> {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}

export function TabBar<T extends string>({ tabs, active, onChange }: TabBarProps<T>) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-surface)',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: 10,
            fontWeight: tab.id === active ? 700 : 500,
            letterSpacing: '1.5px',
            color: tab.id === active ? 'var(--accent)' : 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${tab.id === active ? 'var(--accent)' : 'transparent'}`,
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
