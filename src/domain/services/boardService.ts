import { ClubExpectation } from '../enums'
import type { StandingRow, SaveGame } from '../entities/SaveGame'
import { ordinal } from '../utils/numberFormat'
import type { Club } from '../entities/Club'

export const BOARD_EXPECTATION_TEXT: Record<ClubExpectation, string> = {
  [ClubExpectation.AvoidBottom]: 'undvika botten av tabellen',
  [ClubExpectation.MidTable]: 'hålla oss i mitten av tabellen',
  [ClubExpectation.ChallengeTop]: 'utmana om topplaceringar',
  [ClubExpectation.WinLeague]: 'vinna serien',
}

/**
 * M63 (textaudit 2026-07-04, text 2026-07-05) — ordförandens fullständiga
 * ceremoniella förväntansreplik, en per ClubExpectation. Migrerad hit
 * 2026-07-21 från scenes/boardMeetingScene.ts:s getBoardMeetingBeats
 * (superseterat förstautkast, raderat — BoardMeetingScene.tsx är den
 * levande scenen sedan säsong 2+ byggdes om). Texten är oförändrad,
 * bara flyttad: BOARD_EXPECTATION_TEXT ovan är kortfrasen ("att {X}"),
 * denna är hela repliken för styrelsemötets "Målet i år"-rad.
 */
export const BOARD_EXPECTATION_CEREMONIAL: Record<ClubExpectation, string> = {
  [ClubExpectation.AvoidBottom]: 'Håll oss ovanför strecket. Mer begär vi inte i år. Allt därutöver är bonus.',
  [ClubExpectation.MidTable]: 'Plats fem till åtta. Inget kvalspel.',
  [ClubExpectation.ChallengeTop]: 'Topp fyra. Och när slutspelet börjar ska ingen vilja möta oss.',
  [ClubExpectation.WinLeague]: 'Guld. Det är sagt nu. Vi låtsas inte annat i år.',
}

export interface BoardEvaluation {
  satisfaction: 'delighted' | 'satisfied' | 'concerned' | 'unhappy'
  message: string
}

// U1 (SLUTTEST_KO.md, 2026-08-17): den faktiska nedflyttningszonen — en
// konstant, inte en totalTeams/3-härledd gissning. Delad mellan
// evaluateBoard (AvoidBottom-tröskeln nedan) och seasonEndProcessor.ts:s
// boardPatience-formel, så de beskriver samma zon.
export const RELEGATION_ZONE_SIZE = 2

// U1 andra halvan (Jacobs dom 2026-08-22, efter Skutskär-auditen): EN
// delad ankarposition per ClubExpectation — "positionen som exakt
// motsvarar förväntan, varken över- eller underträffar den". Kalibrerad
// för den fasta 12-lags-ligan (CLUB_TEMPLATES.length === 12), samma
// hårdkodnings-konvention evaluateBoard redan använde innan denna
// refaktor. Källan till en tidigare bugklass: anchor-liknande siffror
// härleddes SEPARAT i evaluateBoard, computeSeasonVerdictRating och
// computeBoardPatienceUpdate — tre gissningar om samma sak som kunde
// divergera tyst. Denna konstant är den ENDA källan; evaluateBoard och
// computeBoardPatienceUpdate läser båda den nedan, aldrig en egen kopia.
export const BOARD_EXPECTATION_ANCHOR_POSITION: Record<ClubExpectation, number> = {
  [ClubExpectation.WinLeague]: 1,
  [ClubExpectation.ChallengeTop]: 4,
  [ClubExpectation.MidTable]: 6,
  [ClubExpectation.AvoidBottom]: 9,
}

// How far into the season (0-1). Earlier = more lenient thresholds.
function seasonProgress(roundsPlayed: number, totalRounds: number): number {
  return Math.min(1, roundsPlayed / totalRounds)
}

export function evaluateBoard(
  expectation: ClubExpectation,
  standing: StandingRow,
  totalTeams: number,
  roundsPlayed: number,
  totalRounds: number,
): BoardEvaluation {
  const pos = standing.position
  const progress = seasonProgress(roundsPlayed, totalRounds)
  // Leniency: early season allows 2 extra places before alarm
  const lenient = progress < 0.4 ? 2 : 0
  // U1 andra halvan: samma ankare som computeBoardPatienceUpdate läser —
  // banden nedan är omskrivna som ankare±offset, siffermässigt IDENTISKA
  // mot de tidigare hårdkodade trösklarna (ingen beteendeändring här),
  // bara med en enda delad källa istf en egen gissning per funktion.
  const anchor = BOARD_EXPECTATION_ANCHOR_POSITION[expectation]

  let satisfaction: BoardEvaluation['satisfaction']

  switch (expectation) {
    case ClubExpectation.WinLeague:
      if (pos <= anchor + 1) satisfaction = 'delighted'
      else if (pos <= anchor + 3 + lenient) satisfaction = 'satisfied'
      else if (pos <= anchor + 5 + lenient) satisfaction = 'concerned'
      else satisfaction = 'unhappy'
      break

    case ClubExpectation.ChallengeTop:
      if (pos <= anchor - 1) satisfaction = 'delighted'
      else if (pos <= anchor + 2 + lenient) satisfaction = 'satisfied'
      else if (pos <= anchor + 4 + lenient) satisfaction = 'concerned'
      else satisfaction = 'unhappy'
      break

    case ClubExpectation.MidTable:
      if (pos >= anchor - 2 && pos <= anchor + 2) satisfaction = 'delighted'
      else if (pos <= anchor + 4 + lenient) satisfaction = 'satisfied'
      else satisfaction = 'concerned'
      break

    case ClubExpectation.AvoidBottom: {
      // U1 (SLUTTEST_KO.md, 2026-08-17): "unhappy" täckte tidigare bara den
      // absolut sista platsen — en klubb på den NÄST sista platsen (också
      // inne i den faktiska nedflyttningszonen, RELEGATION_ZONE_SIZE=2) läste
      // bara som "concerned", inte som verklig risk.
      const relegationZoneStart = totalTeams - RELEGATION_ZONE_SIZE + 1
      if (pos <= anchor - 1) satisfaction = 'delighted'
      else if (pos <= anchor + 1 - lenient) satisfaction = 'satisfied'
      else if (pos < relegationZoneStart) satisfaction = 'concerned'
      else satisfaction = 'unhappy'
      break
    }

    default:
      satisfaction = 'satisfied'
  }

  return { satisfaction, message: '' }
}

const BOARD_MESSAGES: Record<BoardEvaluation['satisfaction'], Array<{ title: string; body: string }>> = {
  delighted: [
    {
      title: 'Styrelsen är nöjd',
      body: 'Laget överträffar förväntningarna. Styrelsen är imponerad och ser med tillförsikt på resten av säsongen.',
    },
    {
      title: 'Positiva signaler från styrelsen',
      body: 'Vi noterar med glädje att laget levererar bättre än beräknat. Håll den nivån.',
    },
    {
      title: 'Bra jobbat',
      body: 'Tabellpositionen är bättre än styrelsen hoppades. Det märks i hela organisationen.',
    },
  ],
  satisfied: [
    {
      title: 'Styrelsen följer läget',
      body: 'Laget lever upp till förväntningarna. Styrelsen är nöjd och ser inga skäl till oro.',
    },
    {
      title: 'Rapport från styrelseordföranden',
      body: 'Resultaten är acceptabla. Fortsätt på inslaget spår så bör vi nå säsongsmålet.',
    },
    {
      title: 'Lägesrapport',
      body: 'Vi är i fas med vad styrelsen förväntar sig. Inga extraordinära åtgärder planeras.',
    },
  ],
  concerned: [
    {
      title: 'Styrelsen är orolig',
      body: 'Tabellpositionen ger anledning till oro. Ordföranden påminner om att styrelsen förväntar sig bättre.',
    },
    {
      title: 'Signaler från styrelsen',
      body: 'Vi ser med viss oro på resultaten. Om trenden håller i sig vill styrelsen diskutera läget.',
    },
    {
      title: 'PM från styrelseordföranden',
      body: 'Positionen i tabellen är inte i linje med vad vi diskuterade inför säsongen. Det behöver vändas.',
    },
    {
      title: 'Styrelsen begär förbättring',
      body: 'Nuvarande resultat håller inte. Styrelsen förväntar sig en tydlig förbättring de närmaste omgångarna.',
    },
  ],
  unhappy: [
    {
      title: 'Krissamtal inkallat',
      body: 'Styrelsen kallar till möte. Resultaten är inte acceptabla och situationen måste diskuteras omgående.',
    },
    {
      title: 'Styrelsen är djupt missnöjd',
      body: 'Det råder ingen tvekan om att förväntningarna inte uppfylls. Styrelsen kräver omedelbara förbättringar.',
    },
    {
      title: 'Allvarliga farhågor',
      body: 'Ordföranden har uttryckt allvarlig oro. Om resultaten inte förbättras omedelbart är styrelsen beredd att agera.',
    },
  ],
}

export function generateBoardMessage(
  evaluation: BoardEvaluation,
  _clubName: string,
  roundsPlayed: number,
): { title: string; body: string } {
  const templates = BOARD_MESSAGES[evaluation.satisfaction]
  // Pick deterministically based on round so same round always gives same template
  const idx = roundsPlayed % templates.length
  const template = templates[idx]
  return { title: template.title, body: template.body }
}

/**
 * A5 (LANGSPEL 10 säsonger, 2026-08-17): enda källan för "hur bra var
 * placeringen X relativt styrelsens krav Y" — 1-5. Tidigare låg denna
 * switch inline i generateSeasonVerdict, och seasonSummaryService.ts hade
 * en EGEN, oberoende trösklad met/exceeded-tabell för samma fråga (drev
 * isär: 2:a plats under WinLeague "uppfyllde" årsbokens tröskel men fick
 * bara betyg 4/5 här — samma rot som growFanbase-etikettfyndet i
 * SLUTTEST-audition, två källor som beskriver samma sak). Både
 * generateSeasonVerdict (styrelsebetyget i inboxen) och
 * seasonSummaryService (årsbokens narrativ) ska anropa DENNA funktion,
 * aldrig underhålla en egen tröskeltabell.
 */
export function computeSeasonVerdictRating(
  expectation: ClubExpectation,
  finalPosition: number,
  totalTeams: number,
): 1 | 2 | 3 | 4 | 5 {
  switch (expectation) {
    case ClubExpectation.WinLeague:
      if (finalPosition === 1) return 5
      else if (finalPosition <= 2) return 4
      else if (finalPosition <= 4) return 3
      else if (finalPosition <= 6) return 2
      else return 1

    case ClubExpectation.ChallengeTop:
      if (finalPosition <= 2) return 5
      else if (finalPosition <= 4) return 4
      else if (finalPosition <= 6) return 3
      else if (finalPosition <= 8) return 2
      else return 1

    case ClubExpectation.MidTable: {
      const midpoint = Math.round(totalTeams / 2)
      if (finalPosition >= midpoint - 2 && finalPosition <= midpoint + 2) return 5
      else if (finalPosition <= midpoint + 3) return 4
      else if (finalPosition <= totalTeams - 3) return 3
      else if (finalPosition <= totalTeams - 1) return 2
      else return 1
    }

    case ClubExpectation.AvoidBottom:
      if (finalPosition <= totalTeams - 4) return 5
      else if (finalPosition <= totalTeams - 2) return 4
      else if (finalPosition === totalTeams - 1) return 2
      else return 1

    default:
      return 3
  }
}

// U6 (SLUTTEST_KO.md, 2026-08-17) / D028: renommé kunde inte falla vid
// misslyckande — bara skandal/nekad licens sänkte det. Under skandalnivå
// (−5/−8, tillfälligt, scandalService.ts) eftersom ett säsongsmisslyckande
// återkommer varje säsong medan skandal är enstaka.
const SEASON_REPUTATION_DELTA: Record<1 | 2 | 3 | 4 | 5, number> = { 1: -6, 2: -3, 3: 0, 4: 2, 5: 4 }

export function seasonReputationDelta(rating: 1 | 2 | 3 | 4 | 5): number {
  return SEASON_REPUTATION_DELTA[rating]
}

// U1 andra halvan (Jacobs dom 2026-08-22): tvålutning per ClubExpectation
// — "above" (positionen är bättre än ankaret, belönar) och "below" (sämre
// än ankaret, straffar hårdare). WinLeague har ankare=1 — går inte att slå,
// så above används aldrig i praktiken (kvar för typfullständighet).
const BOARD_PATIENCE_SLOPE: Record<ClubExpectation, { above: number; below: number }> = {
  [ClubExpectation.WinLeague]: { above: 0, below: 5 },
  [ClubExpectation.ChallengeTop]: { above: 2.5, below: 4 },
  [ClubExpectation.MidTable]: { above: 2, below: 3 },
  [ClubExpectation.AvoidBottom]: { above: 2, below: 4 },
}

/**
 * U1 (SLUTTEST_KO.md, 2026-08-17) — säsongsslutets boardPatience-uppdatering,
 * utbruten ur seasonEndProcessor.ts som en ren funktion (samma disciplin som
 * seasonReputationDelta ovan) för att gå att regressionstesta utan en full
 * säsongssimulering.
 *
 * U1 andra halvan (Jacobs dom 2026-08-22, efter Skutskär-auditen): den
 * tidigare klippformeln gav NOLL patience-effekt för position 4-8 av 12
 * ("dödzonen") oavsett utfall, och läste aldrig boardExpectation — en
 * AvoidBottom-klubb på 8:e plats och en WinLeague-klubb på 8:e plats fick
 * identisk (nollad) behandling. Ersatt av en kontinuerlig, förväntans-
 * medveten formel: delta = slope·(ankare−position), positiv lutning
 * (BOARD_PATIENCE_SLOPE.above) om positionen slår ankaret, negativ
 * (.below, brantare) om den missar det. Ankaret är DELAT med evaluateBoard
 * (BOARD_EXPECTATION_ANCHOR_POSITION ovan) — aldrig en egen gissning.
 *
 * newConsecutiveFailures oförändrad (RELEGATION_ZONE_SIZE-baserad) — det
 * är den andra, separata avskedsvägen (>=3 raka säsonger i faktisk
 * nedflyttningszon) och rördes inte av Jacobs fem ändringar.
 */
export function computeBoardPatienceUpdate(
  finalPos: number,
  totalTeams: number,
  currentPatience: number,
  currentFailures: number,
  expectation: ClubExpectation,
): { newBoardPatience: number; newConsecutiveFailures: number } {
  const relegationZoneStart = totalTeams - RELEGATION_ZONE_SIZE + 1
  const anchor = BOARD_EXPECTATION_ANCHOR_POSITION[expectation]
  const slope = BOARD_PATIENCE_SLOPE[expectation]
  const gap = anchor - finalPos // positivt = bättre än ankaret
  const delta = gap >= 0 ? slope.above * gap : slope.below * gap
  const newBoardPatience = Math.max(0, Math.min(100, currentPatience + delta))
  const newConsecutiveFailures = finalPos >= relegationZoneStart ? currentFailures + 1 : 0
  return { newBoardPatience, newConsecutiveFailures }
}

// U1 andra halvan, ändring 1+2 (Jacobs dom 2026-08-22): löpande omgångsterm.
// Utan denna kunde boardPatience bara röra sig EN gång per säsong (vid
// säsongsslut) — en varningszon-indikator (3.2) var därför dekoration i 21
// av 22 omgångar. Piggybackar på samma "senast räknade fixture"-mönster
// trainerArcService.ts:s updateTrainerArc redan använder (samma runda,
// samma anropsordning i roundProcessor.ts — se anropsstället för varför
// consecutiveLosses skickas in explicit istf läst från game.trainerArc).
const RUNNING_PATIENCE_DELTA = { win: 1.0, draw: 0.5, loss: -1.5 } as const

/**
 * Förlustsviten som bärande signal (ändring 2): ortogonal mot både
 * slutposition och difficulty — straffar inte en svår klubb som grindar
 * fram en bra placering genom många jämna resultat, men fångar en klubb
 * som kollapsar via en svit sent på säsongen. Adderas OVANPÅ
 * RUNNING_PATIENCE_DELTA.loss varje omgång sviten fortsätter.
 */
function losingStreakSurcharge(consecutiveLosses: number): number {
  if (consecutiveLosses >= 5) return -8
  if (consecutiveLosses >= 3) return -3
  return 0
}

export function updateRunningBoardPatience(
  game: SaveGame,
  consecutiveLossesAfterThisRound: number,
): { boardPatience: number; boardPatienceLastCountedFixtureId?: string } {
  const currentPatience = game.boardPatience ?? 70
  const lastFixtures = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && !f.isCup)
    .sort((a, b) => b.roundNumber - a.roundNumber)
  const last = lastFixtures[0]
  if (!last || last.id === game.boardPatienceLastCountedFixtureId) {
    return { boardPatience: currentPatience, boardPatienceLastCountedFixtureId: game.boardPatienceLastCountedFixtureId }
  }
  const isHome = last.homeClubId === game.managedClubId
  const myScore = isHome ? last.homeScore : last.awayScore
  const theirScore = isHome ? last.awayScore : last.homeScore
  const outcome = (myScore ?? 0) > (theirScore ?? 0) ? 'win' : (myScore ?? 0) < (theirScore ?? 0) ? 'loss' : 'draw'
  const baseDelta = RUNNING_PATIENCE_DELTA[outcome]
  const surcharge = outcome === 'loss' ? losingStreakSurcharge(consecutiveLossesAfterThisRound) : 0
  const boardPatience = Math.max(0, Math.min(100, currentPatience + baseDelta + surcharge))
  return { boardPatience, boardPatienceLastCountedFixtureId: last.id }
}

/**
 * A5: rating (1-5, from computeSeasonVerdictRating) → the 3-state verdict
 * the yearbook badge/narrative uses. WinLeague is a binary goal — "vinna
 * ligan" means table position 1, nothing else — so unlike the other three
 * (range) expectations, only rating 5 counts as met and nothing short of
 * becoming playoff champion (isChampion) counts as exceeding it. Applying
 * the generic rating>=3 "met" bucket to WinLeague was the exact bug: 2nd
 * place (rating 4) read as "uppfyller styrelsens krav på att vinna ligan"
 * and 1st place (rating 5) read as "överträffade alla förväntningar" even
 * though 1st place is precisely what was asked for, not more.
 */
export function expectationVerdictFromRating(
  expectation: ClubExpectation,
  rating: 1 | 2 | 3 | 4 | 5,
  isChampion: boolean,
): 'exceeded' | 'met' | 'failed' {
  if (isChampion) return 'exceeded'
  if (expectation === ClubExpectation.WinLeague) {
    return rating === 5 ? 'met' : 'failed'
  }
  if (rating === 5) return 'exceeded'
  if (rating >= 3) return 'met'
  return 'failed'
}

export function generateSeasonVerdict(
  expectation: ClubExpectation,
  finalPosition: number,
  totalTeams: number,
): { title: string; body: string; rating: 1 | 2 | 3 | 4 | 5 } {
  const rating = computeSeasonVerdictRating(expectation, finalPosition, totalTeams)

  const ratingTexts: Record<number, { title: string; body: string }> = {
    5: {
      title: 'Styrelsebetyg: Utmärkt säsong',
      body: `Styrelsen ger dig betyget 5 av 5. Säsongen överträffade förväntningarna på alla plan. Det är noterat i protokollet.`,
    },
    4: {
      title: 'Styrelsebetyg: Bra säsong',
      body: `Styrelsen ger dig betyget 4 av 5. En stark säsong som i det närmaste nådde upp till vad vi hoppades på.`,
    },
    3: {
      title: 'Styrelsebetyg: Godkänd säsong',
      body: `Styrelsen ger dig betyget 3 av 5. Säsongen var godkänd men lämnar utrymme för förbättring.`,
    },
    2: {
      title: 'Styrelsebetyg: Underkänd säsong',
      body: `Styrelsen ger dig betyget 2 av 5. Resultaten nådde inte upp till vad vi kom överens om inför säsongen.`,
    },
    1: {
      title: 'Styrelsebetyg: Misslyckad säsong',
      body: `Styrelsen ger dig betyget 1 av 5. Det råder ingen tvekan — säsongen var ett misslyckande. Framtiden diskuteras.`,
    },
  }

  return { ...ratingTexts[rating], rating }
}

export function generatePreSeasonMessage(
  club: Club,
  standings: StandingRow[],
  lastSeasonPosition: number,
  financialChange: number,
): { title: string; body: string; newExpectation: ClubExpectation } {
  let newExpectation = club.boardExpectation

  if (lastSeasonPosition <= 2 && club.boardExpectation !== ClubExpectation.WinLeague) {
    if (club.boardExpectation === ClubExpectation.AvoidBottom) newExpectation = ClubExpectation.MidTable
    else if (club.boardExpectation === ClubExpectation.MidTable) newExpectation = ClubExpectation.ChallengeTop
    else if (club.boardExpectation === ClubExpectation.ChallengeTop) newExpectation = ClubExpectation.WinLeague
  }
  if (lastSeasonPosition >= 10 && club.boardExpectation !== ClubExpectation.AvoidBottom) {
    if (club.boardExpectation === ClubExpectation.WinLeague) newExpectation = ClubExpectation.ChallengeTop
    else if (club.boardExpectation === ClubExpectation.ChallengeTop) newExpectation = ClubExpectation.MidTable
  }

  const expectationText = BOARD_EXPECTATION_TEXT

  const expectationChanged = newExpectation !== club.boardExpectation

  let body = `Styrelsen har utvärderat säsongen. `
  // M39 (textaudit 2026-07-04): "imponerade" triggade på position ≤3 oavsett
  // boardExpectation — en WinLeague-styrelse (som redan kan ha gett ett lågt
  // säsongsbetyg för just den placeringen) skulle ändå få höra att en 3:e
  // plats imponerade. Gated mot att expectation inte redan ÄR WinLeague.
  if (lastSeasonPosition <= 3 && club.boardExpectation !== ClubExpectation.WinLeague) {
    body += `Förra säsongens ${ordinal(lastSeasonPosition)} plats imponerade. `
  } else if (lastSeasonPosition >= 10) {
    body += `Förra säsongens ${ordinal(lastSeasonPosition)} plats var under förväntan. `
  }

  if (expectationChanged) {
    body += `Förväntningarna har justerats: vi förväntar oss nu att ${expectationText[newExpectation]}. `
  } else {
    body += `Målsättningen kvarstår: ${expectationText[newExpectation]}. `
  }

  if (financialChange > 50000) {
    body += `Ekonomin är stabil. Transferbudgeten har uppdaterats.`
  } else if (financialChange < -50000) {
    body += `Ekonomin är ansträngd. Var försiktig med värvningar.`
  } else {
    body += `Ekonomin är i balans.`
  }

  const title = expectationChanged
    ? `Styrelsemöte — Nya förväntningar inför säsongen`
    : `Styrelsemöte inför säsongen`

  void standings
  return { title, body, newExpectation }
}
