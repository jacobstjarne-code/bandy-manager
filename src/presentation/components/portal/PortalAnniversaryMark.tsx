import { useGameStore } from '../../store/gameStore'
import { pickAnniversaryMarkCopy } from '../../../domain/data/anniversaryMarkText'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props { game: SaveGame }

export function PortalAnniversaryMark({ game }: Props) {
  const markAnniversaryAcknowledged = useGameStore(s => s.markAnniversaryAcknowledged)

  if (!game.activeAnniversaries || game.activeAnniversaries.length === 0) return null

  // ElimAnslag-prioritet: om managed club är eliminerad men elim-anslaget inte är seen — vänta
  if (game.playoffBracket) {
    const managedClubId = game.managedClubId
    const { seenAnslag } = game
    const bracket = game.playoffBracket

    // Kolla om managed club är eliminerad: inte med i någon aktiv serie
    const allSeries = [
      ...bracket.quarterFinals,
      ...bracket.semiFinals,
      ...(bracket.final ? [bracket.final] : []),
    ]
    // En serie utan winnerId är fortfarande aktiv
    const activeSeries = allSeries.filter(s =>
      s.winnerId === null &&
      (s.homeClubId === managedClubId || s.awayClubId === managedClubId)
    )
    const isEliminated = activeSeries.length === 0

    if (isEliminated) {
      // Kontrollera om elim-anslaget visats
      const elimSeen = (seenAnslag ?? []).some(k =>
        k.includes('playoff_eliminated')
      )
      if (!elimSeen) return null
    }
  }

  // Välj big eko med högst significance
  const bigEchos = game.activeAnniversaries.filter(a => a.echoSize === 'big')
  if (bigEchos.length === 0) return null

  const bigEcho = bigEchos.reduce((best, a) =>
    a.significance > best.significance ? a : best
  )

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

  // Om ingen copy finns (Opus inte levererat ännu) — visa ingenting
  if (!copy.quote) return null

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
