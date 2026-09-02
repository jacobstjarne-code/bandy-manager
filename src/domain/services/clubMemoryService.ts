import type { SaveGame } from '../entities/SaveGame'
import type { ClubLegend, AllTimeRecords } from '../entities/Narrative'
import {
  buildEventFromFixture,
  buildEventFromNarrativeLog,
  buildEventFromStoryline,
  buildEventFromRetirement,
} from './clubMemoryEventBuilders'
import type { MomentSource } from '../entities/Moment'
import { FIRST_CALLUP_MEMORY_LINES } from '../data/landslagText'
import { FACILITY_NODE_DEFS } from '../data/facilityNodes'
import { FACILITY_COMPLETED_BEATS, FACILITY_COMPLETED_FALLBACK } from '../data/facilityPortalBeats'

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
    if (!player.diary) continue
    const isOurs = player.clubId === managedClubId ||
      (player.seasonHistory ?? []).some(h => h.clubId === managedClubId && h.season === season)
    if (!isOurs) continue
    for (const entry of player.diary) {
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

  // Release-svepet 2026-07-21 (Block 2b) — första landslagsuttagningen.
  // firstNationalTeamCallupSeason är fryst en gång (till skillnad från
  // nationalTeamCallups-räknaren) — se Player.ts:s kommentar vid fältet.
  // Samma derived-per-säsong-mönster som academy_promotion ovan.
  for (const player of game.players) {
    if (player.firstNationalTeamCallupSeason !== season || player.clubId !== managedClubId) continue
    const template = FIRST_CALLUP_MEMORY_LINES[season % FIRST_CALLUP_MEMORY_LINES.length]
    events.push({
      type: 'national_team_callup', season,
      matchday: player.firstNationalTeamCallupMatchday ?? 1,
      text: template.replace('{spelare}', `${player.firstName} ${player.lastName}`),
      emoji: '⭐', significance: 60, subjectPlayerId: player.id,
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

  // Facility completions. `builtSeasons` är den beständiga sanningen om
  // VILKEN säsong noden stod klar; completion-kön kompletterar med den exakta
  // globala matchdagen när den finns. Kön är inte producent — en legacy-post
  // utan builtSeasons får därför inte hitta på ett historiskt bygge. Om den
  // exakta dagen saknas visar UI:t "Under säsongen" i stället för en falsk
  // ligaomgång. Invigningstexten återanvänds från portalbeatets Opus-låsta
  // källa, så samma completion inte får två konkurrerande berättelser.
  for (const [nodeId, builtSeason] of Object.entries(game.facilityState?.builtSeasons ?? {})) {
    if (builtSeason !== season) continue
    const def = FACILITY_NODE_DEFS.find(node => node.id === nodeId)
    if (!def) continue
    const completion = (game.facilityState?.unseenCompletedFacilities ?? [])
      .filter(item => item.nodeId === nodeId && item.season === season)
      .sort((a, b) => b.matchday - a.matchday)[0]
    const matchday = completion?.matchday ?? 1
    events.push({
      type: 'facility_built',
      season,
      matchday,
      roundLabel: completion ? `Matchdag ${matchday}` : 'Under säsongen',
      text: FACILITY_COMPLETED_BEATS[nodeId] ?? FACILITY_COMPLETED_FALLBACK(def.label),
      emoji: '🏗️',
      significance: 35,
      subjectClubId: managedClubId,
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

// ── Active Memory Aggregator ─────────────────────────────────────────────────
// Normalises all active narrative memories into a single weighted stream.
// No picker, no prioritization beyond raw weight — Design decides display.

export type ActiveMemorySource =
  | 'moment' | 'klack' | 'journalist' | 'nemesis' | 'rival_sale'
  | 'follow_up' | 'letter' | 'board_history' | 'economic_crisis'

export type ActiveMemoryKind = 'triumph' | 'scar' | 'tension' | 'neutral'

export interface ActiveMemory {
  source: ActiveMemorySource
  matchday: number
  season: number
  weight: number        // raw: recency × sourceBaseWeight. No prioritization.
  kind: ActiveMemoryKind
  title: string
  body: string
  subjectPlayerId?: string
  subjectClubId?: string
}

const SOURCE_BASE_WEIGHTS: Record<ActiveMemorySource, number> = {
  moment: 70,
  klack: 60,
  nemesis: 55,
  rival_sale: 65,
  journalist: 50,
  board_history: 55,
  economic_crisis: 60,
  letter: 45,
  follow_up: 40,
}

function calcWeight(source: ActiveMemorySource, memoryMatchday: number, currentMatchday: number): number {
  const recencyFactor = Math.max(0.2, 1 - (currentMatchday - memoryMatchday) / 10)
  return SOURCE_BASE_WEIGHTS[source] * recencyFactor
}

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

/**
 * Aggregates all active narrative memories from 9 sources into one stream.
 * Sorted by weight desc. Returns all — Design decides how many to show.
 */
export function collectActiveMemories(game: SaveGame): ActiveMemory[] {
  const memories: ActiveMemory[] = []
  const currentMatchday = game.currentMatchday
  const currentSeason = game.currentSeason

  // 1. recentMoments[]
  for (const m of (game.recentMoments ?? [])) {
    const weight = calcWeight('moment', m.matchday, currentMatchday)
    memories.push({
      source: 'moment',
      matchday: m.matchday,
      season: m.season,
      weight,
      kind: momentKind(m.source),
      title: m.title,
      body: m.body,
      subjectPlayerId: m.subjectPlayerId,
      subjectClubId: m.subjectClubId,
    })
  }

  // 2. klackEcho — one memory if currentWeight > 0
  const klack = game.klackEcho
  if (klack && klack.currentWeight > 0) {
    const weight = calcWeight('klack', klack.resultMatchday, currentMatchday)
    // Map NotableEventType → kind
    const klackKind: ActiveMemoryKind =
      klack.type === 'derby_win' || klack.type === 'top_team_win' ? 'triumph'
      : klack.type === 'derby_loss' || klack.type === 'heavy_home_loss' || klack.type === 'storstad_loss' ? 'scar'
      : klack.type === 'derby_draw' ? 'neutral'
      : 'neutral'
    memories.push({
      source: 'klack',
      matchday: klack.resultMatchday,
      season: currentSeason,
      weight,
      kind: klackKind,
      title: klack.type,
      body: `klackEcho weight=${klack.currentWeight}`,
    })
  }

  // 3. journalist.memory[] — last 1-2 entries
  const journalist = game.journalist
  if (journalist && journalist.memory.length > 0) {
    const entries = journalist.memory.slice(-2)
    for (const entry of entries) {
      const weight = calcWeight('journalist', entry.matchday, currentMatchday)
      const sentimentText = entry.sentiment >= 5 ? 'positive'
        : entry.sentiment <= -5 ? 'negative'
        : 'neutral'
      memories.push({
        source: 'journalist',
        matchday: entry.matchday,
        season: entry.season,
        weight,
        kind: entry.sentiment >= 3 ? 'triumph' : entry.sentiment <= -3 ? 'scar' : 'neutral',
        title: entry.event,
        body: `journalist sentiment=${sentimentText} (${entry.sentiment})`,
      })
    }
  }

  // 4. nemesisTracker — one memory per player with goalsAgainstUs >= 3
  for (const entry of Object.values(game.nemesisTracker ?? {})) {
    if (entry.goalsAgainstUs >= 3) {
      // Use currentMatchday as proxy (nemesis has no dedicated matchday field)
      const weight = SOURCE_BASE_WEIGHTS['nemesis'] * 0.8
      memories.push({
        source: 'nemesis',
        matchday: currentMatchday,
        season: currentSeason,
        weight,
        kind: 'tension',
        title: entry.name,
        body: `goalsAgainstUs=${entry.goalsAgainstUs}`,
        subjectPlayerId: entry.playerId,
        subjectClubId: entry.clubId,
      })
    }
  }

  // 5. lastRivalSaleMatchday — one memory if within 5 rounds
  if (
    game.lastRivalSaleMatchday !== undefined &&
    (currentMatchday - game.lastRivalSaleMatchday) <= 5
  ) {
    const weight = calcWeight('rival_sale', game.lastRivalSaleMatchday, currentMatchday)
    memories.push({
      source: 'rival_sale',
      matchday: game.lastRivalSaleMatchday,
      season: currentSeason,
      weight,
      kind: 'scar',
      title: 'rival_sale',
      body: `matchday=${game.lastRivalSaleMatchday}`,
    })
  }

  // 6. pendingFollowUps[] — one memory per pending
  for (const fu of (game.pendingFollowUps ?? [])) {
    const fuMatchday = fu.createdMatchday
    const weight = calcWeight('follow_up', fuMatchday, currentMatchday)
    memories.push({
      source: 'follow_up',
      matchday: fuMatchday,
      season: currentSeason,
      weight,
      kind: 'neutral',
      title: fu.type,
      body: `followUp id=${fu.id}`,
    })
  }

  // 7. bandyLetters[] — latest unseen
  const unseenLetters = (game.bandyLetters ?? []).filter(l => !l.savedInArchive)
  if (unseenLetters.length > 0) {
    const latest = unseenLetters[unseenLetters.length - 1]
    const weight = calcWeight('letter', currentMatchday, currentMatchday)
    memories.push({
      source: 'letter',
      matchday: currentMatchday,
      season: currentSeason,
      weight,
      kind: 'triumph',
      title: latest.senderName,
      body: latest.text.slice(0, 80),
    })
  }

  // 8. boardObjectiveHistory[] — last season's met/failed entries
  const boardHistory = (game.boardObjectiveHistory ?? []).filter(
    h => h.season === currentSeason - 1 || h.season === currentSeason,
  )
  for (const entry of boardHistory) {
    const weight = calcWeight('board_history', currentMatchday, currentMatchday)
    memories.push({
      source: 'board_history',
      matchday: currentMatchday,
      season: entry.season,
      weight,
      kind: entry.result === 'met' ? 'triumph' : 'scar',
      title: entry.objectiveId,
      body: `result=${entry.result}`,
    })
  }

  // 9. economicCrisisState — one memory if phase != 'resolved'
  const crisis = game.economicCrisisState
  if (crisis && crisis.phase !== 'resolved') {
    const weight = calcWeight('economic_crisis', crisis.startedMatchday, currentMatchday)
    memories.push({
      source: 'economic_crisis',
      matchday: crisis.startedMatchday,
      season: crisis.startedSeason,
      weight,
      kind: 'scar',
      title: `economic_crisis`,
      body: `phase=${crisis.phase}`,
    })
  }

  return memories.sort((a, b) => b.weight - a.weight)
}
