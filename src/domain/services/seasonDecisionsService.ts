import type { SaveGame } from '../entities/SaveGame'
import { FACILITY_NODE_DEFS } from './facilityService'
import { LICENSE_ZONE_TEXT } from './licenseService'
import { getResolvedStorylineProjections } from './storylineLedgerService'

function objectiveDisplayName(game: SaveGame, objectiveId: string): string {
  const liveLabel = game.boardObjectives?.find(o => o.id === objectiveId)?.label
  if (liveLabel) return liveLabel
  const known: Record<string, string> = {
    balanceBudget: 'Håll ekonomin i balans',
    growFinances: 'Öka klubbkassan',
    investSurplus: 'Investera överskottet',
    playHomegrown: 'Spela egenfostrade',
    improveYouth: 'Utveckla akademin',
    growFanbase: 'Väx supporterbasen',
    reduceInjuries: 'Minska skadorna',
    cupRun: 'Gå långt i cupen',
    topHalf: 'Sluta på övre halvan',
    beatRival: 'Besegra rivalen',
    avoidRelegation: 'Undvik nedflyttning',
  }
  return known[objectiveId] ?? objectiveId.replace(/([a-zåäö])([A-ZÅÄÖ])/g, '$1 $2').toLowerCase()
}

export interface SeasonDecision {
  icon: string
  text: string
  round?: number
  /** Satt bara för storyline-härledda poster — bär StorylineEntry.id vidare
   *  för entity-dedup-grinden (AUDIT DEL 2, 2026-08-12). */
  storylineId?: string
}

/**
 * AUDIT DEL 2 A3, uppföljning (2026-08-09): `excludeStorylineTypes` låter
 * anroparen (SeasonSummaryScreen.tsx) hoppa över storyline-typer som redan
 * visats i en annan sektion på samma skärm (DIN SÄSONG). Båda ytorna läser
 * nu samma liggarstyrda resolution-projektion; Set:et koordinerar bara
 * presentationen mellan sektionerna, inte historisk existens.
 */
export function collectSeasonDecisions(game: SaveGame, excludeStorylineTypes?: Set<string>): SeasonDecision[] {
  const decisions: SeasonDecision[] = []
  const season = game.currentSeason

  // Academy promotions
  const promoted = game.players.filter(p =>
    p.clubId === game.managedClubId &&
    p.promotedFromAcademy &&
    p.promotionRound !== undefined &&
    (p.promotionSeason === season || (p.promotionSeason === undefined && p.id.endsWith(`_${season}`)))
  )
  for (const p of promoted) {
    decisions.push({
      icon: '🎓',
      text: `Kallade upp ${p.firstName} ${p.lastName} (${p.age} år) från akademin`,
      round: p.promotionRound,
    })
  }

  // Resolved storylines
  for (const sl of getResolvedStorylineProjections(game, season)) {
    if (sl.displayText && !excludeStorylineTypes?.has(sl.type)) {
      decisions.push({ icon: '📖', text: sl.displayText, round: sl.matchday, storylineId: sl.id })
    }
  }

  // Board objectives met/failed
  for (const obj of game.boardObjectiveHistory ?? []) {
    if (obj.season === season) {
      decisions.push({
        icon: obj.result === 'met' ? '✅' : '❌',
        text: `Styrelseuppdrag: ${objectiveDisplayName(game, obj.objectiveId)} — ${obj.result === 'met' ? 'uppfyllt' : 'misslyckat'}`,
      })
    }
  }

  // Facility — pågående bygge (nya modellen; completedSeason saknas → bara aktivt bygge visas)
  const ap = game.facilityState?.activeProject
  if (ap) {
    const def = FACILITY_NODE_DEFS.find(d => d.id === ap.nodeId)
    decisions.push({ icon: '🏗️', text: `Bygger: ${def?.label ?? ap.nodeId}` })
  }

  return decisions.sort((a, b) => (a.round ?? 99) - (b.round ?? 99)).slice(0, 8)
}

export interface SeasonLicenseConsequence {
  icon: string
  text: string
}

/**
 * arsbok-dina-val-licensstatus (GPT styrelse-test 2026-09-04, PRIO 3):
 * licensstatus är ett SYSTEMTILLSTÅND, inte ett val spelaren gjorde —
 * `collectSeasonDecisions` (ovan) lade tidigare alltid in den under "Dina
 * val", en rubrik som lovar beslut. Egen konsekvensrad i stället.
 *
 * Om spelaren FAKTISKT svarat på licensnämndens handlingsplan
 * (`licenseHandlingsplan`-eventet, seasonEndProcessor.ts) är DET valet —
 * inte statusen — vad "Dina val" borde visa. Den kopplingen (läsa
 * `resolvedChoices` för den specifika eventet) är INTE byggd här; PRIO 3-
 * raden är märkt "Liten" för statusflytten, inte för handlingsplan-vägen.
 * Flaggat, inte tyst utelämnat — egen rad om Jacob vill ha den.
 */
export function getSeasonLicenseConsequence(game: SaveGame): SeasonLicenseConsequence | null {
  if (!game.licenseStatus || game.licenseStatus === 'clear') return null
  return { icon: '📋', text: `Licensnämnden: ${LICENSE_ZONE_TEXT[game.licenseStatus]}` }
}
