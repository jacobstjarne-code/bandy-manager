import type { SaveGame } from '../entities/SaveGame'
import type { SeasonSignature, SeasonSignatureId } from '../entities/SeasonSignature'
import { SEASON_SIGNATURE_DEFS } from '../entities/SeasonSignature'

type WeightEntry = { id: SeasonSignatureId; weight: number }

/**
 * Väljer säsongssignatur för en kommande säsong.
 * Pure function — tar rand som parameter.
 */
export function pickSeasonSignature(game: SaveGame, rand: () => number): SeasonSignatureId {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const isNorthern = managedClub?.region === 'Norrbotten'

  // Check for recent scandals (last 2 seasons)
  const recentScandals = (game.scandalHistory ?? []).filter(
    s => s.season >= game.currentSeason - 2
  )
  const hasRecentScandals = recentScandals.length > 0

  // hot_transfer_market more likely from season 2 onward (market is active)
  const transferBoost = game.currentSeason > 1

  const weights: WeightEntry[] = [
    { id: 'calm_season',         weight: 50 },
    { id: 'cold_winter',         weight: isNorthern ? 18 : 12 },
    { id: 'scandal_season',      weight: hasRecentScandals ? 18 : 10 },
    { id: 'hot_transfer_market', weight: transferBoost ? 16 : 10 },
    { id: 'injury_curve',        weight: 9 },
    { id: 'dream_round',         weight: 9 },
  ]

  const total = weights.reduce((s, w) => s + w.weight, 0)
  let r = rand() * total
  for (const { id, weight } of weights) {
    r -= weight
    if (r <= 0) return id
  }
  return 'calm_season'
}

/**
 * Bygger en ny SeasonSignature för aktuell säsong.
 */
const SIGNATURE_INITIAL_FACT: Record<SeasonSignatureId, (game: SaveGame) => string> = {
  calm_season: () => 'Ingenting sticker ut i år — ännu.',
  cold_winter: (g) => {
    const club = g.clubs.find(c => c.id === g.managedClubId)
    const region = club?.region ?? 'regionen'
    return `Långtidsprognosen för ${region} lovar en kall vinter. Isen lär bli stenhård.`
  },
  scandal_season: (g) => {
    const recent = (g.scandalHistory ?? []).filter(s => s.season >= g.currentSeason - 2)
    return recent.length > 0
      ? `${recent.length} skandaler i ligan de senaste åren. Pressen luktar redan på nästa.`
      : 'Rubrikerna ligger nära i år. Det märks redan.'
  },
  hot_transfer_market: () => 'Transfertelefonen går varm innan säsongen ens börjat.',
  injury_curve: () => 'Fler på skadebänken än vanligt redan i försäsongen.',
  dream_round: () => 'Ingen klar favorit i år. Serien känns öppen på ett sätt den sällan är.',
}

export function createSeasonSignature(game: SaveGame, rand: () => number): SeasonSignature {
  const id = pickSeasonSignature(game, rand)
  return {
    id,
    modifiers: SEASON_SIGNATURE_DEFS[id],
    startedSeason: game.currentSeason,
    observedFacts: [SIGNATURE_INITIAL_FACT[id](game)],
  }
}

/**
 * Lägger till ett observerat faktum till säsongens signatur.
 */
export function recordSignatureFact(game: SaveGame, fact: string): SaveGame {
  if (!game.currentSeasonSignature) return game
  const existing = game.currentSeasonSignature.observedFacts
  // Max 5 facts to avoid bloat
  const updated = [...existing, fact].slice(-5)
  return {
    ...game,
    currentSeasonSignature: {
      ...game.currentSeasonSignature,
      observedFacts: updated,
    },
  }
}

/**
 * Genererar säsongsslutets rubricerande mening.
 * Returnerar null för calm_season — inget läggs till i SeasonSummary.
 */
export function summarizeSignature(signature: SeasonSignature): string | null {
  const season = signature.startedSeason
  const facts = signature.observedFacts

  // Påståendesvepet #21 (MASTER.md, 2026-08-24): fallbacken (`|| '...'`)
  // påstod ett SPECIFIKT observerat faktum ("Is och minusgrader satte
  // tonen.") även om observedFacts var tom — ogated. I praktiken oåtkomlig
  // (createSeasonSignature seedar alltid minst ett faktum, recordSignatureFact
  // bara lägger till), men om något framtida anrop någonsin konstruerar en
  // signatur förbi den vägen ska raden inte hitta på ett faktum som aldrig
  // observerades — samma princip som #1/#20. Ingen fallback-text, bara
  // rubrikmeningen ensam.
  switch (signature.id) {
    case 'cold_winter':
      return facts[0] ? `Köldvintern ${season}. ${facts[0]}` : `Köldvintern ${season}.`
    case 'scandal_season':
      return facts[0] ? `Skandalsäsongen ${season}. ${facts[0]}` : `Skandalsäsongen ${season}.`
    case 'hot_transfer_market':
      return facts[0] ? `Den heta transfersommaren ${season}. ${facts[0]}` : `Den heta transfersommaren ${season}.`
    case 'injury_curve':
      return facts[0] ? `Skadekurvan ${season}. ${facts[0]}` : `Skadekurvan ${season}.`
    case 'dream_round':
      return facts[0] ? `Drömrundan ${season}. ${facts[0]}` : `Drömrundan ${season}.`
    case 'calm_season':
    default:
      return null
  }
}

/**
 * Returnerar emoji för en signatur.
 */
export function getSignatureEmoji(id: SeasonSignatureId): string {
  switch (id) {
    case 'cold_winter':         return '🌨'
    case 'scandal_season':      return '📰'
    case 'hot_transfer_market': return '💼'
    case 'injury_curve':        return '🩹'
    case 'dream_round':         return '✨'
    default:                    return ''
  }
}

/**
 * Returnerar visningsnamn för en signatur.
 */
export function getSignatureName(id: SeasonSignatureId): string {
  switch (id) {
    case 'cold_winter':         return 'Köldvintern'
    case 'scandal_season':      return 'Skandalsäsongen'
    case 'hot_transfer_market': return 'Het transfermarknad'
    case 'injury_curve':        return 'Skadekurvan'
    case 'dream_round':         return 'Drömrundan'
    default:                    return 'Lugn säsong'
  }
}
