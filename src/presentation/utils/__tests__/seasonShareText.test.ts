/**
 * O9 (O9_TEXT_ARETS_BERATTELSE_2026-08-21.md, DOM_DELNINGSKORTET_2026-08-17.md)
 * — låst text, Opus/Fable. Wirad mot 4.12:s regionsbaserade layout
 * (seasonShareImage.ts) 2026-08-24 — den var aldrig kopplad trots att
 * SLUTTEST_KO.md:s kö sa "Code wirar"; kortet visade fortfarande det äldre
 * "6., 21 poäng"-innehållet auditen kritiserade.
 */
import { describe, it, expect } from 'vitest'
import {
  positionsord, utfallssats, kontrastRad, ogonblickRad, statistikRad,
  tvasanningsRad, fragaRad,
} from '../seasonShareImage'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateSeasonSummary } from '../../../domain/services/seasonSummaryService'
import { ClubExpectation } from '../../../domain/enums'
import type { SeasonSummary, MatchHighlight } from '../../../domain/entities/SeasonSummary'

function baseSummary(): SeasonSummary {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  return generateSeasonSummary(game)
}

describe('positionsord', () => {
  it('1-12 i bestämd form, exakt domens lista', () => {
    const expected = ['etta', 'tvåa', 'trea', 'fyra', 'femma', 'sexa', 'sjua', 'åtta', 'nia', 'tia', 'elva', 'tolva']
    expected.forEach((word, i) => expect(positionsord(i + 1)).toBe(word))
  })
})

describe('utfallssats — prioritetsordningen', () => {
  const base = { finalPosition: 6, playoffResult: null, cupResult: null } as SeasonSummary

  it('champion slår allt', () => {
    expect(utfallssats({ ...base, playoffResult: 'champion', cupResult: 'winner' }, false)).toBe('Svenska mästare.')
  })
  it('cup winner slår SM-final', () => {
    expect(utfallssats({ ...base, playoffResult: 'finalist', cupResult: 'winner' }, false)).toBe('Vann cupen.')
  })
  it('SM-final utan cupvinst', () => {
    expect(utfallssats({ ...base, playoffResult: 'finalist' }, false)).toBe('SM-final.')
  })
  it('semifinal', () => {
    expect(utfallssats({ ...base, playoffResult: 'semifinal' }, false)).toBe('Semifinal.')
  })
  it('kvartsfinal', () => {
    expect(utfallssats({ ...base, playoffResult: 'quarterfinal' }, false)).toBe('Kvartsfinal.')
  })
  it('annars placeringen', () => {
    expect(utfallssats({ ...base, finalPosition: 6 }, false)).toBe('Slutade sexa.')
  })
  it('forcePosition=true hoppar över SM-final/cup, går rakt till placering (failed-fallet)', () => {
    expect(utfallssats({ ...base, playoffResult: 'champion', cupResult: 'winner', finalPosition: 9 }, true)).toBe('Slutade nia.')
  })
})

describe('kontrastRad', () => {
  it('exceeded: förväntanssats + utfallssats', () => {
    const s = { ...baseSummary(), expectationVerdict: 'exceeded' as const, boardExpectation: ClubExpectation.AvoidBottom, playoffResult: 'quarterfinal' as const, cupResult: null, finalPosition: 5 }
    expect(kontrastRad(s)).toBe('Skulle överleva. Kvartsfinal.')
  })

  it('exceeded, WinLeague-förväntan, slutade trea', () => {
    const s = { ...baseSummary(), expectationVerdict: 'exceeded' as const, boardExpectation: ClubExpectation.WinLeague, playoffResult: null, cupResult: null, finalPosition: 3 }
    expect(kontrastRad(s)).toBe('Skulle vinna ligan. Slutade trea.')
  })

  it('failed: alltid placeringen, ALDRIG en cup/SM-framgång på rad 1', () => {
    const s = { ...baseSummary(), expectationVerdict: 'failed' as const, boardExpectation: ClubExpectation.MidTable, playoffResult: 'champion' as const, cupResult: 'winner' as const, finalPosition: 9 }
    expect(kontrastRad(s)).toBe('Skulle landa i mitten. Slutade nia.')
  })

  it('met, longestWinStreak>=4: streak-fallbacken', () => {
    const s = { ...baseSummary(), expectationVerdict: 'met' as const, finalPosition: 9, longestWinStreak: 5, biggestWin: null, topScorer: null, points: 30 }
    expect(kontrastRad(s)).toBe('Nia. Fem raka segrar.')
  })

  it('met, ingen streak men biggestWin', () => {
    const s = { ...baseSummary(), expectationVerdict: 'met' as const, finalPosition: 4, longestWinStreak: 1, biggestWin: { opponent: 'Slottsbron', score: '7-1', round: 10 }, topScorer: null, points: 30 }
    expect(kontrastRad(s)).toBe('Fyra. 7-1 mot Slottsbron.')
  })

  it('met, ingen streak/biggestWin men topScorer', () => {
    const s = { ...baseSummary(), expectationVerdict: 'met' as const, finalPosition: 7, longestWinStreak: 1, biggestWin: null, topScorer: { playerId: 'p1', name: 'Erik Berg', goals: 22, assists: 3 }, points: 30 }
    expect(kontrastRad(s)).toBe('Sjua. Erik Berg gjorde 22 mål.')
  })

  it('met, inget av ovan: poäng-fallbacken', () => {
    const s = { ...baseSummary(), expectationVerdict: 'met' as const, finalPosition: 8, longestWinStreak: 1, biggestWin: null, topScorer: null, points: 27 }
    expect(kontrastRad(s)).toBe('Åtta, 27 poäng.')
  })
})

describe('ogonblickRad', () => {
  it('undefined om matchOfTheSeason saknas', () => {
    expect(ogonblickRad(undefined)).toBeUndefined()
  })

  it('late_winner, hemmamatch — våra/deras rätt riktade', () => {
    const m: MatchHighlight = { fixtureId: 'f', matchday: 1, opponentName: 'Slottsbron', homeScore: 3, awayScore: 2, isHome: true, category: 'late_winner', narrative: 'n', shareImageReady: true }
    expect(ogonblickRad(m)).toBe('Segern mot Slottsbron kom i sista minuterna. 3–2.')
  })

  it('underdog_upset, bortamatch — våra/deras vänds rätt', () => {
    const m: MatchHighlight = { fixtureId: 'f', matchday: 1, opponentName: 'Heros', homeScore: 4, awayScore: 5, isHome: false, category: 'underdog_upset', narrative: 'n', shareImageReady: true }
    expect(ogonblickRad(m)).toBe('Heros skulle vinna. Det blev 5–4.')
  })

  it('big_win — poängen först, ingen "mot"-inledning', () => {
    const m: MatchHighlight = { fixtureId: 'f', matchday: 1, opponentName: 'Skutskär', homeScore: 7, awayScore: 1, isHome: true, category: 'big_win', narrative: 'n', shareImageReady: true }
    expect(ogonblickRad(m)).toBe('7–1 mot Skutskär.')
  })
})

describe('statistikRad', () => {
  it('grundformen, inget cup/slutspel', () => {
    const s = { ...baseSummary(), finalPosition: 8, points: 27, goalsFor: 71, goalsAgainst: 68, cupResult: null, playoffResult: null }
    expect(statistikRad(s)).toBe('8:e · 27 p · 71–68')
  })

  it('1:a och 2:a tar ":a", 3-12 tar ":e"', () => {
    expect(statistikRad({ ...baseSummary(), finalPosition: 1, points: 40, goalsFor: 1, goalsAgainst: 1, cupResult: null, playoffResult: null })).toContain('1:a')
    expect(statistikRad({ ...baseSummary(), finalPosition: 2, points: 40, goalsFor: 1, goalsAgainst: 1, cupResult: null, playoffResult: null })).toContain('2:a')
    expect(statistikRad({ ...baseSummary(), finalPosition: 3, points: 40, goalsFor: 1, goalsAgainst: 1, cupResult: null, playoffResult: null })).toContain('3:e')
  })

  it('cup + slutspel läggs till i ordning, ingen dubblettfiltrering', () => {
    const s = { ...baseSummary(), finalPosition: 1, points: 44, goalsFor: 80, goalsAgainst: 30, cupResult: 'winner' as const, playoffResult: 'champion' as const }
    expect(statistikRad(s)).toBe('1:a · 44 p · 80–30 · Cupmästare · SM-guld')
  })

  it('quarter/eliminated/didNotQualify skrivs aldrig ut', () => {
    const s = { ...baseSummary(), finalPosition: 5, points: 30, goalsFor: 50, goalsAgainst: 40, cupResult: 'eliminated' as const, playoffResult: 'didNotQualify' as const }
    expect(statistikRad(s)).toBe('5:e · 30 p · 50–40')
  })
})

describe('tvasanningsRad', () => {
  it('undefined om expectationVerdict är failed', () => {
    const s = { ...baseSummary(), expectationVerdict: 'failed' as const, objectiveOutcome: { met: 0, atRisk: 1, active: 0, failed: 1 } }
    expect(tvasanningsRad(s)).toBeUndefined()
  })

  it('undefined om objectiveOutcome saknas', () => {
    const s = { ...baseSummary(), expectationVerdict: 'met' as const, objectiveOutcome: undefined }
    expect(tvasanningsRad(s)).toBeUndefined()
  })

  it('undefined om inget uppdrag missat/hotat', () => {
    const s = { ...baseSummary(), expectationVerdict: 'met' as const, objectiveOutcome: { met: 2, atRisk: 0, active: 0, failed: 0 } }
    expect(tvasanningsRad(s)).toBeUndefined()
  })

  it('singular: "ett uppdrag missades"', () => {
    const s = { ...baseSummary(), expectationVerdict: 'exceeded' as const, playoffResult: 'quarterfinal' as const, cupResult: null, objectiveOutcome: { met: 1, atRisk: 0, active: 0, failed: 1 } }
    expect(tvasanningsRad(s)).toBe('Kvartsfinal — men ett uppdrag missades.')
  })

  it('plural, failed+atRisk summeras: "två uppdrag missades"', () => {
    const s = { ...baseSummary(), expectationVerdict: 'exceeded' as const, playoffResult: 'quarterfinal' as const, cupResult: null, objectiveOutcome: { met: 0, atRisk: 1, active: 0, failed: 1 } }
    expect(tvasanningsRad(s)).toBe('Kvartsfinal — men 2 uppdrag missades.')
  })
})

describe('fragaRad', () => {
  it('exceeded', () => {
    expect(fragaRad({ ...baseSummary(), expectationVerdict: 'exceeded', clubName: 'Forsbacka BK' })).toBe('Kan du ta Forsbacka BK längre?')
  })
  it('met', () => {
    expect(fragaRad({ ...baseSummary(), expectationVerdict: 'met', clubName: 'Forsbacka BK' })).toBe('Kan du göra det med Forsbacka BK?')
  })
  it('failed — ingen klubbnamn-interpolering', () => {
    expect(fragaRad({ ...baseSummary(), expectationVerdict: 'failed', clubName: 'Forsbacka BK' })).toBe('Kan du göra det bättre?')
  })
})
