import { ClubExpectation } from '../enums'
import type { StandingRow } from '../entities/SaveGame'

export interface BoardEvaluation {
  satisfaction: 'delighted' | 'satisfied' | 'concerned' | 'unhappy'
  message: string
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

  let satisfaction: BoardEvaluation['satisfaction']

  switch (expectation) {
    case ClubExpectation.WinLeague:
      if (pos <= 2) satisfaction = 'delighted'
      else if (pos <= 4 + lenient) satisfaction = 'satisfied'
      else if (pos <= 6 + lenient) satisfaction = 'concerned'
      else satisfaction = 'unhappy'
      break

    case ClubExpectation.ChallengeTop:
      if (pos <= 3) satisfaction = 'delighted'
      else if (pos <= 6 + lenient) satisfaction = 'satisfied'
      else if (pos <= 8 + lenient) satisfaction = 'concerned'
      else satisfaction = 'unhappy'
      break

    case ClubExpectation.MidTable:
      if (pos >= 4 && pos <= 8) satisfaction = 'delighted'
      else if (pos <= 10 + lenient) satisfaction = 'satisfied'
      else if (pos >= totalTeams - 2 - lenient) satisfaction = 'concerned'
      else satisfaction = 'satisfied'
      break

    case ClubExpectation.AvoidBottom:
      if (pos <= totalTeams - 4) satisfaction = 'delighted'
      else if (pos <= totalTeams - 2 - lenient) satisfaction = 'satisfied'
      else if (pos === totalTeams - 1) satisfaction = 'concerned'
      else satisfaction = 'unhappy'
      break

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

export function generateSeasonVerdict(
  expectation: ClubExpectation,
  finalPosition: number,
  totalTeams: number,
): { title: string; body: string; rating: 1 | 2 | 3 | 4 | 5 } {
  let rating: 1 | 2 | 3 | 4 | 5

  switch (expectation) {
    case ClubExpectation.WinLeague:
      if (finalPosition === 1) rating = 5
      else if (finalPosition <= 2) rating = 4
      else if (finalPosition <= 4) rating = 3
      else if (finalPosition <= 6) rating = 2
      else rating = 1
      break

    case ClubExpectation.ChallengeTop:
      if (finalPosition <= 2) rating = 5
      else if (finalPosition <= 4) rating = 4
      else if (finalPosition <= 6) rating = 3
      else if (finalPosition <= 8) rating = 2
      else rating = 1
      break

    case ClubExpectation.MidTable: {
      const midpoint = Math.round(totalTeams / 2)
      if (finalPosition >= midpoint - 2 && finalPosition <= midpoint + 2) rating = 5
      else if (finalPosition <= midpoint + 3) rating = 4
      else if (finalPosition <= totalTeams - 3) rating = 3
      else if (finalPosition <= totalTeams - 1) rating = 2
      else rating = 1
      break
    }

    case ClubExpectation.AvoidBottom:
      if (finalPosition <= totalTeams - 4) rating = 5
      else if (finalPosition <= totalTeams - 2) rating = 4
      else if (finalPosition === totalTeams - 1) rating = 2
      else rating = 1
      break

    default:
      rating = 3
  }

  const ratingTexts: Record<number, { title: string; body: string }> = {
    5: {
      title: 'Styrelsebetyg: Utmärkt säsong',
      body: `Styrelsen ger dig betyget 5 av 5. Säsongen överträffade förväntningarna på alla plan. Välgjort.`,
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
      body: `Styrelsen ger dig betyget 2 av 5. Resultaten nådde inte upp till vad vi förhandlade om inför säsongen.`,
    },
    1: {
      title: 'Styrelsebetyg: Misslyckad säsong',
      body: `Styrelsen ger dig betyget 1 av 5. Det råder ingen tvekan — säsongen var ett misslyckande. Framtiden diskuteras.`,
    },
  }

  return { ...ratingTexts[rating], rating }
}
