import type { SaveGame } from '../entities/SaveGame'
import type { ClubLegend, AllTimeRecords, EventLedgerType } from '../entities/Narrative'
import type { EventLedgerEntry } from '../entities/Narrative'
import {
  buildEventFromFixture,
  buildEventFromNarrativeLog,
  buildEventFromStoryline,
  deriveMatchMemoryText,
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
import { MOMENT_VIEW_TEMPLATES } from '../data/momentViewTemplates'
import { LEDGER_ONLY_VIEW_TEMPLATES } from '../data/momentViewTemplates'
import type { LedgerOnlySource } from '../data/momentViewTemplates'
import { resolveSubjectName, MOMENT_LEDGER_TYPES } from './momentLedgerService'
import { composeSeasonDecisionSentence } from './seasonDecisionCaptureService'
import { isMatchResultEntry } from '../entities/Narrative'
import { getRivalry } from '../data/rivalries'

/** liggare-k7-beslutsminne (2026-09-03, konsumentkartan §9 #7, Opus dom):
 *  "Krönikan visar decision-poster med significance ≥ 70 som egna rader" —
 *  bara säsongens TYNGSTA beslut når idag årsboken (topp-1), alla andra
 *  glöms. Egen, högre tröskel än SIGNIFICANCE_THRESHOLD (30) eftersom ett
 *  medelmåttigt beslut inte är ett Krönika-minne — det är precis vad topp-1-
 *  urvalet redan sållar bort med rätta. */
const DECISION_MEMORY_THRESHOLD = 70

/**
 * liggare-k1 (2026-09-03): MemoryEventType speglade tidigare bara EventLedgerType's
 * FÖRSTA sexton medlemmar för hand — de 18 som tillkommit sedan (elva Moment-
 * typer, fem tysta, decision, manager_burnout) hade fått läggas till manuellt
 * här också, och gjorde inte det (RAPPORT_LIGGARE_KONSUMENTKARTA_RAW_2026-09-03.md
 * Tabell 1). En sanning, ett ställe (CLAUDE.md OPUS-REGLER #4): alias mot
 * EventLedgerType i stället för en parallell union som kan glida isär igen.
 */
export type MemoryEventType = EventLedgerType

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

/**
 * liggare-k9-doda-typer (Code-fynd 2026-09-04): läste tidigare bara
 * `seasonStartSnapshot.finalPosition` — täcker ENDAST currentSeason-1, så
 * season_finish "glömdes" för allt äldre än föregående säsong redan innan
 * någon fixture-gallringsfråga ens kom in i bilden. `game.seasonSummaries`
 * ackumuleras för alltid (till skillnad från `game.fixtures`, som
 * nollställs varje rollover — k10) och bär `finalPosition` per säsong
 * sedan innan. season_finish behöver därför INGEN ny liggarpost eller
 * `result`-payload (till skillnad från de fem match-resultat-typerna) —
 * bara en bättre datakälla för samma befintliga fixture-väg.
 */
function finishPositionForSeason(game: SaveGame, season: number): number | undefined {
  if (season === game.currentSeason) return undefined
  const summary = (game.seasonSummaries ?? []).find(s => s.season === season)
  if (summary) return summary.finalPosition
  // Fallback för säsonger utan sparad summary (t.ex. äldre saves från
  // innan seasonSummaries fanns) — samma smalare källa som tidigare.
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

// liggare-k1 (2026-09-03): breddad från sex till tjugotre — de elva Moment-
// typerna (tidigare bara lästa av den separata "Det som hänt"-läsaren,
// momentLedgerService.getRecentMomentsFromLedger, aldrig av Krönikan) och de
// fem tysta typerna (referee_feud/trust, mecenat_withdrawal, patron_emerge/
// withdrawal — frysta sedan 2026-09-02, aldrig talade förrän nu, mallar
// LÅSTA i momentViewTemplates.ts §k3). storyline_resolution/decision/
// manager_burnout MEDVETET utanför — egna, redan byggda talvägar (se Tier A
// i konsumentkartan). De nio producentlösa typerna likaså — k9:s domän.
const LEDGER_CLUB_MEMORY_TYPES = new Set<EventLedgerEntry['type']>([
  'academy_promotion',
  'national_team_callup',
  'retirement',
  'facility_built',
  'scandal',
  'player_milestone',
  ...MOMENT_LEDGER_TYPES,
  'referee_feud',
  'referee_trust',
  'mecenat_withdrawal',
  'patron_emerge',
  'patron_withdrawal',
  // liggare-k9 (2026-09-04): TEXT LÅST samma dag som producenterna byggdes.
  'transfer_signed',
  'transfer_sold',
  // liggare-k7 (2026-09-03): tröskeln är INTE SIGNIFICANCE_THRESHOLD (30) —
  // se DECISION_MEMORY_THRESHOLD (70), kollad i switchens 'decision'-gren.
  'decision',
  // liggare-k9 (DOM 2026-09-04): match-resultat-typerna, nu producerade vid
  // matchslut (roundProcessor.ts) med `result`-payload. season_finish är
  // MEDVETET UTANFÖR — se isMatchResultEntry i Narrative.ts.
  'sm_final',
  'cup_final',
  'derby_result',
  'big_win',
  'big_loss',
])

/**
 * Liggaren följer managerkarriären och kan innehålla flera klubbar.
 * `clubId` är därför den kanoniska avgränsningen; subject/subject2 kan vara
 * en motpart och kan inte användas som klubbägare. Poster utan clubId är
 * gamla sparfiler. Migreringen försöker stämpla dem från säsongssummeringen,
 * och den här fallbacken behåller det tidigare enkelklubbsbeteendet när
 * ursprunget inte går att avgöra utan att fabricera data.
 */
function ledgerEntryBelongsToManagedClub(game: SaveGame, entry: EventLedgerEntry, managedClubId: string): boolean {
  // Nya poster bär ursprungsklubben explicit. Det är den enda säkra
  // avgränsningen efter ett klubbyte; subject/subject2 kan vara motparten.
  // Poster utan clubId är legacy och går vidare genom den äldre
  // identitetskontrollen nedan.
  if (entry.clubId) return entry.clubId === managedClubId
  if (entry.type === 'transfer_sold' || entry.type === 'rival_sale') return true
  if (entry.subject?.kind !== 'player') return true

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
    case 'decision': {
      // liggare-k7-beslutsminne (2026-09-03): bara säsongens topp-1 (via
      // pickMostImportantDecisionText) når idag årsboken — allt annat
      // glöms. Krönikan visar nu VARJE beslut som klarar tröskeln, en egen
      // rad per, oavsett om det blev säsongens vinnare eller inte.
      if (entry.significance < DECISION_MEMORY_THRESHOLD) return null
      const sentence = composeSeasonDecisionSentence(entry, game)
      if (!sentence) return null // "hellre ingen mening än falsk" — samma disciplin som årsbokens fallback
      return {
        type: 'decision', season: entry.season, matchday: entry.matchday,
        text: sentence, emoji: momentFamily('decision'), significance: entry.significance,
        subjectPlayerId: playerId,
        subjectClubId: entry.subject?.kind === 'club' ? entry.subject.id : undefined,
      }
    }
    case 'sm_final':
    case 'cup_final':
    case 'derby_result':
    case 'big_win':
    case 'big_loss': {
      // liggare-k9-doda-typer (DOM 2026-09-04): samma text som den levande
      // fixture-vägen (deriveMatchMemoryText, clubMemoryEventBuilders.ts) —
      // "samma ord, annan källa". decider (straff/förlängning) tappas
      // medvetet här (finns inte i result-payloaden), se dokumentationen på
      // MatchMemoryTextInput.decider.
      if (!isMatchResultEntry(entry)) return null
      const { goalsFor, goalsAgainst, opponentClubId } = entry.result
      const rivalry = getRivalry(managedClubId, opponentClubId)
      const derived = deriveMatchMemoryText({
        myScore: goalsFor, theirScore: goalsAgainst,
        won: entry.outcome === 'won', lost: entry.outcome === 'lost', decider: '',
        isFinaldag: entry.type === 'sm_final',
        isCupFinal: entry.type === 'cup_final',
        rivalryFirstName: entry.type === 'derby_result' && rivalry ? rivalry.name.split(' ')[0] : undefined,
      })
      if (!derived) return null
      return {
        type: derived.type, season: entry.season, matchday: entry.matchday,
        text: derived.text, emoji: derived.emoji, significance: derived.significance,
        outcome: derived.outcome, subjectClubId: opponentClubId,
      }
    }
    default: {
      // liggare-k1 (2026-09-03): de elva Moment-typerna + de fem tysta typerna
      // dispatchar hit i stället för att falla på 'default: return null'.
      // Samma mallkälla "Det som hänt" redan använder (MOMENT_VIEW_TEMPLATES)
      // plus den nya LEDGER_ONLY_VIEW_TEMPLATES (k3, TEXT LÅST) — Krönikan
      // skriver ALDRIG egen text, bara dispatchar till befintlig källa.
      const ctx = {
        subjectName: resolveSubjectName(game, entry.subject),
        subject2Name: resolveSubjectName(game, entry.subject2),
        matchday: entry.matchday,
        season: entry.season,
        significance: entry.significance,
        eraLabel: entry.eraLabel,
        transferRole: entry.transferRole,
        matchCategory: entry.matchCategory,
      }
      const isMomentSource = (MOMENT_LEDGER_TYPES as string[]).includes(entry.type)
      const isLedgerOnlySource = entry.type in LEDGER_ONLY_VIEW_TEMPLATES
      if (!isMomentSource && !isLedgerOnlySource) return null
      const { body } = isMomentSource
        ? MOMENT_VIEW_TEMPLATES[entry.type as MomentSource](ctx)
        : LEDGER_ONLY_VIEW_TEMPLATES[entry.type as LedgerOnlySource](ctx)
      return {
        type: entry.type, season: entry.season, matchday: entry.matchday,
        text: body, emoji: momentFamily(entry.type),
        significance: entry.significance,
        subjectPlayerId: entry.subject?.kind === 'player' ? entry.subject.id : undefined,
        subjectClubId: entry.subject?.kind === 'club' ? entry.subject.id : undefined,
      }
    }
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

// liggare-k1/k3 (2026-09-03, konsumentkartan §10, Opus dom): breddad från
// MomentSource (11) till hela EventLedgerType-unionen (34) — statisk tabell
// för de typer vars kind inte beror på ett sekundärt fält. De tre dynamiska
// undantagen (storyline_resolution/decision/manager_burnout) löses via
// `entry`-parametern nedan, inte i tabellen — deras kind beror på ETT
// klassificerande fält på posten (storyline-typens namn/irreversible+tension/
// beat), inte bara `type` ensamt.
const STATIC_MOMENT_KIND: Partial<Record<EventLedgerType, ActiveMemoryKind>> = {
  derby_win: 'triumph', sponsor_positive: 'triumph', era_shift: 'triumph', season_highlight: 'triumph',
  academy_promotion: 'triumph', national_team_callup: 'triumph', facility_built: 'triumph',
  referee_trust: 'triumph', patron_emerge: 'triumph',
  star_injury: 'scar', rival_sale: 'scar', captain_crisis: 'scar', sponsor_negative: 'scar',
  transfer_story: 'scar', scandal: 'scar', mecenat_withdrawal: 'scar', patron_withdrawal: 'scar',
  nemesis_signed: 'tension', referee_feud: 'tension',
  mecenat_costshare: 'neutral', player_milestone: 'neutral', retirement: 'neutral',
}

/**
 * `entry` krävs bara för de tre dynamiska typerna (storyline_resolution/
 * decision/manager_burnout) — övriga läser den statiska tabellen och
 * ignorerar parametern. Given okänt/oklassat `type`: 'neutral' (aldrig en
 * gissning uppåt mot triumph/scar).
 */
export function momentKind(
  type: EventLedgerType,
  entry?: Pick<EventLedgerEntry, 'irreversible' | 'tension' | 'semanticKey'>,
): ActiveMemoryKind {
  if (type === 'decision') {
    return entry?.irreversible && entry?.tension ? 'tension' : 'neutral'
  }
  if (type === 'storyline_resolution') {
    const key = entry?.semanticKey ?? ''
    if (/underdog|gala_winner|breakthrough|vindicated|rallied|hero/.test(key)) return 'triumph'
    return 'neutral'
  }
  if (type === 'manager_burnout') {
    const key = entry?.semanticKey ?? ''
    if (key.includes(':mark:')) return 'scar'
    if (key.includes(':close:')) return 'triumph'
    return 'neutral'
  }
  return STATIC_MOMENT_KIND[type] ?? 'neutral'
}

export type MemoryFamily = '⚔️' | '🏟️' | '👤' | '🤝' | '📋'

// liggare-k1/k3 (2026-09-03, §10): "mappa TYP→FAMILJ, inte typ→egen emoji"
// (redesign-klubbminnet-omdesign) — fem stämplar, inte trettiofyra.
const MOMENT_FAMILY: Partial<Record<EventLedgerType, MemoryFamily>> = {
  derby_win: '⚔️', season_highlight: '⚔️', season_finish: '⚔️', cup_final: '⚔️', sm_final: '⚔️',
  derby_result: '⚔️', big_win: '⚔️', big_loss: '⚔️',
  facility_built: '🏟️',
  player_milestone: '👤', academy_promotion: '👤', retirement: '👤', transfer_story: '👤',
  star_injury: '👤', captain_crisis: '👤', national_team_callup: '👤', nemesis_signed: '👤',
  rival_sale: '👤', transfer_signed: '👤', transfer_sold: '👤',
  patron_emerge: '🤝', patron_withdrawal: '🤝', mecenat_withdrawal: '🤝', mecenat_costshare: '🤝',
  sponsor_positive: '🤝', sponsor_negative: '🤝', referee_feud: '🤝', referee_trust: '🤝',
  decision: '📋', storyline_resolution: '📋', scandal: '📋', manager_burnout: '📋', era_shift: '📋',
}

export function momentFamily(type: EventLedgerType): MemoryFamily {
  return MOMENT_FAMILY[type] ?? '📋'
}
