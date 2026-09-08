/**
 * stickiness-categoryfor-tre-kallor (DOM Opus 2026-09-06): calendar_anchor
 * och season_context är nu egna framåtblickande källor (game.fixtures/
 * game.standings), inte längre en felklassad gren av agendan. Testerna
 * verifierar både "ingen resolvercopy → ingen draft"-disciplinen och att
 * de låsta mallarna får samtliga statefält utan att själva läsa rå state.
 */
import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { FixtureStatus, PlayoffRound, PlayoffStatus } from '../../enums'
import { CLUB_TEMPLATES } from '../../services/worldGenerator'
import { narrativePushDrafts, type ForwardPushPayload } from '../narrativePushAdapter'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'

const MANAGED = 'club_soderfors'
const RIVAL = 'club_skutskar'
const OTHER = CLUB_TEMPLATES.find(c => c.id !== MANAGED && c.id !== RIVAL)!.id

function baseGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: MANAGED, season: 3, seed: 1 })
  return { ...game, currentDate: '2027-01-10', eventLedger: [], ...overrides }
}

function derbyFixture(daysAhead: number): Fixture {
  return {
    id: 'fixture-next', leagueId: 'league-1', season: 3, roundNumber: 4, matchday: 4,
    date: `2027-01-${String(10 + daysAhead).padStart(2, '0')}`,
    homeClubId: MANAGED, awayClubId: RIVAL,
    status: FixtureStatus.Scheduled, homeScore: 0, awayScore: 0, events: [],
  } as unknown as Fixture
}

const alwaysNullResolver = () => null
const acceptAnyResolver = (payload: ForwardPushPayload) => ({ title: 't', body: 'b', voice: 'assistant' as const })

describe('narrativePushDrafts — calendar_anchor (familj 2)', () => {
  it('derby inom fönstret, men en resolver som avstår: ingen draft', () => {
    const game = baseGame({ fixtures: [derbyFixture(3)] })
    expect(narrativePushDrafts(game, alwaysNullResolver)).toEqual([])
  })

  it('derby inom fönstret + stubbad resolver: draft med fixture-källa och /game/match-länk', () => {
    const game = baseGame({ fixtures: [derbyFixture(3)] })
    const payloads: ForwardPushPayload[] = []
    const drafts = narrativePushDrafts(game, payload => {
      payloads.push(payload)
      return acceptAnyResolver(payload)
    })
    expect(drafts).toHaveLength(1)
    expect(drafts[0].type).toBe('calendar_anchor')
    expect(drafts[0].subjectId).toBe('fixture-next')
    expect(drafts[0].sources).toEqual([{ kind: 'fixture', id: 'fixture-next' }])
    expect(drafts[0].deepLink).toBe('/game/match')
    expect(drafts[0].narrativePost).toBeUndefined()
    expect(payloads[0]).toMatchObject({
      category: 'calendar_anchor', kind: 'derby', daysUntil: 3, venue: 'hemma',
    })
  })

  it('derby UTANFÖR fönstret (för långt fram): ingen kandidat alls', () => {
    const game = baseGame({ fixtures: [derbyFixture(20)] })
    expect(narrativePushDrafts(game, acceptAnyResolver)).toEqual([])
  })

  it('nästa match mot ett icke-rivaliserande lag: ingen calendar_anchor-kandidat', () => {
    const fixture = { ...derbyFixture(3), awayClubId: OTHER }
    const game = baseGame({ fixtures: [fixture] })
    expect(narrativePushDrafts(game, acceptAnyResolver)).toEqual([])
  })

  it('cupfinal (bracket round 4) klassas kind:cup, inte derby', () => {
    const fixture = { ...derbyFixture(3), isCup: true }
    const game = baseGame({
      fixtures: [fixture],
      cupBracket: {
        season: 3, completed: false,
        matches: [{ id: 'cm1', round: 4, fixtureId: 'fixture-next', homeClubId: MANAGED, awayClubId: RIVAL }],
      },
    })
    const payloads: ForwardPushPayload[] = []
    narrativePushDrafts(game, (payload) => { payloads.push(payload); return null })
    const calendarPayload = payloads.find(p => p.category === 'calendar_anchor')
    expect(calendarPayload).toMatchObject({ category: 'calendar_anchor', kind: 'cup' })
  })

  it('SM-final (isFinaldag) klassas kind:final', () => {
    const fixture = { ...derbyFixture(3), isFinaldag: true }
    const game = baseGame({ fixtures: [fixture] })
    const payloads: ForwardPushPayload[] = []
    narrativePushDrafts(game, (payload) => { payloads.push(payload); return null })
    const calendarPayload = payloads.find(p => p.category === 'calendar_anchor')
    expect(calendarPayload).toMatchObject({ category: 'calendar_anchor', kind: 'final' })
  })

  it('slutspelskvart klassas ur bracketen, inte ur det globala roundNumber-talet', () => {
    const fixture = { ...derbyFixture(3), awayClubId: OTHER, isKnockout: true, roundNumber: 27 }
    const series = {
      id: 'qf-1', round: PlayoffRound.QuarterFinal, homeClubId: MANAGED, awayClubId: OTHER,
      fixtures: ['fixture-next'], homeWins: 0, awayWins: 0, winnerId: null, loserId: null,
    }
    const game = baseGame({
      fixtures: [fixture],
      playoffBracket: {
        season: 3, status: PlayoffStatus.QuarterFinals, quarterFinals: [series],
        semiFinals: [], final: null, champion: null,
      },
    })
    const payloads: ForwardPushPayload[] = []
    narrativePushDrafts(game, payload => { payloads.push(payload); return null })
    expect(payloads.find(p => p.category === 'calendar_anchor')).toMatchObject({
      category: 'calendar_anchor', kind: 'playoff', playoffStage: 'kvartsfinal',
    })
  })

  it('annandagsmatch utan tyngre ankare får den egna kalenderkategorin', () => {
    const fixture = { ...derbyFixture(3), awayClubId: OTHER, isAnnandagen: true }
    const game = baseGame({ fixtures: [fixture] })
    const payloads: ForwardPushPayload[] = []
    narrativePushDrafts(game, payload => { payloads.push(payload); return null })
    expect(payloads.find(p => p.category === 'calendar_anchor')).toMatchObject({
      category: 'calendar_anchor', kind: 'annandag', venue: 'hemma',
    })
  })

})

describe('narrativePushDrafts — season_context (familj 3)', () => {
  // Boundary-raderna (rank 8 = slutspelsstrecket, rank 10 = sista säkra
  // plats mot nedflyttning, 12 lag/2-lags zon) får fasta, monotont fallande
  // poäng oberoende av var managed club läggs — annars blir toPlayoff/
  // toRelegation inkonsekventa mot de RIKTIGA gränsraderna.
  function standingsWithPosition(position: number, points: number, playedOverride?: number) {
    const basePointsForRank = (rank: number) => 60 - rank * 2
    const others = CLUB_TEMPLATES.map(c => c.id).filter(id => id !== MANAGED)
    let otherIdx = 0
    return Array.from({ length: 12 }, (_, i) => i + 1).map(rank => {
      if (rank === position) {
        return {
          clubId: MANAGED, position: rank, points, played: playedOverride ?? 20,
          wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
        }
      }
      return {
        clubId: others[otherIdx++], position: rank, points: basePointsForRank(rank), played: 20,
        wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
      }
    })
  }

  it('trygg mittenplacering, långt från båda linjerna (rank8=44p, rank10=40p): ingen kandidat', () => {
    const game = baseGame({ standings: standingsWithPosition(6, 52) })
    expect(narrativePushDrafts(game, acceptAnyResolver)).toEqual([])
  })

  it('nära slutspelsstrecket men resolver som avstår → ingen draft', () => {
    const game = baseGame({ standings: standingsWithPosition(9, 43) })
    expect(narrativePushDrafts(game, alwaysNullResolver)).toEqual([])
  })

  it('nära slutspelsstrecket + stubbad resolver: draft med standing-källa och /game/tabell-länk', () => {
    const game = baseGame({ standings: standingsWithPosition(9, 43) })
    const payloads: ForwardPushPayload[] = []
    const drafts = narrativePushDrafts(game, payload => {
      payloads.push(payload)
      return acceptAnyResolver(payload)
    })
    expect(drafts).toHaveLength(1)
    expect(drafts[0].type).toBe('season_context')
    expect(drafts[0].sources).toEqual([{ kind: 'standing', id: MANAGED }])
    expect(drafts[0].deepLink).toBe('/game/tabell')
    expect(payloads[0]).toMatchObject({
      category: 'season_context',
      kind: 'playoff_edge',
      position: 9,
      pointsTo: { playoff: 1 },
      roundsRemaining: 22,
      form: null,
    })
  })

  it('own.played === 0 (säsongsstart): ingen kandidat, inga matcher spelade än', () => {
    const game = baseGame({ standings: standingsWithPosition(9, 43, 0) })
    expect(narrativePushDrafts(game, acceptAnyResolver)).toEqual([])
  })

  it('nedflyttningsläge går före slutspelsmarginal och bär poäng till säkerhet', () => {
    const game = baseGame({ standings: standingsWithPosition(11, 39) })
    const payloads: ForwardPushPayload[] = []
    narrativePushDrafts(game, payload => { payloads.push(payload); return acceptAnyResolver(payload) })
    expect(payloads.find(p => p.category === 'season_context')).toMatchObject({
      category: 'season_context', kind: 'relegation', position: 11,
      pointsTo: { safety: 1 },
    })
  })

  it('tvåan inom tre poäng från ledaren bär ett sant seriesegersläge', () => {
    const game = baseGame({ standings: standingsWithPosition(2, 56) })
    const payloads: ForwardPushPayload[] = []
    narrativePushDrafts(game, payload => { payloads.push(payload); return acceptAnyResolver(payload) })
    expect(payloads.find(p => p.category === 'season_context')).toMatchObject({
      category: 'season_context', kind: 'title', position: 2,
      pointsTo: { title: 2 },
    })
  })

  it('tre raka vinster blir formpayload när tabellen inte ligger vid en gräns', () => {
    const next = { ...derbyFixture(3), awayClubId: OTHER }
    const game = baseGame({
      fixtures: [next],
      standings: standingsWithPosition(6, 52),
      trainerArc: {
        ...baseGame().trainerArc,
        consecutiveWins: 3,
        consecutiveLosses: 0,
      },
    })
    const payloads: ForwardPushPayload[] = []
    narrativePushDrafts(game, payload => { payloads.push(payload); return acceptAnyResolver(payload) })
    expect(payloads.find(p => p.category === 'season_context')).toMatchObject({
      category: 'season_context', kind: 'streak_w', form: { result: 'W', length: 3 },
      nextOpponentClubId: OTHER,
    })
  })
})
