import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { advanceToNextEvent } from '../../../application/useCases/advanceToNextEvent'
import { generateSeasonSummary, getClubPositionTrend } from '../seasonSummaryService'
import { FixtureStatus, PlayoffRound, PlayoffStatus } from '../../enums'
import type { SeasonSummary } from '../../entities/SeasonSummary'

function makeFullSeasonGame() {
  let game = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  for (let round = 1; round <= 22; round++) {
    // Set a lineup so managed club can advance
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining === 0)
    const sorted = [...managedPlayers].sort((a, b) => b.currentAbility - a.currentAbility)
    const starters = sorted.slice(0, 11)
    const bench = sorted.slice(11, 16)
    if (starters.length === 11) {
      game = {
        ...game,
        managedClubPendingLineup: {
          startingPlayerIds: starters.map(p => p.id),
          benchPlayerIds: bench.map(p => p.id),
          captainPlayerId: starters[0]?.id,
          tactic: game.clubs.find(c => c.id === game.managedClubId)!.activeTactic,
        },
      }
    }
    const result = advanceToNextEvent(game, round)
    game = result.game
  }
  return game
}

describe('generateSeasonSummary', () => {
  it('returns correct clubId and clubName', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.clubId).toBe('club_forsbacka')
    expect(summary.clubName).toBeTruthy()
    expect(summary.season).toBe(2025)
  }, 60000)

  it('has non-zero points and position 1-12', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.finalPosition).toBeGreaterThanOrEqual(1)
    expect(summary.finalPosition).toBeLessThanOrEqual(12)
    expect(summary.points).toBeGreaterThan(0)
  }, 60000)

  it('homeRecord + awayRecord wins sum to total wins', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.homeRecord.wins + summary.awayRecord.wins).toBe(summary.wins)
  }, 60000)

  it('formTrend is one of the valid values', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(['improving', 'stable', 'declining']).toContain(summary.formTrend)
  }, 60000)

  it('improving trend when second half > first half × 1.15', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    if (summary.secondHalfPoints > summary.firstHalfPoints * 1.15) {
      expect(summary.formTrend).toBe('improving')
    }
  }, 60000)

  it('narrativeSummary contains club name', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.narrativeSummary).toContain(summary.clubName)
  }, 60000)

  it('narrativeSummary is non-empty', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.narrativeSummary.length).toBeGreaterThan(20)
  }, 60000)

  it('longestWinStreak is non-negative integer', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.longestWinStreak).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(summary.longestWinStreak)).toBe(true)
  }, 60000)

  it('firstHalfPoints + secondHalfPoints equals total points', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.firstHalfPoints + summary.secondHalfPoints).toBe(summary.points)
  }, 60000)

  it('topScorer has goals >= 0', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    if (summary.topScorer) {
      expect(summary.topScorer.goals).toBeGreaterThan(0)
    }
  }, 60000)

  it('roundPoints array has 22 entries', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.roundPoints).toHaveLength(22)
  }, 60000)

  it('roundPoints is monotonically non-decreasing', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    for (let i = 1; i < summary.roundPoints.length; i++) {
      expect(summary.roundPoints[i]).toBeGreaterThanOrEqual(summary.roundPoints[i-1])
    }
  }, 60000)
})

// 2026-08-17 (Stickiness-audit): eliminatedByClubId/decidingFixtureId/decidingRound
// måste fångas HÄR, vid genereringstillfället, medan game.playoffBracket fortfarande
// är den här säsongens — SeasonSummaryScreen.tsx läste tidigare game.playoffBracket
// vid RENDER, vilket blir opålitligt efter rollover (nollställs, eller pekar på en
// senare säsongs bracket). Se SeasonSummary.ts's kommentar för hela rotorsaken.
describe('generateSeasonSummary — playoff-eliminering fångas vid genereringstillfället', () => {
  it('sätter eliminatedByClubId/decidingFixtureId/decidingRound från en kvartsfinal-förlust', () => {
    let game = makeFullSeasonGame()
    const opponentId = game.clubs.find(c => c.id !== game.managedClubId)!.id
    const decisiveFixtureId = 'test_qf_decisive'

    game = {
      ...game,
      fixtures: [
        ...game.fixtures,
        {
          id: 'test_qf_g1',
          season: game.currentSeason,
          matchday: 30,
          roundNumber: 28,
          homeClubId: game.managedClubId,
          awayClubId: opponentId,
          homeScore: 2,
          awayScore: 4,
          status: FixtureStatus.Completed,
          isCup: false,
        } as never,
        {
          id: decisiveFixtureId,
          season: game.currentSeason,
          matchday: 32,
          roundNumber: 29,
          homeClubId: opponentId,
          awayClubId: game.managedClubId,
          homeScore: 5,
          awayScore: 3,
          status: FixtureStatus.Completed,
          isCup: false,
        } as never,
      ],
      playoffBracket: {
        season: game.currentSeason,
        status: PlayoffStatus.Completed,
        quarterFinals: [{
          id: 'qf_test',
          round: PlayoffRound.QuarterFinal,
          homeClubId: game.managedClubId,
          awayClubId: opponentId,
          fixtures: ['test_qf_g1', decisiveFixtureId],
          homeWins: 0,
          awayWins: 2,
          winnerId: opponentId,
          loserId: game.managedClubId,
        }],
        semiFinals: [],
        final: null,
        champion: null,
      },
    }

    const summary = generateSeasonSummary(game)

    expect(summary.eliminatedByClubId).toBe(opponentId)
    expect(summary.decidingFixtureId).toBe(decisiveFixtureId)
    expect(summary.decidingRound).toBe(29)
  }, 60000)
})

// PÅSTÅENDEKARTAN omsvep (2026-08-24), VAR-fel-entitet: computeKeyMoments
// slog upp hattrick-/sen-avgörande-scorers namn i managedPlayers (klubb-
// filtrerad VID SÄSONGSSLUT) — en spelare som gjorde bedriften men SÅLDES
// senare under säsongen hittades inte där och blev "Okänd", trots att
// matchhändelsen redan korrekt identifierat vem som gjorde vad.
describe('generateSeasonSummary — keyMoments namnger en spelare som sålts efter bedriften', () => {
  it('hattrick-headline visar spelarens riktiga namn, inte "Okänd", trots att spelaren nu tillhör en annan klubb', () => {
    let game = makeFullSeasonGame()
    const scorer = game.players.find(p => p.clubId === game.managedClubId)!
    const opponentId = game.clubs.find(c => c.id !== game.managedClubId)!.id
    const hatTrickFixtureId = 'test_hattrick_fx'

    game = {
      ...game,
      fixtures: [
        ...game.fixtures,
        {
          // computeKeyMoments håller EN moment per fixture (högst score
          // vinner) och toppar sen hela säsongen till fem. Marginal HÅLLS
          // under bigWin-tröskeln (3) med flit — annars konkurrerar
          // fixturens EGEN bigWin-kandidat (score = margin×10) bort
          // hatTrick-kandidaten (score = 30+(goals-3)×10) i dedupen innan
          // testet ens når fråga om namnet är rätt. Målantalet (10, inte
          // en realistisk bandysiffra) är satt högt av samma skäl som
          // marginalen tidigare — garanterat topp-5 oavsett vad resten av
          // den simulerade säsongens seed råkar innehålla.
          id: hatTrickFixtureId,
          season: game.currentSeason,
          matchday: 5,
          roundNumber: 5,
          homeClubId: game.managedClubId,
          awayClubId: opponentId,
          homeScore: 10,
          awayScore: 8,
          status: FixtureStatus.Completed,
          isCup: false,
          events: Array.from({ length: 10 }, (_, i) => (
            { type: 'goal', playerId: scorer.id, minute: i + 1, clubId: game.managedClubId }
          )),
        } as never,
      ],
      // Spelaren "sålt" efter bedriften — clubId pekar nu på motståndarklubben.
      players: game.players.map(p => p.id === scorer.id ? { ...p, clubId: opponentId } : p),
    }

    const summary = generateSeasonSummary(game)
    const hatTrickMoment = (summary.keyMoments ?? []).find(m => m.type === 'hatTrick' && m.fixtureId === hatTrickFixtureId)

    expect(hatTrickMoment, JSON.stringify(summary.keyMoments)).toBeDefined()
    expect(hatTrickMoment!.headline).toContain(scorer.firstName)
  })
})

// ── Påståendesvepet #5 (MASTER.md, 2026-08-24) ────────────────────────────
// En resolvad arc-berättelse (t.ex. contract_drama_resolved — en BITTER
// avresa) fick tidigare type:'bigWin' som placeholder. SeasonSummaryScreen.tsx
// läser type för att välja IKON, inte bara displayText — en avskedstext
// visades alltså med en ✅-ikon. Fixen: type:'storyline' (neutral 📖).
describe('generateSeasonSummary — resolvade arc-berättelser får INTE type:bigWin', () => {
  it('en resolvad contract_drama_resolved-storyline mappas till type:storyline, inte bigWin', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const gameWithStoryline = {
      ...game,
      storylines: [{
        id: 'story_1',
        type: 'contract_drama_resolved',
        season: game.currentSeason,
        matchday: 10,
        playerId: player.id,
        description: `${player.firstName} lämnade klubben efter kontraktsstriden. En bitter upplösning.`,
        displayText: `${player.firstName} — kontraktsstriden slutade i avsked`,
        resolved: true,
      }],
    }
    const summary = generateSeasonSummary(gameWithStoryline as never)
    const arcMoment = (summary.keyMoments ?? []).find(m => m.relatedPlayerId === player.id)
    expect(arcMoment, JSON.stringify(summary.keyMoments)).toBeDefined()
    expect(arcMoment!.type).toBe('storyline')
    expect(arcMoment!.type).not.toBe('bigWin')
  })
})

/**
 * topScorer/topAssister/topRated/youngPlayer-refaktorn (2026-08-25, Jacobs
 * order). Samma "sålt efter bedriften"-uppställning som keyMoments-testet
 * ovan, men riktad mot award-familjen: bevisar att en spelare som gjorde
 * flest mål FÖR oss men SÅLDES innan säsongsslut fortfarande krediteras
 * — inte tappad ur summary.topScorer bara för att player.clubId nu pekar
 * på en annan klubb, och inte kontaminerad av mål gjorda för den nya
 * klubben efter försäljningen (samma clubFixtures-mängd som redan filtrerar
 * på matchens EGNA homeClubId/awayClubId, oberoende av spelarens NUVARANDE
 * clubId).
 */
describe('generateSeasonSummary — topScorer/topAssister/topRated krediterar en spelare som sålts under säsongen', () => {
  it('topScorer namnger den sålda spelaren och räknar in de injicerade målen, trots att clubId nu pekar på en annan klubb', () => {
    let game = makeFullSeasonGame()
    const scorer = game.players.find(p => p.clubId === game.managedClubId)!
    const opponentId = game.clubs.find(c => c.id !== game.managedClubId)!.id
    const bigFixtureId = 'test_topscorer_fx'

    game = {
      ...game,
      fixtures: [
        ...game.fixtures,
        {
          id: bigFixtureId,
          season: game.currentSeason,
          matchday: 5,
          roundNumber: 5,
          homeClubId: game.managedClubId,
          awayClubId: opponentId,
          homeScore: 50,
          awayScore: 0,
          status: FixtureStatus.Completed,
          isCup: false,
          // Orealistiskt måltal (50), medvetet — garanterar att spelaren
          // slår varje verklig spelares seasonStats-ackumulering oavsett
          // vad den simulerade 22-omgångarssäsongens seed råkar innehålla.
          events: Array.from({ length: 50 }, (_, i) => (
            { type: 'goal', playerId: scorer.id, minute: 1, clubId: game.managedClubId }
          )),
        } as never,
      ],
      // Spelaren "sålt" efter bedriften.
      players: game.players.map(p => p.id === scorer.id ? { ...p, clubId: opponentId } : p),
    }

    const summary = generateSeasonSummary(game)

    expect(summary.topScorer, JSON.stringify(summary.topScorer)).not.toBeNull()
    expect(summary.topScorer!.playerId).toBe(scorer.id)
    expect(summary.topScorer!.name).toContain(scorer.firstName)
    expect(summary.topScorer!.name).not.toBe('Okänd')
    expect(summary.topScorer!.goals).toBeGreaterThanOrEqual(50)
  }, 60000)
})

function summaryAt(season: number, positions: Record<string, number>): SeasonSummary {
  return {
    season,
    standingsSnapshot: Object.entries(positions).map(([clubId, position]) => ({ clubId, position, points: 0 })),
  } as unknown as SeasonSummary
}

describe('getClubPositionTrend (2026-08-25, Jacobs order "AI-klubbarnas förändring: positionstrend, det är billigt och sant")', () => {
  it('rising — placeringssiffran har minskat (bättre plats) mellan äldsta och senaste säsongen', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const withHistory = {
      ...game,
      seasonSummaries: [
        summaryAt(2025, { club_rogle: 10 }),
        summaryAt(2026, { club_rogle: 6 }),
      ],
    }
    expect(getClubPositionTrend(withHistory, 'club_rogle')).toEqual({
      clubId: 'club_rogle', positions: [10, 6], direction: 'rising',
    })
  })

  it('falling — placeringssiffran har ökat (sämre plats)', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const withHistory = {
      ...game,
      seasonSummaries: [
        summaryAt(2025, { club_rogle: 3 }),
        summaryAt(2026, { club_rogle: 9 }),
      ],
    }
    expect(getClubPositionTrend(withHistory, 'club_rogle')?.direction).toBe('falling')
  })

  it('stable — oförändrad placering', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const withHistory = {
      ...game,
      seasonSummaries: [
        summaryAt(2025, { club_rogle: 5 }),
        summaryAt(2026, { club_rogle: 5 }),
      ],
    }
    expect(getClubPositionTrend(withHistory, 'club_rogle')?.direction).toBe('stable')
  })

  it('null — färre än två säsonger med data för klubben (ingen trend går att uttala sig om)', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const withHistory = { ...game, seasonSummaries: [summaryAt(2025, { club_rogle: 5 })] }
    expect(getClubPositionTrend(withHistory, 'club_rogle')).toBeNull()

    const noHistory = { ...game, seasonSummaries: [] }
    expect(getClubPositionTrend(noHistory, 'club_rogle')).toBeNull()
  })

  it('läser bara de senaste lastNSeasons säsongerna, sorterat på season-fältet (inte arrayordning)', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const withHistory = {
      ...game,
      seasonSummaries: [
        summaryAt(2026, { club_rogle: 8 }),
        summaryAt(2024, { club_rogle: 1 }),
        summaryAt(2025, { club_rogle: 4 }),
      ],
    }
    expect(getClubPositionTrend(withHistory, 'club_rogle', 2)).toEqual({
      clubId: 'club_rogle', positions: [4, 8], direction: 'falling',
    })
  })

  it('fungerar för en AI-klubb, inte bara hanterad klubb — det är hela poängen med bygget', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    expect(game.managedClubId).not.toBe('club_heros')
    const withHistory = {
      ...game,
      seasonSummaries: [
        summaryAt(2025, { club_heros: 12, [game.managedClubId]: 3 }),
        summaryAt(2026, { club_heros: 11, [game.managedClubId]: 1 }),
      ],
    }
    expect(getClubPositionTrend(withHistory, 'club_heros')?.direction).toBe('rising')
  })
})
