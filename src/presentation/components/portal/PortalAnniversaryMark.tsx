import { useGameStore } from '../../store/gameStore'
import { pickAnniversaryMarkCopy } from '../../../domain/data/anniversaryMarkText'
import { resolveAnniversaryEcho } from '../../../domain/services/portal/atmosphereResolver'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props { game: SaveGame }

// PORTAL-TAKREGEL (2026-08-09): urvalslogiken (elim-anslag-väntan, big-eko-
// filter, tom-copy-koll) flyttad till atmosphereResolver.ts:s
// resolveAnniversaryEcho — samma funktion PortalScreen.tsx:s prioritets-
// urval anropar. Ingen duplicerad gate-kedja kvar här.
export function PortalAnniversaryMark({ game }: Props) {
  const markAnniversaryAcknowledged = useGameStore(s => s.markAnniversaryAcknowledged)

  const bigEcho = resolveAnniversaryEcho(game)
  if (!bigEcho) return null

  const rawCopy = pickAnniversaryMarkCopy(bigEcho, game)

  // Resolva {subject} → spelarnamn eller klubbnamn
  const subject = (() => {
    if (bigEcho.subjectPlayerId) {
      const p = game.players.find(pl => pl.id === bigEcho.subjectPlayerId)
      return p ? p.lastName : ''
    }
    if (bigEcho.subjectClubId) {
      const c = game.clubs.find(cl => cl.id === bigEcho.subjectClubId)
      return c ? (c.shortName ?? c.name.split(' ')[0]) : ''
    }
    return ''
  })()
  const resolve = (s: string) => subject ? s.replace(/\{subject\}/g, subject) : s

  const copy = {
    eyebrow: rawCopy.eyebrow,
    quote: resolve(rawCopy.quote),
    helper: resolve(rawCopy.helper),
  }

  const isTriumph = bigEcho.outcome === 'won'
  const accentColor = isTriumph ? 'var(--gold)' : 'var(--danger)'
  const bgAlpha = isTriumph ? 'color-mix(in srgb, var(--gold) 6%, transparent)' : 'color-mix(in srgb, var(--danger) 6%, transparent)'
  const borderTopColor = isTriumph ? 'color-mix(in srgb, var(--gold) 35%, transparent)' : 'color-mix(in srgb, var(--danger) 30%, transparent)'
  const borderBottomColor = isTriumph ? 'color-mix(in srgb, var(--gold) 12%, transparent)' : 'color-mix(in srgb, var(--danger) 10%, transparent)'

  return (
    <div
      className="portal-anniversarymark"
      onClick={() => markAnniversaryAcknowledged(bigEcho.eventId)}
      style={{
        borderTopColor,
        borderBottomColor,
        background: `linear-gradient(180deg, ${bgAlpha} 0%, transparent 100%)`,
      }}
    >
      <div
        className="portal-anniversarymark-eyebrow"
        style={{ color: accentColor }}
      >
        {copy.eyebrow}
      </div>
      <div className="portal-anniversarymark-quote">"{copy.quote}"</div>
      {copy.helper && (
        <div className="portal-anniversarymark-helper">{copy.helper}</div>
      )}
    </div>
  )
}
