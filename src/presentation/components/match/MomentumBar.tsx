interface MomentumBarProps {
  homeActions: number
  awayActions: number
  intensity: 'low' | 'medium' | 'high'
}

export function MomentumBar({ homeActions, awayActions, intensity }: MomentumBarProps) {
  const total = homeActions + awayActions
  const homePercent = total > 0 ? (homeActions / total) * 100 : 50

  const intensityIcon = intensity === 'high' ? '🔥' : intensity === 'medium' ? '⚡' : '·'
  const intensityLabel = intensity === 'high' ? 'INTENSIVT' : intensity === 'medium' ? 'AKTIVT' : 'LUGNT'

  return (
    <div className="momentum-stalvallen">
      <div className="momentum-header">
        <span className="momentum-side-label">HEMMA</span>
        <span className="momentum-intensity-tag">
          {intensityIcon} {intensityLabel}
        </span>
        <span className="momentum-side-label">BORTA</span>
      </div>
      <div className="momentum-bar">
        <div
          className="momentum-bar-home"
          style={{ width: `${homePercent}%` }}
        />
      </div>
    </div>
  )
}
