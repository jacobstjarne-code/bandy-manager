import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { FixtureStatus } from '../../../../domain/enums'
import type { LiveMatchProgress, TeamSelection } from '../../../../domain/entities/Fixture'
import type { MatchStep } from '../../../../domain/services/matchSimulator'
import { CLUB_TEMPLATES } from '../../../../domain/services/worldGenerator'
import { matchActions } from '../matchActions'

const lineup = {
  startingPlayerIds: Array.from({ length: 11 }, (_, index) => `p${index}`),
  benchPlayerIds: [],
  tactic: {},
} as TeamSelection

function step(index: number, minute: number): MatchStep {
  return {
    step: index,
    minute,
    events: [],
    homeScore: 1,
    awayScore: 0,
    commentary: '',
    intensity: 'low',
    activeSuspensions: { homeCount: 0, awayCount: 0 },
    shotsHome: 3,
    shotsAway: 1,
    onTargetHome: 2,
    onTargetAway: 1,
    cornersHome: 1,
    cornersAway: 0,
  }
}

describe('matchActions — durabel live-progress', () => {
  it('sparar exakt minut + stegserie och skriver inte om matchens ursprungliga starttid', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 944 })
    const fixture = base.fixtures.find(candidate => candidate.status === FixtureStatus.Scheduled)!
    let store = {
      game: {
        ...base,
        fixtures: base.fixtures.map(candidate => candidate.id === fixture.id
          ? { ...candidate, matchStartedAt: 100, homeLineup: lineup, awayLineup: lineup }
          : candidate),
      },
    }
    const actions = matchActions(
      () => store,
      partial => { store = { ...store, ...partial } as typeof store },
    )
    const progress: LiveMatchProgress = {
      currentStep: 1,
      displayedMinute: 17,
      steps: [step(0, 0), step(1, 15), step(2, 20)],
    }

    actions.saveLiveMatchProgress(fixture.id, progress)
    actions.markMatchStarted(fixture.id, lineup, lineup)

    const saved = store.game.fixtures.find(candidate => candidate.id === fixture.id)!
    expect(saved.liveMatchProgress).toBe(progress)
    expect(saved.matchStartedAt).toBe(100)
  })

  it('ignorerar progress för en match som inte har startats', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 945 })
    const fixture = game.fixtures.find(candidate => candidate.status === FixtureStatus.Scheduled)!
    let store = { game }
    const actions = matchActions(
      () => store,
      partial => { store = { ...store, ...partial } as typeof store },
    )

    actions.saveLiveMatchProgress(fixture.id, {
      currentStep: 0,
      displayedMinute: 0,
      steps: [step(0, 0)],
    })

    expect(store.game.fixtures.find(candidate => candidate.id === fixture.id)?.liveMatchProgress).toBeUndefined()
  })
})
