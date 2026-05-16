interface Props {
  roundsLeft: number
  totalRounds: number
}

export function CooldownRow({ roundsLeft, totalRounds }: Props) {
  if (roundsLeft <= 0) return null

  const label = `${roundsLeft} omgång${roundsLeft === 1 ? '' : 'ar'} kvar`

  return (
    <div className="portal-cooldown-row">
      <span className="portal-cooldown-label">
        <span className="portal-cooldown-icon">🕐</span>
        <span>{label}</span>
      </span>
      <span className="portal-cooldown-dots">
        {[...Array(totalRounds)].map((_, i) => (
          <span
            key={i}
            className={`portal-cooldown-dot ${i < roundsLeft ? 'portal-cooldown-dot-left' : ''}`}
          />
        ))}
      </span>
    </div>
  )
}
