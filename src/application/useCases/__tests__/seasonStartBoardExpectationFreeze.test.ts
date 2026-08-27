/**
 * A-H1 (SEXSÄSONGSAUDITEN 2026-08-26, spår 2 rot a — "ett fält med flera
 * semantiker"): seasonEndProcessor.ts stegade managedClub.boardExpectation
 * till NÄSTA säsongs krav (rad ~379) INNAN generateSeasonSummary (rad ~1332)
 * läste den. Årsboken/historiken riskerade därmed att döma den AVSLUTADE
 * säsongen mot ett krav som aldrig gällde under den — samtidigt som
 * avskedsbeslutet (computeBoardPatienceUpdate) redan (korrekt, av en
 * lyckträff — game.clubs muteras aldrig, bara den lokala updatedClubs-kopian)
 * dömde mot RÄTT krav. Konsekvensen Jacob beskrev: "Historiken skriver att
 * kravet uppfylldes medan samma resultat gav sparken."
 *
 * Fixet: SaveGame.seasonStartBoardExpectation fryser säsongens krav vid
 * säsongsstart (samma mönster som seasonStartFinances). Alla retrospektiva
 * ytor (årsboken/generateSeasonSummary, styrelsebetyg-kortet/generateSeasonVerdict,
 * avskedsbeslutet/computeBoardPatienceUpdate) läser NU det frusna fältet —
 * aldrig club.boardExpectation live, som redan kan vara framåtstegad.
 *
 * Scenariot nedan konstruerar EXAKT den motsägelse Jacob beskrev: klubbens
 * boardExpectation denna säsong är MidTable (ankare plats 6 av 12).
 * Slutplacering 10 missar det ordentligt (rating 2/5 → 'failed', och en
 * position>=10 sänker NÄSTA säsongs krav ett steg till AvoidBottom, ankare
 * plats 9). Samma slutplacering (10) MÖTER AvoidBottom (rating 4/5 → 'met').
 * Om årsboken av misstag läser det redan nedstegade AvoidBottom-kravet
 * (buggen) skulle den säga "möttes" om en säsong som i verkligheten
 * missade sitt MidTable-krav — och samtidigt som avskedet faktiskt utlöses
 * av just den missen.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import { generateSeasonVerdict } from '../../../domain/services/boardService'
import { calculateStandings } from '../../../domain/services/standingsService'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import { ClubExpectation, FixtureStatus } from '../../../domain/enums'

const MANAGED_ID = 'club_forsbacka'
// 9 klubbar som vinner en (påhittad) match var mot en av de två
// "offer"-klubbarna nedan — ger dem 2 poäng och positiv målskillnad, så de
// rankas ovanför den hanterade klubben oavsett tie-break.
const WINNERS = [
  'club_soderfors', 'club_vastanfors', 'club_karlsborg', 'club_malilla',
  'club_gagnef', 'club_halleforsnas', 'club_lesjofors', 'club_rogle',
  'club_slottsbron',
]
// De två klubbar som tar samtliga förluster — negativ målskillnad garanterar
// att de tie-break-rankas UNDER den hanterade klubben (0 spelade, 0 GD).
const SACRIFICES = ['club_skutskar', 'club_heros']

/**
 * Bygger 9 fabricerade avslutade matcher (en per vinnare, mot en av de två
 * offerklubbarna, omväxlande) — den hanterade klubben spelar noll matcher
 * (0 poäng, 0 GD), vilket garanterat rankar den ovanför offerklubbarna
 * (negativ GD) men under alla nio vinnarna (2 poäng). Slutresultat:
 * hanterad klubb hamnar EXAKT på plats 10 av 12.
 */
function buildFixturesForPosition10(season: number): Fixture[] {
  return WINNERS.map((winnerId, i) => {
    const loserId = SACRIFICES[i % SACRIFICES.length]
    return {
      id: `fabricated_${season}_${i}`,
      leagueId: `league_${season}`,
      season,
      roundNumber: 1,
      matchday: 1,
      homeClubId: winnerId,
      awayClubId: loserId,
      status: FixtureStatus.Completed,
      homeScore: 5,
      awayScore: 0,
      events: [],
    } satisfies Fixture
  })
}

function makeGameAtPosition10(): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: MANAGED_ID, season: 2025, seed: 42 })
  const fabricatedFixtures = buildFixturesForPosition10(game.currentSeason)
  const allTeamIds = game.clubs.map(c => c.id)
  const precomputedStandings = calculateStandings(allTeamIds, fabricatedFixtures)

  return {
    ...game,
    // MidTable denna säsong — låst i BÅDA fälten (club.boardExpectation live
    // OCH den frusna seasonStartBoardExpectation), precis som en verklig
    // säsong hade haft dem synkade vid säsongsstart.
    clubs: game.clubs.map(c => c.id === MANAGED_ID ? { ...c, boardExpectation: ClubExpectation.MidTable } : c),
    seasonStartBoardExpectation: ClubExpectation.MidTable,
    fixtures: [...game.fixtures, ...fabricatedFixtures],
    // generateSeasonSummary läser game.standings direkt (den ordinarie vägen,
    // uppdaterad varje omgång av roundProcessor.ts i verkligt spel) — måste
    // spegla samma tabell som handleSeasonEnds egen lokala omräkning.
    standings: precomputedStandings,
    boardObjectives: [],   // isolerar positionstermen, ingen objektivkostnad
    boardPatience: 20,
    meritBuffer: 0,
    consecutiveFailures: 0,
  }
}

describe('A-H1 — seasonStartBoardExpectation fryser säsongens krav genom hela retrospektiva kedjan', () => {
  it('sanity: plats 10 missar MidTable men möter AvoidBottom (förutsättningen för hela testet)', () => {
    const totalTeams = 12
    const midTableVerdict = generateSeasonVerdict(ClubExpectation.MidTable, 10, totalTeams)
    const avoidBottomVerdict = generateSeasonVerdict(ClubExpectation.AvoidBottom, 10, totalTeams)
    expect(midTableVerdict.rating).toBeLessThanOrEqual(2)
    expect(avoidBottomVerdict.rating).toBeGreaterThanOrEqual(4)
  })

  it('den fabricerade tabellen ger verkligen den hanterade klubben plats 10 av 12', () => {
    const game = makeGameAtPosition10()
    const row = game.standings.find(s => s.clubId === MANAGED_ID)
    expect(row?.position).toBe(10)
  })

  it('nästa säsongs krav stegas ned till AvoidBottom (plats 10 >= 10-tröskeln)', () => {
    const game = makeGameAtPosition10()
    const result = handleSeasonEnd(game, 1)
    const managedClub = result.game.clubs.find(c => c.id === MANAGED_ID)!
    expect(managedClub.boardExpectation).toBe(ClubExpectation.AvoidBottom)
  })

  it('årsboken (generateSeasonSummary via handleSeasonEnd) dömer mot MidTable — den AVSLUTADE säsongens krav — inte mot det redan nedstegade AvoidBottom', () => {
    const game = makeGameAtPosition10()
    const result = handleSeasonEnd(game, 1)
    const summary = result.game.seasonSummaries.at(-1)!

    expect(summary.boardExpectation).toBe(ClubExpectation.MidTable)
    // Dömande av regressionen: hade buggen levt kvar (läst det redan
    // nedstegade AvoidBottom) hade expectationVerdict varit 'met' här.
    expect(summary.expectationVerdict).toBe('failed')
    expect(summary.metExpectation).toBe(false)
  })

  it('avskedsbeslutet triggas av SAMMA (MidTable-)miss som årsboken nu korrekt registrerar — ingen motsägelse mellan de två ytorna', () => {
    const game = makeGameAtPosition10()
    const result = handleSeasonEnd(game, 1)
    const summary = result.game.seasonSummaries.at(-1)!

    // Kärnmotsägelsen ur audit-rapporten: managern sparkas ("miss") medan
    // historiken sa "möttes". Bevisa att båda nu pekar åt SAMMA håll.
    expect(result.game.managerFired).toBe(true)
    expect(summary.expectationVerdict).toBe('failed')
  })

  it('styrelsebetyg-kortets text (generateSeasonVerdict i inkorgen) refererar också MidTable-domen, inte AvoidBottom', () => {
    const game = makeGameAtPosition10()
    const result = handleSeasonEnd(game, 1)
    const verdictItem = result.game.inbox.find(i => i.id.startsWith('inbox_board_verdict_'))
    expect(verdictItem).toBeDefined()
    // MidTable rating 2 → "Styrelsebetyg: Underkänd säsong" (boardService.ts).
    // AvoidBottom rating 4 hade gett "Bra säsong" — motsatsen till vad som
    // faktiskt hände.
    expect(verdictItem!.title).toBe('Styrelsebetyg: Underkänd säsong')
  })
})
