import { useRef, useState, useEffect, useCallback } from 'react'
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [fade, setFade] = useState({ left: false, right: false })

  const updateFade = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setFade({
      left: scrollLeft > 1,
      right: scrollLeft + clientWidth < scrollWidth - 1,
    })
  }, [])

  useEffect(() => {
    updateFade()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateFade, { passive: true })
    window.addEventListener('resize', updateFade)
    return () => {
      el.removeEventListener('scroll', updateFade)
      window.removeEventListener('resize', updateFade)
    }
  }, [updateFade, tabs.length])

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
    <div className="tab-bar" role="tablist">
      <div className="tab-bar-scroll" ref={scrollRef}>
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
              <span className="tab-bar-dot" style={{ background: dotColor(tab.dot) }} />
            )}
          </button>
        ))}
      </div>
      {fade.left && <div className="tab-bar-fade tab-bar-fade-left" />}
      {fade.right && <div className="tab-bar-fade tab-bar-fade-right" />}
    </div>
  )
}
