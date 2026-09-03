import { describe, expect, it } from 'vitest'
import { PlayoffStatus, PlayoffRound } from '../domain/enums'
import type { Fixture } from '../domain/entities/Fixture'
import type { PlayoffBracket } from '../domain/entities/Playoff'
import { shouldReviewContinueToChampion } from '../presentation/screens/granska/helpers'

const smFinal = { id: 'sm-final', isCup: false } as Fixture
const cupFinal = { id: 'sm-final', isCup: true } as Fixture
const bracket = {
  status: PlayoffStatus.Completed,
  champion: 'club-a',
  quarterFinals: [],
  semiFinals: [],
  final: {
    id: 'series-final',
    round: PlayoffRound.Final,
    homeClubId: 'club-a',
    awayClubId: 'club-b',
    homeWins: 1,
    awayWins: 0,
    fixtures: ['sm-final'],
    winnerId: 'club-a',
    loserId: 'club-b',
  },
} as PlayoffBracket

describe('Granska final routing', () => {
  it('routes an already completed SM final to the season ending', () => {
    expect(shouldReviewContinueToChampion({ playoffBracket: bracket }, smFinal)).toBe(true)
  })

  it('does not treat a cup final as the SM season ending', () => {
    expect(shouldReviewContinueToChampion({ playoffBracket: bracket }, cupFinal)).toBe(false)
  })

  it('does not route before the playoff bracket is completed', () => {
    expect(shouldReviewContinueToChampion({
      playoffBracket: { ...bracket, status: PlayoffStatus.Final },
    }, smFinal)).toBe(false)
  })
})
