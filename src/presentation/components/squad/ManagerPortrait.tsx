import { getManagerInitials } from '../../../domain/services/managerProfileService'

interface Props {
  displayName: string
  seasonsAtClub: number
  burnoutScore?: number
  size?: number
}

export function ManagerPortrait({ displayName, seasonsAtClub, burnoutScore = 0, size = 54 }: Props) {
  const initials = getManagerInitials(displayName)
  const isVeteran = seasonsAtClub >= 3
  const isLegend  = seasonsAtClub >= 6
  const showBurnoutDot = burnoutScore >= 70

  const ringSize  = size + 6
  const ringOffset = -3

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Veteran/legend ring */}
      {isVeteran && (
        <div style={{
          position: 'absolute',
          inset: ringOffset,
          width: ringSize, height: ringSize,
          borderRadius: '50%',
          border: `2px solid ${isLegend ? 'var(--gold)' : 'color-mix(in srgb, var(--accent) 55%, transparent)'}`,
          boxShadow: isLegend ? '0 0 8px color-mix(in srgb, var(--gold) 45%, transparent)' : 'none',
          zIndex: 0,
          pointerEvents: 'none',
        }} />
      )}

      {/* Portrait circle */}
      <div style={{
        width: size, height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--bg-leather) 0%, var(--accent-deep) 100%)',
        border: '2px solid var(--border-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: Math.round(size * 0.37),
          fontWeight: 700,
          color: 'rgba(255,255,255,0.9)',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          {initials}
        </span>
      </div>

      {/* Burnout dot */}
      {showBurnoutDot && (
        <div style={{
          position: 'absolute',
          bottom: 1, right: 1,
          width: 10, height: 10,
          borderRadius: '50%',
          background: 'var(--danger)',
          border: '2px solid var(--bg-surface)',
          zIndex: 2,
        }} />
      )}
    </div>
  )
}
