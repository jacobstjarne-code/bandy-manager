import { describe, expect, it } from 'vitest'
import { FixtureStatus } from '../../enums'
import type { EventLedgerEntry, LedgerToldRegistry } from '../../entities/Narrative'
import type { SaveGame } from '../../entities/SaveGame'
import { chronologyPointLabel, currentChronology, leagueRoundAtMatchday, type CurrentChronology } from '../currentChronology'
import { ledgerPostKey, markLedgerPostTold, toldMarksFor } from '../ledgerToldService'
import { agendaForSurface, redaktoren, semanticKeyStem } from '../redaktorenService'

const CLUB_ID = 'club_a'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'save_test',
    managedClubId: CLUB_ID,
    currentSeason: 3,
    currentMatchday: 10,
    fixtures: [],
    playoffBracket: null,
    eventLedger: [],
    ledgerTold: {},
    ...overrides,
  } as unknown as SaveGame
}

function post(overrides: Partial<EventLedgerEntry> = {}): EventLedgerEntry {
  return {
    type: 'player_milestone',
    semanticKey: 'player_milestone:p1:s3:m10:first_team_goal',
    clubId: CLUB_ID,
    season: 3,
    matchday: 10,
    subject: { kind: 'player', id: 'p1' },
    significance: 60,
    ...overrides,
  }
}

const chronology: CurrentChronology = {
  season: 3,
  matchday: 10,
  leagueRound: 6,
  phase: 'regular_active',
}

describe('Berättaren steg 1 — currentChronology + ledgerTold', () => {
  it('håller global matchdag skild från spelad ligaomgång', () => {
    const game = makeGame({
      currentMatchday: 11,
      fixtures: [{
        id: 'league_6',
        season: 3,
        matchday: 9,
        roundNumber: 6,
        homeClubId: CLUB_ID,
        awayClubId: 'club_b',
        homeScore: 3,
        awayScore: 2,
        status: FixtureStatus.Completed,
        isCup: false,
        isKnockout: false,
      } as never, {
        id: 'cup_gap',
        season: 3,
        matchday: 10,
        roundNumber: 2,
        homeClubId: CLUB_ID,
        awayClubId: 'club_c',
        homeScore: 2,
        awayScore: 1,
        status: FixtureStatus.Completed,
        isCup: true,
      } as never],
    })

    expect(currentChronology(game)).toEqual({
      season: 3,
      matchday: 11,
      leagueRound: 6,
      phase: 'regular_active',
    })
  })

  it('etiketterar en historisk ligamatch med faktisk omgång men cupgap som matchdag', () => {
    const game = makeGame({
      currentMatchday: 6,
      fixtures: [{
        id: 'league_2', season: 3, matchday: 3, roundNumber: 2,
        homeClubId: CLUB_ID, awayClubId: 'club_b', status: FixtureStatus.Completed,
        isCup: false, isKnockout: false,
      } as never, {
        id: 'cup_gap', season: 3, matchday: 4, roundNumber: 1,
        homeClubId: CLUB_ID, awayClubId: 'club_c', status: FixtureStatus.Completed,
        isCup: true, isKnockout: false,
      } as never, {
        id: 'league_3', season: 3, matchday: 5, roundNumber: 3,
        homeClubId: 'club_d', awayClubId: CLUB_ID, status: FixtureStatus.Completed,
        isCup: false, isKnockout: false,
      } as never],
    })

    expect(leagueRoundAtMatchday(game, 3, 3)).toBe(2)
    expect(leagueRoundAtMatchday(game, 3, 4)).toBe(2)
    expect(chronologyPointLabel(game, 3, 3)).toBe('omgång 2')
    expect(chronologyPointLabel(game, 3, 4)).toBe('matchdag 4')
    expect(chronologyPointLabel(game, 3, 5)).toBe('omgång 3')
  })

  it('bygger stabil postnyckel och skriver idempotent ytkvitto', () => {
    const entry = post()
    const once = markLedgerPostTold(undefined, entry, 'portal', chronology)
    const twice = markLedgerPostTold(once, entry, 'portal', chronology)

    expect(ledgerPostKey(entry)).toBe('["player_milestone","player_milestone:p1:s3:m10:first_team_goal",3,10]')
    expect(twice).toBe(once)
    expect(toldMarksFor(twice, entry)).toEqual([{ surface: 'portal', season: 3, matchday: 10 }])
  })
})

describe('Berättaren steg 2 — redaktoren', () => {
  it('läser strikt den managerade klubbens poster', () => {
    const ours = post()
    const theirs = post({ semanticKey: 'theirs', clubId: 'club_b' })
    const unstampedLegacy = post({ semanticKey: 'legacy', clubId: undefined })
    const agenda = redaktoren(makeGame({ eventLedger: [ours, theirs, unstampedLegacy] }), chronology)

    expect(agenda.items.map(item => item.post.semanticKey)).toEqual([ours.semanticKey])
  })

  it('viktar personer/relationer upp och matcher ned', () => {
    const person = post({ significance: 60 })
    const relation = post({
      type: 'patron_emerge',
      semanticKey: 'patron:p1:s3:m10',
      subject: { kind: 'patron', id: 'patron_1' },
      significance: 60,
    })
    const match = post({
      type: 'big_win',
      semanticKey: 'match:f1:s3:m10',
      subject: { kind: 'club', id: 'club_b' },
      significance: 60,
    })
    const agenda = redaktoren(makeGame({ eventLedger: [match, relation, person] }), chronology)

    const byFamily = new Map(agenda.items.map(item => [item.family, item]))
    expect(agenda.items.slice(0, 2).map(item => item.family).sort()).toEqual(['people', 'relations_money'])
    expect(byFamily.get('people')?.scoresBySurface.portal.total).toBeCloseTo(84)
    expect(byFamily.get('relations_money')?.scoresBySurface.portal.total).toBeCloseTo(84)
    expect(byFamily.get('match')?.scoresBySurface.portal.total).toBeCloseTo(48)
  })

  it('klassar journalistens lösta båge som relation, inte generell beslutsrad', () => {
    const journalistStory = post({
      type: 'storyline_resolution',
      semanticKey: 'storyline_resolution:journalist_feud:journalist-feud-s3',
      subject: { kind: 'club', id: CLUB_ID },
      significance: 40,
    })
    const agenda = redaktoren(makeGame({ eventLedger: [journalistStory] }), chronology)

    expect(agenda.items[0]?.family).toBe('relations_money')
    expect(agenda.items[0]?.scoresBySurface.yearbook.relation).toBe(1.4)
  })

  it('har separata färskhetsköer och faller till bakgrund efter fyra matchdagar', () => {
    const fresh = post({ semanticKey: 'fresh', matchday: 10 })
    const edge = post({ semanticKey: 'edge', matchday: 6 })
    const stale = post({ semanticKey: 'stale', matchday: 5 })
    const anniversary = post({ semanticKey: 'anniversary', season: 2, matchday: 10 })
    const agenda = redaktoren(makeGame({ eventLedger: [fresh, edge, stale, anniversary] }), chronology)
    const byKey = new Map(agenda.items.map(item => [item.post.semanticKey, item]))

    expect(byKey.get('fresh')?.freshnessQueue).toBe('since_last')
    expect(byKey.get('fresh')?.scoresBySurface.portal.freshness).toBe(1)
    expect(byKey.get('edge')?.scoresBySurface.portal.freshness).toBe(0.5)
    expect(byKey.get('stale')?.freshnessQueue).toBe('background')
    expect(byKey.get('stale')?.scoresBySurface.portal.freshness).toBe(0.2)
    expect(byKey.get('anniversary')?.freshnessQueue).toBe('anniversary')
    expect(byKey.get('anniversary')?.scoresBySurface.portal.freshness).toBe(1)
  })

  it('nedviktar samma yta till 0,3 och en annan yta till 0,7', () => {
    const entry = post()
    const ledgerTold = markLedgerPostTold({}, entry, 'portal', chronology)
    const agenda = redaktoren(makeGame({ eventLedger: [entry], ledgerTold }), chronology)
    const item = agenda.items[0]

    expect(item.scoresBySurface.portal.untoldness).toBe(0.3)
    expect(item.scoresBySurface.push.untoldness).toBe(0.7)
    expect(agendaForSurface(agenda, 'review')).toHaveLength(1)
  })

  it('nollställer ärvd otaldhet när samma berättelse eskalerar', () => {
    const old = post({
      semanticKey: 'star_injury:p1:s3:m7',
      type: 'star_injury',
      matchday: 7,
      significance: 50,
    })
    const escalated = post({
      semanticKey: 'star_injury:p1:s3:m9',
      type: 'star_injury',
      matchday: 9,
      significance: 70,
    })
    const repeated = post({
      semanticKey: 'star_injury:p1:s3:m10',
      type: 'star_injury',
      matchday: 10,
      significance: 60,
    })
    const ledgerTold: LedgerToldRegistry = markLedgerPostTold({}, old, 'portal', {
      ...chronology,
      matchday: 7,
    })
    const agenda = redaktoren(makeGame({ eventLedger: [old, escalated, repeated], ledgerTold }), chronology)
    const byKey = new Map(agenda.items.map(item => [item.post.semanticKey, item]))

    expect(semanticKeyStem(old.semanticKey)).toBe('star_injury:p1')
    expect(byKey.get(escalated.semanticKey)?.scoresBySurface.portal.untoldness).toBe(1)
    expect(byKey.get(repeated.semanticKey)?.scoresBySurface.portal.untoldness).toBe(0.3)
  })
})
