import '../../styles/tabs.css'
import { dotColor } from './Dot'

export interface TabDef {
  id: string
  label: string
  dot?: 'accent' | 'danger' | null
}

interface TabBarProps {
  tabs: TabDef[]
  activeId: string
  onSelect: (id: string) => void
  /** 'segment' (default) = equal-width underline-aktiv (≤5 flikar). 'pills' = scrollande pill-rad. */
  variant?: 'segment' | 'pills'
}

export function TabBar({ tabs, activeId, onSelect, variant = 'segment' }: TabBarProps) {
  if (variant === 'segment') {
    return (
      <div className="tab-bar tab-bar-segment" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeId === tab.id}
            onClick={() => onSelect(tab.id)}
            className={`tab-bar-seg-btn${activeId === tab.id ? ' tab-bar-seg-btn-active' : ''}`}
          >
            {tab.label}
            {tab.dot && (
              <span className="tab-bar-dot" style={{ background: dotColor(tab.dot) }} />
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="tab-bar tab-bar-pills" role="tablist">
      <div className="tab-bar-scroll">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeId === tab.id}
            onClick={() => onSelect(tab.id)}
            className={`tab-bar-pill${activeId === tab.id ? ' tab-bar-pill-active' : ''}`}
          >
            {tab.label}
            {tab.dot && (
              <span className="tab-bar-dot" style={{ background: dotColor(tab.dot) }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
