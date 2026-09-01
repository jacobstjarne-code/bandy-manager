import type { Fixture } from '../entities/Fixture'
import type { PlayoffBracket } from '../entities/Playoff'
import { getRivalry } from '../data/rivalries'
import { PlayoffRound, MatchEventType } from '../enums'
import { getPlayoffRoundForFixture } from './playoffService'

/**
 * GRANSKA DEL 4 (2026-08-11), steg 1 — axelhärledningen.
 *
 * Tre oberoende axlar ur en fixture. Sektionsregler (steg 2) läser
 * tävlingstyp + skede. Arena/flavor läser plats. Plats får INTE bakas in i
 * tävlingstyp — ett femvärdesenum slår ihop cupkvartsfinal hemma med
 * cupsemifinal på neutral plan, samma fel som lagades i SLUTTEST RUNDA 4.
 *
 * SM-final = tavlingstyp:'slutspel' + skede:'final'. Cupfinal = 'cup' + 'final'.
 * Final är inget eget tavlingstyp-värde, bara ett skede som cup och slutspel delar.
 */
export type Tavlingstyp = 'liga' | 'cup' | 'slutspel' | 'avsked'
export type Skede = 'forstarunda' | 'kvartsfinal' | 'semifinal' | 'final'
export type Plats = 'hemma' | 'borta' | 'neutral'

export type Utfall = 'vunnet' | 'forlorat' | 'oavgjort'

export interface MatchTypeAxes {
  tavlingstyp: Tavlingstyp
  /** Bara satt för cup/slutspel — liga och avsked har inget skede. */
  skede?: Skede
  plats: Plats
  /**
   * U2 (SLUTTEST_KO.md, 2026-08-17) — faktiskt utfall för den hanterade
   * klubben, EFTER förlängning/straffar om matchen gick dit. Ersätter fyra
   * separata rå-score-tolkningar i pressConferenceService.ts/
   * csPressEventService.ts som gav en straffseger som "oavgjort".
   */
  utfall: Utfall
  /** = tavlingstyp === 'liga'. Cup/slutspel/avsked ger inga ligapoäng. */
  gavLigapoang: boolean
  /** = !!getRivalry(homeClubId, awayClubId), oavsett tävlingstyp. */
  arDerby: boolean
}

export function deriveMatchTypeAxes(
  fixture: Fixture,
  managedClubId: string,
  playoffBracket: PlayoffBracket | null,
): MatchTypeAxes {
  const tavlingstyp = deriveTavlingstyp(fixture)
  return {
    tavlingstyp,
    skede: deriveSkede(fixture, tavlingstyp, playoffBracket),
    plats: derivePlats(fixture, managedClubId),
    utfall: deriveUtfall(fixture, managedClubId),
    gavLigapoang: tavlingstyp === 'liga',
    arDerby: !!getRivalry(fixture.homeClubId, fixture.awayClubId),
  }
}

/**
 * Läser wentToPenalties/overtimeResult/penaltyResult FÖRE homeScore/awayScore
 * — en straffavgjord match har homeScore === awayScore (oavgjort efter
 * ordinarie tid + förlängning), så råscore ensam gav "oavgjort" trots att
 * matchen var avgjord. Samma rotorsak som U2:s symptom 1. Exporterad separat
 * (inte bara via deriveMatchTypeAxes) eftersom pressConferenceService.ts
 * behöver den utan playoffBracket-parametern som skede kräver.
 */
export function deriveUtfall(fixture: Fixture, managedClubId: string): Utfall {
  const isHome = fixture.homeClubId === managedClubId
  // penaltyResult är i sig den starkaste sanningen. Äldre sparfiler och
  // vissa test/dev-fixtures kan sakna den redundanta wentToPenalties-flaggan.
  if (fixture.penaltyResult) {
    if (fixture.penaltyResult.home === fixture.penaltyResult.away) return 'oavgjort'
    const penaltyWinnerIsHome = fixture.penaltyResult.home > fixture.penaltyResult.away
    return penaltyWinnerIsHome === isHome ? 'vunnet' : 'forlorat'
  }
  if (fixture.overtimeResult) {
    return fixture.overtimeResult === (isHome ? 'home' : 'away') ? 'vunnet' : 'forlorat'
  }
  if (fixture.homeScore === fixture.awayScore) return 'oavgjort'
  const homeWon = fixture.homeScore > fixture.awayScore
  return homeWon === isHome ? 'vunnet' : 'forlorat'
}

/**
 * O9 (DOMLOGG_2026-08-31.md, Code-actionable-listan): extraherad ur
 * pressConferenceService.ts:s buildPressContext (var tidigare en lokal,
 * oexporterad beräkning där) — matchHighlightService.ts behöver samma
 * "låg vi under vid paus?"-fråga för comeback-kategorin. En sanning, ett
 * ställe, i stället för en andra kopia av samma minut≤45-räkning.
 */
export function computeTrailedAtHalf(fixture: Fixture, managedClubId: string): boolean {
  const evts = fixture.events ?? []
  let htManaged = 0, htOpp = 0
  for (const e of evts) {
    if (e.type !== MatchEventType.Goal) continue
    if ((e.minute ?? 100) > 45) continue
    if (e.clubId === managedClubId) htManaged++; else htOpp++
  }
  return htOpp > htManaged
}

/**
 * avsked går före cup/slutspel: farewellMatchForPlayerId sätts på "nästa
 * hemmamatch" oavsett typ (gameFlowActions.ts) och kan därför i teorin träffa
 * en cup- eller slutspelsmatch. Avskedet är då den skärm som visas — se
 * steg 3 (trophy/tribute-grenar): elva av tolv sektioner är ✕ på avsked,
 * det är inte "cup med undantag".
 */
function deriveTavlingstyp(fixture: Fixture): Tavlingstyp {
  if (fixture.farewellMatchForPlayerId) return 'avsked'
  if (fixture.isCup) return 'cup'
  if (fixture.isKnockout) return 'slutspel'
  return 'liga'
}

/**
 * Cup: skede ur fixture.roundNumber (1=förstarunda…4=final), samma
 * rond-numrering cupService.ts:s CUP_MATCHDAYS och getCupRoundName() bygger
 * på — tolv lag, topp fyra bye in i kvarten, botten åtta spelar förstarunda,
 * inget gruppspel, ingen åttondel (cupService.ts:generateCupFixtures).
 *
 * Slutspel: skede ur vilken gren av playoffBracket vars fixtures-array
 * innehåller matchen — PlayoffSeries har ingen egen fixture→skede-pekare,
 * bara `fixtures: string[]` per gren (quarterFinals/semiFinals/final).
 */
function deriveSkede(fixture: Fixture, tavlingstyp: Tavlingstyp, bracket: PlayoffBracket | null): Skede | undefined {
  if (tavlingstyp === 'cup') {
    switch (fixture.roundNumber) {
      case 1: return 'forstarunda'
      case 2: return 'kvartsfinal'
      case 3: return 'semifinal'
      case 4: return 'final'
      default: return undefined
    }
  }
  if (tavlingstyp === 'slutspel') {
    // Uppslaget bor i playoffService.getPlayoffRoundForFixture (HIGH 5,
    // 2026-08-29) — samma tre grenar låg tidigare kopierade här och i fem
    // UI-filer. Bara mappningen PlayoffRound→Skede är kvar lokalt.
    const round = getPlayoffRoundForFixture(bracket, fixture.id)
    if (round === PlayoffRound.Final) return 'final'
    if (round === PlayoffRound.SemiFinal) return 'semifinal'
    if (round === PlayoffRound.QuarterFinal) return 'kvartsfinal'
    return undefined
  }
  return undefined
}

/** fixture.isNeutralVenue är redan den mekaniska sanningen (matchCore.ts nollar
 *  hemmafördel på den) — plats härleds direkt därur, ingen ny logik. */
function derivePlats(fixture: Fixture, managedClubId: string): Plats {
  if (fixture.isNeutralVenue) return 'neutral'
  return fixture.homeClubId === managedClubId ? 'hemma' : 'borta'
}
