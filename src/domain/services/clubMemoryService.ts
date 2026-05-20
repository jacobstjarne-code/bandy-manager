import type { SaveGame } from '../entities/SaveGame'
import type { ClubLegend, AllTimeRecords } from '../entities/Narrative'
import {
  buildEventFromFixture,
  buildEventFromNarrativeLog,
  buildEventFromStoryline,
  buildEventFromRetirement,
} from './clubMemoryEventBuilders'

export type MemoryEventType =
  | 'season_finish' | 'cup_final' | 'sm_final' | 'derby_result'
  | 'big_win' | 'big_loss' | 'player_milestone' | 'academy_promotion'
  | 'retirement' | 'facility_built' | 'transfer_signed' | 'transfer_sold'
  | 'patron_change' | 'storyline_resolution' | 'scandal'

export interface MemoryEvent {
  type: MemoryEventType
  season: number
  matchday: number
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

function collectSeasonEvents(game: SaveGame, season: number, managedClubId: string): MemoryEvent[] {
  const events: MemoryEvent[] = []

  // Fixture events
  for (const f of game.fixtures) {
    if (f.season !== season) continue
    const ev = buildEventFromFixture(f, managedClubId)
    if (ev) events.push(ev)
  }

  // Player narrative logs
  for (const player of game.players) {
    if (!player.narrativeLog) continue
    const isOurs = player.clubId === managedClubId ||
      (player.seasonHistory ?? []).some(h => h.clubId === managedClubId && h.season === season)
    if (!isOurs) continue
    for (const entry of player.narrativeLog) {
      if (entry.season !== season) continue
      const ev = buildEventFromNarrativeLog(player, entry)
      if (ev) events.push(ev)
    }
  }

  // Academy promotions
  for (const player of game.players) {
    if (!player.promotedFromAcademy || player.clubId !== managedClubId) continue
    const promoSeason = player.seasonHistory?.find(h => h.season === season) ? season : game.currentSeason
    if (promoSeason !== season) continue
    events.push({
      type: 'academy_promotion', season,
      matchday: player.promotionRound ?? 1,
      text: `${player.firstName} ${player.lastName} uppflyttad från P19 till A-laget.`,
      emoji: '🎓', significance: 55, subjectPlayerId: player.id,
    })
  }

  // Scandals
  const allScandals = [...(game.scandalHistory ?? []), ...(game.activeScandals ?? [])]
  for (const s of allScandals) {
    if (s.affectedClubId !== managedClubId || s.season !== season) continue
    events.push({
      type: 'scandal', season, matchday: s.triggerRound,
      text: `Skandal drabbade klubben (omgång ${s.triggerRound}).`,
      emoji: '🔥', significance: 70,
    })
  }

  // Facility built
  for (const p of (game.facilityProjects ?? [])) {
    if (p.status !== 'completed' || p.completedSeason !== season) continue
    events.push({
      type: 'facility_built', season, matchday: p.completedMatchday ?? 22,
      text: `${p.name} stod klart.`, emoji: '🏟️', significance: 50,
    })
  }

  // Storylines
  for (const sl of (game.storylines ?? [])) {
    if (sl.season !== season) continue
    if (sl.clubId && sl.clubId !== managedClubId) continue
    const ev = buildEventFromStoryline(sl)
    if (ev) events.push(ev)
  }

  // Legend retirements
  for (const legend of (game.clubLegends ?? [])) {
    if (legend.retiredSeason === season) events.push(buildEventFromRetirement(legend))
  }

  return events.filter(e => e.significance >= SIGNIFICANCE_THRESHOLD).sort((a, b) => a.matchday - b.matchday)
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
