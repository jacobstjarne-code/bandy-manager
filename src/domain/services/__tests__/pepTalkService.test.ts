/**
 * DOM_PEPTALK_YTA_2026-09-02 — getPepTalk fick en yta (förbered-fasen) och
 * ett cooldown-krav (Beslut 3): samma replikindex ska inte upprepas innan
 * hela kategorins pool har roterat.
 */
import { describe, it, expect } from 'vitest'
import { getPepTalk, selectPepTalk, PEPTALK_QUOTE_PREFIX } from '../pepTalkService'
import { logNarrativeBeat } from '../narrativeLogService'
import { FixtureStatus } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import type { StandingRow } from '../../entities/SaveGame'

function makeStanding(overrides: Partial<StandingRow> = {}): StandingRow {
  return {
    clubId: 'c1', played: 6, wins: 3, draws: 1, losses: 2, points: 10,
    goalsFor: 20, goalsAgainst: 18, position: 5,
    ...overrides,
  } as StandingRow
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'f1', matchday: 6, roundNumber: 6, status: 'completed' as FixtureStatus,
    homeClubId: 'c1', awayClubId: 'c2', homeScore: 3, awayScore: 1,
    isCup: false,
    ...overrides,
  } as unknown as Fixture
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    managedClubId: 'c1',
    currentSeason: 2025,
    standings: [makeStanding()],
    fixtures: [makeFixture()],
    narrativeBeatLog: [],
    ...overrides,
  } as unknown as SaveGame
}

describe('selectPepTalk — kategorival', () => {
  it('ingen match spelad (played=0) ger null', () => {
    const game = makeGame({ standings: [makeStanding({ played: 0 })] })
    expect(selectPepTalk(game)).toBeNull()
  })

  it('ingen avslutad hanterad-klubbmatch ger null', () => {
    const game = makeGame({ fixtures: [] })
    expect(selectPepTalk(game)).toBeNull()
  })

  it('position 11+ klassas crisis oavsett resultat', () => {
    const game = makeGame({ standings: [makeStanding({ position: 11 })] })
    expect(selectPepTalk(game)?.category).toBe('crisis')
  })

  it('betydligt fler förluster än vinster klassas crisis', () => {
    const game = makeGame({ standings: [makeStanding({ position: 5, wins: 2, losses: 6 })] })
    expect(selectPepTalk(game)?.category).toBe('crisis')
  })

  it('topp 1-3 efter minst 5 spelade klassas top', () => {
    const game = makeGame({ standings: [makeStanding({ position: 2, played: 6 })] })
    expect(selectPepTalk(game)?.category).toBe('top')
  })

  it('topp 1-3 men färre än 5 spelade faller igenom till resultat-kategori', () => {
    const game = makeGame({ standings: [makeStanding({ position: 2, played: 3 })], fixtures: [makeFixture({ homeScore: 3, awayScore: 1 })] })
    expect(selectPepTalk(game)?.category).toBe('win')
  })

  it('vinst (som hemmalag) klassas win', () => {
    const game = makeGame({ fixtures: [makeFixture({ homeClubId: 'c1', homeScore: 4, awayScore: 2 })] })
    expect(selectPepTalk(game)?.category).toBe('win')
  })

  it('förlust (som bortalag) klassas loss', () => {
    const game = makeGame({ fixtures: [makeFixture({ awayClubId: 'c1', homeClubId: 'c2', homeScore: 4, awayScore: 2 })] })
    expect(selectPepTalk(game)?.category).toBe('loss')
  })

  it('oavgjort klassas draw', () => {
    const game = makeGame({ fixtures: [makeFixture({ homeScore: 2, awayScore: 2 })] })
    expect(selectPepTalk(game)?.category).toBe('draw')
  })
})

describe('selectPepTalk — cooldown (Beslut 3)', () => {
  it('undviker ett index som redan loggats denna säsong, väljer ett annat ur poolen', () => {
    const base = makeGame()
    const firstPick = selectPepTalk(base)!
    expect(firstPick.category).toBe('win')

    const loggedKey = `${PEPTALK_QUOTE_PREFIX}${firstPick.category}_${firstPick.index}`
    const withLog = makeGame({
      narrativeBeatLog: logNarrativeBeat(base, loggedKey, base.currentSeason, base.fixtures[0].matchday),
    })

    const secondPick = selectPepTalk(withLog)!
    expect(secondPick.index).not.toBe(firstPick.index)
  })

  it('släpper spärren när hela poolen för kategorin är på cooldown (helt varv)', () => {
    // PEP_DRAW-poolen har tre repliker — logga alla tre denna säsong.
    const game = makeGame({ fixtures: [makeFixture({ homeScore: 2, awayScore: 2 })] })
    let log = game.narrativeBeatLog ?? []
    for (let i = 0; i < 3; i++) {
      log = logNarrativeBeat({ ...game, narrativeBeatLog: log }, `${PEPTALK_QUOTE_PREFIX}draw_${i}`, game.currentSeason, game.fixtures[0].matchday)
    }
    const saturated = { ...game, narrativeBeatLog: log }
    const pick = selectPepTalk(saturated)
    expect(pick).not.toBeNull()
    expect(pick!.index).toBeGreaterThanOrEqual(0)
    expect(pick!.index).toBeLessThan(3)
  })

  it('en tidigare säsongs loggning spärrar inte innevarande säsong (minSeasonsApart=1)', () => {
    const base = makeGame()
    const firstPick = selectPepTalk(base)!
    const loggedKey = `${PEPTALK_QUOTE_PREFIX}${firstPick.category}_${firstPick.index}`
    const nextSeasonGame = makeGame({
      currentSeason: 2026,
      narrativeBeatLog: logNarrativeBeat(base, loggedKey, base.currentSeason, base.fixtures[0].matchday),
    })
    const nextSeasonPick = selectPepTalk(nextSeasonGame)!
    expect(nextSeasonPick.index).toBe(firstPick.index)
  })
})

describe('getPepTalk — textbygge', () => {
  it('crisis/top får inget akt-suffix', () => {
    const game = makeGame({ standings: [makeStanding({ position: 11 })] })
    const text = getPepTalk(game)
    expect(text).not.toBeNull()
    expect(text).not.toMatch(/Säsongen är ung|Vintern testar|Tabellen klarnar|avgörandet/)
  })

  it('win/loss/draw i akt 3+ får ett akt-suffix', () => {
    const game = makeGame({ fixtures: [makeFixture({ matchday: 20, roundNumber: 20 })] })
    const text = getPepTalk(game)
    expect(text).toMatch(/Tabellen klarnar|avgörandet/)
  })

  it('returnerar null utan spelad match', () => {
    const game = makeGame({ standings: [makeStanding({ played: 0 })] })
    expect(getPepTalk(game)).toBeNull()
  })
})
