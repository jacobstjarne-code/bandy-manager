import { ClubExpectation } from '../enums'
import type { StandingRow, SaveGame, BoardAssessment } from '../entities/SaveGame'
import { ordinal } from '../utils/numberFormat'
import type { Club } from '../entities/Club'
import { boardPatienceZoneFromScore } from './portal/boardPatienceZone'
import type { SeasonBoardTruth } from '../entities/SeasonSummary'

// SVENSK TEXT — CODE SKRIVER ALDRIG (CLAUDE.md): Survive-raderna nedan i
// BOARD_EXPECTATION_TEXT/BOARD_EXPECTATION_CEREMONIAL är '[Opus]'-platshållare.
// Jacob har låst EN text för H4 (klubbvalsskärmens rad: "LÅGA FÖRVÄNTNINGAR" /
// "Styrelsen begär bara att klubben finns kvar nästa år" — wired separat,
// se ClubExpandedCard.tsx) men INTE styrelsemötets kortfras/ceremoniella
// replik. Väntar på Opus.
export const BOARD_EXPECTATION_TEXT: Record<ClubExpectation, string> = {
  [ClubExpectation.Survive]: 'hålla oss kvar i serien',
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
  [ClubExpectation.Survive]: 'Bara ni finns kvar till nästa vinter har ni gjort ert jobb. Slutar vi sist får det vara så. Vi bygger vidare därifrån.',
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
// H4 Heros (Jacobs dom 2026-08-25): Survive-ankaret satt till 12 (sista
// platsen i den fasta 12-lags-ligan) — "positionen som exakt motsvarar
// förväntan" är alltså bokstavligen sistaplats. gap = anchor-position kan
// därför aldrig bli negativt för Survive; se BOARD_PATIENCE_SLOPE.below
// nedan, matematiskt oåtkomlig men kvar för typfullständighet. Ingen ny
// formel — samma delade-ankare-mönster som de fyra andra tierna.
export const BOARD_EXPECTATION_ANCHOR_POSITION: Record<ClubExpectation, number> = {
  [ClubExpectation.WinLeague]: 1,
  [ClubExpectation.ChallengeTop]: 4,
  [ClubExpectation.MidTable]: 6,
  [ClubExpectation.AvoidBottom]: 9,
  [ClubExpectation.Survive]: 12,
}

/**
 * Skutskär-auditens test 2 (boardVerdictConsistency.test.ts), Jacobs dom
 * 2026-08-24: satisfaction beräknades tidigare OBEROENDE ur position/
 * anchor-band (ett ögonblicksomdöme) medan portalens boardPatience-zon
 * (getBoardPatienceZone, portal/boardPatienceZone.ts) läser ACKUMULERAD
 * historik — samma familj av fel som Skutskär 8:a-motsägelsen (portalen
 * "Stabilt", ett uppdrag "I FARA", samma omgång): tre formler om samma
 * fråga, tre separata kalibreringar som kunde säga emot varandra.
 *
 * "Zonen är sanningen, domen ska förklara den." evaluateBoard läser nu
 * SAMMA boardPatience-värde som getBoardPatienceZone, med trösklar satta
 * så att 'delighted'/'satisfied' alltid faller inom zonens 'stabilt'
 * (patience>=50) och 'unhappy' alltid inom 'ultimatum' (patience<30) —
 * ett ögonblick kan aldrig säga emot minnet, för det ÄR minnet.
 * Position/expectation styr inte längre klassificeringen (det gjorde de
 * ALDRIG i boardPatience-zonen — bara i den gamla, nu borttagna, separata
 * anchor-bandslogiken här).
 */
export function evaluateBoard(boardPatience: number): BoardEvaluation {
  let satisfaction: BoardEvaluation['satisfaction']
  if (boardPatience >= 80) satisfaction = 'delighted'
  else if (boardPatience >= 50) satisfaction = 'satisfied'
  else if (boardPatience >= 30) satisfaction = 'concerned'
  else satisfaction = 'unhappy'

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

    // H4 Heros (Jacobs dom 2026-08-25): samma tre-bandsmönster som AvoidBottom
    // ovan, förskjutet ett steg — sistaplats ("else"-grenen) ger 3 (möter
    // förväntan), aldrig 1 (misslyckande). "Sistaplats är inte ett
    // misslyckande så länge klubben finns kvar." Ingen ny formeltyp, samma
    // positionsband-mönster som alla andra tiers, bara skiftat.
    case ClubExpectation.Survive:
      if (finalPosition <= totalTeams - 2) return 5
      else if (finalPosition === totalTeams - 1) return 4
      else return 3

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
// H4 Heros: Survive.below är matematiskt oåtkomlig (ankaret=12=sämsta
// möjliga placering, gap kan aldrig bli negativt) — värdet spelar ingen
// roll i praktiken, satt till samma som AvoidBottom.below för typskäl.
// Survive.above lägre än AvoidBottoms (1 mot 2) — varje placering är per
// definition "över" ankaret här, så en mildare lutning undviker att
// patiensen rusar uppåt för fort av att bara existera.
const BOARD_PATIENCE_SLOPE: Record<ClubExpectation, { above: number; below: number }> = {
  [ClubExpectation.WinLeague]: { above: 0, below: 5 },
  [ClubExpectation.ChallengeTop]: { above: 2.5, below: 4 },
  [ClubExpectation.MidTable]: { above: 2, below: 3 },
  [ClubExpectation.AvoidBottom]: { above: 2, below: 4 },
  [ClubExpectation.Survive]: { above: 1, below: 4 },
}

/**
 * DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md — svaret på "fem klockor, alla
 * kalibrerade var för sig, ingen mot de andra": en klubb som missar sin
 * anchor men stannar inom EN tier därunder (samma stege som
 * EXPECTATION_LADDER/recalibrateExpectationLadder redan delar) är i GRACE
 * — "nästan lyckad", inte kollaps. En genuin kollaps (bortom nästa tiers
 * anchor, ELLER i den faktiska nedflyttningszonen) är ALDRIG grace.
 *
 * ENDA definitionen. Ingen klocka får en egen kopia — det var systemets
 * ursprungssjuka (diagnosens ord). Härlett rent ur BOARD_EXPECTATION_
 * ANCHOR_POSITION + EXPECTATION_LADDER, ingen egen tröskeltabell — MEN
 * taket klipps vid nedflyttningszonens start (RELEGATION_ZONE_SIZE, samma
 * konstant som newConsecutiveFailures redan använder): utan den klippen
 * fick AvoidBottom (vars "ett steg ner" är Survive, ankare=12=sistaplats)
 * ett graceband som bokstavligen SVALDE hela den faktiska nedflyttnings-
 * zonen (plats 11-12 i en 12-lagsliga) — precis den kollaps domens SKYDDAT-
 * paragraf säger ska förbli fullt bled. Fångat av computeBoardPatienceUpdate
 * ovans befintliga regressionstester innan denna commit, inte gissat fram.
 *   WinLeague (anchor 1, tak min(ChallengeTop 4, 10))   → grace 2-4
 *   ChallengeTop (anchor 4, tak min(MidTable 6, 10))    → grace 5-6
 *   MidTable (anchor 6, tak min(AvoidBottom 9, 10))     → grace 7-9
 *   AvoidBottom (anchor 9, tak min(Survive 12, 10))     → grace 10 ENDAST (11-12 är nedflyttningszonen, klippt)
 *   Survive (anchor 12, inget steg under golvet)         → grace tom
 * (siffrorna ovan för den fasta 12-lagsligan; taket skalar med totalTeams.)
 */
export function boardGraceState(
  expectation: ClubExpectation,
  finalPos: number,
  totalTeams: number,
): boolean {
  const anchor = BOARD_EXPECTATION_ANCHOR_POSITION[expectation]
  if (finalPos <= anchor) return false
  const idx = EXPECTATION_LADDER.indexOf(expectation)
  if (idx === 0) return false // Survive — inget golv under sig, grace strukturellt tom
  const lowerTierAnchor = BOARD_EXPECTATION_ANCHOR_POSITION[EXPECTATION_LADDER[idx - 1]]
  const relegationZoneStart = totalTeams - RELEGATION_ZONE_SIZE + 1
  const graceCeiling = Math.min(lowerTierAnchor, relegationZoneStart - 1)
  return finalPos <= graceCeiling
}

/**
 * DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md, GODKÄNT NÄR: "nearMiss-slope ~2"
 * — PROPOSAL, magnitud via mätning (samma döm-siffrorna-mönster som
 * MERIT_BUFFER_CAP ovan). Ersätter BOARD_PATIENCE_SLOPE.below i
 * computeBoardPatienceUpdate NÄR klubben är i grace — en 3:e-plats under
 * WinLeague (gap=-2) blir −4/säsong (2×−2) i stället för −10 (5×−2).
 * Delad, EN siffra för alla tiers (inte en per-tier tabell) — matchar
 * domens "en enda förlåtelse" och ger Jacob en enda ratt att tuna, inte
 * fem. D-fact: D045_board_grace_state_magnitudes.yaml.
 */
export const NEAR_MISS_SLOPE = 2

/**
 * DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md, GODKÄNT NÄR: "grace-multiplikator
 * ~0,5" — PROPOSAL, magnitud via mätning. Skalar ner den löpande omgångs-
 * termens (updateRunningBoardPatience) förlustmultiplikator OCH
 * losingStreakSurcharge när klubben är i grace — en nästan-lyckad klubb
 * bleder hälften så snabbt per omgång, inte oförändrat. Kollaps (utanför
 * grace) är fullt bled, oförändrat. D-fact: D045_board_grace_state_magnitudes.yaml.
 */
export const GRACE_MULTIPLIER = 0.5

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
// Meritbuffert (Jacobs koefficientdom 2026-08-23, DOM_MERITBUFFERT_2026-08-23.md,
// fjärde koefficientrundan — O5-acceptanstestets fynd: en klubb med tre raka
// SM-guld sparkades två säsonger senare efter en normal svacka, för att
// säsongsslutstermen inte hade något minne av vad klubben gjort innan.
// "Samma princip som streak-taket" (Jacobs ord): styrelsen har ett minne,
// inte bara ett omdöme om senaste säsongen.
//
// PROPOSAL, inte låst — Jacob dömer magnituderna. Föreslagna värden nedan
// verifierade mot Grind 1 v3-stresstestets Skutskär-data (AvoidBottom,
// gap oftast -1 till -3, delta -4 till -12) och O5-acceptanstestets
// Västanfors-data (ChallengeTop, treepeat-scenariot seed 70014: tre säsonger
// gap=+3, delta=+7,5 vardera, sedan en 8:e-plats-säsong gap=-4, delta=-16):
//   MERIT_BUFFER_CAP = 20 — täcker exakt seed 70014:s -16-smäll efter tre
//   golden-delta-inbetalningar (7,5×3=22,5, kapat till 20), lämnar 4 kvar.
//   Ett tak på "≈2,5 typiska säsonger" i ChallengeTop-registret, matchar
//   domens "två-tre säsongers minne".
export const MERIT_BUFFER_CAP = 20

/**
 * Femte koefficientrundan (Jacobs dom 2026-08-23, O5_FEMTE_PASSET_
 * AVSKEDSDIAGNOS_2026-08-23.md): bufferten utökad till HELA säsongsslutstermen
 * — position OCH objektivkostnad tillsammans — inte bara position. Rotorsak
 * till utökningen: dekomponering av sex sparkade acceptanstest-körningar
 * visade att objektivkostnaden (som tidigare låg helt oskyddad, applicerad
 * separat i seasonEndProcessor.ts EFTER denna funktion) var en STÖRRE
 * bidragande faktor (-276,0 summerat) än positionstermen (-123,0 löpande
 * term, för jämförelse) — bufferten skyddade fel del av samma fråga
 * ("har managern gjort något värt tålamod?").
 *
 * `bufferEligibleObjectiveDelta` är den delen av objektivkostnaden som FÅR
 * absorberas/bankas tillsammans med positionen — anropsstället
 * (seasonEndProcessor.ts) exkluderar UPPREPADE objektivmissar innan den
 * skickas hit (Jacobs andra villkor: "samma objective missat tre år i rad
 * är inte otur"), de träffar patiensen direkt, aldrig buffer-skyddade.
 *
 * Golvet är noll, aldrig ett plus (Jacobs första villkor) — detta följer
 * redan av matematiken utan extra klampning: `absorbed` kan aldrig
 * överstiga `-delta`, så `effectiveDelta` kan aldrig bli positivt när
 * `delta` var negativt.
 */
export function computeBoardPatienceUpdate(
  finalPos: number,
  totalTeams: number,
  currentPatience: number,
  currentFailures: number,
  expectation: ClubExpectation,
  currentMeritBuffer = 0,
  bufferEligibleObjectiveDelta = 0,
): { newBoardPatience: number; newConsecutiveFailures: number; newMeritBuffer: number } {
  const relegationZoneStart = totalTeams - RELEGATION_ZONE_SIZE + 1
  const anchor = BOARD_EXPECTATION_ANCHOR_POSITION[expectation]
  const slope = BOARD_PATIENCE_SLOPE[expectation]
  const gap = anchor - finalPos // positivt = bättre än ankaret
  // DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md: en nästan-lyckad säsong (grace)
  // straffas med NEAR_MISS_SLOPE i stället för den branta slope.below — en
  // genuin kollaps (utanför grace) är oförändrad.
  const inGrace = gap < 0 && boardGraceState(expectation, finalPos, totalTeams)
  const belowSlope = inGrace ? NEAR_MISS_SLOPE : slope.below
  const positionDelta = gap >= 0 ? slope.above * gap : belowSlope * gap
  const delta = positionDelta + bufferEligibleObjectiveDelta // HELA säsongsslutstermen

  let effectiveDelta = delta
  let newMeritBuffer = currentMeritBuffer
  if (delta >= 0) {
    // Mötte/överträffade förväntan (position+objektiv sammanslaget) —
    // patiensen stiger som förut, OCH en kredit bankas in (inget avdrag
    // från den direkta vinsten).
    newMeritBuffer = Math.min(MERIT_BUFFER_CAP, currentMeritBuffer + delta)
  } else {
    // Understeg förväntan — krediten förbrukas FÖRST, innan patiensen rörs.
    // Golvet är noll: absorbed <= -delta alltid, effectiveDelta kan aldrig
    // bli positivt.
    const absorbed = Math.min(currentMeritBuffer, -delta)
    newMeritBuffer = currentMeritBuffer - absorbed
    effectiveDelta = delta + absorbed
  }

  const newBoardPatience = Math.max(0, Math.min(100, currentPatience + effectiveDelta))
  const newConsecutiveFailures = finalPos >= relegationZoneStart ? currentFailures + 1 : 0
  return { newBoardPatience, newConsecutiveFailures, newMeritBuffer }
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
 * H4 Heros-fixet (Jacobs dom 2026-08-25): den löpande förlustterm ovan var
 * medvetet expectation-blind sedan Grind 1 (Jacobs dom 2026-08-22) — för att
 * bevara ortogonaliteten mot förlustsviten nedan. Rätt för Skutskär (AvoidBottom,
 * sund ekonomi, borde inte straffas extra för enskilda förluster), FEL för
 * Heros (Survive, canoniskt 14-23% vinstandel — samma flata -1,5 per förlust
 * som en WinLeague-klubb gav 100% avskedsfrekvens, se BACKLOG.md). Multiplicerar
 * BARA basförlusten (RUNNING_PATIENCE_DELTA.loss) — losingStreakSurcharge
 * förblir OSKALAD, sviten är fortfarande ortogonal: fem raka är kollaps
 * oavsett tier. Siffror Jacobs egna, döm-själv-klausul inte utnyttjad —
 * ingen egen kalibreringsanledning att avvika från förslaget.
 */
const RUNNING_LOSS_EXPECTATION_MULTIPLIER: Record<ClubExpectation, number> = {
  [ClubExpectation.Survive]: 0.4,
  [ClubExpectation.AvoidBottom]: 0.7,
  [ClubExpectation.MidTable]: 1.0,
  [ClubExpectation.ChallengeTop]: 1.2,
  [ClubExpectation.WinLeague]: 1.4,
}

/**
 * Förlustsviten som bärande signal (ändring 2): ortogonal mot både
 * slutposition och difficulty — straffar inte en svår klubb som grindar
 * fram en bra placering genom många jämna resultat, men fångar en klubb
 * som kollapsar via en svit sent på säsongen. Adderas OVANPÅ
 * RUNNING_PATIENCE_DELTA.loss varje omgång sviten fortsätter.
 *
 * Tak på fem omgångar per enskild svit (Jacobs koefficientdom 2026-08-23,
 * efter Grind 1 v3-stresstestet): förlustsvit≥3 hade tidigare inget tak,
 * och verkligt spel (autoSelectLineup/advanceToNextEvent) producerar sviter
 * på 7-19 omgångar i en och samma säsong — långt bortom det illustrativa
 * 5-matchersexemplet domen ursprungligen räknade på. En 16-omgångarssvit
 * betalade ~-120 patience, vilket ensamt drev 57%/100% avskedsfrekvens
 * (Skutskär/Heros) i stresstestet, mycket högre än kalibreringsmålet
 * "icke-noll men rimlig". Jacobs skäl: efter fem raka förluster har
 * styrelsen bildat sin uppfattning — förlust tolv tillför ingen ny
 * information. Inte en engångskostnad (tappar upptrappningen -3→-8 som gör
 * sviten kännbar) och inte lägre magnituder (försvagar det verkliga fallet
 * — kollaps sent på säsongen — vikterna ska fånga). Tak på ANTAL OMGÅNGAR
 * bevarar båda: -3/-3/-8 betalas ut precis som förut för omgång 3, 4, 5 av
 * en svit, sedan 0 för varje ytterligare omgång SAMMA svit fortsätter.
 * Ingen extra state behövs — consecutiveLosses nollställs redan vid varje
 * ny svit (trainerArcService.ts), så gränsen på indata-värdet räcker.
 */
function losingStreakSurcharge(consecutiveLosses: number): number {
  if (consecutiveLosses > 5) return 0
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
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && !f.isCup && !f.isKnockout)
    .sort((a, b) => b.matchday - a.matchday)
  const last = lastFixtures[0]
  if (!last || last.id === game.boardPatienceLastCountedFixtureId) {
    return { boardPatience: currentPatience, boardPatienceLastCountedFixtureId: game.boardPatienceLastCountedFixtureId }
  }
  const isHome = last.homeClubId === game.managedClubId
  const myScore = isHome ? last.homeScore : last.awayScore
  const theirScore = isHome ? last.awayScore : last.homeScore
  const outcome = (myScore ?? 0) > (theirScore ?? 0) ? 'win' : (myScore ?? 0) < (theirScore ?? 0) ? 'loss' : 'draw'
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const expectation = managedClub?.boardExpectation ?? ClubExpectation.MidTable

  // DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md: löpande termen känner bara till
  // klubbens LIVE tabellplacering, inte säsongsslutets finalPos — samma
  // boardGraceState läses ändå, med den löpande standingen som proxy för
  // "om säsongen slutade nu". Golvet `played > 0` (samma mönster som
  // trainerArcService.ts:s bestFinish) undviker att en alfabetisk
  // 0-omgångars skuggposition ger en falsk grace-lättnad vid säsongsstart.
  const standing = game.standings?.find(s => s.clubId === game.managedClubId)
  const inGrace = standing !== undefined && standing.played > 0
    ? boardGraceState(expectation, standing.position, game.clubs.length)
    : false

  const lossMultiplier = RUNNING_LOSS_EXPECTATION_MULTIPLIER[expectation] * (inGrace ? GRACE_MULTIPLIER : 1)
  const baseDelta = outcome === 'loss'
    ? RUNNING_PATIENCE_DELTA.loss * lossMultiplier
    : RUNNING_PATIENCE_DELTA[outcome]
  const rawSurcharge = outcome === 'loss' ? losingStreakSurcharge(consecutiveLossesAfterThisRound) : 0
  const surcharge = inGrace ? rawSurcharge * GRACE_MULTIPLIER : rawSurcharge
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

/**
 * An underdog season is not a second performance scale. It is the canonical
 * season verdict, narrowed to clubs whose frozen starting expectation was to
 * avoid the bottom or merely survive.
 */
export function isUnderdogSeason(
  expectation: ClubExpectation,
  finalPosition: number,
  totalTeams: number,
  isChampion: boolean,
): boolean {
  if (expectation !== ClubExpectation.AvoidBottom && expectation !== ClubExpectation.Survive) {
    return false
  }
  const rating = computeSeasonVerdictRating(expectation, finalPosition, totalTeams)
  return expectationVerdictFromRating(expectation, rating, isChampion) === 'exceeded'
}

/**
 * Påståendesvepet #4 (MASTER.md, 2026-08-24), Jacobs dom 2026-08-26: årsbokens
 * gamla 3-grenade text ("Styrelsen är nöjd/besviken", SeasonSummaryScreen.tsx)
 * lät som ett omdöme om ställningen hos styrelsen — kunde motsäga portalens
 * löpande boardPatience-zon (som har minne, meritkredit från tidigare
 * framgångar) i samma stund en spelare såg båda. De två axlarna är MEDVETET
 * separata (se BACKLOG.md): denna text dömer bara SÄSONGEN, aldrig
 * relationen. Låst text, en mening per rating — ingen av dem säger något om
 * spelaren/managern, bara om vintern som var.
 */
export function seasonVerdictText(
  expectation: ClubExpectation,
  finalPosition: number,
  totalTeams: number,
): string {
  const rating = computeSeasonVerdictRating(expectation, finalPosition, totalTeams)
  switch (rating) {
    case 5: return 'Styrelsen hade inte väntat sig det här.'
    case 4: return 'Styrelsen fick mer än de bad om.'
    case 3: return 'Säsongen blev vad styrelsen räknade med.'
    case 2: return 'Styrelsen hade hoppats på mer av vintern.'
    case 1: return 'Vintern blev en besvikelse för styrelsen.'
  }
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

/**
 * Påståendesvepet #13 (MASTER.md, 2026-08-24), Jacobs dom 2026-08-26:
 * TILL SKILLNAD FRÅN årsbokens seasonVerdictText (#4, som dömdes till att
 * MEDVETET hålla säsongsbetyget och styrelsens tålamod isär) är detta
 * inkorgskortet ett AKTIVT meddelande vid säsongsslut — ytan spelaren
 * agerar på inför nästa vinter. Domen: fortfarande INGEN sammanvävning —
 * generateSeasonVerdict()s betyg (ovan) står FÖRST, ORÖRT — men denna
 * lägesmening läggs till EFTER, som sin egen sats. Ingen förklaring till
 * VARFÖR (det är BoardPatienceMinimal/Sommaren-förutsättningsfasens jobb)
 * — kortet bara konstaterar. Låst text, tre lägen, ingen av dem nämner
 * orsaken. Ta EMOT det slutgiltiga (efter säsongsslutets egen uppdatering)
 * boardPatience-värdet, inte det som gällde vid säsongsstart — annars
 * skulle kortet visa ett läge som redan hunnit bli fel samma dag.
 */
export function seasonVerdictZoneLine(boardPatience: number): string {
  const zone = boardPatienceZoneFromScore(boardPatience)
  if (zone === 'ultimatum') return 'Det här kan inte upprepas.'
  if (zone === 'under_press') return 'Vi förväntar oss att nästa vinter ser annorlunda ut.'
  return 'Ni har vårt förtroende.'
}

// H4 Heros-uppföljning (Jacobs dom 2026-08-25): stegkedjan täckte tidigare
// bara MidTable↔ChallengeTop↔WinLeague fullt ut — AvoidBottom kunde bara
// befordras uppåt (aldrig degraderas, gated `!== AvoidBottom`) och Survive
// (tillagd samma dag, H4) fanns inte med i någon gren alls, ett strukturellt
// tak/golv en klubb aldrig kunde lämna. Jacobs skäl: "en Survive-klubb som
// slutar tvåa ska inte förbli Survive; en WinLeague-klubb som kollapsar tre
// år ska kunna hamna i AvoidBottom." Ersatt med en ordnad stege — samma
// ≤2/≥10-trösklar, ett steg per anrop (en säsong), bara golvet/taket är nu
// Survive/WinLeague i stället för AvoidBottom/WinLeague.
const EXPECTATION_LADDER: ClubExpectation[] = [
  ClubExpectation.Survive,
  ClubExpectation.AvoidBottom,
  ClubExpectation.MidTable,
  ClubExpectation.ChallengeTop,
  ClubExpectation.WinLeague,
]

/**
 * DOM_BOARDEXPEKTAN_TROGHET_2026-08-31.md: en klubb som håller sig på 3:e-9:e
 * plats kan fastna för alltid vid WinLeague (bara 1:a-plats "möter" den,
 * botten-3 är den enda vägen ner) — sparkas i gapet innan den kollapsar dit.
 * Antal säsonger i rad med 'failed'-verdict innan en tröghets-demotering
 * (ETT steg, aldrig kaskad) — tunbart, mätt mot H5-scenariot (D044).
 */
export const TROGHET_THRESHOLD = 2

/**
 * ENDA källan för ladder-logiken — generatePreSeasonMessage och
 * deriveBoardAssessment bar tidigare IDENTISK ≤2/≥10-kod (dubblett, en
 * bugklass om de fick driva isär). Lägger till tröghets-demoteringen som en
 * TREDJE väg ner, bara aktiv när positionsratcharna (upp/botten-3) INTE
 * redan ändrat idx denna säsong — en genuin kollaps hanteras redan av
 * botten-3-vägen omedelbart, tröghet fyller bara gapet däremellan (SKYDDAT:
 * "ett steg per trigger", ingen dubbel-demotering samma säsong).
 */
function recalibrateExpectationLadder(
  club: Pick<Club, 'boardExpectation' | 'consecutiveExpectationMisses'>,
  lastSeasonPosition: number,
  totalTeams: number,
): { newExpectation: ClubExpectation; newConsecutiveExpectationMisses: number } {
  const currentIdx = EXPECTATION_LADDER.indexOf(club.boardExpectation)
  let newIdx = currentIdx
  if (lastSeasonPosition <= 2 && currentIdx < EXPECTATION_LADDER.length - 1) {
    newIdx = currentIdx + 1
  }
  if (lastSeasonPosition >= 10 && currentIdx > 0) {
    newIdx = currentIdx - 1
  }

  // isChampion=false är avsiktligt: rating=5 (position 1) ger alltid 'met'
  // eller 'exceeded' oavsett isChampion, aldrig 'failed' — så räknarens
  // nollställning påverkas inte av att AI-klubbars faktiska slutspelsutfall
  // inte spåras här.
  const rating = computeSeasonVerdictRating(club.boardExpectation, lastSeasonPosition, totalTeams)
  const verdict = expectationVerdictFromRating(club.boardExpectation, rating, false)
  const prevMisses = club.consecutiveExpectationMisses ?? 0
  let newMisses = verdict === 'failed' ? prevMisses + 1 : 0

  if (newIdx === currentIdx && newMisses >= TROGHET_THRESHOLD && currentIdx > 0) {
    newIdx = currentIdx - 1
    newMisses = 0
  }

  return { newExpectation: EXPECTATION_LADDER[newIdx], newConsecutiveExpectationMisses: newMisses }
}

export interface BoardEscalationState {
  level: 'second' | 'thirdPlus'
  consecutiveExpectationMisses: number
  /** BOARD_EXPECTATION_TEXT[boardExpectation] — styrelsens egen kortfras för
   *  målet, för en eventuell mall som vill referera det konkret ("topp-fyra"). */
  expectationLabel: string
}

/**
 * DOM_BOARDRELATION_BAGE_2026-09-02.md, steg 3 — den TALADE eskaleringen.
 * consecutiveExpectationMisses (skriven varje säsong av recalibrateExpectation-
 * Ladder ovan) läses idag BARA av tröghets-demoteringen — spårad, aldrig
 * talad. Denna funktion är en ren läsning av samma räknare för en berättande
 * yta, INTE en ny beräkning och INTE en utökning av tröghet-domen (den
 * ÄNDRAR förväntan, denna BERÄTTAR förloppet — samma räknare, olika syfte).
 *
 * Samma tröskel som tröghet (TROGHET_THRESHOLD=2) — 'second' vid EXAKT 2,
 * 'thirdPlus' därutöver. null under tröskeln: en klubb som möter förväntan
 * får ingen eskaleringsrad (domens SKYDDAT — ingen påhittad oro).
 *
 * Platsering (årsbok/board-möte/kurv-bildtext) och den talade textens
 * innehåll är INTE avgjort här — se domens ÄGARSKAP. Denna funktion levererar
 * bara strukturen ett framtida konsumentval bygger på.
 */
export function getBoardEscalationLevel(game: SaveGame): BoardEscalationState | null {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  const misses = club?.consecutiveExpectationMisses ?? 0
  if (!club || misses < TROGHET_THRESHOLD) return null
  return {
    level: misses === TROGHET_THRESHOLD ? 'second' : 'thirdPlus',
    consecutiveExpectationMisses: misses,
    expectationLabel: BOARD_EXPECTATION_TEXT[club.boardExpectation],
  }
}

export function generatePreSeasonMessage(
  club: Club,
  standings: StandingRow[],
  lastSeasonPosition: number,
  financialChange: number,
): { title: string; body: string; newExpectation: ClubExpectation; newConsecutiveExpectationMisses: number } {
  const { newExpectation, newConsecutiveExpectationMisses } = recalibrateExpectationLadder(club, lastSeasonPosition, standings.length)

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

  return { title, body, newExpectation, newConsecutiveExpectationMisses }
}

// Förutsättningsfasen, steg 1 (Jacobs dom 2026-08-25, texter låsta ordagrant
// i chatten samma dag). Nivåetiketterna Survive/WinLeague var engelska
// platshållare i ClubExpectation-enumet, aldrig avsedda som visad text —
// detta är den första skarpa användningen.
export const BOARD_EXPECTATION_LEVEL_LABEL: Record<ClubExpectation, string> = {
  [ClubExpectation.Survive]: 'Överleva',
  [ClubExpectation.AvoidBottom]: 'Undvika botten',
  [ClubExpectation.MidTable]: 'Mitten',
  [ClubExpectation.ChallengeTop]: 'Slutspel',
  [ClubExpectation.WinLeague]: 'Vinna ligan',
}

/**
 * Skälsraden Jacob gav sex av (tre per riktning). Regeln: "Raden väljs efter
 * vad som faktiskt drev ändringen — ligarörelser, egen försvagning, eller
 * föregående resultat." STEG 1 har bara föregående resultat att peka på.
 * Rad 1/3 per riktning citerar rivaler ("fältet bakom er stärktes", "två
 * lag som låg under er har rustat") — kan INTE beläggas förrän steg 2
 * finns, medvetet outnyttjade. Rad 2 per riktning är den enda som är sant
 * grundad i placeringen ensam — den enda som används här.
 *
 * MASTER_OPPET.md inv-4-forutsattningsfasen-steg2-blocker-stale (2026-09-01):
 * steg 2:s BÅDA datakällor finns nu (aiTransferLog — seasonEndProcessor.ts:1853,
 * standingsSnapshot — seasonSummaryService.ts:719/847), så påståendet ovan om
 * "ej byggda" var stale och rättat. Steg 2 är därmed TEKNISKT körbart, men de
 * fullständiga sex raderna (bara rad 2/riktning finns som konstant här; rad
 * 1/3 finns bara som paraffraserade citat i denna kommentar, inte verifierat
 * ordagrant mot Jacobs ursprungliga chattbeslut) är inte tillräckligt
 * dokumenterade i repot för att koda urvalslogiken utan att gissa på texten
 * — se BOARD_EXPECTATION_LEVEL_LABEL-kommentaren ovan för hur STEG 1:s texter
 * i stället citerades ordagrant. Nästa steg innan bygge: Opus bekräftar/
 * återger de fyra saknade raderna ordagrant.
 */
/**
 * De SEX skälsraderna, tre per riktning (Jacob låst; rad 1/3 bekräftade
 * ordagrant 2026-09-02, "de duger"). Raden väljs efter vad som DREV
 * ändringen: `leagueMovement` (rad 1 — ligarörelser: vilka lag kom upp/
 * föll ur), `results` (rad 2 — föregående placering ensam, den enda steg 1
 * kunde belägga), `aiTransfers` (rad 3 — rivalernas rustning). Steg 2 (Code)
 * wirar urvalet mot aiTransferLog + standingsSnapshot; tills dess använder
 * deriveBoardAssessment `.results` som förut (RAISED/LOWERED_REASON_LINE nedan).
 */
export const BOARD_REASON_LINES: Record<'raised' | 'lowered', { leagueMovement: string; results: string; aiTransfers: string }> = {
  raised: {
    leagueMovement: 'Lagen som kom upp är svagare än de som föll ur. Toppen är öppnare i år, och det ser vi också.',
    results: 'Ni har visat att ni kan mer. Då begär vi mer.',
    aiTransfers: 'Konkurrenterna har inte rustat som ni gjort. Det finns ett läge i år — ta det.',
  },
  lowered: {
    leagueMovement: 'Serien fick tyngre lag i år. Ribban höjdes för alla, inte bara för er.',
    results: 'Ni tappade för mycket för att vi ska kunna kräva samma sak.',
    aiTransfers: 'Två lag omkring er har rustat på ett sätt ni inte matchat. Vi justerar därefter.',
  },
}

const RAISED_REASON_LINE = BOARD_REASON_LINES.raised.results
const LOWERED_REASON_LINE = BOARD_REASON_LINES.lowered.results

// SVENSK TEXT — CODE SKRIVER ALDRIG (CLAUDE.md). Del 1 ("vad de såg" — en
// kort kvittens av föregående säsong, DOM:s ord: "styrelsens läsning",
// INTE en upprepning av årsboken) fick ingen låst text i Jacobs order —
// bara nivåetiketterna + skälsraderna var låsta. Platshållare tills Opus
// skriver den, per BoardAssessment.seasonAcknowledgment.
export const BOARD_SEASON_ACKNOWLEDGMENT_PLACEHOLDER = 'Vi har vägt in hela säsongen, inte bara sista omgången.'

/**
 * @cites club.boardExpectation, lastSeasonPosition
 */
export function deriveBoardAssessment(
  club: Club,
  lastSeasonPosition: number,
  season: number,
  totalTeams: number,
): Omit<BoardAssessment, 'seasonAcknowledgment'> {
  const currentIdx = EXPECTATION_LADDER.indexOf(club.boardExpectation)
  const { newExpectation } = recalibrateExpectationLadder(club, lastSeasonPosition, totalTeams)
  const newIdx = EXPECTATION_LADDER.indexOf(newExpectation)

  const direction: BoardAssessment['direction'] =
    newIdx > currentIdx ? 'raised' : newIdx < currentIdx ? 'lowered' : 'unchanged'

  return {
    season,
    previousExpectation: club.boardExpectation,
    newExpectation,
    direction,
    reasonLine: direction === 'raised' ? RAISED_REASON_LINE
      : direction === 'lowered' ? LOWERED_REASON_LINE
      : undefined,
  }
}

/**
 * A-H4 (TRIAGE_AUDIT_2026-08-29.md, HIGH 4) — enda källan för
 * `SeasonSummary.boardTruth` (se entities/SeasonSummary.ts för den fulla
 * motiveringen). Anropas EN gång, i seasonEndProcessor.ts, efter att
 * säsongsslutets boardPatience-uppdatering och avskedskontroll redan är
 * klara — denna funktion räknar inte om NÅGOT nytt, den bara paketerar tre
 * redan beräknade sanningar (mål/utfall/relation) i EN frusen struktur, med
 * samma pure functions (computeSeasonVerdictRating/
 * expectationVerdictFromRating/boardPatienceZoneFromScore) som
 * styrelsebetyget och portalzonen redan delar. Ingen ny tröskeltabell.
 */
export function buildSeasonBoardTruth(params: {
  expectation: ClubExpectation
  finalPosition: number
  totalTeams: number
  isChampion: boolean
  boardPatienceAfter: number
  consecutiveFailuresAfter: number
  managerFired: boolean
  firedReason?: SeasonBoardTruth['relationship']['firedReason']
}): SeasonBoardTruth {
  const {
    expectation, finalPosition, totalTeams, isChampion,
    boardPatienceAfter, consecutiveFailuresAfter, managerFired, firedReason,
  } = params

  const rating = computeSeasonVerdictRating(expectation, finalPosition, totalTeams)
  const verdict = expectationVerdictFromRating(expectation, rating, isChampion)

  return {
    statedGoal: {
      expectation,
      anchorPosition: BOARD_EXPECTATION_ANCHOR_POSITION[expectation],
      label: BOARD_EXPECTATION_TEXT[expectation],
    },
    outcome: { finalPosition, rating, verdict, isChampion },
    relationship: {
      boardPatienceAfter,
      zone: boardPatienceZoneFromScore(boardPatienceAfter),
      consecutiveFailuresAfter,
      managerFired,
      // Namngiven orsak är bara meningsfull när avsked faktiskt skedde —
      // annars alltid undefined, oavsett vad anroparen skickade in.
      firedReason: managerFired ? firedReason : undefined,
    },
  }
}

/**
 * A-H4 — Game Over-skärmens styrelseuttalande, härlett ur SAMMA
 * SeasonBoardTruth-snapshot som årsbokens expectationVerdict, i stället för
 * att GameOverScreen.tsx läser game.boardPatience/consecutiveFailures LIVE
 * vid rendertillfället (den ursprungliga bugkällan — två oberoende
 * härledningar av samma säsongs utfall som kunde säga emot varandra).
 *
 * Tvåsanning på Game Over (Jacobs dom 2026-08-29): när avskedet beror på
 * ackumulerat tålamod (boardPatience) men SISTA säsongen faktiskt höll
 * (verdict !== 'failed'), nämner texten BÄGGE sanningarna — annars läser en
 * godkänd årsbok plus "ihållande besvikelser" som förvirrande. Bara det
 * divergerande fallet är nytt; consecutiveFailures (tre bottensäsonger, ingen
 * divergens) och den generiska raden är orörda. `outcome` är valfri — gamla
 * saves (legacyTruth i GameOverScreen) saknar den och faller på relationsraden.
 */
export function gameOverBoardStatement(
  truth: Pick<SeasonBoardTruth, 'relationship'> & Partial<Pick<SeasonBoardTruth, 'outcome'>>,
  clubName: string | undefined,
): string {
  const { firedReason } = truth.relationship
  if (firedReason === 'consecutiveFailures') {
    return `Efter tre säsonger på rad utan förbättring ser styrelsen sig tvingad att göra en förändring. ${clubName ?? 'Klubben'} tackar för insatsen men önskar dig lycka till i framtiden.`
  }
  if (firedReason === 'boardPatience') {
    if (truth.outcome && truth.outcome.verdict !== 'failed') {
      return `Vintern som gick höll måttet. Men för mycket hade redan gått förlorat innan den, och där tog styrelsens tålamod slut. Du lämnar ${clubName ?? 'klubben'} med omedelbar verkan.`
    }
    return `Styrelsen har förlorat förtroendet för dig som tränare efter de ihållande besvikelserna. Beslutet är fattat — du lämnar ${clubName ?? 'klubben'} med omedelbar verkan.`
  }
  // 'bankruptcy' faller medvetet igenom till den generiska raden nedan —
  // Code skriver aldrig ny svensk speltext (CLAUDE.md), och den generiska
  // texten är inte FELAKTIG för konkurs, bara oattribuerad. En egen
  // konkurs-rad är en Opus-textuppgift, inte en del av denna wiring-fix.
  return `Styrelsen har beslutat att göra en förändring i tränarrollen. Tack för din tid i ${clubName ?? 'klubben'}.`
}
