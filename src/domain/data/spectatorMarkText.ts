import type { SaveGame } from '../entities/SaveGame'
import { isManagedClubSpectator } from './seasonPhases'

interface SpectatorMarkCopy {
  eyebrow: string
  quote: string
  helper: string
}

/**
 * Tre kontexter:
 * - eliminated_in_playoff: managed deltog i slutspel, åkte ut
 * - never_in_playoff: managed kvalade inte till slutspel (8:e+)
 * - season_winding_down: sista omgångarna före säsongsslut
 *
 * Pickern väljer kontext baserat på SaveGame.playoffBracket-state.
 */
const VARIANTS_ELIMINATED: SpectatorMarkCopy[] = [
  {
    eyebrow: '⬩ Säsongen fortsätter utan oss ⬩',
    quote: 'Andra spelar nu. Vi ser på.',
    helper: 'Truppen finns kvar. Tiden räknas.',
  },
  {
    eyebrow: '⬩ Slutspelet rullar vidare ⬩',
    quote: 'Vi är ute. Bandyn pågår ändå.',
    helper: 'Använd veckorna. De kommer inte tillbaka.',
  },
]

const VARIANTS_NEVER_IN_PLAYOFF: SpectatorMarkCopy[] = [
  {
    eyebrow: '⬩ Vi var inte med i år ⬩',
    quote: 'Slutspelet börjar utan oss.',
    helper: 'Höstens jobb börjar tidigare än vi tänkt.',
  },
  {
    eyebrow: '⬩ Slutspelet för de andra ⬩',
    quote: 'Åttondeplats blev åttondeplats.',
    helper: 'Det finns att lära av dem som står kvar.',
  },
]

/**
 * Returnerar passande copy baserat på vad som hände i säsongen.
 * managedClubInBracket → eliminerad-i-playoff-variant
 * Annars → aldrig-i-playoff-variant.
 */
export function pickSpectatorMarkCopy(game: SaveGame): SpectatorMarkCopy {
  if (!isManagedClubSpectator(game)) {
    // Fallback (ska inte hända i normal användning)
    return VARIANTS_ELIMINATED[0]
  }

  const allSeries = [
    ...(game.playoffBracket?.quarterFinals ?? []),
    ...(game.playoffBracket?.semiFinals ?? []),
    ...(game.playoffBracket?.final ? [game.playoffBracket.final] : []),
  ]
  const managedInBracket = allSeries.some(s =>
    s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
  )

  const pool = managedInBracket ? VARIANTS_ELIMINATED : VARIANTS_NEVER_IN_PLAYOFF
  const seed = game.currentSeason + game.managedClubId.charCodeAt(0)
  return pool[seed % pool.length]
}
