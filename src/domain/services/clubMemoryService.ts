import type { SaveGame } from '../entities/SaveGame'
import type { ClubLegend, AllTimeRecords } from '../entities/Narrative'
import type { EventLedgerEntry } from '../entities/Narrative'
import {
  buildEventFromFixture,
  buildEventFromNarrativeLog,
  buildEventFromStoryline,
} from './clubMemoryEventBuilders'
import type { MomentSource } from '../entities/Moment'
import { FIRST_CALLUP_MEMORY_LINES } from '../data/landslagText'
import { FACILITY_NODE_DEFS } from '../data/facilityNodes'
import { FACILITY_COMPLETED_BEATS, FACILITY_COMPLETED_FALLBACK } from '../data/facilityPortalBeats'
import {
  getFacilityNodeIdFromLedger,
  getPlayerMilestoneCodeFromLedger,
} from './clubHistoryLedgerService'
import { getResolvedStorylineProjections } from './storylineLedgerService'

export type MemoryEventType =
  | 'season_finish' | 'cup_final' | 'sm_final' | 'derby_result'
  | 'big_win' | 'big_loss' | 'player_milestone' | 'academy_promotion'
  | 'retirement' | 'facility_built' | 'transfer_signed' | 'transfer_sold'
  | 'patron_change' | 'storyline_resolution' | 'scandal' | 'national_team_callup'

export interface MemoryEvent {
  type: MemoryEventType
  season: number
  /** Kronologi/sortering — ALDRIG rond-identitet i UI, se roundLabel. */
  matchday: number
  /** HIGH 5 (2026-08-29): färdig tävlingsmedveten rond-etikett, satt vid
   *  byggtillfället för fixture-baserade händelser (buildEventFromFixture).
   *  Icke-fixture-händelser (spelardagbok, storyline, pension) saknar den —
   *  ClubMemoryEventRow faller då tillbaka på matchday som förut. */
  roundLabel?: string
  text: string
  emoji: string
  significance: number
  outcome?: 'won' | 'lost' | 'neutral'
  subjectPlayerId?: string
  subjectClubId?: string
}

export interface SeasonMemory {
  season: number
  isOngoing: boolean
  finishPosition?: number
  events: MemoryEvent[]
  eraName?: string | 'unknown'
}

export interface ClubMemoryView {
  seasons: SeasonMemory[]
  legends: ClubLegend[]
  records: AllTimeRecords | null
  totalEventsAcrossSeasons: number
}

export const SIGNIFICANCE_THRESHOLD = 30
const MAX_SEASONS = 5

/** Significance is pre-calculated in builders — this function is the public API for tests. */
export function scoreEvent(event: MemoryEvent): number {
  return event.significance
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function finishPositionForSeason(game: SaveGame, season: number): number | undefined {
  if (season === game.currentSeason) return undefined
  // Only the previous season's position is stored (seasonStartSnapshot is set at season end)
  if (season === game.currentSeason - 1 && game.seasonStartSnapshot) {
    return game.seasonStartSnapshot.finalPosition
  }
  return undefined
}

function seasonFinishEvent(season: number, pos: number): MemoryEvent {
  const sig = pos === 1 ? 100 : pos === 2 ? 75 : pos <= 4 ? 65 : pos <= 6 ? 45 : pos <= 9 ? 35 : 30
  const label = pos === 1 ? '1:a (MÄSTARE!)' : pos === 2 ? '2:a' : pos === 3 ? '3:a' : `${pos}:e`
  return {
    type: 'season_finish', season, matchday: 22,
    text: `Säsongen avslutad på ${label} plats.`,
    emoji: pos === 1 ? '🥇' : pos <= 3 ? '🏅' : '📊',
    significance: sig,
  }
}

const LEDGER_CLUB_MEMORY_TYPES = new Set<EventLedgerEntry['type']>([
  'academy_promotion',
  'national_team_callup',
  'retirement',
  'facility_built',
  'scandal',
  'player_milestone',
])

function ledgerEntryBelongsToManagedClub(game: SaveGame, entry: EventLedgerEntry, managedClubId: string): boolean {
  if (entry.subject?.kind === 'club') return entry.subject.id === managedClubId
  if (entry.subject2?.kind === 'club') return entry.subject2.id === managedClubId
  if (entry.subject?.kind !== 'player') return false

  const player = game.players.find(item => item.id === entry.subject!.id)
  if (player) {
    return player.clubId === managedClubId
      || player.academyClubId === managedClubId
      || (player.seasonHistory ?? []).some(item => item.clubId === managedClubId && item.season === entry.season)
  }
  return (game.clubLegends ?? []).some(legend => legend.playerId === entry.subject!.id)
}

function opponentNameAt(game: SaveGame, season: number, matchday: number, managedClubId: string): string {
  const fixture = game.fixtures.find(item =>
    item.season === season
    && item.matchday === matchday
    && (item.homeClubId === managedClubId || item.awayClubId === managedClubId)
  )
  if (!fixture) return 'motståndet'
  const opponentId = fixture.homeClubId === managedClubId ? fixture.awayClubId : fixture.homeClubId
  const opponent = game.clubs.find(club => club.id === opponentId)
  return opponent?.shortName ?? opponent?.name ?? 'motståndet'
}

function playerMilestoneText(game: SaveGame, entry: EventLedgerEntry, managedClubId: string): string | null {
  const code = getPlayerMilestoneCodeFromLedger(entry)
  if (!code) return null
  const opponent = opponentNameAt(game, entry.season, entry.matchday, managedClubId)
  if (code === 'first_team_debut') return `A-lagsdebut mot ${opponent}. Nerverna satt — men benen höll.`
  if (code === 'first_team_goal') return `Satte sitt första A-lagsmål mot ${opponent}. En dag att minnas.`
  if (code === 'academy_promotion') return 'Tar klivet upp till A-laget. Akademin levererade — nu gäller det att gripa chansen.'
  const hatTrick = code.match(/^hat_trick_(\d+)$/)
  if (hatTrick) return `Hattrick mot ${opponent} — ${hatTrick[1]} mål. Stämningen exploderade på läktarna.`
  const goals = code.match(/^career_goals_(\d+)$/)
  if (goals) return `Mål nummer ${goals[1]} i karriären. En siffra att vara stolt över.`
  const games = code.match(/^career_games_(\d+)$/)
  if (games) return `Match nummer ${games[1]} i A-laget. Lojalitet och uthållighet lönar sig.`
  return null
}

function buildMemoryEventFromLedger(game: SaveGame, entry: EventLedgerEntry, managedClubId: string): MemoryEvent | null {
  const playerId = entry.subject?.kind === 'player' ? entry.subject.id : undefined
  const player = playerId ? game.players.find(item => item.id === playerId) : undefined
  const playerName = player
    ? `${player.firstName} ${player.lastName}`
    : (game.clubLegends ?? []).find(item => item.playerId === playerId)?.name

  switch (entry.type) {
    case 'academy_promotion':
      if (!playerName) return null
      return {
        type: 'academy_promotion', season: entry.season, matchday: entry.matchday,
        text: `${playerName} uppflyttad från P19 till A-laget.`,
        emoji: '🎓', significance: entry.significance, subjectPlayerId: playerId,
      }
    case 'national_team_callup': {
      if (!playerName) return null
      const template = FIRST_CALLUP_MEMORY_LINES[entry.season % FIRST_CALLUP_MEMORY_LINES.length]
      return {
        type: 'national_team_callup', season: entry.season, matchday: entry.matchday,
        text: template.replace('{spelare}', playerName),
        emoji: '⭐', significance: entry.significance, subjectPlayerId: playerId,
      }
    }
    case 'scandal':
      return {
        type: 'scandal', season: entry.season, matchday: entry.matchday,
        text: `Skandal drabbade klubben (omgång ${entry.matchday}).`,
        emoji: '🔥', significance: entry.significance, subjectClubId: managedClubId,
      }
    case 'facility_built': {
      const nodeId = getFacilityNodeIdFromLedger(entry)
      const def = nodeId ? FACILITY_NODE_DEFS.find(node => node.id === nodeId) : undefined
      if (!nodeId || !def) return null
      const hasExactMatchday = /_s\d+_m\d+$/.test(entry.semanticKey)
      return {
        type: 'facility_built', season: entry.season, matchday: entry.matchday,
        roundLabel: hasExactMatchday ? `Matchdag ${entry.matchday}` : 'Under säsongen',
        text: FACILITY_COMPLETED_BEATS[nodeId] ?? FACILITY_COMPLETED_FALLBACK(def.label),
        emoji: '🏗️', significance: entry.significance, subjectClubId: managedClubId,
      }
    }
    case 'retirement': {
      const legend = (game.clubLegends ?? []).find(item => item.playerId === playerId)
      if (!legend) return null
      const text = legend.memorableStory
        ?? `${legend.name} pensionerade sig efter ${legend.seasons} säsonger och ${legend.totalGoals} mål.`
      return {
        type: 'retirement', season: entry.season, matchday: entry.matchday,
        text, emoji: '👋', significance: entry.significance, subjectPlayerId: playerId,
      }
    }
    case 'player_milestone': {
      const text = playerMilestoneText(game, entry, managedClubId)
      if (!text) return null
      const code = getPlayerMilestoneCodeFromLedger(entry) ?? ''
      const emoji = code.startsWith('hat_trick_') ? '🎩'
        : code.includes('_100') ? '💯'
        : code === 'first_team_debut' || code === 'first_team_goal' ? '⭐'
        : '👤'
      return {
        type: 'player_milestone', season: entry.season, matchday: entry.matchday,
        text, emoji, significance: entry.significance, subjectPlayerId: playerId,
      }
    }
    default:
      return null
  }
}

function collectSeasonEvents(game: SaveGame, season: number, managedClubId: string): MemoryEvent[] {
  const events: MemoryEvent[] = []

  // Fixture events
  for (const f of game.fixtures) {
    if (f.season !== season) continue
    const ev = buildEventFromFixture(f, managedClubId)
    if (ev) events.push(ev)
  }

  // Player diary remains a capped presentation pocket. Its permanent,
  // structured milestones are read from eventLedger below; only the two
  // still-unmigrated diary categories remain here.
  for (const player of game.players) {
    if (!player.diary) continue
    const isOurs = player.clubId === managedClubId ||
      (player.seasonHistory ?? []).some(h => h.clubId === managedClubId && h.season === season)
    if (!isOurs) continue
    for (const entry of player.diary) {
      if (entry.type === 'milestone') continue
      if (entry.season !== season) continue
      const ev = buildEventFromNarrativeLog(player, entry)
      if (ev) events.push(ev)
    }
  }

  // De sex migrerade ClubMemory-källorna läses nu ur kanon. Fickorna ovan
  // fortsätter finnas för sina övriga roller, men får inte längre återskapa
  // samma historiska händelse parallellt.
  for (const entry of game.eventLedger ?? []) {
    if (entry.season !== season || !LEDGER_CLUB_MEMORY_TYPES.has(entry.type)) continue
    if (!ledgerEntryBelongsToManagedClub(game, entry, managedClubId)) continue
    const event = buildMemoryEventFromLedger(game, entry, managedClubId)
    if (event) events.push(event)
  }

  // Resolved storylines: the ledger decides what happened. The retained
  // storyline object supplies only its frozen, already-approved view text.
  for (const sl of getResolvedStorylineProjections(game, season)) {
    if (sl.clubId && sl.clubId !== managedClubId) continue
    const ev = buildEventFromStoryline(sl)
    if (ev) events.push(ev)
  }

  const filtered = events.filter(e => e.significance >= SIGNIFICANCE_THRESHOLD)
  // Dedup visuellt identiska rader: t.ex. när hela A-laget debuterar samma match får elva
  // spelare var sin namnlösa "A-lagsdebut"-post → elva identiska rader. Klubbens debut är ETT minne.
  const seen = new Set<string>()
  const deduped = filtered.filter(e => {
    const key = `${e.type}|${e.matchday}|${e.text}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return deduped.sort((a, b) => a.matchday - b.matchday)
}

// ── Anniversary system ───────────────────────────────────────────────────────

export interface ActiveAnniversary {
  eventId: string                    // unique ID på den minnesvärda eventen
  originalSeason: number             // när det hände
  yearsAgo: number                   // 1, 2, 3... (max 5 för MAX_SEASONS)
  matchday: number                   // matchday i ursprungsåret (matchas mot nuvarande)
  type: MemoryEventType
  outcome: 'won' | 'lost' | 'neutral'
  significance: number               // 0-100
  echoSize: 'small' | 'medium' | 'big'
  subjectPlayerId?: string
  subjectClubId?: string
  originalEventText: string          // för referens (visas inte direkt — Opus skriver eko)
}

/** Konstruerar ett unikt eventId för matchning */
export function buildEventId(event: MemoryEvent): string {
  return `${event.season}-${event.matchday}-${event.type}-${event.subjectPlayerId ?? event.subjectClubId ?? 'x'}`
}

/**
 * Returnerar alla aktiva anniversaries för nuvarande matchday.
 * - 1 år: significance >= 30
 * - 2-5 år: significance >= 95 (SM-guld, SM-final-förlust etc)
 */
export function findActiveAnniversaries(game: SaveGame): ActiveAnniversary[] {
  const currentMatchday = game.currentMatchday
  const allEvents = getClubMemory(game).seasons.flatMap(s => s.events)

  return allEvents
    .filter(e => {
      // Måste matcha matchday inom +/- 1 (slacka pga schemavariation)
      if (Math.abs(e.matchday - currentMatchday) > 1) return false

      // 1 år — significance >= 30
      const yearsAgo = game.currentSeason - e.season
      if (yearsAgo < 1) return false
      if (yearsAgo === 1) return e.significance >= 30

      // 2+ år bakåt — endast för significance >= 95 (SM-guld, SM-final-förlust, etc)
      if (e.significance >= 95) return yearsAgo <= MAX_SEASONS
      return false
    })
    .map(e => ({
      eventId: buildEventId(e),
      originalSeason: e.season,
      yearsAgo: game.currentSeason - e.season,
      matchday: e.matchday,
      type: e.type,
      outcome: e.outcome ?? 'neutral',
      significance: e.significance,
      echoSize: (
        e.significance >= 90 ? 'big' :
        e.significance >= 60 ? 'medium' :
        'small'
      ) as 'small' | 'medium' | 'big',
      subjectPlayerId: e.subjectPlayerId,
      subjectClubId: e.subjectClubId,
      originalEventText: e.text,
    }))
}

// ── Main aggregator ──────────────────────────────────────────────────────────

export function getClubMemory(game: SaveGame): ClubMemoryView {
  const managedClubId = game.managedClubId
  const currentSeason = game.currentSeason
  const firstSeason = Math.max(1, currentSeason - (MAX_SEASONS - 1))

  const seasons: SeasonMemory[] = []

  for (let season = currentSeason; season >= firstSeason; season--) {
    const isOngoing = season === currentSeason
    const position = finishPositionForSeason(game, season)
    const events = collectSeasonEvents(game, season, managedClubId)
    if (position !== undefined) {
      events.unshift(seasonFinishEvent(season, position))
      events.sort((a, b) => a.matchday - b.matchday)
    }
    // Era: for ongoing season use currentEra; for previous season use snapshot; older = unknown
    let eraName: string | undefined
    if (isOngoing) {
      eraName = game.currentEra ?? undefined
    } else if (season === game.currentSeason - 1 && game.seasonStartSnapshot) {
      const snapshotEra = game.seasonStartSnapshot.era
      eraName = snapshotEra && snapshotEra !== 'unknown' ? snapshotEra : undefined
    }

    if (events.length === 0 && !isOngoing) continue
    seasons.push({
      season, isOngoing, finishPosition: position, events,
      eraName,
    })
  }

  return {
    seasons,
    legends: game.clubLegends ?? [],
    records: game.allTimeRecords ?? null,
    totalEventsAcrossSeasons: seasons.reduce((sum, s) => sum + s.events.length, 0),
  }
}

// ── Moment kind mapping ──────────────────────────────────────────────────────
// Delad av ClubMemoryView.tsx. Den tidigare "Active Memory Aggregator"-
// sektionen (collectActiveMemories + dess nio-källors omräkning av samma
// state varje anrop) retirerad LIGGARE-PRIO 4 (2026-09-03, SPEC_LIGGARE_
// MIGRERING_PRIORITERAD_2026-09-02.md): infördes som aggregator i `7d475b42`
// men kopplades aldrig till en spelyta — noll produktionskonsumenter, bara
// sina egna tester. Superseterad kod (CLAUDE.md §7), inte text-utan-yta:
// dess källor (moments/klack/journalist/nemesis/board-historik/ekonomikris)
// har redan sina egna, riktiga läsvägar (getClubMemory/eventLedger m.fl.) —
// ingen unik information gick förlorad vid raderingen.

export type ActiveMemoryKind = 'triumph' | 'scar' | 'tension' | 'neutral'

export function momentKind(source: MomentSource): ActiveMemoryKind {
  switch (source) {
    case 'derby_win':
    case 'sponsor_positive':
    case 'era_shift':
    case 'season_highlight':
      return 'triumph'
    case 'star_injury':
    case 'rival_sale':
    case 'captain_crisis':
    case 'sponsor_negative':
    case 'transfer_story':
      return 'scar'
    case 'nemesis_signed':
      return 'tension'
    default:
      return 'neutral'
  }
}
