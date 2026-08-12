import { useGameStore } from '../../store/gameStore'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { Z } from '../../utils/zIndices'
import { DecisionChoices } from '../DecisionChoices'

/**
 * GEMENSAM BESLUTSMODELL (2026-08-12): INTE migrerad till DecisionCard.
 * Ceremonin (eyebrow, namn, statistikrad, headline-citat, avskedscitat) är
 * en bespok helskärmslayout, inte en "situation → val"-kortform — det finns
 * ingen wrapper-card att dela, bara en sekvens av fritt placerade textblock.
 * Knapp-lagret delade redan DecisionChoices sedan 2026-07-07 (yta 5b), före
 * DecisionCard-scaffolden fanns.
 */
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
  // Entitets-dedup-grinden (2026-08-12): se EventCardInline.tsx för samma resonemang.
  const entityId = event.relatedBidId ? `bid:${event.relatedBidId}` : `event:${event.id}`

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg-dark)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: Z.modal,
        padding: '0 24px',
      }}
      data-entity-id={entityId}
      data-entity-source="CeremonyRetirement"
    >
      {/* Eyebrow */}
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase',
        color: 'var(--accent)', marginBottom: 24,
      }}>
        🎖️ AVSKED
      </p>

      {/* Name */}
      <h1 className="h-display-md" style={{ color: 'var(--text-light)', textAlign: 'center', letterSpacing: '1px', marginBottom: 4 }}>
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
        Läktaren reser sig en sista gång. Den platsen blir aldrig riktigt någon annans.
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

      {/* Choices — yta 5b (Audit-syntes, 2026-07-07): handrullade knappar → delad
          DecisionChoices, samma komponent som Portal/Granskas övriga event-kort.
          Alla event.choices-fält (id/label/subtitle) mappas rakt av, ingen sträng
          tappad. Första valet primärt, matchar tidigare i===0-beteendet. */}
      <div style={{ width: '100%', maxWidth: 300 }}>
        <DecisionChoices
          choices={event.choices}
          onChoose={(choiceId) => resolveEvent(event.id, choiceId)}
          primaryChoiceId={event.choices[0]?.id}
        />
      </div>
    </div>
  )
}
