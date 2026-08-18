/**
 * Å4 (SLUTTEST_KO.md, 2026-08-18) — "tre Acceptera-primärer". Tre inkommande
 * bud renderades tidigare med primaryChoiceId="accept" ovillkorligt på varje
 * IncomingBidCard, så alla tre fick .btn-primary samtidigt. sortBidsByUrgency
 * avgör vilket bud som är mest brådskande — TransfersScreen sätter isPrimary
 * bara på resultatets index 0.
 */
import { describe, it, expect } from 'vitest'
import { sortBidsByUrgency } from '../TransfersScreen'
import type { TransferBid } from '../../../domain/entities/GameEvent'

function makeBid(id: string, expiresRound: number | undefined): TransferBid {
  return {
    id, playerId: 'p1', buyingClubId: 'c1', sellingClubId: 'c2',
    offerAmount: 100000, offeredSalary: 5000, contractYears: 3,
    direction: 'incoming', status: 'pending', createdRound: 1,
    expiresRound,
  } as TransferBid
}

describe('sortBidsByUrgency', () => {
  it('mest brådskande (lägst expiresRound) hamnar först', () => {
    const bids = [makeBid('a', 10), makeBid('b', 3), makeBid('c', 7)]
    const sorted = sortBidsByUrgency(bids)
    expect(sorted.map(b => b.id)).toEqual(['b', 'c', 'a'])
  })

  it('saknad expiresRound räknas som mest brådskande (0)', () => {
    const bids = [makeBid('a', 5), makeBid('b', undefined)]
    const sorted = sortBidsByUrgency(bids)
    expect(sorted[0].id).toBe('b')
  })

  it('muterar inte input-arrayen', () => {
    const bids = [makeBid('a', 10), makeBid('b', 3)]
    const original = [...bids]
    sortBidsByUrgency(bids)
    expect(bids).toEqual(original)
  })

  it('tom array ger tom array', () => {
    expect(sortBidsByUrgency([])).toEqual([])
  })

  it('ett enda bud förblir det enda budet', () => {
    const bids = [makeBid('a', 5)]
    expect(sortBidsByUrgency(bids).map(b => b.id)).toEqual(['a'])
  })
})
