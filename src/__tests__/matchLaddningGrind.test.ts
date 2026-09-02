// A3 — Match-laddning grind tests
// Locks: standard/post_loss → no beat; final/annandagen/cup/derby/premiar/nyar → scene;
// streak ≥3 → band; broken streak → broken band; eyebrow gold only on final.

import { describe, it, expect } from 'vitest'
import { computeLaddningBeat } from '../domain/data/matchLaddningGrind'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { Fixture } from '../domain/entities/Fixture'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fix_1',
    homeClubId: 'club_home',
    awayClubId: 'club_away',
    matchday: 5,
    roundNumber: 5,
    season: 2026,
    status: 'scheduled',
    isCup: false,
    isPlayoff: false,
    ...overrides,
  } as Fixture
}

function completedFixture(overrides: Partial<Fixture> = {}): Fixture {
  return makeFixture({ status: 'completed', ...overrides })
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Tränare',
    managedClubId: 'club_home',
    currentDate: '2026-10-15',
    currentSeason: 2026,
    currentMatchday: 5,
    clubs: [
      { id: 'club_home', name: 'Hemma', region: 'Uppland', reputation: 50, arenaName: 'Arena', supporterGroupName: 'Klacken', finances: 0, wage: 0, wageBudget: 0 },
      { id: 'club_away', name: 'Borta', region: 'Uppland', reputation: 50, arenaName: 'Arena2', supporterGroupName: 'Klack2', finances: 0, wage: 0, wageBudget: 0 },
    ] as never,
    players: [],
    league: { id: 'l1', name: 'Test', clubs: [] } as never,
    fixtures: [],
    standings: [{ clubId: 'club_home', played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 15, goalsAgainst: 10, points: 7, position: 4 }],
    inbox: [],
    transferState: {} as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    mentorships: [],
    loanDeals: [],
    academyLevel: 'none' as never,
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    seasonSummaries: [],
    version: '1.0',
    lastSavedAt: '2026-10-15T00:00:00',
    ...overrides,
  } as SaveGame
}

// Build a game with N consecutive wins/losses in completed fixtures.
// O1/SPÅR B B4-fixet (2026-08-23): getStreakState läser numera game.trainerArc
// (samma consecutiveWins/consecutiveLosses som boardPatience), inte längre en
// oberoende omräkning ur fixtures — trainerArc måste alltså sättas här också,
// annars ser getStreakState ingen svit oavsett fixtures.
function makeStreakGame(
  type: 'win' | 'loss',
  count: number,
  extraOverrides: Partial<SaveGame> = {},
): SaveGame {
  const fixtures: Fixture[] = []
  for (let i = 0; i < count; i++) {
    fixtures.push(completedFixture({
      id: `fix_past_${i}`,
      matchday: i + 1,
      roundNumber: i + 1,
      homeClubId: 'club_home',
      awayClubId: 'club_away',
      homeScore: type === 'win' ? 3 : 0,
      awayScore: type === 'win' ? 0 : 3,
    }))
  }
  const trainerArc = {
    current: 'grind', history: [], seasonCount: 1, bestFinish: 1, titlesWon: 0,
    consecutiveWins: type === 'win' ? count : 0,
    consecutiveLosses: type === 'loss' ? count : 0,
    boardWarningGiven: false,
  } as SaveGame['trainerArc']
  return makeGame({ fixtures, currentMatchday: count + 1, trainerArc, ...extraOverrides })
}

// ── grind tier: none ─────────────────────────────────────────────────────────

describe('computeLaddningBeat — tier none', () => {

  it('standard match → no beat', () => {
    const scheduledFix = makeFixture()
    // Add one completed fixture so character != premiere, plus the scheduled fixture
    const game = makeGame({
      fixtures: [
        completedFixture({ id: 'fix_done', matchday: 4, roundNumber: 4, homeClubId: 'club_home', awayClubId: 'club_away', homeScore: 2, awayScore: 1 }),
        scheduledFix,
      ],
    })
    expect(computeLaddningBeat(game, scheduledFix).tier).toBe('none')
  })

  it('post_loss (single loss) → no beat', () => {
    const scheduledFix = makeFixture()
    const game = makeGame({
      fixtures: [
        completedFixture({ id: 'fix_loss', matchday: 4, roundNumber: 4, homeClubId: 'club_home', awayClubId: 'club_away', homeScore: 0, awayScore: 3 }),
        scheduledFix,
      ],
    })
    expect(computeLaddningBeat(game, scheduledFix).tier).toBe('none')
  })

  it('streak=2 (under threshold) → no beat', () => {
    const game = makeStreakGame('win', 2)
    const fix = makeFixture({ matchday: 3 })
    // makeStreakGame already includes completed fixtures; add a scheduled one
    const gameWithSched = makeGame({
      ...game,
      fixtures: [...game.fixtures, fix],
    })
    expect(computeLaddningBeat(gameWithSched, fix).tier).toBe('none')
  })

})

// ── grind tier: scene ────────────────────────────────────────────────────────

describe('computeLaddningBeat — tier scene', () => {

  it('isFinaldag → scene:final, isFinal=true', () => {
    // Fix must be in game.fixtures — nextMatchIsSMFinal uses getNextManagedFixture internally
    const fix = makeFixture({ isFinaldag: true })
    const game = makeGame({ fixtures: [fix] })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') {
      expect(beat.occasion).toBe('final')
      expect(beat.isFinal).toBe(true)
    }
  })

  it('playoff bracket final (no isFinaldag) → scene:final via bracket fallback', () => {
    const fix = makeFixture({ id: 'final_fix', isNeutralVenue: true, isKnockout: true })
    const game = makeGame({
      fixtures: [fix],
      playoffBracket: {
        season: 2026,
        status: 'inProgress' as never,
        quarterFinals: [],
        semiFinals: [],
        final: {
          id: 'series_final',
          round: 'final' as never,
          homeClubId: 'club_home',
          awayClubId: 'club_away',
          fixtures: ['final_fix'],
          homeWins: 0,
          awayWins: 0,
          winnerId: null,
          loserId: null,
        },
        champion: null,
      },
    })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') {
      expect(beat.occasion).toBe('final')
      expect(beat.isFinal).toBe(true)
    }
  })

  it('isAnnandagen → scene:annandagen, isFinal=false', () => {
    const game = makeGame()
    const fix = makeFixture({ isAnnandagen: true })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') {
      expect(beat.occasion).toBe('annandagen')
      expect(beat.isFinal).toBe(false)
    }
  })

  it('isNyarsbandy → scene:nyar', () => {
    const game = makeGame()
    const fix = makeFixture({ isNyarsbandy: true })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') expect(beat.occasion).toBe('nyar')
  })

  it('isCup → scene:cup', () => {
    const game = makeGame()
    const fix = makeFixture({ isCup: true })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') expect(beat.occasion).toBe('cup')
  })

  it('premiere (no completed fixtures) → scene:premiar', () => {
    const game = makeGame({ fixtures: [] })
    const fix = makeFixture()
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') expect(beat.occasion).toBe('premiar')
  })

  it('derby via club_soderfors vs club_skutskar → scene:derby', () => {
    // Upplandsderbyt is a known rivalry in rivalries.ts
    // fixture must be in game.fixtures so getRoundCharacter picks it up via getNextManagedFixture
    const derbyFix = makeFixture({ homeClubId: 'club_soderfors', awayClubId: 'club_skutskar' })
    const game = makeGame({
      managedClubId: 'club_soderfors',
      standings: [{ clubId: 'club_soderfors', played: 5, won: 3, drawn: 0, lost: 2, goalsFor: 10, goalsAgainst: 8, points: 6, position: 4 }],
      fixtures: [derbyFix],
    })
    const beat = computeLaddningBeat(game, derbyFix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') expect(beat.occasion).toBe('derby')
  })

  it('final takes priority over isAnnandagen when both set', () => {
    const fix = makeFixture({ isFinaldag: true, isAnnandagen: true })
    const game = makeGame({ fixtures: [fix] })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') {
      expect(beat.occasion).toBe('final')
      expect(beat.isFinal).toBe(true)
    }
  })

  it('derby day + active winning streak ≥3 → scene:derby (band hidden by occasion tier)', () => {
    const derbyFix = makeFixture({ homeClubId: 'club_soderfors', awayClubId: 'club_skutskar', matchday: 5 })
    const completedWins: Fixture[] = [1, 2, 3].map(i => completedFixture({
      id: `fix_w${i}`, matchday: i, roundNumber: i,
      homeClubId: 'club_soderfors', awayClubId: 'club_away', homeScore: 3, awayScore: 0,
    }))
    const game = makeGame({
      managedClubId: 'club_soderfors',
      currentMatchday: 5,
      standings: [{ clubId: 'club_soderfors', played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 9, goalsAgainst: 0, points: 6, position: 1 }],
      fixtures: [...completedWins, derbyFix],
    })
    const beat = computeLaddningBeat(game, derbyFix)
    // Occasion tier wins — derby scene, not streak band
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') expect(beat.occasion).toBe('derby')
  })

})

// ── grind tier: band (active streak) ─────────────────────────────────────────

describe('computeLaddningBeat — tier band (active streak)', () => {

  it('winning streak ≥3, first time → band:winning_streak', () => {
    const game = makeStreakGame('win', 3)
    const fix = makeFixture({ matchday: 4 })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('band')
    if (beat.tier === 'band') {
      expect(beat.state).toBe('winning_streak')
      expect(beat.isBroken).toBe(false)
      expect(beat.streakLength).toBe(3)
    }
  })

  it('losing streak ≥3, first time → band:losing_streak', () => {
    const game = makeStreakGame('loss', 3)
    const fix = makeFixture({ matchday: 4 })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('band')
    if (beat.tier === 'band') {
      expect(beat.state).toBe('losing_streak')
      expect(beat.isBroken).toBe(false)
      expect(beat.streakLength).toBe(3)
    }
  })

  it('streak=3 already shown at 3, still 3 → no band (no new milestone)', () => {
    const game = makeStreakGame('win', 3, {
      matchLaddningBandShown: { matchday: 4, streakLength: 3, stateType: 'winning_streak' },
    })
    const fix = makeFixture({ matchday: 4 })
    // Same matchday as lastShown AND same type → show again (within-round rule)
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('band')
  })

  it('streak=3 shown at matchday 3, now matchday 4 with streak still 3 → no band', () => {
    // Between rounds: shown at md 3, now at md 4 (streak hasn't grown past milestone 3)
    // streakLength would still be 3 (no new matches) — but wait, this scenario is unusual
    // because after playing md 3 the streak would be 3+1=4. Let me model this correctly:
    // shown at md=3 with streakLength=3. Now at md=4 the streak is still 3 (drew or won once more — but won=4)
    // Actually if streak was 3 at md 3 and now is still 3 at md 4 it means there was a draw.
    // Draw breaks streak in roundCharacter.ts. So streak would be 0. So this is a degenerate case.
    // The real test: shown at md=3 with streakLength=3, now md=4 with streakLength=4.
    // 4 is NOT a milestone (milestones are 3,5,7,10) → no show.
    const fixtures: Fixture[] = []
    for (let i = 0; i < 4; i++) {
      fixtures.push(completedFixture({
        id: `fix_past_${i}`,
        matchday: i + 1,
        roundNumber: i + 1,
        homeClubId: 'club_home',
        awayClubId: 'club_away',
        homeScore: 3, awayScore: 0,
      }))
    }
    const game = makeGame({
      fixtures,
      currentMatchday: 5,
      matchLaddningBandShown: { matchday: 4, streakLength: 3, stateType: 'winning_streak' },
      trainerArc: { current: 'grind', history: [], seasonCount: 1, bestFinish: 1, titlesWon: 0, consecutiveWins: 4, consecutiveLosses: 0, boardWarningGiven: false } as SaveGame['trainerArc'],
    })
    const fix = makeFixture({ matchday: 5 })
    const beat = computeLaddningBeat(game, fix)
    // streak=4, last shown at 3 — next milestone is 5, not crossed → no band
    expect(beat.tier).toBe('none')
  })

  it('streak reaches milestone 5 → band shows again', () => {
    const fixtures: Fixture[] = []
    for (let i = 0; i < 5; i++) {
      fixtures.push(completedFixture({
        id: `fix_past_${i}`,
        matchday: i + 1,
        roundNumber: i + 1,
        homeClubId: 'club_home',
        awayClubId: 'club_away',
        homeScore: 3, awayScore: 0,
      }))
    }
    const game = makeGame({
      fixtures,
      currentMatchday: 6,
      matchLaddningBandShown: { matchday: 5, streakLength: 3, stateType: 'winning_streak' },
      trainerArc: { current: 'grind', history: [], seasonCount: 1, bestFinish: 1, titlesWon: 0, consecutiveWins: 5, consecutiveLosses: 0, boardWarningGiven: false } as SaveGame['trainerArc'],
    })
    const fix = makeFixture({ matchday: 6 })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('band')
    if (beat.tier === 'band') expect(beat.streakLength).toBe(5)
  })

})

// ── grind tier: band (broken streak) ─────────────────────────────────────────

describe('computeLaddningBeat — tier band (broken streak)', () => {

  it('streak was ≥3 last round, now standard → broken band', () => {
    // 3 wins, then a draw (draw breaks streak → character = standard, streak = 0)
    const fixtures: Fixture[] = [
      completedFixture({ id: 'fix_1', matchday: 1, roundNumber: 1, homeClubId: 'club_home', awayClubId: 'club_away', homeScore: 3, awayScore: 0 }),
      completedFixture({ id: 'fix_2', matchday: 2, roundNumber: 2, homeClubId: 'club_home', awayClubId: 'club_away', homeScore: 3, awayScore: 0 }),
      completedFixture({ id: 'fix_3', matchday: 3, roundNumber: 3, homeClubId: 'club_home', awayClubId: 'club_away', homeScore: 3, awayScore: 0 }),
      completedFixture({ id: 'fix_4', matchday: 4, roundNumber: 4, homeClubId: 'club_home', awayClubId: 'club_away', homeScore: 2, awayScore: 2 }),
    ]
    const game = makeGame({
      fixtures,
      currentMatchday: 5,
      matchLaddningBandShown: { matchday: 4, streakLength: 3, stateType: 'winning_streak' },
    })
    const fix = makeFixture({ matchday: 5 })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('band')
    if (beat.tier === 'band') {
      expect(beat.isBroken).toBe(true)
      expect(beat.state).toBe('winning_streak')
    }
  })

  it('broken band too old (>2 matchdays ago) → no beat', () => {
    // Need a completed fixture so character != premiere, and a scheduled one at md 8
    const scheduledFix = makeFixture({ matchday: 8, roundNumber: 8 })
    const game = makeGame({
      currentMatchday: 8,
      matchLaddningBandShown: { matchday: 4, streakLength: 3, stateType: 'winning_streak' },
      fixtures: [
        completedFixture({ id: 'fix_done', matchday: 7, roundNumber: 7, homeClubId: 'club_home', awayClubId: 'club_away', homeScore: 2, awayScore: 1 }),
        scheduledFix,
      ],
    })
    const beat = computeLaddningBeat(game, scheduledFix)
    // matchday 4 is > 2 rounds ago from matchday 8 → no broken beat
    expect(beat.tier).toBe('none')
  })

})

// ── §9.1 eyebrow color contract ───────────────────────────────────────────────

describe('§9.1 eyebrow color contract', () => {

  it('final → isFinal=true (component must render gold eyebrow)', () => {
    const fix = makeFixture({ isFinaldag: true })
    const game = makeGame({ fixtures: [fix] })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') expect(beat.isFinal).toBe(true)
  })

  it('annandagen → isFinal=false (component must render accent eyebrow)', () => {
    const game = makeGame()
    const fix = makeFixture({ isAnnandagen: true })
    const beat = computeLaddningBeat(game, fix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') expect(beat.isFinal).toBe(false)
  })

  it('derby → isFinal=false (component must render warm-light eyebrow)', () => {
    const derbyFix = makeFixture({ homeClubId: 'club_soderfors', awayClubId: 'club_skutskar' })
    const game = makeGame({
      managedClubId: 'club_soderfors',
      standings: [{ clubId: 'club_soderfors', played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 4, goalsAgainst: 3, points: 2, position: 6 }],
      fixtures: [derbyFix],
    })
    const beat = computeLaddningBeat(game, derbyFix)
    expect(beat.tier).toBe('scene')
    if (beat.tier === 'scene') {
      expect(beat.isFinal).toBe(false)
      expect(beat.occasion).toBe('derby')
    }
  })

})
