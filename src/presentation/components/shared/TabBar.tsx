import '../../styles/tabs.css'

export interface TabDef {
  id: string
  label: string
  dot?: 'accent' | 'danger' | null
}

interface TabBarProps {
  tabs: TabDef[]
  activeId: string
  onSelect: (id: string) => void
}

export function TabBar({ tabs, activeId, onSelect }: TabBarProps) {
  return (
    <div className="tab-bar" role="tablist">
      <div className="tab-bar-scroll">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeId === tab.id}
            onClick={() => onSelect(tab.id)}
            className={`btn ${activeId === tab.id ? 'btn-copper' : 'btn-ghost'} tab-bar-btn`}
          >
            {tab.label}
            {tab.dot && (
              <span
                className="tab-bar-dot"
                style={{ background: tab.dot === 'danger' ? 'var(--danger)' : 'var(--accent)' }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="tab-bar-fade" />
    </div>
  )
}
