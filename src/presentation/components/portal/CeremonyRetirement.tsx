import { useGameStore } from '../../store/gameStore'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { Z } from '../../utils/zIndices'

interface Props {
  game: SaveGame
  event: GameEvent
}

export function CeremonyRetirement({ game, event }: Props) {
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const player = event.relatedPlayerId
    ? game.players.find(p => p.id === event.relatedPlayerId)
    : null
  const playerName = event.sender?.name ?? (player ? `${player.firstName} ${player.lastName}` : 'Spelaren')
  const seasons = player?.careerStats?.seasonsPlayed ?? 0
  const goals = player?.careerStats?.totalGoals ?? 0
  const games = player?.careerStats?.totalGames ?? 0

  // Body contains farewell quote + protégé line + "Vill du erbjuda…"
  // Split at the last sentence starting with "Vill"
  const splitIdx = event.body.lastIndexOf(' Vill du')
  const farewellText = splitIdx > 0 ? event.body.slice(0, splitIdx).trim() : event.body

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-dark)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: Z.modal,
      padding: '0 24px',
    }}>
      {/* Eyebrow */}
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase',
        color: 'var(--accent)', marginBottom: 24,
      }}>
        🎖️ AVSKED
      </p>

      {/* Name */}
      <h1 style={{
        fontSize: 26, fontWeight: 900, color: 'var(--text-light)',
        fontFamily: 'var(--font-display)', textAlign: 'center',
        letterSpacing: '1px', marginBottom: 4,
      }}>
        {playerName}
      </h1>

      {/* Stats row */}
      <p style={{ fontSize: 12, color: 'var(--text-light-secondary)', marginBottom: 24, textAlign: 'center' }}>
        {seasons > 0 && `${seasons} säsonger · `}{games} matcher{goals > 0 && ` · ${goals} mål`}
      </p>

      {/* Ceremony headline — OPUS_COPY */}
      <p style={{
        fontSize: 13, fontStyle: 'italic', fontFamily: 'Georgia, serif',
        color: 'var(--text-light)', lineHeight: 1.7, textAlign: 'center',
        maxWidth: 320, marginBottom: 8,
      }}>
        {/* // OPUS_COPY — en rad om vad spelaren lämnar efter sig i klacken */}
      </p>

      {/* Farewell quote from game event */}
      {farewellText && (
        <p style={{
          fontSize: 12, color: 'var(--text-light-secondary)', fontStyle: 'italic',
          lineHeight: 1.6, textAlign: 'center', maxWidth: 300, marginBottom: 32,
        }}>
          "{farewellText}"
        </p>
      )}

      {/* Choices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
        {event.choices.map((choice, i) => (
          <button
            key={choice.id}
            onClick={() => resolveEvent(event.id, choice.id)}
            style={{
              padding: '13px 16px',
              background: i === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-md)',
              color: i === 0 ? 'var(--bg-dark)' : 'var(--text-light)',
              fontSize: 13, fontWeight: i === 0 ? 700 : 500,
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            {choice.label}
            {choice.subtitle && (
              <span style={{ display: 'block', fontSize: 11, marginTop: 2, opacity: 0.7, fontWeight: 400 }}>
                {choice.subtitle}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
