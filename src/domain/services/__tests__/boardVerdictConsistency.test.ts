/**
 * Skutskär-auditens test 2 (P0 sanningskontrakt): "för varje placering/
 * förväntan/objective-kombination ska portalzon, årsboksdom och avskedsrisk
 * ge en gemensamt förklarbar utsaga." Matchar BACKLOG.md:s öppna rad i
 * "Två läsare, en sanning" — tre formler (computeBoardPatienceUpdate,
 * computeSeasonVerdictRating, evaluateBoard) om samma fråga ("är styrelsen
 * nöjd?"), historiskt med olika indata. Skutskär 8:a av 12 (verklig
 * spelupplevelse): portalen sa "Stabilt", ett uppdrag stod som
 * "STYRELSEUPPDRAG I FARA", årsboken sa "mer än nöjd" — tre sanna svar på
 * samma fråga, ingen förklarade de andra två.
 *
 * U1 (2026-08-17/22) delade redan ankarpositionen (BOARD_EXPECTATION_
 * ANCHOR_POSITION) mellan evaluateBoard och computeBoardPatienceUpdate —
 * men computeSeasonVerdictRating har KVAR sin egen, oberoende trösklade
 * tabell. Detta test bevisar inte att alla tre är IDENTISKA (de mäter
 * olika saker: satisfaction är ett ögonblicksomdöme, rating är en 1-5-
 * betygsskala, boardPatience-zonen är ackumulerad över tid) — det bevisar
 * att de aldrig SÄGER EMOT VARANDRA för samma placering/förväntan. Går
 * detta test rött har någon av de tre formlerna kalibrerats om utan de
 * andra två.
 */
import { describe, it, expect } from 'vitest'
import {
  evaluateBoard,
  computeSeasonVerdictRating,
  computeBoardPatienceUpdate,
} from '../boardService'
import { getBoardPatienceZone } from '../portal/boardPatienceZone'
import { ClubExpectation } from '../../enums'
import type { StandingRow, SaveGame } from '../../entities/SaveGame'

const TOTAL_TEAMS = 12
const EXPECTATIONS = [
  ClubExpectation.WinLeague,
  ClubExpectation.ChallengeTop,
  ClubExpectation.MidTable,
  ClubExpectation.AvoidBottom,
]

function makeStanding(position: number): StandingRow {
  return { clubId: 'c', played: 22, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, position }
}

function makeGameWithPatience(boardPatience: number): Pick<SaveGame, 'boardPatience' | 'boardObjectives' | 'boardObjectiveHistory' | 'currentSeason'> {
  return { boardPatience, boardObjectives: [], boardObjectiveHistory: [], currentSeason: 3 }
}

describe('Board verdict consistency — evaluateBoard vs computeSeasonVerdictRating', () => {
  for (const expectation of EXPECTATIONS) {
    for (let position = 1; position <= TOTAL_TEAMS; position++) {
      it(`${expectation} × plats ${position}: satisfaction och rating säger inte emot varandra`, () => {
        const { satisfaction } = evaluateBoard(expectation, makeStanding(position), TOTAL_TEAMS, 22, 22)
        const rating = computeSeasonVerdictRating(expectation, position, TOTAL_TEAMS)

        // "delighted" (bästa omdömet) får aldrig sammanfalla med ett dåligt
        // betyg (1-2 av 5) — det vore precis Skutskär 8:a-motsägelsen.
        if (satisfaction === 'delighted') {
          expect(rating, `plats ${position} under ${expectation}: delighted men rating=${rating}`).toBeGreaterThanOrEqual(3)
        }
        // "unhappy" (sämsta omdömet) får aldrig sammanfalla med ett bra
        // betyg (4-5 av 5).
        if (satisfaction === 'unhappy') {
          expect(rating, `plats ${position} under ${expectation}: unhappy men rating=${rating}`).toBeLessThanOrEqual(3)
        }
      })
    }
  }
})

// Faktiska fynd (denna test-fil, 2026-08-23) — tre kombinationer där en
// enskild säsongs 'unhappy'-omdöme INTE räcker för att flytta boardPatience
// under 50 (stabilt-tröskeln) från en neutral startpunkt (70). Roten:
// BOARD_PATIENCE_SLOPE:s magnituder (t.ex. avoidBottom.below=4) är
// kalibrerade mot ACKUMULERAD historik över flera säsonger — evaluateBoards
// positionsband är kalibrerade mot ETT ögonblick. Samma familj av fel som
// Skutskär 8:a (portalen "Stabilt", uppdrag "I FARA" samma omgång) — inte
// samma bugg, men samma ROT: tre formler, tre separata kalibreringar av
// "hur illa är det här". Ospecat, inte fixat — se BACKLOG.md "Två läsare,
// en sanning" (styrelsens nöjdhet-raden, redan öppen, redan flaggad
// "Under byggnad"). it.fails här håller fyndet SYNLIGT och mekaniskt
// vaktat: går den oväntat grön har någon fixat det (ta bort .fails), går
// den rött på en NY kombination har divergensen vuxit.
const KNOWN_SINGLE_SEASON_PATIENCE_DIVERGENCE = new Set([
  `${ClubExpectation.ChallengeTop}_9`,
  `${ClubExpectation.AvoidBottom}_11`,
  `${ClubExpectation.AvoidBottom}_12`,
])

describe('Board verdict consistency — evaluateBoard vs boardPatience-zonen (portalen)', () => {
  for (const expectation of EXPECTATIONS) {
    for (let position = 1; position <= TOTAL_TEAMS; position++) {
      const isKnownDivergence = KNOWN_SINGLE_SEASON_PATIENCE_DIVERGENCE.has(`${expectation}_${position}`)
      const testFn = isKnownDivergence ? it.fails : it
      testFn(`${expectation} × plats ${position}: satisfaction och portalzonen säger inte emot varandra`, () => {
        const { satisfaction } = evaluateBoard(expectation, makeStanding(position), TOTAL_TEAMS, 22, 22)
        // Neutral startpunkt (70, standardvärdet getBoardPatienceZone själv
        // faller tillbaka på), ingen tidigare historik — isolerar SÄSONGENS
        // eget utfall, inte ackumulerad skuld/kredit från förra säsonger.
        const { newBoardPatience } = computeBoardPatienceUpdate(position, TOTAL_TEAMS, 70, 0, expectation)
        const { zone } = getBoardPatienceZone(makeGameWithPatience(newBoardPatience) as SaveGame)

        if (satisfaction === 'delighted') {
          expect(zone, `plats ${position} under ${expectation}: delighted men portalzon=${zone}`).not.toBe('ultimatum')
        }
        if (satisfaction === 'unhappy') {
          expect(zone, `plats ${position} under ${expectation}: unhappy men portalzon=${zone}`).not.toBe('stabilt')
        }
      })
    }
  }
})
