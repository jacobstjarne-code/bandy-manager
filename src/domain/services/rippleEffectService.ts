// DREAM-003: Spridningseffekter
// Systemkorsningar: stjärna skadad, derby-seger, mecenat lämnar.

import type { SaveGame, RippleChain, RippleChainStep } from '../entities/SaveGame'

// M15: fields that ripple effects can modify — used for targeted merging
export const RIPPLE_AFFECTED_FIELDS = [
  'fanMood', 'communityStanding', 'boardPatience', 'sponsorNetworkMood', 'supporterGroup',
] as const

export type RippleAffectedField = typeof RIPPLE_AFFECTED_FIELDS[number]

export interface RippleMergeOverrides {
  /** Base fanMood before adding ripple delta (e.g. narrative-updated fanMood) */
  fanMoodBase?: number
  /** Additional sponsorNetworkMood delta beyond ripple (e.g. transfer reactions) */
  sponsorNetworkMoodDelta?: number
  /** Additional communityStanding delta beyond ripple (e.g. csBoost from community) */
  communityStandingDelta?: number
  /** Fallback supporterGroup if ripple did not change it */
  supporterGroupFallback?: SaveGame['supporterGroup']
}

/**
 * Merge ripple-derived deltas into the correct fields for the output game state.
 * Replaces the scattered manual extractions in roundProcessor.
 */
export function mergeRippleDeltas(
  base: SaveGame,
  rippled: SaveGame,
  overrides: RippleMergeOverrides = {},
): Pick<SaveGame, RippleAffectedField> {
  const fanMoodBase = overrides.fanMoodBase ?? base.fanMood ?? 50
  const fanMoodRippleDelta = (rippled.fanMood ?? base.fanMood ?? 50) - (base.fanMood ?? 50)

  return {
    fanMood: Math.min(100, Math.max(0, fanMoodBase + fanMoodRippleDelta)),
    communityStanding: Math.min(100, Math.max(0, Math.round(
      (rippled.communityStanding ?? base.communityStanding ?? 50) + (overrides.communityStandingDelta ?? 0),
    ))),
    boardPatience: rippled.boardPatience,
    sponsorNetworkMood: Math.min(100, Math.max(0,
      (rippled.sponsorNetworkMood ?? base.sponsorNetworkMood ?? 50) + (overrides.sponsorNetworkMoodDelta ?? 0),
    )),
    supporterGroup: rippled.supporterGroup !== base.supporterGroup
      ? rippled.supporterGroup
      : (overrides.supporterGroupFallback ?? base.supporterGroup),
  }
}

/**
 * Diffar before/after på de ripple-påverkade fälten → en beskrivande dominokedja.
 *
 * relatedPlayerId (ÖVERLÄMNING 2 steg 3-underlag, 2026-08-12) är valfri och
 * diffar EN specifik spelares fält (idag: morale) som ett eget, scope:'player'-
 * märkt steg — skilt från de sju scope:'club'-stegen nedan. Byggd nu (avslags-
 * utfallets enda konsekvens är annars alltid osynlig), men INTE utökad till
 * star_injured ännu — det är en separat, medveten senare runda (Jacobs dom:
 * piloten ska stå färdig och kunna kastas innan mönstret generaliseras).
 */
export function describeRippleChain(
  before: SaveGame,
  after: SaveGame,
  trigger: RippleChain['trigger'],
  subjectName: string | undefined,
  round: number,
  season: number,
  relatedPlayerId?: string,
): RippleChain {
  const steps: RippleChainStep[] = []
  const fanD = (after.fanMood ?? 50) - (before.fanMood ?? 50)
  if (fanD !== 0) steps.push({ label: 'Stämningen', dir: fanD > 0 ? 'up' : 'down', scope: 'club' })
  const klackD = (after.supporterGroup?.mood ?? 50) - (before.supporterGroup?.mood ?? 50)
  if (klackD !== 0) steps.push({ label: 'Klacken', dir: klackD > 0 ? 'up' : 'down', scope: 'club' })
  const csD = (after.communityStanding ?? 50) - (before.communityStanding ?? 50)
  if (csD !== 0) steps.push({ label: 'Orten', dir: csD > 0 ? 'up' : 'down', scope: 'club' })
  const boardD = (after.boardPatience ?? 70) - (before.boardPatience ?? 70)
  if (boardD !== 0) steps.push({ label: 'Styrelsen', dir: boardD > 0 ? 'up' : 'down', scope: 'club' })
  const sponsD = (after.sponsorNetworkMood ?? 50) - (before.sponsorNetworkMood ?? 50)
  if (sponsD !== 0) steps.push({ label: 'Sponsorerna', dir: sponsD > 0 ? 'up' : 'down', scope: 'club' })

  // AUDIT DEL 4 steg 2 (2026-08-12): ekonomi — kassan och transferbudgeten.
  // Klubb-nivå (managedClubId), inte SaveGame-nivå som de fem ovan — RIPPLE_
  // AFFECTED_FIELDS (denna fils topp) kan inte utökas med dem rakt av, den
  // är typad Pick<SaveGame, ...> för mergeRippleDeltas specifikt (en annan
  // konsument, roundProcessor.ts:s tre ursprungliga triggers). Samma AVSIKT
  // (fler fält kedjan bevakar) löst här istf i den konstanten.
  const beforeClub = before.clubs.find(c => c.id === before.managedClubId)
  const afterClub = after.clubs.find(c => c.id === after.managedClubId)
  const kassaD = (afterClub?.finances ?? 0) - (beforeClub?.finances ?? 0)
  if (kassaD !== 0) steps.push({ label: 'Kassan', dir: kassaD > 0 ? 'up' : 'down', scope: 'club' })
  const budgetD = (afterClub?.transferBudget ?? 0) - (beforeClub?.transferBudget ?? 0)
  if (budgetD !== 0) steps.push({ label: 'Transferbudget', dir: budgetD > 0 ? 'up' : 'down', scope: 'club' })

  // ÖVERLÄMNING 2 steg 3-underlag: spelarnivå, egen scope. Etiketten är
  // fältets namn ("Moralen") — subjectName bär redan VEM det gäller, "Spelaren"
  // hade varit dubbelt och tomt (Jacobs dom, 2026-08-15).
  if (relatedPlayerId) {
    const beforePlayer = before.players.find(p => p.id === relatedPlayerId)
    const afterPlayer = after.players.find(p => p.id === relatedPlayerId)
    const moraleD = (afterPlayer?.morale ?? 50) - (beforePlayer?.morale ?? 50)
    if (moraleD !== 0) steps.push({ label: 'Moralen', dir: moraleD > 0 ? 'up' : 'down', scope: 'player' })
  }

  return { trigger, subjectName, round, season, steps }
}

export type RippleTrigger =
  | { type: 'star_injured'; playerId: string }
  | { type: 'big_derby_win'; fixtureId: string }
  | { type: 'mecenat_left'; mecenatId: string }

export function applyRipples(game: SaveGame, trigger: RippleTrigger): SaveGame {
  switch (trigger.type) {
    case 'star_injured':
      return applyStarInjuryRipples(game, trigger.playerId)
    case 'big_derby_win':
      return applyBigDerbyWinRipples(game)
    case 'mecenat_left':
      return applyMecenatLeftRipples(game, trigger.mecenatId)
  }
}

function applyStarInjuryRipples(game: SaveGame, playerId: string): SaveGame {
  const player = game.players.find(p => p.id === playerId)
  if (!player) return game

  // Only ripple for managed-club stars (CA ≥ 60)
  if (player.clubId !== game.managedClubId || player.currentAbility < 60) return game

  const weeksOut = Math.ceil((player.injuryDaysRemaining ?? 0) / 7)
  const isFranchise = player.id === game.captainPlayerId || player.currentAbility >= 78

  // Bas — varje stjärnskada (oavsett längd): oro i leden
  let updated: SaveGame = {
    ...game,
    fanMood: Math.max(0, (game.fanMood ?? 50) - 4),
  }
  if (updated.supporterGroup) {
    updated = { ...updated, supporterGroup: {
      ...updated.supporterGroup,
      mood: Math.max(0, (updated.supporterGroup.mood ?? 50) - 3),
    }}
  }

  // Eskalering — endast långtidsskada (≥4 v) PÅ en franchise-spelare rör styrelsen
  if (weeksOut >= 4 && isFranchise) {
    updated = { ...updated, boardPatience: Math.max(0, (updated.boardPatience ?? 70) - 4) }
  }

  return updated
}

function applyBigDerbyWinRipples(game: SaveGame): SaveGame {
  let updated = game

  // fanMood +8
  updated = { ...updated, fanMood: Math.min(100, (updated.fanMood ?? 50) + 8) }

  // Supporter group mood +10 (if exists)
  if (updated.supporterGroup) {
    updated = {
      ...updated,
      supporterGroup: {
        ...updated.supporterGroup,
        mood: Math.min(100, (updated.supporterGroup.mood ?? 50) + 10),
      },
    }
  }

  // Yta 2 (Audit-syntes, 2026-07-07 — Väg B): communityStanding-steget (Orten)
  // borttaget avsiktligt. Med fyra steg (Stämningen/Klacken/Orten/Sponsorerna)
  // klippte describeRippleChains .slice(0,3) alltid bort Sponsorerna — kedjan
  // visade bara atmosfär ("alla blev glada"), aldrig pengaföljden. Grep-
  // verifierat: ingen achievement/styrelsemål/era-tröskel/narrativ text
  // refererar derby-vinst specifikt som communityStanding-källa (reputation-
  // MilestoneService/clubEraService läser bara det ackumulerade värdet
  // generellt, matat av många andra källor — economy/politiker/sponsorer/
  // hallprocess). Nu ryms alla tre kvarvarande steg (Stämningen/Klacken/
  // Sponsorerna) utan att klippas, och pengarna syns äntligen i kedjan.
  // Community standing FRÅN derbyvinster specifikt är alltså medvetet borta
  // — inte en glömd rad. Rör inte tillbaka utan ett nytt designbeslut.

  // Sponsors: bump all active sponsor incomes by 5% for one season via sponsor mood
  updated = {
    ...updated,
    sponsorNetworkMood: Math.min(100, (updated.sponsorNetworkMood ?? 50) + 5),
  }

  return updated
}

function applyMecenatLeftRipples(game: SaveGame, _mecenatId: string): SaveGame {
  let updated = game

  // communityStanding −8
  updated = { ...updated, communityStanding: Math.max(0, (updated.communityStanding ?? 50) - 8) }

  // boardPatience −10
  updated = { ...updated, boardPatience: Math.max(0, (updated.boardPatience ?? 70) - 10) }

  // Supporter mood −5
  if (updated.supporterGroup) {
    updated = {
      ...updated,
      supporterGroup: {
        ...updated.supporterGroup,
        mood: Math.max(0, (updated.supporterGroup.mood ?? 50) - 5),
      },
    }
  }

  return updated
}
