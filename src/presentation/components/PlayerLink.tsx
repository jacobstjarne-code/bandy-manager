import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

interface PlayerLinkProps {
  playerId: string
  name: string
  style?: React.CSSProperties
}

export function PlayerLink({ playerId, name, style }: PlayerLinkProps) {
  const navigate = useNavigate()
  const managedClubId = useGameStore(s => s.game?.managedClubId)
  const player = useGameStore(s => s.game?.players.find(p => p.id === playerId))
  const isOwned = player?.clubId === managedClubId

  return (
    <button
      onClick={e => {
        e.stopPropagation()
        if (isOwned) {
          navigate('/game/squad', { state: { highlightPlayer: playerId } })
        } else {
          navigate('/game/transfers', { state: { highlightPlayer: playerId } })
        }
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
