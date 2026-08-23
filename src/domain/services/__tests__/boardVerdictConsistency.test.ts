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
 * **Förlikt 2026-08-24 (Jacobs dom).** De tre `it.fails()`-markerade
 * kombinationerna (ChallengeTop×9, AvoidBottom×11/12) beskrev ett VERKLIGT
 * fel, inte ett testfel: portalzonen läser ackumulerad historik,
 * evaluateBoard läste tidigare ett enskilt ögonblick (position/anchor-band)
 * — två separata kalibreringar av "hur illa är det här" som kunde säga
 * emot varandra. "Zonen är sanningen, domen ska förklara den" — evaluateBoard
 * läser nu SAMMA boardPatience-värde som getBoardPatienceZone (se
 * boardService.ts:s kommentar på funktionen). `it.fails()` borttaget: alla
 * kombinationer är nu mekaniskt garanterade att inte säga emot varandra,
 * inte bara verifierade för den gamla kalibreringen. BACKLOG.md:s "Två
 * läsare, en sanning"-rad (styrelsens nöjdhet) stängd i samma commit.
 */
import { describe, it, expect } from 'vitest'
import {
  evaluateBoard,
  computeSeasonVerdictRating,
  computeBoardPatienceUpdate,
} from '../boardService'
import { getBoardPatienceZone } from '../portal/boardPatienceZone'
import { ClubExpectation } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'

const TOTAL_TEAMS = 12
const EXPECTATIONS = [
  ClubExpectation.WinLeague,
  ClubExpectation.ChallengeTop,
  ClubExpectation.MidTable,
  ClubExpectation.AvoidBottom,
]

function makeGameWithPatience(boardPatience: number): Pick<SaveGame, 'boardPatience' | 'boardObjectives' | 'boardObjectiveHistory' | 'currentSeason'> {
  return { boardPatience, boardObjectives: [], boardObjectiveHistory: [], currentSeason: 3 }
}

describe('Board verdict consistency — evaluateBoard vs computeSeasonVerdictRating', () => {
  for (const expectation of EXPECTATIONS) {
    for (let position = 1; position <= TOTAL_TEAMS; position++) {
      it(`${expectation} × plats ${position}: satisfaction och rating säger inte emot varandra`, () => {
        // Neutral startpunkt (70), en säsongs utfall från position — samma
        // ackumulerade väg som boardPatience-zonen nedan går, så alla tre
        // formler jämförs mot samma säsongsutfall.
        const { newBoardPatience } = computeBoardPatienceUpdate(position, TOTAL_TEAMS, 70, 0, expectation)
        const { satisfaction } = evaluateBoard(newBoardPatience)
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

describe('Board verdict consistency — evaluateBoard vs boardPatience-zonen (portalen)', () => {
  for (const expectation of EXPECTATIONS) {
    for (let position = 1; position <= TOTAL_TEAMS; position++) {
      it(`${expectation} × plats ${position}: satisfaction och portalzonen säger aldrig emot varandra (samma källvärde)`, () => {
        // Neutral startpunkt (70, standardvärdet getBoardPatienceZone själv
        // faller tillbaka på), ingen tidigare historik — isolerar SÄSONGENS
        // eget utfall, inte ackumulerad skuld/kredit från förra säsonger.
        const { newBoardPatience } = computeBoardPatienceUpdate(position, TOTAL_TEAMS, 70, 0, expectation)
        const { satisfaction } = evaluateBoard(newBoardPatience)
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
