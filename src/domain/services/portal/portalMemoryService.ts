import type { EventLedgerEntry } from '../../entities/Narrative'
import type { SaveGame } from '../../entities/SaveGame'
import { buildMemoryEventFromLedger } from '../clubMemoryService'
import { currentChronology } from '../currentChronology'
import { getActiveDecisionCount } from '../decisionBudgetService'
import { toldMarksFor } from '../ledgerToldService'
import { agendaForSurface, redaktoren, type AgendaItem } from '../redaktorenService'

export interface PortalMemoryCandidate {
  post: EventLedgerEntry
  postKey: string
  kicker: 'SEDAN SIST' | 'FÖR ETT ÅR SEDAN'
  text: string
  emoji: string
  editorialWeight: number
}

function toCandidate(game: SaveGame, item: AgendaItem): PortalMemoryCandidate | null {
  const memory = buildMemoryEventFromLedger(game, item.post, game.managedClubId)
  if (!memory) return null
  return {
    post: item.post,
    postKey: item.postKey,
    kicker: item.freshnessQueue === 'anniversary' ? 'FÖR ETT ÅR SEDAN' : 'SEDAN SIST',
    text: memory.text,
    emoji: memory.emoji,
    editorialWeight: item.scoresBySurface.portal.total,
  }
}

/**
 * SPEC_BERATTAREN §5, steg 3. Högst ett minne per matchdag. Ett redan
 * visat minne hålls fast resten av samma matchdag så told-kvittot inte får
 * React-renderingen att byta eller ta bort kortet direkt efter visning.
 */
export function selectPortalMemory(game: SaveGame): PortalMemoryCandidate | null {
  if (getActiveDecisionCount(game) > 0) return null
  const chronology = currentChronology(game)
  const agenda = redaktoren(game, chronology)
  const ranked = agendaForSurface(agenda, 'portal')

  const shownThisMatchday = ranked.find(item =>
    toldMarksFor(game.ledgerTold, item.post).some(mark =>
      mark.surface === 'portal'
      && mark.season === chronology.season
      && mark.matchday === chronology.matchday
    )
  )
  if (shownThisMatchday) return toCandidate(game, shownThisMatchday)

  for (const item of ranked) {
    const weight = item.scoresBySurface.portal.total
    const eligible = item.freshnessQueue === 'since_last'
      ? weight >= 60
      : item.freshnessQueue === 'anniversary' && weight >= 70
    if (!eligible) continue
    const candidate = toCandidate(game, item)
    if (candidate) return candidate
  }
  return null
}
