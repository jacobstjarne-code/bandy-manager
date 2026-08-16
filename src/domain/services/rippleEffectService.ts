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
      return applyBigDerbyWinRipples(game, trigger.fixtureId)
    case 'mecenat_left':
      return applyMecenatLeftRipples(game, trigger.mecenatId)
  }
}

// ÖVERLÄMNING 2 steg 3, dynamiska deltan (2026-08-16): Jacobs krav — dagens
// fasta värden ska vara MITTPUNKTEN i spannet, inte en av ändarna, så
// kalibreringen (redan spelad in mot verkliga säsonger) inte glider.
// weight=1.0 exakt vid "genomsnittsfallet" som beskrivs vid varje formel;
// clamp() sätter yttergränserna så inga extremfall ger absurda utslag.
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function applyStarInjuryRipples(game: SaveGame, playerId: string): SaveGame {
  const player = game.players.find(p => p.id === playerId)
  if (!player) return game

  // Only ripple for managed-club stars (CA ≥ 60)
  if (player.clubId !== game.managedClubId || player.currentAbility < 60) return game

  const weeksOut = Math.ceil((player.injuryDaysRemaining ?? 0) / 7)
  const isFranchise = player.id === game.captainPlayerId || player.currentAbility >= 78

  // Vikt: spelarens styrka relativt truppsnittet × kaptenskap × hur etablerad
  // hen är denna säsong. Baseline (vikt=1.0, reproducerar exakt −4/−3/−4):
  // CA = truppsnittet, inte kapten, 10 matcher spelade den här säsongen.
  // En inbytare (låg CA, få matcher, ej kapten) hamnar nära golvet (0.25) —
  // knappt märkbart. Lagets bästa (hög CA, kapten, etablerad) hamnar nära
  // taket (2.5) — svider ordentligt.
  const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const avgCA = squadPlayers.length > 0
    ? squadPlayers.reduce((sum, p) => sum + p.currentAbility, 0) / squadPlayers.length
    : player.currentAbility
  const caWeight = avgCA > 0 ? clamp(player.currentAbility / avgCA, 0.4, 2.0) : 1.0
  const captainMult = player.id === game.captainPlayerId ? 1.3 : 1.0
  const gamesThisSeason = player.seasonStats?.gamesPlayed ?? 0
  const gamesWeight = clamp(gamesThisSeason / 10, 0.3, 1.4)
  const weight = clamp(caWeight * captainMult * gamesWeight, 0.25, 2.5)

  // Bas — varje stjärnskada (oavsett längd): oro i leden
  let updated: SaveGame = {
    ...game,
    fanMood: Math.max(0, (game.fanMood ?? 50) - Math.round(4 * weight)),
  }
  if (updated.supporterGroup) {
    updated = { ...updated, supporterGroup: {
      ...updated.supporterGroup,
      mood: Math.max(0, (updated.supporterGroup.mood ?? 50) - Math.round(3 * weight)),
    }}
  }

  // Eskalering — endast långtidsskada (≥4 v) PÅ en franchise-spelare rör styrelsen
  if (weeksOut >= 4 && isFranchise) {
    updated = { ...updated, boardPatience: Math.max(0, (updated.boardPatience ?? 70) - Math.round(4 * weight)) }
  }

  return updated
}

function applyBigDerbyWinRipples(game: SaveGame, fixtureId: string): SaveGame {
  let updated = game

  // Vikt: målmarginal × motståndarens tabellplacering. Baseline (vikt=1.0,
  // reproducerar exakt +8/+10/+5): 2 mål marginal mot ett mittenlag. En
  // enmålsseger mot ett bottenlag ger en svag skvalp; att köra över
  // serieledaren med stor marginal ger en riktig våg.
  const fixture = game.fixtures.find(f => f.id === fixtureId)
  let weight = 1.0
  if (fixture) {
    const managedIsHome = fixture.homeClubId === game.managedClubId
    const managedScore = managedIsHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0)
    const oppScore = managedIsHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0)
    const margin = Math.max(1, managedScore - oppScore)
    const marginWeight = clamp(margin / 2, 0.4, 2.2)

    const oppId = managedIsHome ? fixture.awayClubId : fixture.homeClubId
    const totalClubs = game.standings.length || 12
    const oppPosition = game.standings.find(s => s.clubId === oppId)?.position ?? Math.ceil(totalClubs / 2)
    // Position 1 (serieledaren) → ~1.4-1.5, mittenlag → 1.0, sistalaget → 0.5.
    const oppWeight = clamp(1.5 - (oppPosition / totalClubs), 0.5, 1.5)

    weight = clamp(marginWeight * oppWeight, 0.3, 2.5)
  }

  // fanMood +8 (baseline)
  updated = { ...updated, fanMood: Math.min(100, (updated.fanMood ?? 50) + Math.round(8 * weight)) }

  // Supporter group mood +10 (baseline, if exists)
  if (updated.supporterGroup) {
    updated = {
      ...updated,
      supporterGroup: {
        ...updated.supporterGroup,
        mood: Math.min(100, (updated.supporterGroup.mood ?? 50) + Math.round(10 * weight)),
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
    sponsorNetworkMood: Math.min(100, (updated.sponsorNetworkMood ?? 50) + Math.round(5 * weight)),
  }

  return updated
}

function applyMecenatLeftRipples(game: SaveGame, mecenatId: string): SaveGame {
  let updated = game

  // Vikt: mecenatens contribution (kr/säsong, wealth 1-5 → ~20 000-120 000
  // per mecenatService.ts) relativt en 70 000-baseline (wealth≈3, mitten av
  // skalan) — reproducerar exakt −8/−10/−5 för en genomsnittlig mecenat.
  // En liten mecenat som drar sig ur märks knappt; en stor rycker undan mattan.
  const mecenat = (game.mecenater ?? []).find(m => m.id === mecenatId)
  const baselineContribution = 70000
  const weight = mecenat
    ? clamp(mecenat.contribution / baselineContribution, 0.3, 2.0)
    : 1.0

  // communityStanding −8 (baseline)
  updated = { ...updated, communityStanding: Math.max(0, (updated.communityStanding ?? 50) - Math.round(8 * weight)) }

  // boardPatience −10 (baseline)
  updated = { ...updated, boardPatience: Math.max(0, (updated.boardPatience ?? 70) - Math.round(10 * weight)) }

  // Supporter mood −5 (baseline)
  if (updated.supporterGroup) {
    updated = {
      ...updated,
      supporterGroup: {
        ...updated.supporterGroup,
        mood: Math.max(0, (updated.supporterGroup.mood ?? 50) - Math.round(5 * weight)),
      },
    }
  }

  return updated
}
