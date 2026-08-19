/**
 * O15 (Taktikens två lägen, 2026-08-18/19, DOM 1b) — låser den LÅSTA texten
 * (Jacob/Design) för delta-raden och ändringshistoriken. Dessa strängar är
 * ordagranna leveranser, inte Code-prosa — ett test som failar på en
 * ordalydelseändring är avsiktligt strikt.
 */
import { describe, it, expect } from 'vitest'
import { diffTactics, getTacticDeltaLine, getTacticChangeHistoryLines } from '../tacticData'
import { TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle } from '../../../domain/enums'
import type { Tactic, TacticChangeLogEntry } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'

function baseTactic(overrides: Partial<Tactic> = {}): Tactic {
  return {
    mentality: TacticMentality.Balanced,
    tempo: TacticTempo.Normal,
    press: TacticPress.Medium,
    passingRisk: TacticPassingRisk.Mixed,
    width: TacticWidth.Normal,
    attackingFocus: TacticAttackingFocus.Mixed,
    cornerStrategy: CornerStrategy.Standard,
    penaltyKillStyle: PenaltyKillStyle.Active,
    ...overrides,
  }
}

function fixtureWithTactic(tactic: Tactic, opts: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fx-1',
    leagueId: 'l1',
    season: 1,
    roundNumber: 5,
    matchday: 5,
    homeClubId: 'us',
    awayClubId: 'them',
    status: 'completed',
    homeScore: 2,
    awayScore: 1,
    events: [],
    homeLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic },
    ...opts,
  } as unknown as Fixture
}

describe('diffTactics', () => {
  it('hittar bara de 8 dimensionerna, aldrig formation/lineupSlots', () => {
    const from = baseTactic({ formation: '3-3-4' as never })
    const to = baseTactic({ formation: '4-2-4' as never, tempo: TacticTempo.High })
    const diffs = diffTactics(from, to)
    expect(diffs).toEqual([{ key: 'tempo', value: TacticTempo.High }])
  })
})

describe('getTacticDeltaLine', () => {
  const managedClubId = 'us'

  it('första matchen någonsin (ingen lastFixture) — ingen rad', () => {
    expect(getTacticDeltaLine(baseTactic(), null, managedClubId, 1, undefined)).toBeUndefined()
  })

  it('säsongens första match — ny säsong-raden', () => {
    const last = fixtureWithTactic(baseTactic(), { season: 1 })
    expect(getTacticDeltaLine(baseTactic(), last, managedClubId, 2, 'Målilla'))
      .toBe('Ny säsong. Planen står som du lämnade den.')
  })

  it('noll ändringar — samma-plan-raden', () => {
    const last = fixtureWithTactic(baseTactic(), { season: 1 })
    expect(getTacticDeltaLine(baseTactic(), last, managedClubId, 1, 'Skutskär'))
      .toBe('Samma plan som mot Skutskär.')
  })

  it('en ändring — dimension → nytt värde', () => {
    const last = fixtureWithTactic(baseTactic(), { season: 1 })
    const current = baseTactic({ tempo: TacticTempo.High })
    expect(getTacticDeltaLine(current, last, managedClubId, 1, 'Målilla'))
      .toBe('Sedan Målilla: Tempo → Högt.')
  })

  it('två ändringar — "X och Y ändrade"', () => {
    const last = fixtureWithTactic(baseTactic(), { season: 1 })
    const current = baseTactic({ mentality: TacticMentality.Offensive, press: TacticPress.High })
    expect(getTacticDeltaLine(current, last, managedClubId, 1, 'Skutskär'))
      .toBe('Sedan Skutskär: Mentalitet och Press ändrade.')
  })

  it('tre ändringar — "X, Y och Z ändrade"', () => {
    const last = fixtureWithTactic(baseTactic(), { season: 1 })
    const current = baseTactic({ mentality: TacticMentality.Offensive, press: TacticPress.High, tempo: TacticTempo.High })
    expect(getTacticDeltaLine(current, last, managedClubId, 1, 'Skutskär'))
      .toBe('Sedan Skutskär: Mentalitet, Tempo och Press ändrade.')
  })

  it('fyra eller fler ändringar — "har du gjort om planen"', () => {
    const last = fixtureWithTactic(baseTactic(), { season: 1 })
    const current = baseTactic({
      mentality: TacticMentality.Offensive, press: TacticPress.High,
      tempo: TacticTempo.High, width: TacticWidth.Wide,
    })
    expect(getTacticDeltaLine(current, last, managedClubId, 1, 'Skutskär'))
      .toBe('Sedan Skutskär har du gjort om planen.')
  })

  it('jämför mot förra SPELADE matchen oavsett tävlingstyp (cupmatch räknas)', () => {
    // Kritiskt villkor: en cupmatch mellan två ligaomgångar ÄR "sedan sist".
    const lastCup = fixtureWithTactic(baseTactic({ tempo: TacticTempo.Low }), { season: 1, isCup: true, matchday: 8 })
    const current = baseTactic({ tempo: TacticTempo.High })
    expect(getTacticDeltaLine(current, lastCup, managedClubId, 1, 'Cupmotståndet'))
      .toBe('Sedan Cupmotståndet: Tempo → Högt.')
  })

  it('läser bortalag-lineupen när managed club var borta', () => {
    const last = fixtureWithTactic(baseTactic(), { season: 1, homeClubId: 'them', awayClubId: managedClubId, homeLineup: undefined, awayLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: baseTactic() } } as never)
    const current = baseTactic({ press: TacticPress.High })
    expect(getTacticDeltaLine(current, last, managedClubId, 1, 'Hemmalaget'))
      .toBe('Sedan Hemmalaget: Press → Hög.')
  })
})

describe('getTacticChangeHistoryLines', () => {
  it('inget loggat — bara utgångsläge-raden', () => {
    expect(getTacticChangeHistoryLines(undefined)).toEqual(['Omg 1 · utgångsläge satt'])
  })

  it('nyast överst, en rad per matchday, flera ändringar på samma rad separerade med " · "', () => {
    const log: TacticChangeLogEntry[] = [
      { matchday: 9, changes: [{ key: 'press', value: TacticPress.High }, { key: 'width', value: TacticWidth.Wide }] },
      { matchday: 14, changes: [{ key: 'tempo', value: TacticTempo.High }] },
    ]
    expect(getTacticChangeHistoryLines(log)).toEqual([
      'Omg 14 · Tempo → Högt',
      'Omg 9 · Press → Hög · Bredd → Bred',
      'Omg 1 · utgångsläge satt',
    ])
  })

  it('riktig post på omgång 1 ersätter den syntetiska raden, dupliceras inte', () => {
    const log: TacticChangeLogEntry[] = [{ matchday: 1, changes: [{ key: 'mentality', value: TacticMentality.Offensive }] }]
    expect(getTacticChangeHistoryLines(log)).toEqual(['Omg 1 · Mentalitet → Offensiv'])
  })
})
