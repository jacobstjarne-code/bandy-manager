import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { advanceToNextEvent } from '../../../application/useCases/advanceToNextEvent'
import { deriveBoardLeagueContext, generateSeasonSummary, getClubPositionTrend, getBoardRelationshipTrend } from '../seasonSummaryService'
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
  it('fryser faktisk snitt-CA för en AI-klubb i befintlig standingsSnapshot', () => {
    const game = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const aiClub = game.clubs.find(club => club.id !== game.managedClubId)!
    const aiPlayerIds = new Set(game.players.filter(player => player.clubId === aiClub.id).map(player => player.id))
    const firstAiPlayerId = [...aiPlayerIds][0]
    const players = game.players.map(player => aiPlayerIds.has(player.id)
      ? { ...player, currentAbility: player.id === firstAiPlayerId ? 40 : 60 }
      : player)
    const expectedAverage = Math.round(
      players
        .filter(player => player.clubId === aiClub.id)
        .reduce((sum, player) => sum + player.currentAbility, 0)
      / aiPlayerIds.size * 10,
    ) / 10

    const summary = generateSeasonSummary({ ...game, players })
    const snapshot = summary.standingsSnapshot?.find(row => row.clubId === aiClub.id)

    expect(snapshot?.squadStrength).toBe(expectedAverage)
  })

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

  // SEXSÄSONGSAUDITEN 2026-08-26 ("toppskyttar med många mål visades som
  // '0 ass'"): en full simulerad säsong producerar riktiga Assist-events i
  // matchCore.ts (trackAssist/MatchEventType.Assist) för de allra flesta
  // mål — countSeasonAssistsByPlayer (seasonSummaryService.ts) ska faktiskt
  // hitta dem. Testet är medvetet löst (>0 räcker) eftersom exakt antal
  // beror på seedad matchsimulering, men en regression till "alltid 0"
  // (stub/fel fält/fel filter) ska fångas här.
  it('topScorer/topAssister har verkliga assists — inte alltid 0 (regression: countSeasonAssistsByPlayer)', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    const totalAssistEvents = game.fixtures
      .filter(f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
      .flatMap(f => f.events ?? [])
      .filter(e => e.type === 'assist' && e.clubId === game.managedClubId)
      .length
    // En hel säsong ska generera minst några assister för den managerade klubben.
    expect(totalAssistEvents).toBeGreaterThan(0)
    if (summary.topScorer) {
      expect(summary.topScorer.assists).toBeGreaterThanOrEqual(0)
    }
    if (summary.topAssister) {
      expect(summary.topAssister.assists).toBeGreaterThan(0)
    } else {
      // Om ingen topAssister valdes trots assist-events i state, är
      // summeringen trasig — precis det audit-fyndet varnade för.
      expect(totalAssistEvents).toBe(0)
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

describe('deriveBoardLeagueContext — Förutsättningsfasen steg 2', () => {
  it('väljer högst tre sanna rader och tar med både transferlogg och placeringstrend', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const rivals = game.clubs.filter(club => club.id !== game.managedClubId).slice(0, 3)
    const withContext = {
      ...game,
      seasonSummaries: [
        summaryAt(2025, { [game.managedClubId]: 5, [rivals[0].id]: 9, [rivals[1].id]: 4, [rivals[2].id]: 7 }),
        summaryAt(2026, { [game.managedClubId]: 4, [rivals[0].id]: 6, [rivals[1].id]: 8, [rivals[2].id]: 7 }),
      ],
      aiTransferLog: [
        { season: 2027, playerId: 'p1', playerName: 'A Spelare', fromClubId: rivals[1].id, fromClubName: rivals[1].name, toClubId: rivals[0].id, toClubName: rivals[0].name, fee: 150000 },
        { season: 2027, playerId: 'p2', playerName: 'B Spelare', fromClubId: 'free_agent', fromClubName: 'Fri agent', toClubId: rivals[2].id, toClubName: rivals[2].name, fee: 0 },
      ],
    }

    const context = deriveBoardLeagueContext(withContext, 2027, 'raised')
    expect(context.movements).toHaveLength(3)
    expect(context.movements[0]).toMatchObject({ type: 'transfer', playerName: 'A Spelare', fee: 150000 })
    expect(context.movements.some(movement => movement.type === 'positionTrend')).toBe(true)
    expect(context.movements.some(movement => movement.type === 'transfer' && movement.fee === 0)).toBe(true)
  })

  it('väljer AI-rustningsorsaken vid sänkt ribba först när två närliggande klubbar faktiskt blivit starkare', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const rivals = game.clubs.filter(club => club.id !== game.managedClubId).slice(0, 2)
    const strengthSummary = (season: number, managed: number, rivalA: number, rivalB: number) => ({
      season,
      standingsSnapshot: [
        { clubId: game.managedClubId, position: 6, points: 0, squadStrength: managed },
        { clubId: rivals[0].id, position: 4, points: 0, squadStrength: rivalA },
        { clubId: rivals[1].id, position: 8, points: 0, squadStrength: rivalB },
      ],
    }) as unknown as SeasonSummary

    expect(deriveBoardLeagueContext({
      ...game,
      seasonSummaries: [strengthSummary(2025, 50, 52, 48), strengthSummary(2026, 51, 52.5, 48.5)],
    }, 2027, 'lowered').reasonSource).toBe('results')

    expect(deriveBoardLeagueContext({
      ...game,
      seasonSummaries: [strengthSummary(2025, 50, 52, 48), strengthSummary(2026, 50, 54, 51)],
    }, 2027, 'lowered').reasonSource).toBe('aiTransfers')
  })

  it('väljer AI-rustningsorsaken vid höjd ribba bara när styrkesnapshots belägger påståendet', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const rivals = game.clubs.filter(club => club.id !== game.managedClubId).slice(0, 2)
    const strengthSummary = (season: number, managed: number, rivalA: number, rivalB: number) => ({
      season,
      standingsSnapshot: [
        { clubId: game.managedClubId, position: 4, points: 0, squadStrength: managed },
        { clubId: rivals[0].id, position: 3, points: 0, squadStrength: rivalA },
        { clubId: rivals[1].id, position: 6, points: 0, squadStrength: rivalB },
      ],
    }) as unknown as SeasonSummary
    const withStrength = {
      ...game,
      seasonSummaries: [strengthSummary(2025, 50, 52, 48), strengthSummary(2026, 54, 53, 49)],
    }

    expect(deriveBoardLeagueContext(withStrength, 2027, 'raised').reasonSource).toBe('aiTransfers')
    expect(deriveBoardLeagueContext({
      ...withStrength,
      seasonSummaries: [strengthSummary(2025, 50, 52, 48), strengthSummary(2026, 51, 55, 50)],
    }, 2027, 'raised').reasonSource).toBe('results')
  })

  it('väljer aldrig leagueMovement utan kanonisk upp-/nedflyttningsstate', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    expect(deriveBoardLeagueContext(game, 2027, 'lowered').reasonSource).toBe('results')
  })
})

// DOM_BOARDRELATION_BAGE_2026-09-02.md, steg 2 — parallell till
// getClubPositionTrend ovan: ren läsning av seasonSummaries[].boardTruth,
// ofönstrad (hela karriären, till skillnad från positionstrendens lastNSeasons).
function boardTruthSummaryAt(
  season: number,
  overrides: { boardPatienceAfter: number; zone: 'stabilt' | 'under_press' | 'ultimatum'; verdict: 'exceeded' | 'met' | 'failed' },
): SeasonSummary {
  return {
    season,
    boardTruth: {
      statedGoal: { expectation: 'topFour' as never, anchorPosition: 4, label: 'Utmana toppen' },
      outcome: { finalPosition: 4, rating: 3, verdict: overrides.verdict, isChampion: false },
      relationship: {
        boardPatienceAfter: overrides.boardPatienceAfter,
        zone: overrides.zone,
        consecutiveFailuresAfter: 0,
        managerFired: false,
      },
    },
  } as unknown as SeasonSummary
}

describe('getBoardRelationshipTrend (DOM_BOARDRELATION_BAGE_2026-09-02.md, steg 2)', () => {
  it('returnerar en kronologisk kurva av boardPatienceAfter/zone/verdict, en punkt per säsong som bär boardTruth', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const withHistory = {
      ...game,
      seasonSummaries: [
        boardTruthSummaryAt(2026, { boardPatienceAfter: 40, zone: 'under_press', verdict: 'failed' }),
        boardTruthSummaryAt(2025, { boardPatienceAfter: 70, zone: 'stabilt', verdict: 'met' }),
      ],
    }
    // Osorterad indata (2026 före 2025) ska ändå ge äldst→nyast-ordning.
    expect(getBoardRelationshipTrend(withHistory)).toEqual({
      points: [
        { season: 2025, boardPatienceAfter: 70, zone: 'stabilt', verdict: 'met' },
        { season: 2026, boardPatienceAfter: 40, zone: 'under_press', verdict: 'failed' },
      ],
    })
  })

  it('hoppar tyst över säsonger utan boardTruth (saves från före A-H4) i stället för att krascha', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const withHistory = {
      ...game,
      seasonSummaries: [
        { season: 2024 } as unknown as SeasonSummary,  // ingen boardTruth
        boardTruthSummaryAt(2025, { boardPatienceAfter: 70, zone: 'stabilt', verdict: 'met' }),
        boardTruthSummaryAt(2026, { boardPatienceAfter: 60, zone: 'stabilt', verdict: 'met' }),
      ],
    }
    expect(getBoardRelationshipTrend(withHistory)?.points).toHaveLength(2)
  })

  it('null vid färre än två säsonger med boardTruth — ingen kurva på en enda punkt', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const withOneSeasson = {
      ...game,
      seasonSummaries: [boardTruthSummaryAt(2026, { boardPatienceAfter: 50, zone: 'stabilt', verdict: 'met' })],
    }
    expect(getBoardRelationshipTrend(withOneSeasson)).toBeNull()
    expect(getBoardRelationshipTrend({ ...game, seasonSummaries: [] })).toBeNull()
  })
})

// SEXSÄSONGSAUDITEN 2026-08-26, "Förbättringsaritmetik": Lesjöfors visade
// "43 → 52" som "+10" (skulle vara +9). Rotorsak: caGain räknades ur RÅA
// (oavrundade) currentAbility/startSeasonCA, medan de visade start/slut-
// siffrorna avrundades var för sig — två oberoende avrundningar kan tappa/
// vinna 1 mot en avrundning av differensen. Fix: caGain härleds nu ur de
// REDAN avrundade start/slut-värdena, aldrig ur rå float.
describe('generateSeasonSummary — mostImproved.caGain matchar de visade start/slut-siffrorna', () => {
  it('42.6 → 52.4 (rått): avrundas till 43/52, caGain ska vara 9 — inte 10', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const gameWithPlayer = {
      ...game,
      players: game.players.map(p => p.id === player.id
        ? { ...p, startSeasonCA: 42.6, currentAbility: 52.4 }
        : p),
    }
    const summary = generateSeasonSummary(gameWithPlayer)
    expect(summary.mostImproved).not.toBeNull()
    expect(summary.mostImproved!.startCA).toBe(43)
    expect(summary.mostImproved!.endCA).toBe(52)
    // Bevisar buggklassen: displayed delta ska ALLTID vara endCA - startCA,
    // aldrig ett tal som inte går att härleda ur de två siffrorna spelaren ser.
    expect(summary.mostImproved!.caGain).toBe(summary.mostImproved!.endCA - summary.mostImproved!.startCA)
    expect(summary.mostImproved!.caGain).toBe(9)
  })
})

// DOM_ARSBOKEN_MANAGERSEKTION_2026-09-02.md — managerSeason: managerProfile.
// diary fryst till DENNA säsongs rader, samma motivering som retiredPlayers/topScorer.
describe('generateSeasonSummary — managerSeason filtrerar dagboken till innevarande säsong', () => {
  it('bara entries med season === game.currentSeason tas med, andra säsongers rader utelämnas', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const gameWithDiary = {
      ...game,
      managerProfile: {
        ...game.managerProfile!,
        diary: [
          { season: 2026, matchday: 20, type: 'arrival' as const, text: 'Förra säsongens rad — ska INTE tas med.' },
          { season: 2027, matchday: 5, type: 'era_shift' as const, text: 'Den här säsongens rad #1.' },
          { season: 2027, matchday: 15, type: 'burnout_scar' as const, text: 'Den här säsongens rad #2.' },
        ],
      },
    }
    const summary = generateSeasonSummary(gameWithDiary)
    expect(summary.managerSeason).toHaveLength(2)
    expect(summary.managerSeason!.every(e => e.season === 2027)).toBe(true)
    expect(summary.managerSeason!.map(e => e.text)).toEqual([
      'Den här säsongens rad #1.',
      'Den här säsongens rad #2.',
    ])
  })

  it('ingen dagboksrad denna säsong → undefined, inte en tom lista', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const gameWithDiary = {
      ...game,
      managerProfile: {
        ...game.managerProfile!,
        diary: [{ season: 2026, matchday: 20, type: 'arrival' as const, text: 'Förra säsongen.' }],
      },
    }
    const summary = generateSeasonSummary(gameWithDiary)
    expect(summary.managerSeason).toBeUndefined()
  })
})

// SEXSÄSONGSAUDITEN 2026-08-26, "Omgångsidentitet": årsbokens bästa match
// (matchOfTheSeason, matchHighlightService.ts) och tidslinjen (keyMoments,
// computeKeyMoments ovan) visade olika omgångsnummer för SAMMA fixture i
// ett fall. Rotorsak: computeKeyMoments taggade moments med roundNumber
// (per-tävling, cup 1-4 skilt från liga 1-22) medan resten av årsboken
// (matchOfTheSeason, storylineItems i SeasonSummaryScreen.tsx) redan
// använde matchday (global spelordning) — CLAUDE.md:s hårda regel. Testet
// sätter matchday och roundNumber till OLIKA värden (simulerar en cup-
// insticksoffset) för att bevisa att keyMoments nu läser matchday.
describe('generateSeasonSummary — keyMoments använder matchday, inte roundNumber, för omgångsidentitet', () => {
  it('en bigWin-fixture med matchday ≠ roundNumber taggas med matchday i keyMoments', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 1 })
    const opponentId = game.clubs.find(c => c.id !== game.managedClubId)!.id
    const bigWinFixtureId = 'test_matchday_identity_fx'

    const gameWithFixture = {
      ...game,
      fixtures: [
        ...game.fixtures,
        {
          id: bigWinFixtureId,
          season: game.currentSeason,
          matchday: 8,       // global spelordning (t.ex. förskjuten av en cup-omgång)
          roundNumber: 5,    // ligans EGEN rondräkning — medvetet olika från matchday
          homeClubId: game.managedClubId,
          awayClubId: opponentId,
          homeScore: 5,
          awayScore: 0,
          status: FixtureStatus.Completed,
          isCup: false,
          events: [],
        } as never,
      ],
    }

    const summary = generateSeasonSummary(gameWithFixture as never)
    const moment = (summary.keyMoments ?? []).find(m => m.fixtureId === bigWinFixtureId)
    expect(moment, JSON.stringify(summary.keyMoments)).toBeDefined()
    expect(moment!.round).toBe(8)
    expect(moment!.round).not.toBe(5)
  })
})
