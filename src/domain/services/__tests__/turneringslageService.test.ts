import { describe, it, expect } from 'vitest'
import { deriveTurneringslageMode, getTurneringslageText } from '../turneringslageService'
import type { TurneringslageMode } from '../turneringslageService'
import type { SaveGame } from '../../entities/SaveGame'
import type { CupBracket } from '../../entities/Cup'
import type { PlayoffBracket, PlayoffSeries } from '../../entities/Playoff'
import { PlayoffStatus, PlayoffRound } from '../../enums'

const MANAGED = 'club_1'
const OPP = 'club_2'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return { managedClubId: MANAGED, cupBracket: null, playoffBracket: null, ...overrides } as SaveGame
}

function cupBracketWith(matches: CupBracket['matches'], winnerId: string | null = null): CupBracket {
  return { matches, winnerId } as CupBracket
}

function series(round: PlayoffRound, overrides: Partial<PlayoffSeries> = {}): PlayoffSeries {
  return { id: `s-${round}`, round, homeClubId: MANAGED, awayClubId: OPP, fixtures: [], homeWins: 0, awayWins: 0, winnerId: null, loserId: null, ...overrides }
}

function playoffBracketWith(overrides: Partial<PlayoffBracket>): PlayoffBracket {
  return { season: 8, status: PlayoffStatus.QuarterFinals, quarterFinals: [], semiFinals: [], final: null, champion: null, ...overrides }
}

describe('deriveTurneringslageMode — GRANSKA DEL 4 steg 5 (2026-08-11)', () => {
  it('liga/avsked — alltid null, inget turneringsläge att rapportera', () => {
    expect(deriveTurneringslageMode(makeGame(), 'liga')).toBeNull()
    expect(deriveTurneringslageMode(makeGame(), 'avsked')).toBeNull()
  })

  it('cup — ingen bracket alls → null, inte krasch', () => {
    expect(deriveTurneringslageMode(makeGame({ cupBracket: null }), 'cup')).toBeNull()
  })

  it.each([
    [1, 'ut_forstarunda'],
    [2, 'ut_kvart'],
    [3, 'ut_semi'],
    [4, 'forlorad_final'],
  ] as const)('cup, utslagen i rond %i → %s', (round, mode) => {
    const bracket = cupBracketWith([{ id: 'm1', round, fixtureId: 'f1', homeClubId: MANAGED, awayClubId: OPP, winnerId: OPP }])
    expect(deriveTurneringslageMode(makeGame({ cupBracket: bracket }), 'cup')).toBe(mode)
  })

  it('cup, vunnen final — winnerId === managedClubId', () => {
    const bracket = cupBracketWith([], MANAGED)
    expect(deriveTurneringslageMode(makeGame({ cupBracket: bracket }), 'cup')).toBe('vunnen_final')
  })

  it('cup, vidare till final — kvart+semi vunna, final ej avgjord', () => {
    const bracket = cupBracketWith([
      { id: 'm1', round: 2, fixtureId: 'f1', homeClubId: MANAGED, awayClubId: OPP, winnerId: MANAGED },
      { id: 'm2', round: 3, fixtureId: 'f2', homeClubId: MANAGED, awayClubId: OPP, winnerId: MANAGED },
      { id: 'm3', round: 4, fixtureId: 'f3', homeClubId: MANAGED, awayClubId: OPP, winnerId: null },
    ])
    expect(deriveTurneringslageMode(makeGame({ cupBracket: bracket }), 'cup')).toBe('vidare_final')
  })

  it('slutspel — ingen bracket alls → null', () => {
    expect(deriveTurneringslageMode(makeGame({ playoffBracket: null }), 'slutspel')).toBeNull()
  })

  it('slutspel, ut i kvartsfinal', () => {
    const bracket = playoffBracketWith({ quarterFinals: [series(PlayoffRound.QuarterFinal, { winnerId: OPP, loserId: MANAGED })] })
    expect(deriveTurneringslageMode(makeGame({ playoffBracket: bracket }), 'slutspel')).toBe('ut_kvart')
  })

  it('slutspel, ut i semifinal', () => {
    const bracket = playoffBracketWith({
      quarterFinals: [series(PlayoffRound.QuarterFinal, { winnerId: MANAGED, loserId: OPP })],
      semiFinals: [series(PlayoffRound.SemiFinal, { winnerId: OPP, loserId: MANAGED })],
    })
    expect(deriveTurneringslageMode(makeGame({ playoffBracket: bracket }), 'slutspel')).toBe('ut_semi')
  })

  it('slutspel, förlorad final', () => {
    const bracket = playoffBracketWith({ final: series(PlayoffRound.Final, { winnerId: OPP, loserId: MANAGED }) })
    expect(deriveTurneringslageMode(makeGame({ playoffBracket: bracket }), 'slutspel')).toBe('forlorad_final')
  })

  it('slutspel, vunnen final — champion === managedClubId', () => {
    const bracket = playoffBracketWith({ champion: MANAGED })
    expect(deriveTurneringslageMode(makeGame({ playoffBracket: bracket }), 'slutspel')).toBe('vunnen_final')
  })

  it('slutspel, vidare till final', () => {
    const bracket = playoffBracketWith({ final: series(PlayoffRound.Final) })
    expect(deriveTurneringslageMode(makeGame({ playoffBracket: bracket }), 'slutspel')).toBe('vidare_final')
  })

  it('fortfarande med, inget avgjort — null (ingen rad, naturlig tystnad mitt i turneringen)', () => {
    const bracket = playoffBracketWith({ quarterFinals: [series(PlayoffRound.QuarterFinal, { winnerId: MANAGED, loserId: OPP })] })
    expect(deriveTurneringslageMode(makeGame({ playoffBracket: bracket }), 'slutspel')).toBeNull()
  })
})

// Text från Opus (2026-08-12) — låst mot oavsiktlig drift.
describe('getTurneringslageText', () => {
  const cupModes: [TurneringslageMode, string][] = [
    ['ut_forstarunda', 'Ut i förstarundan. Cupen blev kort i år.'],
    ['ut_kvart', 'Kvartsfinal, och inte längre. Cupen är över för den här gången.'],
    ['ut_semi', 'En match från final. Cupen slutar här.'],
    ['vidare_final', 'Final. Ni är en match från att ta hem den.'],
    ['vunnen_final', 'Cupen är er.'],
    ['forlorad_final', 'Final och silver. Det tar ett tag innan man ser det som något annat än en förlust.'],
  ]
  it.each(cupModes)('cup, %s', (mode, text) => {
    expect(getTurneringslageText(mode, 'cup')).toBe(text)
  })

  const slutspelModes: [TurneringslageMode, string][] = [
    ['ut_kvart', 'Kvartsfinal, och inte längre. Säsongen är slut.'],
    ['ut_semi', 'En match från SM-final. Så nära kom ni.'],
    ['vidare_final', 'SM-final. Studenternas väntar.'],
    ['vunnen_final', 'Svenska mästare.'],
    ['forlorad_final', 'SM-final och silver. Ingen tröst i dag. Kanske i mars.'],
  ]
  it.each(slutspelModes)('slutspel, %s', (mode, text) => {
    expect(getTurneringslageText(mode, 'slutspel')).toBe(text)
  })
})
