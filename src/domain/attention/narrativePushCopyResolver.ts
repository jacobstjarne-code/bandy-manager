import type { SaveGame } from '../entities/SaveGame'
import type { AgendaItem } from '../services/redaktorenService'
import { resolveSubjectName } from '../services/momentLedgerService'
import { getNextManagedFixture } from '../services/portal/triggers/matchTriggers'
import type { AttentionCategory, AttentionVoice } from './types'
import type { NarrativePushCopy, NarrativePushCopyResolver } from './narrativePushAdapter'

/**
 * Läser/skriver "vilken röst visades sist för detta scenario" så resolvern
 * kan hålla registrets §8.1-regel (aldrig samma variant två leveranser i
 * rad). Domänlagret ska vara rent — nyckel-persistensen (localStorage i
 * produktion) hör hemma i infrastrukturlagret, se
 * `src/infrastructure/attention/attentionClient.ts`s egna nycklar
 * (IDENTITY_KEY/ENABLED_KEY) för samma mönster.
 */
export interface PushCopyRotationStore {
  getLastVoice(scenarioKey: string): AttentionVoice | undefined
  setLastVoice(scenarioKey: string, voice: AttentionVoice): void
}

const WEEKDAYS = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']

/** Registret §8.4: "{dag}" renderas som veckodag ("på lördag"). */
function weekdayLabel(isoDate: string): string {
  return WEEKDAYS[new Date(`${isoDate}T00:00:00`).getDay()]
}

function pickVoice(
  rotation: PushCopyRotationStore,
  scenarioKey: string,
  options: readonly [AttentionVoice, AttentionVoice],
): AttentionVoice {
  const last = rotation.getLastVoice(scenarioKey)
  const chosen = last === options[0] ? options[1] : options[0]
  rotation.setLastVoice(scenarioKey, chosen)
  return chosen
}

function nextOpponentClubId(game: SaveGame, fixture: SaveGame['fixtures'][number]): string {
  return fixture.homeClubId === game.managedClubId ? fixture.awayClubId : fixture.homeClubId
}

/**
 * stickiness-copy-roster (register LÅST 2026-09-04, wiring 2026-09-06) —
 * löser `narrative_return`-kategorins två sub-scenarier som har en verklig,
 * levande liggarproducent idag: revansch (`buildMatchResultLedgerEntry`,
 * clubMemoryEventBuilders.ts, skrivs i roundProcessor.ts) och ex-spelare i
 * motståndarlaget (`transferProcessor.ts:521`).
 *
 * Tre av registrets fem `memory.*`-scenarier är MEDVETET INTE wired här —
 * ingen producent finns att läsa från, en gissad payload-form hade varit
 * påhittad data:
 *  - "återkomst till gamla klubben" — ingen liggartyp bär managerns
 *    klubbhistorik idag.
 *  - "återkommande taktiskt misslyckande" (B12-mönster) — kräver en ny
 *    treomgångars-detektor mot MatchEvent.contributingFactors; ingen
 *    liggarpost existerar för detta ännu.
 *  - nemesis (`nemesis_signed`) — deklarerad `EventLedgerType`, men noll
 *    skrivvägar (grep bekräftat, 2026-09-06) — text-utan-yta, väntar på sin
 *    producent, inte borttagen (Princip 7).
 *
 * `calendar_anchor`/`season_context`-kategorierna (registrets familjer 2
 * "Kalenderankare" och 3 "Säsongsläge") lämnas MEDVETET oresolverade (retur
 * null) — se MASTER_OPPET `stickiness-copy-roster`: adapterns egen
 * `categoryFor()` (narrativePushAdapter.ts) grundar dem på
 * `freshnessQueue==='anniversary'`/`family==='decisions_era'`, en
 * BAKÅTBLICKANDE minnestaxonomi (liggarposter om det som HÄNT) — medan
 * registrets familjer 2/3 är FRAMÅTBLICKANDE (en kommande derby/final,
 * aktuell tabellplacering), data som kommer ur `game.fixtures`/
 * `game.standings`, inte ur en `AgendaItem`. Att bygga dem kräver ett
 * arkitekturbeslut om `categoryFor()`/adaptern själv, inte bara copy —
 * flaggat, inte tyst ihopklämt mot fel datakälla.
 */
export function createNarrativePushCopyResolver(
  game: SaveGame,
  rotation: PushCopyRotationStore,
): NarrativePushCopyResolver {
  return (item: AgendaItem, category: AttentionCategory): NarrativePushCopy | null => {
    if (category !== 'narrative_return') return null

    const fixture = getNextManagedFixture(game)
    if (!fixture?.date) return null
    const opponentId = nextOpponentClubId(game, fixture)
    const dag = weekdayLabel(fixture.date)
    const ownClub = game.clubs.find(c => c.id === game.managedClubId)
    const ownClubName = ownClub?.shortName ?? ownClub?.name
    if (!ownClubName) return null

    // Revansch (register §4) — big_loss / förlorat derby mot exakt nästa motstånd, ≤1 säsong.
    if (
      (item.post.type === 'big_loss' || (item.post.type === 'derby_result' && item.post.outcome === 'lost')) &&
      item.post.subject?.kind === 'club' &&
      item.post.subject.id === opponentId &&
      item.post.result
    ) {
      const seasonsAgo = game.currentSeason - item.post.season
      if (seasonsAgo < 0 || seasonsAgo > 1) return null
      const opponentName = resolveSubjectName(game, item.post.subject)
      if (!opponentName) return null
      const resultat = `${item.post.result.goalsFor}–${item.post.result.goalsAgainst}`
      const timeframe = seasonsAgo === 0 ? 'i höstas' : 'förra säsongen'
      const voice = pickVoice(rotation, 'memory_revenge', ['press', 'club'])
      return voice === 'press'
        ? {
            voice,
            title: 'Revanschen väntar.',
            body: `${opponentName} slog ${ownClubName} med ${resultat} ${timeframe}. På ${dag} möts de igen.`,
          }
        : {
            voice,
            title: `${opponentName}. Igen.`,
            body: `${resultat} förra gången. Den siffran står kvar i Krönikan.`,
          }
    }

    // Ex-spelare i motståndarlaget (register §4) — transfer_sold till exakt nästa motstånd.
    if (
      item.post.type === 'transfer_sold' &&
      item.post.subject?.kind === 'player' &&
      item.post.subject2?.kind === 'club' &&
      item.post.subject2.id === opponentId
    ) {
      const seasonsAgo = game.currentSeason - item.post.season
      if (seasonsAgo < 0 || seasonsAgo > 1) return null
      const playerName = resolveSubjectName(game, item.post.subject)
      const opponentName = resolveSubjectName(game, item.post.subject2)
      if (!playerName || !opponentName) return null
      const timeframe = seasonsAgo === 0 ? 'i somras' : 'förra året'
      const voice = pickVoice(rotation, 'memory_ex_player', ['press', 'club'])
      return voice === 'press'
        ? {
            voice,
            title: `${playerName} kommer tillbaka.`,
            body: `Såld till ${opponentName} ${timeframe}. På ${dag} spelar han mot ${ownClubName}.`,
          }
        : {
            voice,
            title: `${playerName} i fel tröja.`,
            body: 'Ni sålde honom. Nu möter ni honom.',
          }
    }

    return null
  }
}
