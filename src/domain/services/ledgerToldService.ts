import type {
  EventLedgerEntry,
  LedgerToldMark,
  LedgerToldRegistry,
  NarrativeSurface,
} from '../entities/Narrative'
import type { SaveGame } from '../entities/SaveGame'
import { currentChronology, type CurrentChronology } from './currentChronology'

/** Identiteten är exakt den som SPEC_BERATTAREN §4 låser. */
export function ledgerPostKey(
  entry: Pick<EventLedgerEntry, 'type' | 'semanticKey' | 'season' | 'matchday'>,
): string {
  return JSON.stringify([entry.type, entry.semanticKey, entry.season, entry.matchday])
}

export function toldMarksFor(
  registry: LedgerToldRegistry | undefined,
  entry: Pick<EventLedgerEntry, 'type' | 'semanticKey' | 'season' | 'matchday'>,
): readonly LedgerToldMark[] {
  return registry?.[ledgerPostKey(entry)] ?? []
}

/**
 * Ren, idempotent skrivväg. En React-remount eller ett omtag i samma
 * matchdag får inte skapa flera kvitton för samma faktiska visning.
 */
export function markLedgerPostTold(
  registry: LedgerToldRegistry | undefined,
  entry: Pick<EventLedgerEntry, 'type' | 'semanticKey' | 'season' | 'matchday'>,
  surface: NarrativeSurface,
  chronology: Pick<CurrentChronology, 'season' | 'matchday'>,
): LedgerToldRegistry {
  const key = ledgerPostKey(entry)
  const current = registry ?? {}
  const marks = current[key] ?? []
  const duplicate = marks.some(mark =>
    mark.surface === surface
    && mark.season === chronology.season
    && mark.matchday === chronology.matchday
  )
  if (duplicate) return current

  return {
    ...current,
    [key]: [...marks, { surface, season: chronology.season, matchday: chronology.matchday }],
  }
}

/**
 * Gemensam kvittoväg för ytor som bär liggarpostens stabila nyckel men inte
 * hela posten. Ogiltiga eller redan kvitterade nycklar är rena no-op:s.
 */
export function recordLedgerPostToldByKey(
  game: SaveGame,
  postKey: string | undefined,
  surface: NarrativeSurface,
): SaveGame {
  if (!postKey) return game
  const post = (game.eventLedger ?? []).find(candidate => ledgerPostKey(candidate) === postKey)
  if (!post) return game
  const ledgerTold = markLedgerPostTold(
    game.ledgerTold,
    post,
    surface,
    currentChronology(game),
  )
  return ledgerTold === game.ledgerTold ? game : { ...game, ledgerTold }
}
