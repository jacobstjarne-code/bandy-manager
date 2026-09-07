/**
 * stickiness-categoryfor-tre-kallor (DOM Opus 2026-09-06): calendar_anchor
 * och season_context är nu egna framåtblickande källor (game.fixtures/
 * game.standings), inte längre en felklassad gren av agendan. Ingen copy
 * finns än för dem (Opus skriver den senare) — testerna verifierar att
 * infrastrukturen håller "ingen copy → ingen draft"-disciplinen, och att
 * en stubbad resolver (som simulerar framtida copy) får rätt payload-form.
 */
import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { FixtureStatus } from '../../enums'
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
  it('derby inom fönstret, men ingen copy skriven än: ingen draft (infrastruktur utan dold produktionscopy)', () => {
    const game = baseGame({ fixtures: [derbyFixture(3)] })
    expect(narrativePushDrafts(game, alwaysNullResolver)).toEqual([])
  })

  it('derby inom fönstret + stubbad resolver: draft med fixture-källa och /game/match-länk', () => {
    const game = baseGame({ fixtures: [derbyFixture(3)] })
    const drafts = narrativePushDrafts(game, acceptAnyResolver)
    expect(drafts).toHaveLength(1)
    expect(drafts[0].type).toBe('calendar_anchor')
    expect(drafts[0].subjectId).toBe('fixture-next')
    expect(drafts[0].sources).toEqual([{ kind: 'fixture', id: 'fixture-next' }])
    expect(drafts[0].deepLink).toBe('/game/match')
    expect(drafts[0].narrativePost).toBeUndefined()
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

  it('nära slutspelsstrecket: ingen copy skriven än → ingen draft', () => {
    const game = baseGame({ standings: standingsWithPosition(9, 43) })
    expect(narrativePushDrafts(game, alwaysNullResolver)).toEqual([])
  })

  it('nära slutspelsstrecket + stubbad resolver: draft med standing-källa och /game/tabell-länk', () => {
    const game = baseGame({ standings: standingsWithPosition(9, 43) })
    const drafts = narrativePushDrafts(game, acceptAnyResolver)
    expect(drafts).toHaveLength(1)
    expect(drafts[0].type).toBe('season_context')
    expect(drafts[0].sources).toEqual([{ kind: 'standing', id: MANAGED }])
    expect(drafts[0].deepLink).toBe('/game/tabell')
  })

  it('own.played === 0 (säsongsstart): ingen kandidat, inga matcher spelade än', () => {
    const game = baseGame({ standings: standingsWithPosition(9, 43, 0) })
    expect(narrativePushDrafts(game, acceptAnyResolver)).toEqual([])
  })
})
