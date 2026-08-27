/**
 * boardMeetingStateResolver — beräknar A/B/C-tillstånd + render-data för
 * BoardMeeting säsong 2+ från föregående säsongs måluppfyllelse.
 *
 * Ren funktion. Inga store-anrop, inga side effects.
 *
 *  A · Första gången   — säsong 2 (oavsett utfall)
 *  B · Efter bra säsong — säsong 3+, måluppfyllelse ≥ 80%
 *  C · Efter dålig säsong — säsong 3+, måluppfyllelse < 50%
 *  Mellansäsonger (50–80%) → B om ≥ 65%, annars C
 */

import type { SaveGame } from '../../domain/entities/SaveGame'
import type { BoardObjective } from '../../domain/entities/Community'
import type { BoardMeetingState } from '../../domain/data/boardMeetingCopy'
import { getBoardPatienceZone } from '../../domain/services/portal/boardPatienceZone'

export interface BoardMeetingEvalRow {
  label: string
  met: boolean
}

export interface BoardMeetingFinance {
  finances: number
  transferBudget: number
  wageBudget: number
  /** Skillnad mot förra säsongsstart, om känt (för trend-pil). */
  financesDelta: number | null
}

export interface BoardMeetingData {
  state: BoardMeetingState
  fulfillmentPct: number   // 0–100, eller -1 om inga mål förra säsongen
  evalRows: BoardMeetingEvalRow[]
  hiddenEvalCount: number  // antal mål utöver de 3 visade
  finance: BoardMeetingFinance
  newGoals: BoardObjective[]
  chairmanName: string
  chairmanRole: string
}

type HistoryEntry = {
  season: number
  objectiveId: string
  result: 'met' | 'failed'
  ownerReaction: string
  label?: string
}

const MAX_EVAL_ROWS = 3

function shortLabel(entry: HistoryEntry): string {
  if (entry.label) return entry.label
  // Fallback: härled kort etikett ur ownerReaction (första meningen, trunkerad)
  const first = entry.ownerReaction.split(/[.!?]/)[0]?.trim() ?? 'Mål'
  return first.length > 32 ? first.slice(0, 30) + '…' : first
}

/**
 * PÅSTÅENDEKARTAN (2026-08-24): mötets ton läste tidigare fulfillmentPct
 * (förra säsongens målpoäng), en fjärde oberoende nöjdhetsformel — läser nu
 * getBoardPatienceZone(game).zone, samma tröskel som portalBeats.ts:s
 * board_failure-beat redan är kalibrerad mot.
 *
 * @cites boardPatience, fulfillmentPct
 */
export function resolveBoardMeetingState(game: SaveGame): BoardMeetingData {
  const prevSeason = game.currentSeason - 1
  const history = (game.boardObjectiveHistory ?? []) as HistoryEntry[]
  const prevResults = history.filter(h => h.season === prevSeason)

  const total = prevResults.length
  const met = prevResults.filter(r => r.result === 'met').length
  const fulfillmentPct = total > 0 ? Math.round((met / total) * 100) : -1

  // State-resolver
  // PÅSTÅENDEKARTAN (2026-08-24): läste tidigare fulfillmentPct (förra
  // säsongens boardObjectives-måluppfyllelse) för att avgöra mötets HELA ton
  // — en FJÄRDE, oberoende formel för styrelsens nöjdhet. boardService.ts:s
  // egen kommentar (rad 34-37, 60-75) dokumenterar redan att boardPatience
  // är den enda sanningen efter sex kalibreringspass på att ena de tre andra
  // (evaluateBoard, getBoardPatienceZone, growFanbase-fyndet). Återanvänder
  // getBoardPatienceZone rakt av — samma 50-tröskel som redan är kalibrerad
  // och synlig på andra ställen (portalBeats.ts:s board_failure), inte en ny
  // siffra uppfunnen här.
  let state: BoardMeetingState
  if ((game.seasonSummaries?.length ?? 0) <= 1 || fulfillmentPct < 0) {
    state = 'A'
  } else {
    state = getBoardPatienceZone(game).zone === 'stabilt' ? 'B' : 'C'
  }

  // Eval-rader — misslyckade mål först (mest informativa), max 3
  const sorted = [...prevResults].sort((a, b) =>
    a.result !== b.result ? (a.result === 'failed' ? -1 : 1) : 0
  )
  const evalRows: BoardMeetingEvalRow[] = sorted.slice(0, MAX_EVAL_ROWS).map(r => ({
    label: shortLabel(r),
    met: r.result === 'met',
  }))
  const hiddenEvalCount = Math.max(0, total - MAX_EVAL_ROWS)

  // Ekonomi
  const club = game.clubs.find(c => c.id === game.managedClubId)
  const finances = club?.finances ?? 0
  const seasonStart = game.seasonStartFinances
  const finance: BoardMeetingFinance = {
    finances,
    transferBudget: club?.transferBudget ?? 0,
    wageBudget: club?.wageBudget ?? 0,
    financesDelta: seasonStart !== undefined ? finances - seasonStart : null,
  }

  // Nya mål (denna säsong)
  const newGoals = game.boardObjectives ?? []

  // Ordförande — KF4 (2026-06-21): EN källa, game.board (find-by-role). Samma källa som
  // boardMeetingScene-beats → dubbelnamnet är borta. Efter migration finns game.board alltid;
  // fallback-strängen är död kod men behålls som defensiv sista-utväg.
  const chair = game.board?.find(m => m.role === 'ordförande')
  const chairmanName = chair ? `${chair.firstName} ${chair.lastName}` : 'Ordföranden'
  const chairmanRole = chair?.role ?? 'ordförande'

  return {
    state,
    fulfillmentPct,
    evalRows,
    hiddenEvalCount,
    finance,
    newGoals,
    chairmanName,
    chairmanRole,
  }
}
