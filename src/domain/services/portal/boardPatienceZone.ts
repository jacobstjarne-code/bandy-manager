import type { SaveGame } from '../../entities/SaveGame'
import type { BoardObjective } from '../../entities/Community'

/**
 * 3.2 (SLUTTEST_KO.md, 2026-08-17) — kvalitativa zoner för boardPatience,
 * inte råtal. Trösklarna (50/30) matchar redan kalibrerade gränser i
 * PORTAL_BEATS' board_failure-beat (portalBeats.ts) — inte nya siffror,
 * återanvänder en befintlig, redan sedd severity-gräns.
 *
 * Verklig avsked-gräns är boardPatience <= 15 (seasonEndProcessor.ts) —
 * 'ultimatum' (< 30) ger en varningsmarginal innan tröskeln nås, inte en
 * exakt matchning mot avskedsgränsen.
 */
export type BoardPatienceZone = 'stabilt' | 'under_press' | 'ultimatum'

/**
 * Utbruten (påståendesvepet #13, MASTER.md, 2026-08-24, Jacobs dom
 * 2026-08-26) så boardService.ts:s "Styrelsebetyg"-inkorgskort kan använda
 * SAMMA tröskel som portalens zon-visning, istf en andra kopia av 30/50.
 */
export function boardPatienceZoneFromScore(patience: number): BoardPatienceZone {
  return patience < 30 ? 'ultimatum' : patience < 50 ? 'under_press' : 'stabilt'
}

export interface BoardPatienceZoneInfo {
  zone: BoardPatienceZone
  /** Ordet Jacob gav i SLUTTEST_KO.md — inte Code-författad speltext. */
  label: 'Stabilt' | 'Under press' | 'Ultimatum'
  /** 3.2 "med orsak"-kravet: rubrikraden, låst text 2026-08-17. */
  headline: string
  /** Orsaksrad — bara satt i under_press/ultimatum, en av fyra låsta rader. */
  causeLine?: string
  /** Väg tillbaka — bara satt i ultimatum. */
  pathBackLine?: string
}

const HEADLINES: Record<BoardPatienceZone, string> = {
  stabilt: 'Styrelsen har inget att invända.',
  under_press: 'Styrelsen är orolig.',
  ultimatum: 'Styrelsen har tappat tålamodet.',
}

type ConcernCause = 'standings' | 'economy' | 'repetition' | 'supporters'

const CAUSE_LINES: Record<ConcernCause, string> = {
  standings: 'Ni ligger under det de begärde.',
  economy: 'Kassan går åt fel håll.',
  repetition: 'Andra året i rad utan det de bad om.',
  supporters: 'Det syns på läktaren, och de ser det.',
}

/**
 * "med orsak"-kravet: väljer den orsak som FAKTISKT driver tålamodet nedåt,
 * en åt gången, i Opus låsta prioritetsordning (SLUTTEST_KO.md, 2026-08-17):
 * 1. tabellplacering under kravet, 2. ekonomi, 3. upprepning (andra året i
 * rad), 4. klack/publik. Läser boardObjectives (redan byggd källa — samma
 * struktur som board_failure-beaten i portalBeats.ts använder), inte en ny
 * härledning.
 */
function pickConcernCause(game: SaveGame): { cause: ConcernCause; objective?: BoardObjective } | null {
  const objectives = game.boardObjectives ?? []
  const concerning = (t: BoardObjective['type']) =>
    objectives.find(o => o.type === t && (o.status === 'failed' || o.status === 'at_risk'))

  const sporting = concerning('sporting')
  if (sporting) return { cause: 'standings', objective: sporting }

  const economic = concerning('economic')
  if (economic) return { cause: 'economy', objective: economic }

  const anyConcerning = objectives.find(o => o.status === 'failed' || o.status === 'at_risk')
  const lastSeasonFailed = (game.boardObjectiveHistory ?? []).some(
    h => h.season === game.currentSeason - 1 && h.result === 'failed'
  )
  if (anyConcerning && lastSeasonFailed) return { cause: 'repetition', objective: anyConcerning }

  const community = concerning('community')
  if (community) return { cause: 'supporters', objective: community }

  return null
}

export function getBoardPatienceZone(game: SaveGame): BoardPatienceZoneInfo {
  const patience = game.boardPatience ?? 70
  const zone = boardPatienceZoneFromScore(patience)
  const label = zone === 'ultimatum' ? 'Ultimatum' : zone === 'under_press' ? 'Under press' : 'Stabilt'
  const headline = HEADLINES[zone]

  if (zone === 'stabilt') {
    return { zone, label, headline }
  }

  const concern = pickConcernCause(game)
  const causeLine = concern ? CAUSE_LINES[concern.cause] : undefined
  const pathBackLine = zone === 'ultimatum' && concern?.objective
    ? `Det som återstår: ${concern.objective.label}.`
    : undefined

  return { zone, label, headline, causeLine, pathBackLine }
}
