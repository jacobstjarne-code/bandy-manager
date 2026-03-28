import { useNavigate } from 'react-router-dom'

interface PlayerLinkProps {
  playerId: string
  name: string
  style?: React.CSSProperties
}

export function PlayerLink({ playerId, name, style }: PlayerLinkProps) {
  const navigate = useNavigate()
  return (
    <button
      onClick={e => {
        e.stopPropagation()
        navigate('/game/squad', { state: { highlightPlayer: playerId } })
      }}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        fontWeight: 600,
        fontSize: 'inherit',
        cursor: 'pointer',
        textDecoration: 'underline',
        textDecorationColor: 'rgba(196,122,58,0.4)',
        textUnderlineOffset: 3,
        ...style,
        color: style?.color ?? 'var(--accent)',
      }}
    >
      {name}
    </button>
  )
}
