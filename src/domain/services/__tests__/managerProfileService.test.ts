import { describe, it, expect } from 'vitest'
import {
  updateManagerBurnout,
  deriveBurnoutCause,
  getBurnoutZone,
  shouldShowBurnoutMark,
  shouldShowBurnoutRelief,
  shouldShowBurnoutClose,
  BURNOUT_NATURAL_DECAY,
} from '../managerProfileService'
import { FixtureStatus } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'
import type { ManagerProfile } from '../../entities/ManagerProfile'
import type { Fixture } from '../../entities/Fixture'

// HIGH 10 (DOM_HIGH10_BURNOUT_BAGE_2026-08-29.md). Fram till 2026-08-30 fanns
// ingen enhetstest-fil för managerProfileService — updateManagerBurnout,
// getBurnoutZone och shouldShowBurnoutMark täcktes bara indirekt via
// roundProcessor-integrationstester, som aldrig kunde isolera decay-gaten.

const MANAGED = 'club_a'
const OPPONENT = 'club_b'

function makeProfile(over: Partial<ManagerProfile> = {}): ManagerProfile {
  return {
    firstName: 'Test',
    lastName: 'Testsson',
    age: 45,
    hometown: 'Edsbyn',
    burnoutScore: 0,
    burnoutHistory: [],
    careerWins: 0,
    careerDraws: 0,
    careerLosses: 0,
    seasonsAtClub: 1,
    contractUntilSeason: 4,
    monthlySalary: 20,
    coachRivalries: [],
    diary: [],
    ...over,
  }
}

/** Minsta möjliga färdigspelade fixture för den styrda klubben. */
function playedFixture(matchday: number, managedScore: number, opponentScore: number): Fixture {
  return {
    id: `fx_${matchday}`,
    season: 1,
    roundNumber: matchday,
    matchday,
    homeClubId: MANAGED,
    awayClubId: OPPONENT,
    homeScore: managedScore,
    awayScore: opponentScore,
    status: FixtureStatus.Completed,
  } as unknown as Fixture
}

/** Ospelad fixture — bär 0–0 i score-fälten precis som scheduleGenerator sätter dem. */
function scheduledFixture(matchday: number): Fixture {
  return {
    id: `fx_${matchday}`,
    season: 1,
    roundNumber: matchday,
    matchday,
    homeClubId: MANAGED,
    awayClubId: OPPONENT,
    homeScore: 0,
    awayScore: 0,
    status: FixtureStatus.Scheduled,
  } as unknown as Fixture
}

function makeGame(over: {
  profile?: ManagerProfile
  fixtures?: Fixture[]
  unreadInbox?: number
  fatigue?: number
} = {}): SaveGame {
  const unread = over.unreadInbox ?? 0
  return {
    managedClubId: MANAGED,
    managerProfile: over.profile ?? makeProfile(),
    fixtures: over.fixtures ?? [],
    fatigueHistory: over.fatigue !== undefined ? [over.fatigue] : [],
    inbox: Array.from({ length: unread }, (_, i) => ({ id: `i${i}`, isRead: false })),
  } as unknown as SaveGame
}

describe('updateManagerBurnout — decay-gaten (HIGH 10, bugg 1)', () => {
  it('drar burnout NEDÅT över tid när enda pressen är en oläst inkorg', () => {
    // Regressionstestet för buggen: `if (delta === 0) delta -= DECAY` gjorde
    // decayen strukturellt oåtkomlig så fort någon komponent var nollskild.
    // En enda oläst inkorgspost (+0.3) räckte för att låsa burnout permanent.
    let game = makeGame({
      profile: makeProfile({ burnoutScore: 60, burnoutHistory: [60] }),
      unreadInbox: 1,
    })
    const trajectory: number[] = []
    for (let i = 0; i < 4; i++) {
      const next = updateManagerBurnout(game)!
      trajectory.push(next.burnoutScore)
      game = { ...game, managerProfile: next }
    }
    // Strikt monotont fallande — inte "ligger kvar", inte "stiger".
    for (let i = 1; i < trajectory.length; i++) {
      expect(trajectory[i]).toBeLessThan(trajectory[i - 1])
    }
    expect(trajectory[trajectory.length - 1]).toBeLessThan(60)
  })

  it('eskalerar ändå för den hårt pressade — decayen tar inte bort tänderna', () => {
    const fixtures = [
      playedFixture(3, 0, 3),
      playedFixture(2, 1, 4),
      playedFixture(1, 0, 2),
    ]
    const game = makeGame({
      profile: makeProfile({ burnoutScore: 20, burnoutHistory: [20] }),
      fixtures,
      unreadInbox: 10,
      fatigue: 40,
    })
    const next = updateManagerBurnout(game)!
    expect(next.burnoutScore).toBeGreaterThan(20)
  })

  it('räknar bara FÄRDIGSPELADE matcher — ospelade 0–0-fixtures är inte oavgjorda', () => {
    // scheduleGenerator sätter homeScore/awayScore till 0 redan vid skapandet,
    // så det gamla `homeScore !== undefined`-filtret plockade de tre högsta
    // matchdagarna i hela programmet i stället för de tre senast spelade.
    const game = makeGame({
      profile: makeProfile({ burnoutScore: 0, burnoutHistory: [] }),
      fixtures: [playedFixture(1, 0, 3), scheduledFixture(20), scheduledFixture(21)],
    })
    // Förlusten på matchdag 1 ska synas trots att matchdag 20/21 sorterar högre.
    expect(deriveBurnoutCause(game)).toBe('losses')
  })

  it('behåller föregående orsak en lugn omgång i stället för att nolla den', () => {
    const withCause = makeProfile({ burnoutScore: 50, burnoutHistory: [50], lastBurnoutCause: 'losses' })
    const quiet = makeGame({ profile: withCause })   // ingen press alls
    const next = updateManagerBurnout(quiet)!
    expect(next.lastBurnoutCause).toBe('losses')
    expect(next.burnoutScore).toBe(50 - BURNOUT_NATURAL_DECAY)
  })
})

describe('deriveBurnoutCause', () => {
  it('returnerar undefined när ingen press finns', () => {
    expect(deriveBurnoutCause(makeGame())).toBeUndefined()
  })

  it('pekar ut förluster när de dominerar', () => {
    const game = makeGame({ fixtures: [playedFixture(1, 0, 2)], unreadInbox: 3, fatigue: 10 })
    expect(deriveBurnoutCause(game)).toBe('losses')
  })

  it('pekar ut inkorgen när den dominerar', () => {
    const game = makeGame({ unreadInbox: 20, fatigue: 10 })   // inbox 6 (tak) vs fatigue 3
    expect(deriveBurnoutCause(game)).toBe('inbox')
  })

  it('pekar ut fatigue när den dominerar', () => {
    const game = makeGame({ unreadInbox: 2, fatigue: 60 })     // inbox 0.6 vs fatigue 18
    expect(deriveBurnoutCause(game)).toBe('fatigue')
  })

  it('bryter lika till förluster före inkorg', () => {
    // 1 förlust = 10; 34 olästa = 10.2 → capas till 6. Bygg exakt lika i stället:
    // 1 förlust = 10, inkorgstak = 6, fatigue = 33.33 → 10. Lika mellan losses
    // och fatigue: losses vinner.
    const draw = makeGame({ fixtures: [playedFixture(1, 1, 1)], unreadInbox: 0, fatigue: 0 })
    expect(deriveBurnoutCause(draw)).toBeUndefined()   // oavgjort ger ingen press

    const tie = makeGame({
      fixtures: [playedFixture(1, 0, 2)],   // losses = 10
      unreadInbox: 20,                       // inbox  = 6 (tak)
      fatigue: 100 / 3,                      // fatigue = 10
    })
    expect(tie.fatigueHistory![0] * 0.3).toBeCloseTo(10, 6)
    expect(deriveBurnoutCause(tie)).toBe('losses')
  })

  it('bryter lika till inkorg före fatigue', () => {
    const tie = makeGame({
      unreadInbox: 20,   // inbox = 6 (tak)
      fatigue: 20,       // fatigue = 6
    })
    expect(deriveBurnoutCause(tie)).toBe('inbox')
  })
})

describe('bågens tre beats fyrar en gång per övergång (HIGH 10, bugg 2 + punkt 3/4)', () => {
  it('shouldShowBurnoutMark fyrar en gång, inte varje omgång i samma zon', () => {
    const sustained = makeProfile({ burnoutScore: 80, burnoutHistory: [75, 80] })
    expect(shouldShowBurnoutMark(sustained)).toBe(true)

    // Efter att beaten visats stämplas zonen — samma tillstånd får inte fyra igen.
    const shown = { ...sustained, lastShownBurnoutZone: 'hog' as const }
    expect(shouldShowBurnoutMark(shown)).toBe(false)

    // Ännu en omgång kvar över tröskeln: fortfarande tyst.
    const stillHigh = { ...shown, burnoutScore: 84, burnoutHistory: [80, 84] }
    expect(shouldShowBurnoutMark(stillHigh)).toBe(false)
  })

  it('kräver fortfarande ihållande hög — en enstaka topp räcker inte', () => {
    const spike = makeProfile({ burnoutScore: 75, burnoutHistory: [40, 75] })
    expect(shouldShowBurnoutMark(spike)).toBe(false)
  })

  it('shouldShowBurnoutRelief fyrar på hög→märkbar, sedan tystnar', () => {
    const improved = makeProfile({
      burnoutScore: 50, burnoutHistory: [80, 50], lastShownBurnoutZone: 'hog',
    })
    expect(shouldShowBurnoutRelief(improved)).toBe(true)

    const afterShown = { ...improved, lastShownBurnoutZone: 'markbar' as const }
    expect(shouldShowBurnoutRelief(afterShown)).toBe(false)

    // Ytterligare en omgång i samma zon: fortfarande tyst.
    expect(shouldShowBurnoutRelief({ ...afterShown, burnoutScore: 45 })).toBe(false)
  })

  it('shouldShowBurnoutRelief kräver en tidigare VISAD zon', () => {
    const neverShown = makeProfile({ burnoutScore: 50, burnoutHistory: [80, 50] })
    expect(shouldShowBurnoutRelief(neverShown)).toBe(false)
  })

  it('shouldShowBurnoutRelief fyrar inte när bågen slutit helt', () => {
    const closed = makeProfile({
      burnoutScore: 20, burnoutHistory: [80, 20], lastShownBurnoutZone: 'hog',
    })
    expect(shouldShowBurnoutRelief(closed)).toBe(false)
    expect(shouldShowBurnoutClose(closed)).toBe(true)
  })

  it('shouldShowBurnoutClose fyrar en gång, sedan tystnar', () => {
    const closing = makeProfile({
      burnoutScore: 10, burnoutHistory: [45, 10], lastShownBurnoutZone: 'markbar',
    })
    expect(shouldShowBurnoutClose(closing)).toBe(true)

    const afterShown = { ...closing, lastShownBurnoutZone: 'frisk' as const }
    expect(shouldShowBurnoutClose(afterShown)).toBe(false)
    expect(shouldShowBurnoutClose({ ...afterShown, burnoutScore: 5 })).toBe(false)
  })

  it('shouldShowBurnoutClose fyrar inte för en manager som aldrig varit förhöjd', () => {
    expect(shouldShowBurnoutClose(makeProfile({ burnoutScore: 5 }))).toBe(false)
    expect(shouldShowBurnoutClose(makeProfile({
      burnoutScore: 5, lastShownBurnoutZone: 'frisk',
    }))).toBe(false)
  })

  it('de tre villkoren är ömsesidigt uteslutande i varje enskilt tillstånd', () => {
    const states: ManagerProfile[] = [
      makeProfile({ burnoutScore: 80, burnoutHistory: [80, 80] }),
      makeProfile({ burnoutScore: 80, burnoutHistory: [80, 80], lastShownBurnoutZone: 'markbar' }),
      makeProfile({ burnoutScore: 50, burnoutHistory: [80, 50], lastShownBurnoutZone: 'hog' }),
      makeProfile({ burnoutScore: 10, burnoutHistory: [80, 10], lastShownBurnoutZone: 'hog' }),
      makeProfile({ burnoutScore: 10, burnoutHistory: [10, 10], lastShownBurnoutZone: 'frisk' }),
    ]
    for (const p of states) {
      const fired = [shouldShowBurnoutClose(p), shouldShowBurnoutRelief(p), shouldShowBurnoutMark(p)]
        .filter(Boolean).length
      expect(fired).toBeLessThanOrEqual(1)
    }
  })

  it('gamla saves utan lastShownBurnoutZone undertrycker ingenting', () => {
    const legacy = makeProfile({ burnoutScore: 90, burnoutHistory: [90, 90] })
    expect(legacy.lastShownBurnoutZone).toBeUndefined()
    expect(shouldShowBurnoutMark(legacy)).toBe(true)
  })
})

describe('getBurnoutZone', () => {
  it('delar 0–100 i frisk/märkbar/hög', () => {
    expect(getBurnoutZone(0)).toBe('frisk')
    expect(getBurnoutZone(39)).toBe('frisk')
    expect(getBurnoutZone(40)).toBe('markbar')
    expect(getBurnoutZone(69)).toBe('markbar')
    expect(getBurnoutZone(70)).toBe('hog')
    expect(getBurnoutZone(100)).toBe('hog')
  })
})
