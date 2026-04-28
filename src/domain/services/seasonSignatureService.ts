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
export function createSeasonSignature(game: SaveGame, rand: () => number): SeasonSignature {
  const id = pickSeasonSignature(game, rand)
  return {
    id,
    modifiers: SEASON_SIGNATURE_DEFS[id],
    startedSeason: game.currentSeason,
    observedFacts: [],
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
 */
export function summarizeSignature(signature: SeasonSignature): string {
  const season = signature.startedSeason
  const facts = signature.observedFacts

  switch (signature.id) {
    case 'cold_winter':
      return `Detta blev köldvintern ${season} — ${facts[0] || 'is och minusgrader dominerade'}`
    case 'scandal_season':
      return `Skandalsäsongen ${season} — ${facts[0] || 'rykten och rubriker drog bort fokus'}`
    case 'hot_transfer_market':
      return `Den heta transfersommaren ${season} — ${facts[0] || 'telefonen ringde, fönstret stängde med dramatik'}`
    case 'injury_curve':
      return `Skadekurvan ${season} — ${facts[0] || 'mellansäsongen kostade hårt på truppen'}`
    case 'dream_round':
      return `Drömrundan ${season} — ${facts[0] || 'underdog-energin gav ligan ett nytt ansikte'}`
    case 'calm_season':
    default:
      return `En lugn säsong ${season} utan dramatiska avvikelser.`
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
