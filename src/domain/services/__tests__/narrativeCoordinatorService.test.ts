import { describe, it, expect } from 'vitest'
import {
  applySurfacingBudget,
  isExemptFromSurfacingBudget,
  recentlySurfaced,
  rotateSubject,
  genericBeatExcludeCount,
  CHANNEL_BY_EVENT_TYPE,
  SURFACING_GLOBAL_CAP,
} from '../narrativeCoordinatorService'
import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import type { NarrativeLogEntry } from '../../entities/Narrative'

function ev(type: GameEvent['type'], id: string, extra?: Partial<GameEvent>): GameEvent {
  return { id, type, title: id, body: id, choices: [{ id: 'ok', label: 'ok', effect: { type: 'noOp' } }], resolved: false, ...extra }
}

function gameWithLog(log: NarrativeLogEntry[]): Pick<SaveGame, 'narrativeBeatLog'> {
  return { narrativeBeatLog: log }
}

describe('applySurfacingBudget — kanal-exklusivitet', () => {
  it('släpper bara en per kanal', () => {
    const candidates = [
      ev('pressConference', 'a'),
      ev('journalistExclusive', 'b'), // samma kanal (press) som a
      ev('sponsorOffer', 'c'), // orten
    ]
    const { kept, dropped } = applySurfacingBudget(candidates)
    expect(kept.map(e => e.id)).toEqual(['a', 'c'])
    expect(dropped.map(e => e.id)).toEqual(['b'])
  })

  it('stänger vid globalt tak även inom skilda kanaler', () => {
    const candidates = [
      ev('pressConference', 'a'), // press
      ev('sponsorOffer', 'b'), // orten
      ev('burnoutRelief', 'c'), // manager — tredje icke-undantagna, taket är 2
    ]
    const { kept, dropped } = applySurfacingBudget(candidates)
    expect(kept.map(e => e.id)).toEqual(['a', 'b'])
    expect(dropped.map(e => e.id)).toEqual(['c'])
  })

  it('systemhandelse:true undantas taket och kanalen helt', () => {
    const candidates = [
      ev('pressConference', 'a'),
      ev('sponsorOffer', 'b'),
      ev('varsel', 'sys', { systemhandelse: true }),
    ]
    const { kept, dropped } = applySurfacingBudget(candidates)
    expect(kept.map(e => e.id)).toEqual(['a', 'b', 'sys'])
    expect(dropped).toHaveLength(0)
  })

  it('retirementCeremony undantas', () => {
    const candidates = [ev('pressConference', 'a'), ev('sponsorOffer', 'b'), ev('retirementCeremony', 'r')]
    const { kept } = applySurfacingBudget(candidates)
    expect(kept.map(e => e.id)).toEqual(['a', 'b', 'r'])
  })

  it('HIGH 11 måste-tier (contractRequest) undantas', () => {
    const candidates = [ev('pressConference', 'a'), ev('sponsorOffer', 'b'), ev('contractRequest', 'must')]
    const { kept } = applySurfacingBudget(candidates)
    expect(kept.map(e => e.id)).toEqual(['a', 'b', 'must'])
  })

  it('typer utanför koordinatorns stängda scope passerar opåverkat, räknas inte mot taket', () => {
    const candidates = [
      ev('pressConference', 'a'),
      ev('sponsorOffer', 'b'),
      ev('playerArc', 'c'), // ej klassificerad — utanför scope
      ev('economicStress', 'd'), // ej klassificerad
    ]
    const { kept, dropped } = applySurfacingBudget(candidates)
    expect(kept.map(e => e.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(dropped).toHaveLength(0)
  })

  it('ordningen i candidates avgör vem som vinner en kanalkollision', () => {
    const first = [ev('pressConference', 'winner'), ev('journalistExclusive', 'loser')]
    expect(applySurfacingBudget(first).kept.map(e => e.id)).toEqual(['winner'])

    const swapped = [ev('journalistExclusive', 'winner'), ev('pressConference', 'loser')]
    expect(applySurfacingBudget(swapped).kept.map(e => e.id)).toEqual(['winner'])
  })

  it('SURFACING_GLOBAL_CAP är 2 (dagens känsla, domens startvärde)', () => {
    expect(SURFACING_GLOBAL_CAP).toBe(2)
  })

  it('varje namngiven kanal-typ är verifierad mot GameEventType (kompileringstest, ingen körning krävs)', () => {
    expect(CHANNEL_BY_EVENT_TYPE.pressConference).toBe('press')
    expect(CHANNEL_BY_EVENT_TYPE.communityEvent).toBe('orten')
    expect(CHANNEL_BY_EVENT_TYPE.burnoutRelief).toBe('manager')
  })
})

describe('isExemptFromSurfacingBudget', () => {
  it('vanligt event är inte undantaget', () => {
    expect(isExemptFromSurfacingBudget(ev('pressConference', 'a'))).toBe(false)
  })
})

describe('recentlySurfaced — innehålls-recency', () => {
  it('true inom fönstret, false utanför', () => {
    const game = gameWithLog([{ semanticKey: 'press_q_x', season: 1, round: 10 }])
    expect(recentlySurfaced(game, 'press_q_x', 5, 12)).toBe(true) // 12-10=2 < 5
    expect(recentlySurfaced(game, 'press_q_x', 5, 15)).toBe(false) // 15-10=5, ej < 5
  })

  it('annan semanticKey påverkar inte', () => {
    const game = gameWithLog([{ semanticKey: 'press_q_y', season: 1, round: 10 }])
    expect(recentlySurfaced(game, 'press_q_x', 5, 11)).toBe(false)
  })

  it('tom logg → aldrig nyligen visad', () => {
    expect(recentlySurfaced(gameWithLog([]), 'anything', 5, 10)).toBe(false)
  })
})

describe('rotateSubject — subjekts-rotation', () => {
  const pool = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' }]
  const pickFirst = (c: { id: string }[]) => c[0]

  it('utesluter de senast figurerade subjekten, nyast först, upp till excludeCount', () => {
    const game = gameWithLog([
      { semanticKey: 'beat_p1', season: 1, round: 5 },
      { semanticKey: 'beat_p2', season: 1, round: 8 },
      { semanticKey: 'beat_p3', season: 1, round: 10 },
    ])
    // excludeCount=2 → de två SENAST figurerade (p3 round10, p2 round8) uteslutna, p1 kvar valbar
    const result = rotateSubject(pool, 'beat_', game, 2, c => c[0])
    expect(result?.id).toBe('p1')
  })

  it('sorterar historiken på säsong före den säsongslokala omgången', () => {
    const game = gameWithLog([
      { semanticKey: 'beat_p1', season: 1, round: 30 },
      { semanticKey: 'beat_p2', season: 2, round: 2 },
    ])
    const result = rotateSubject(pool, 'beat_', game, 1, c => c[0])

    // p2 är senast trots lägre round; p1 ska därför fortfarande vara valbar.
    expect(result?.id).toBe('p1')
  })

  it('släpper spärren helt när hela poolen uteslutits (fullt varv)', () => {
    const game = gameWithLog([
      { semanticKey: 'beat_p1', season: 1, round: 1 },
      { semanticKey: 'beat_p2', season: 1, round: 2 },
      { semanticKey: 'beat_p3', season: 1, round: 3 },
      { semanticKey: 'beat_p4', season: 1, round: 4 },
      { semanticKey: 'beat_p5', season: 1, round: 5 },
    ])
    const result = rotateSubject(pool, 'beat_', game, pool.length, pickFirst)
    // Alla uteslutna → fallback till hela poolen, tie-break avgör som vanligt
    expect(result?.id).toBe('p1')
  })

  it('journalistExclusive-mönstret: career-brett varv reproduceras med excludeCount=pool.length', () => {
    // Endast p1 och p2 har någonsin figurerat — p3/p4/p5 ska vara valbara
    const game = gameWithLog([
      { semanticKey: 'jx_p1', season: 1, round: 1 },
      { semanticKey: 'jx_p2', season: 2, round: 10 },
    ])
    const pickHighest = (c: { id: string }[]) => c[c.length - 1]
    const result = rotateSubject(pool, 'jx_', game, pool.length, pickHighest)
    expect(['p3', 'p4', 'p5']).toContain(result?.id)
  })

  it('tom pool → null', () => {
    expect(rotateSubject([], 'x_', gameWithLog([]), 5, pickFirst)).toBeNull()
  })

  it('ingen historik → hela poolen valbar direkt', () => {
    const result = rotateSubject(pool, 'beat_', gameWithLog([]), 2, pickFirst)
    expect(result?.id).toBe('p1')
  })
})

describe('genericBeatExcludeCount — K=5 startvärde', () => {
  it('min(poolstorlek-3, K) med K=5', () => {
    expect(genericBeatExcludeCount(15)).toBe(5) // min(12,5)=5
    expect(genericBeatExcludeCount(6)).toBe(3) // min(3,5)=3
    expect(genericBeatExcludeCount(3)).toBe(0) // min(0,5)=0
    expect(genericBeatExcludeCount(1)).toBe(0) // golv 0, aldrig negativt
  })
})
