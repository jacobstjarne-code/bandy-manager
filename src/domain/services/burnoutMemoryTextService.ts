import type { SaveGame } from '../entities/SaveGame'
import { BURNOUT_MARK_RELAPSE } from '../data/managerKaraktarText'

/** Read the previous season's actual choice, not this season's latest scar. */
export function getPriorBurnoutChoice(game: SaveGame): 'stepped_back' | 'hardened' | undefined {
  const prior = (game.eventLedger ?? [])
    .filter(e => e.type === 'decision' && e.season < game.currentSeason
      && (!e.managerId || e.managerId === game.id)
      && (e.semanticKey === 'burnoutCeiling:step_back' || e.semanticKey === 'burnoutCeiling:push_through'))
    .sort((a, b) => b.season - a.season || b.matchday - a.matchday)[0]
  if (prior) return prior.semanticKey === 'burnoutCeiling:step_back' ? 'stepped_back' : 'hardened'

  // Legacy saves may only carry the latest scar. Never mistake a scar from
  // this season for the previous episode, or invent a choice without evidence.
  const scars = (game.managerProfile?.diary ?? []).filter(e => e.type === 'burnout_scar')
  if (scars.some(e => e.season < game.currentSeason) && !scars.some(e => e.season >= game.currentSeason)) {
    return game.managerProfile?.burnoutScar
  }
  return undefined
}

export function getBurnoutRelapseText(game: SaveGame, zone: 'markbar' | 'hog') {
  const quotes = [...BURNOUT_MARK_RELAPSE.quotesByZone[zone]]
  const helpers = [...BURNOUT_MARK_RELAPSE.helpersByZone[zone]]
  // Preserve pool length/index: roundProcessor logs these same identities.
  if (zone === 'hog') {
    const prior = getPriorBurnoutChoice(game)
    if (prior === 'stepped_back') {
      quotes[2] = 'Förra gången klev jag tillbaka. Nu behöver jag lyssna på kroppen igen.'
      helpers[0] = 'Du klev tillbaka förra gången. Du behöver inte vänta lika länge nu.'
    } else if (prior === 'hardened') {
      quotes[2] = 'Förra gången körde jag vidare. Det hindrade mig inte från att hamna här igen.'
      helpers[0] = 'Du körde vidare förra gången. Det är ingen garanti för att det håller nu.'
    }
  }
  return { quotes, helpers }
}
