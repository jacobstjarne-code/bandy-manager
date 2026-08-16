// DREAM-003: Spridningseffekter
// Systemkorsningar: stjärna skadad, derby-seger, mecenat lämnar.

import type { SaveGame, RippleChain, RippleChainStep } from '../entities/SaveGame'
import type { Player } from '../entities/Player'
import type { TransferBid } from '../entities/GameEvent'

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
// ÖVERLÄMNING 2 steg 3 (2026-08-16): tröskel per fälttyp, inte globalt —
// humör och kassa rör sig i olika skalor (Jacobs krav). Humör-fält (0-100,
// t.ex. Stämningen/Moralen): absoluta poäng, grundat i de ursprungliga fasta
// deltana (4/3/8/10/5) så mittpunkterna landar spritt över banden, inte alla
// i samma. Ekonomi-fält (Kassan/Transferbudget): andel av wageBudget, eftersom
// samma kronbelopp betyder olika mycket för en liten och en stor klubb.
function humorMagnitude(absDelta: number): RippleChainStep['magnitude'] {
  if (absDelta >= 10) return 'kraftigt'
  if (absDelta >= 5) return 'tydligt'
  return 'knappt'
}

function economyMagnitude(absDelta: number, wageBudget: number): RippleChainStep['magnitude'] {
  const pct = wageBudget > 0 ? absDelta / wageBudget : 0
  if (pct > 0.4) return 'kraftigt'
  if (pct >= 0.1) return 'tydligt'
  return 'knappt'
}

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
  if (fanD !== 0) steps.push({ label: 'Stämningen', dir: fanD > 0 ? 'up' : 'down', scope: 'club', magnitude: humorMagnitude(Math.abs(fanD)) })
  const klackD = (after.supporterGroup?.mood ?? 50) - (before.supporterGroup?.mood ?? 50)
  if (klackD !== 0) steps.push({ label: 'Klacken', dir: klackD > 0 ? 'up' : 'down', scope: 'club', magnitude: humorMagnitude(Math.abs(klackD)) })
  const csD = (after.communityStanding ?? 50) - (before.communityStanding ?? 50)
  if (csD !== 0) steps.push({ label: 'Orten', dir: csD > 0 ? 'up' : 'down', scope: 'club', magnitude: humorMagnitude(Math.abs(csD)) })
  const boardD = (after.boardPatience ?? 70) - (before.boardPatience ?? 70)
  if (boardD !== 0) steps.push({ label: 'Styrelsen', dir: boardD > 0 ? 'up' : 'down', scope: 'club', magnitude: humorMagnitude(Math.abs(boardD)) })
  const sponsD = (after.sponsorNetworkMood ?? 50) - (before.sponsorNetworkMood ?? 50)
  if (sponsD !== 0) steps.push({ label: 'Sponsorerna', dir: sponsD > 0 ? 'up' : 'down', scope: 'club', magnitude: humorMagnitude(Math.abs(sponsD)) })

  // AUDIT DEL 4 steg 2 (2026-08-12): ekonomi — kassan och transferbudgeten.
  // Klubb-nivå (managedClubId), inte SaveGame-nivå som de fem ovan — RIPPLE_
  // AFFECTED_FIELDS (denna fils topp) kan inte utökas med dem rakt av, den
  // är typad Pick<SaveGame, ...> för mergeRippleDeltas specifikt (en annan
  // konsument, roundProcessor.ts:s tre ursprungliga triggers). Samma AVSIKT
  // (fler fält kedjan bevakar) löst här istf i den konstanten.
  const beforeClub = before.clubs.find(c => c.id === before.managedClubId)
  const afterClub = after.clubs.find(c => c.id === after.managedClubId)
  const wageBudget = beforeClub?.wageBudget ?? 0
  const kassaD = (afterClub?.finances ?? 0) - (beforeClub?.finances ?? 0)
  if (kassaD !== 0) steps.push({ label: 'Kassan', dir: kassaD > 0 ? 'up' : 'down', scope: 'club', magnitude: economyMagnitude(Math.abs(kassaD), wageBudget) })
  const budgetD = (afterClub?.transferBudget ?? 0) - (beforeClub?.transferBudget ?? 0)
  if (budgetD !== 0) steps.push({ label: 'Transferbudget', dir: budgetD > 0 ? 'up' : 'down', scope: 'club', magnitude: economyMagnitude(Math.abs(budgetD), wageBudget) })

  // ÖVERLÄMNING 2 steg 3-underlag: spelarnivå, egen scope. Etiketten är
  // fältets namn ("Moralen") — subjectName bär redan VEM det gäller, "Spelaren"
  // hade varit dubbelt och tomt (Jacobs dom, 2026-08-15).
  if (relatedPlayerId) {
    const beforePlayer = before.players.find(p => p.id === relatedPlayerId)
    const afterPlayer = after.players.find(p => p.id === relatedPlayerId)
    const moraleD = (afterPlayer?.morale ?? 50) - (beforePlayer?.morale ?? 50)
    if (moraleD !== 0) steps.push({ label: 'Moralen', dir: moraleD > 0 ? 'up' : 'down', scope: 'player', magnitude: humorMagnitude(Math.abs(moraleD)) })
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

// ÖVERLÄMNING 2 (2026-08-16, Jacobs dom): Moralen-steget (transfer-avslag)
// var den enda kvarvarande fasta konstanten (−5) — bryter mönstret de tre
// andra triggarna redan följer. Samma disciplin: dagens värde är MITTPUNKTEN.
// Vikt: spelarens temperament (proxy: discipline — inget separat temperament-
// fält finns i Player) × hur långt budet låg under marknadsvärdet × hur
// länge kontraktet har kvar. Baseline (vikt=1.0, reproducerar exakt −5):
// discipline=60 (kodbasens vanliga default), bud 20% under marknadsvärde,
// 2 år kvar på kontraktet.
export function transferRejectMoraleWeight(player: Player, bid: TransferBid, currentSeason: number): number {
  // Lågt discipline → hetare temperament → sveder mer av ett avslag.
  const disciplineWeight = clamp(1.5 - (player.discipline ?? 60) / 120, 0.5, 1.6)

  // Ju längre under marknadsvärdet budet låg, desto mer kändes avslaget som
  // en förlorad chans att få rätt betalt — inte bara ett nej.
  const gapPct = player.marketValue > 0
    ? Math.max(0, (player.marketValue - bid.offerAmount) / player.marketValue)
    : 0.2
  const gapWeight = clamp(gapPct / 0.2, 0.4, 2.0)

  // Kort kvarvarande kontrakt → spelaren såg budet som sin chans att gå
  // vidare, blockeringen väger tyngre. Långt kvar → mindre akut, väger lättare.
  const remainingYears = clamp((player.contractUntilSeason ?? currentSeason + 2) - currentSeason, 1, 6)
  const contractWeight = clamp(2 / remainingYears, 0.5, 1.7)

  return clamp(disciplineWeight * gapWeight * contractWeight, 0.3, 2.5)
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
