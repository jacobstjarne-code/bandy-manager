/**
 * Tester för Efterklang flöde-redesign (Code-brief 2026-06-03):
 *  - A3: gate på spelade ligamatcher (inte currentMatchday)
 *  - B4: premiss-komposition per minnestyp
 */
import { describe, it, expect } from 'vitest'
import { pickEfterklang } from '../domain/services/portal/pickEfterklang'
import { markLedgerPostTold } from '../domain/services/ledgerToldService'
import { FixtureStatus } from '../domain/enums'
import type { EventLedgerEntry } from '../domain/entities/Narrative'
import type { SaveGame } from '../domain/entities/SaveGame'

const MANAGED = 'club_managed'

function leagueFixtures(n: number, season = 3) {
  return Array.from({ length: n }, (_, i) => ({
    id: `lg-${i}`,
    season,
    roundNumber: i + 1,
    matchday: i + 1,
    status: FixtureStatus.Completed,
    isCup: false,
    homeClubId: MANAGED,
    awayClubId: 'club_x',
    events: [],
  }))
}

function makeGame(overrides: Partial<SaveGame> = {}, completedLeague = 6): SaveGame {
  return {
    id: 'test',
    currentSeason: 3,
    currentMatchday: 10,
    currentDate: '2026-01-01',
    managedClubId: MANAGED,
    clubs: [{ id: 'club_x', name: 'Söderfors IF', shortName: 'Söderfors' }],
    players: [],
    fixtures: leagueFixtures(completedLeague),
    inbox: [],
    ...overrides,
  } as unknown as SaveGame
}

// ── A3 — gate ────────────────────────────────────────────────────────────────

describe('pickEfterklang — A3 gate', () => {
  it('returnerar [] när färre än 5 ligamatcher spelats', () => {
    const game = makeGame({ klackEcho: { currentWeight: 0.7 } as never }, 4)
    expect(pickEfterklang(game)).toEqual([])
  })

  it('släpper igenom vid exakt 5 spelade ligamatcher', () => {
    const game = makeGame({ klackEcho: { currentWeight: 0.7 } as never }, 5)
    expect(pickEfterklang(game).length).toBeGreaterThan(0)
  })

  it('cupmatcher räknas inte mot gaten', () => {
    const cupFixtures = leagueFixtures(10).map(f => ({ ...f, isCup: true }))
    const game = makeGame({ klackEcho: { currentWeight: 0.7 } as never, fixtures: cupFixtures as never }, 0)
    expect(pickEfterklang(game)).toEqual([])
  })
})

// ── B4 — premiss per typ ───────────────────────────────────────────────────────

describe('pickEfterklang — B4 premiss-komposition', () => {
  const find = (game: SaveGame, type: string) =>
    pickEfterklang(game, 8).find(m => m.type === type)

  it('nemesis: karriärsumman märks inte felaktigt som innevarande säsong', () => {
    // Fynd 9: nemesis-efterklang gatas på att nemesisen ÄR nästa motståndare.
    const nextVsNemesis = {
      id: 'next', season: 3, roundNumber: 7, matchday: 11,
      status: FixtureStatus.Scheduled, isCup: false,
      homeClubId: MANAGED, awayClubId: 'club_x', events: [],
    }
    const game = makeGame({
      nemesisTracker: { club_x: { playerId: 'p1', name: 'Theo Dahlqvist', clubId: 'club_x', goalsAgainstUs: 3 } } as never,
      fixtures: [...leagueFixtures(6), nextVsNemesis] as never,
    })
    expect(find(game, 'nemesis')?.premiss).toBe('3 mål mot er.')
  })

  it('nemesis visas INTE när nästa motståndare är någon annan (fynd 9)', () => {
    const nextVsOther = {
      id: 'next', season: 3, roundNumber: 7, matchday: 11,
      status: FixtureStatus.Scheduled, isCup: false,
      homeClubId: MANAGED, awayClubId: 'club_other', events: [],
    }
    const game = makeGame({
      nemesisTracker: { club_x: { playerId: 'p1', name: 'Theo Dahlqvist', clubId: 'club_x', goalsAgainstUs: 3 } } as never,
      fixtures: [...leagueFixtures(6), nextVsOther] as never,
    })
    expect(find(game, 'nemesis')).toBeUndefined()
  })

  it('journalist: stam + opponentShort på good_answer', () => {
    // matchday 9, säsong 3 → matchdag 5-26 är alltid liga (buildSeasonCalendar),
    // leagueRound = matchday - 4 = 5.
    const game = makeGame({
      journalist: {
        name: 'Britta Sandström', relationship: 60, pressRefusals: 0,
        memory: [{ season: 3, matchday: 9, event: 'good_answer', sentiment: 4, opponentShort: 'Karlsborg' }],
      } as never,
    })
    expect(find(game, 'journalist')?.premiss).toBe('Du gav Britta Sandström ett rakt svar efter Karlsborg, omg 5.')
  })

  it('journalist: cup-/slutspelsmatchdag har ingen serieomgång — "matchdag N", aldrig ett påhittat rond-nummer (SKALA-BUGGEN steg B)', () => {
    // matchday 2 är alltid en cupmatchdag (1-4) — matchdayToLeagueRound
    // returnerar undefined, precis som cupbracket-precedenset i TabellScreen.tsx.
    const game = makeGame({
      journalist: {
        name: 'Britta Sandström', relationship: 60, pressRefusals: 0,
        memory: [{ season: 3, matchday: 2, event: 'good_answer', sentiment: 4, opponentShort: 'Karlsborg' }],
      } as never,
    })
    expect(find(game, 'journalist')?.premiss).toBe('Du gav Britta Sandström ett rakt svar efter Karlsborg, matchdag 2.')
  })

  it('journalist: nollvärdesvakt — matchday 0 (preseason-sentinel/gammalt save) visas ALDRIG som "omg 0", faller till currentMatchday', () => {
    // A-L1 (SLUTTEST_KO.md): matchday 0 är alltid en föregångare-sentinel
    // (createNewGame.ts sätter currentMatchday:0 innan omgång 1), aldrig en
    // riktig omgång att referera i text. Testar display-vakten i
    // pickEfterklang.ts oberoende av var 0:an ursprungligen kom ifrån.
    const game = makeGame({
      journalist: {
        name: 'Britta Sandström', relationship: 60, pressRefusals: 0,
        memory: [{ season: 3, matchday: 0, event: 'good_answer', sentiment: 4, opponentShort: 'Karlsborg' }],
      } as never,
    })
    const mem = find(game, 'journalist')
    expect(mem?.premiss).not.toContain('omg 0')
    // currentMatchday 10, säsong 3 → leagueRound = 10 - 4 = 6 (SKALA-BUGGEN
    // steg B: fallbacken konverteras nu också, visas inte längre rått).
    expect(mem?.premiss).toBe('Du gav Britta Sandström ett rakt svar efter Karlsborg, omg 6.')
    // Tidslinjen (EfterklangThreadModal renderar den konverterade etiketten)
    // ska inte heller bära en synlig 0:a.
    expect(mem?.threadEntries.every(e => e.matchday !== 0)).toBe(true)
  })

  it('journalist: utan opponentShort faller tillbaka på ", omg {N}."', () => {
    // matchday 9 → leagueRound 5 (samma räkning som "stam + opponentShort"-testet).
    const game = makeGame({
      journalist: {
        name: 'Britta Sandström', relationship: 60, pressRefusals: 0,
        memory: [{ season: 3, matchday: 9, event: 'bad_answer', sentiment: -4 }],
      } as never,
    })
    expect(find(game, 'journalist')?.premiss).toBe('Du snäste av Britta Sandström, omg 5.')
  })

  it('journalist: big_win tar aldrig opponentShort-svansen', () => {
    // matchday 9 → leagueRound 5.
    const game = makeGame({
      journalist: {
        name: 'Britta Sandström', relationship: 60, pressRefusals: 0,
        memory: [{ season: 3, matchday: 9, event: 'big_win', sentiment: 6, opponentShort: 'Karlsborg' }],
      } as never,
    })
    expect(find(game, 'journalist')?.premiss).toBe('Britta Sandström skrev om storsegern, omg 5.')
  })

  it('rivalSale: konkret namn när enrich finns', () => {
    const game = makeGame({
      lastRivalSaleMatchday: 8,
      lastRivalSaleInfo: { soldPlayerName: 'Lindqvist', buyerClubName: 'Söderfors IF' },
    })
    const m = find(game, 'rivalSale')
    expect(m?.premiss).toBe('Ni sålde Lindqvist till Söderfors IF.')
    expect(m?.soldPlayerName).toBe('Lindqvist')
    expect(m?.buyerClubName).toBe('Söderfors IF')
  })

  it('rivalSale: fallback utan enrich', () => {
    const game = makeGame({ lastRivalSaleMatchday: 8 })
    expect(find(game, 'rivalSale')?.premiss).toBe('Ni sålde en nyckelspelare till en rival.')
  })

  it('anniversary: delta 1 → "Ett år sedan", delta 3 → "3 år sedan"', () => {
    const ann = (yearsAgo: number) => ({
      eventId: 'e1', originalSeason: 3 - yearsAgo, yearsAgo, matchday: 5,
      type: 'match', outcome: 'won', significance: 80, echoSize: 'medium',
      originalEventText: 'segern mot Karlsborg',
    })
    expect(find(makeGame({ activeAnniversaries: [ann(1)] as never }), 'anniversary')?.premiss)
      .toBe('Ett år sedan segern mot Karlsborg.')
    expect(find(makeGame({ activeAnniversaries: [ann(3)] as never }), 'anniversary')?.premiss)
      .toBe('3 år sedan segern mot Karlsborg.')
  })

  it('klackEcho: premiss skiftar på currentWeight', () => {
    expect(find(makeGame({ klackEcho: { currentWeight: 0.7 } as never }), 'klackEcho')?.premiss)
      .toBe('Klacken har inte släppt det än.')
    expect(find(makeGame({ klackEcho: { currentWeight: 0.5 } as never }), 'klackEcho')?.premiss)
      .toBe('Klacken minns hur säsongen kändes.')
    expect(find(makeGame({ klackEcho: { currentWeight: 0.3 } as never }), 'klackEcho')?.premiss)
      .toBe('Känslorna sitter kvar i själva läktaren.')
  })

  it('klackEcho: 0–1-vikten normaliseras mot övriga kandidaters 0–100-skala', () => {
    const memories = pickEfterklang(makeGame({
      klackEcho: { currentWeight: 0.7 } as never,
      boardObjectiveHistory: [{ result: 'failed', ownerReaction: 'Besviken.' }] as never,
    }), 1)

    expect(memories[0]?.type).toBe('klackEcho')
  })

  it('boardObjective: statisk premiss vid failed', () => {
    const game = makeGame({
      boardObjectiveHistory: [{ result: 'failed', ownerReaction: 'Besviken.' }] as never,
    })
    expect(find(game, 'boardObjective')?.premiss).toBe('Du missade styrelsens mål förra säsongen.')
  })

  it('economicScar: decision → acute, awareness → annat', () => {
    const crisis = (phase: string) => ({ startedSeason: 2, startedMatchday: 1, phase, eventsFired: [] })
    expect(find(makeGame({ economicCrisisState: crisis('decision') as never }), 'economicScar')?.premiss)
      .toBe('Kassan är tom — igen.')
    expect(find(makeGame({ economicCrisisState: crisis('awareness') as never }), 'economicScar')?.premiss)
      .toBe('Inte länge sedan kassan var tom.')
  })

  it('followUp: avsändare + säsong', () => {
    const game = makeGame({
      bandyLetters: [{ season: 3, senderName: 'Gösta i klacken' }] as never,
    })
    expect(find(game, 'followUp')?.premiss).toBe('Gösta i klacken skrev till dig tidigare i säsongen.')
  })
})

describe('pickEfterklang — Berättarens agenda', () => {
  const rivalSalePost: EventLedgerEntry = {
    type: 'rival_sale',
    semanticKey: 'rival_sale:p1:club_x:s3:m9',
    clubId: MANAGED,
    season: 3,
    matchday: 9,
    subject: { kind: 'player', id: 'p1' },
    subject2: { kind: 'club', id: 'club_x' },
    significance: 75,
  }

  const economyPost: EventLedgerEntry = {
    type: 'decision',
    semanticKey: 'criticalEconomy:take_loan',
    clubId: MANAGED,
    managerId: 'test',
    season: 3,
    matchday: 9,
    significance: 100,
    irreversible: true,
    tension: true,
  }

  function canonicalGame(overrides: Partial<SaveGame> = {}): SaveGame {
    return makeGame({
      clubs: [
        { id: MANAGED, name: 'Forsbacka IF', shortName: 'Forsbacka' },
        { id: 'club_x', name: 'Söderfors IF', shortName: 'Söderfors' },
      ] as never,
      players: [{ id: 'p1', firstName: 'Jari', lastName: 'Niemi', clubId: 'club_x' }] as never,
      eventLedger: [],
      ledgerTold: {},
      ...overrides,
    })
  }

  it('bygger rivalförsäljningen ur clubId-avgränsad liggare utan legacyfickan', () => {
    const memory = pickEfterklang(canonicalGame({ eventLedger: [rivalSalePost] }), 8)
      .find(item => item.type === 'rivalSale')

    expect(memory).toMatchObject({
      premiss: 'Ni sålde Jari Niemi till Söderfors IF.',
      objectName: 'Jari Niemi',
      soldPlayerName: 'Jari Niemi',
      buyerClubName: 'Söderfors IF',
      sourcePostKey: expect.any(String),
    })
    expect(memory?.sourcePost).toBe(rivalSalePost)
    expect(memory?.threadEntries[0]).toMatchObject({ season: 3, matchday: 9 })
  })

  it('läcker inte en annan klubbs liggarpost till Efterklang', () => {
    const otherClubPost = { ...rivalSalePost, clubId: 'club_other' }
    const memories = pickEfterklang(canonicalGame({ eventLedger: [otherClubPost] }), 8)

    expect(memories.some(item => item.type === 'rivalSale')).toBe(false)
  })

  it('hämtar årsdagen ur agendans kanon även utan activeAnniversaries', () => {
    const oldPost = { ...rivalSalePost, season: 2, matchday: 10 }
    const memory = pickEfterklang(canonicalGame({ eventLedger: [oldPost] }), 8)
      .find(item => item.type === 'anniversary')

    expect(memory?.premiss).toMatch(/^Ett år sedan /)
    expect(memory?.sourcePost).toBe(oldPost)
    expect(memory?.threadEntries[0]).toMatchObject({ season: 2, matchday: 10 })
    expect(pickEfterklang(canonicalGame({ eventLedger: [oldPost] }), 8)
      .filter(item => item.sourcePostKey === memory?.sourcePostKey)).toHaveLength(1)
  })

  it('hämtar ett löst ekonomiskt val ur agendan utan economicCrisisState', () => {
    const memory = pickEfterklang(canonicalGame({ eventLedger: [economyPost] }), 8)
      .find(item => item.type === 'economicScar')

    expect(memory?.premiss).toBe('Kommunlånet löper fortfarande.')
    expect(memory?.sourcePost).toBe(economyPost)
  })

  it('håller en kvitterad tråd stabil samma matchdag men släpper fram nytt ämne nästa', () => {
    const game = canonicalGame({ eventLedger: [rivalSalePost, economyPost] })
    const first = pickEfterklang(game, 1)[0]
    expect(first.type).toBe('rivalSale')

    const ledgerTold = markLedgerPostTold(game.ledgerTold, rivalSalePost, 'efterklang', {
      season: 3,
      matchday: 10,
    })
    const sameDay = pickEfterklang({ ...game, ledgerTold }, 1)[0]
    expect(sameDay.type).toBe('rivalSale')

    const nextDay = pickEfterklang({ ...game, currentMatchday: 11, ledgerTold }, 1)[0]
    expect(nextDay.type).toBe('economicScar')
  })

  it('kopplar journalistens livepresentation till den kanoniska resolutionen', () => {
    const resolution: EventLedgerEntry = {
      type: 'storyline_resolution',
      semanticKey: 'storyline_resolution:journalist_feud:journalist-feud-s3',
      clubId: MANAGED,
      season: 3,
      matchday: 9,
      subject: { kind: 'club', id: MANAGED },
      significance: 40,
    }
    const game = canonicalGame({
      eventLedger: [resolution],
      journalist: {
        name: 'Britta Sandström', relationship: 20, pressRefusals: 3,
        memory: [{ season: 3, matchday: 9, event: 'refused_press', sentiment: -5 }],
      } as never,
    })
    const memory = pickEfterklang(game, 8).find(item => item.type === 'journalist')

    expect(memory?.sourcePost).toBe(resolution)
    expect(memory?.sourcePostKey).toBeDefined()
  })
})
