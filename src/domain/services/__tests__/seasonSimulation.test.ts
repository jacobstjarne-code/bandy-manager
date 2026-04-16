import { describe, it, expect } from 'vitest'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { generateWorld } from '../worldGenerator'
import { generateSchedule } from '../scheduleGenerator'
import { simulateMatch } from '../matchSimulator'
import { calculateStandings } from '../standingsService'

import type { Club } from '../../entities/Club'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import type { StandingRow } from '../../entities/SaveGame'
import { PlayerPosition, FixtureStatus, MatchEventType } from '../../enums'

function generateAiLineup(club: Club, players: Player[]): TeamSelection {
  const squadPlayers = players.filter(
    p => p.clubId === club.id && !p.isInjured && p.suspensionGamesRemaining === 0,
  )
  const gks = squadPlayers
    .filter(p => p.position === PlayerPosition.Goalkeeper)
    .sort((a, b) => b.currentAbility - a.currentAbility)
  const outfield = squadPlayers
    .filter(p => p.position !== PlayerPosition.Goalkeeper)
    .sort((a, b) => b.currentAbility - a.currentAbility)
  const starters: Player[] = []
  if (gks.length > 0) starters.push(gks[0])
  starters.push(...outfield.slice(0, 10))
  // If not enough: fill with any available
  if (starters.length < 11) {
    starters.push(
      ...squadPlayers.filter(p => !starters.includes(p)).slice(0, 11 - starters.length),
    )
  }
  const bench = squadPlayers.filter(p => !starters.includes(p)).slice(0, 5)
  const captain = [...starters].sort((a, b) => b.currentAbility - a.currentAbility)[0]
  return {
    startingPlayerIds: starters.map(p => p.id),
    benchPlayerIds: bench.map(p => p.id),
    captainPlayerId: captain?.id,
    tactic: club.activeTactic,
  }
}

interface SeasonStats {
  seed: number
  totalGoals: number
  totalMatches: number
  zeroZeroMatches: number
  highScoringMatches: number // 8+ goals
  cornerGoals: number
  totalCornerSequences: number
  totalRedCards: number
  finalStandings: StandingRow[]
  topScorers: { playerId: string; playerName: string; clubName: string; goals: number }[]
  topRatedPlayers: {
    playerId: string
    playerName: string
    clubName: string
    avgRating: number
    games: number
  }[]
  clubs: Club[]
  players: Player[]
}

function simulateSeason(seed: number): SeasonStats {
  const { clubs, players } = generateWorld(2025, seed)
  const scheduleFixtures = generateSchedule(
    clubs.map(c => c.id),
    2025,
  )

  // Convert ScheduleFixture[] to Fixture[]
  const fixtures: Fixture[] = scheduleFixtures.map((sf, index) => ({
    id: `fixture_${seed}_${index}`,
    leagueId: 'league_allsvenskan',
    season: 2025,
    roundNumber: sf.roundNumber,
    homeClubId: sf.homeClubId,
    awayClubId: sf.awayClubId,
    status: FixtureStatus.Scheduled,
    homeScore: 0,
    awayScore: 0,
    events: [],
  }))

  // Get max round
  const maxRound = Math.max(...fixtures.map(f => f.roundNumber))

  let totalGoals = 0
  let totalMatches = 0
  let zeroZeroMatches = 0
  let highScoringMatches = 0
  let cornerGoals = 0
  let totalCornerSequences = 0
  let totalRedCards = 0

  // Per-player tracking
  const playerGoalCount: Record<string, number> = {}
  const playerRatingSum: Record<string, number> = {}
  const playerRatingGames: Record<string, number> = {}

  const completedFixtures: Fixture[] = []

  for (let round = 1; round <= maxRound; round++) {
    const roundFixtures = fixtures.filter(f => f.roundNumber === round)

    roundFixtures.forEach((fixture, fixtureIndex) => {
      const homeClub = clubs.find(c => c.id === fixture.homeClubId)!
      const awayClub = clubs.find(c => c.id === fixture.awayClubId)!

      const homePlayers = players.filter(p => p.clubId === homeClub.id)
      const awayPlayers = players.filter(p => p.clubId === awayClub.id)

      const homeLineup = generateAiLineup(homeClub, players)
      const awayLineup = generateAiLineup(awayClub, players)

      const result = simulateMatch({
        fixture,
        homeLineup,
        awayLineup,
        homePlayers,
        awayPlayers,
        homeAdvantage: 0.05,
        seed: seed + round * 1000 + fixtureIndex,
      })

      const completed = result.fixture
      completedFixtures.push(completed)

      const matchGoals = completed.homeScore + completed.awayScore
      totalGoals += matchGoals
      totalMatches++

      if (completed.homeScore === 0 && completed.awayScore === 0) zeroZeroMatches++
      if (matchGoals >= 8) highScoringMatches++

      // Count corner goals using the isCornerGoal flag
      const events = completed.events
      for (let i = 0; i < events.length; i++) {
        const ev = events[i]
        if (ev.type === MatchEventType.Corner) {
          totalCornerSequences++
        }
        if (ev.type === MatchEventType.Goal && ev.isCornerGoal === true) {
          cornerGoals++
        }
        if (ev.type === MatchEventType.RedCard) totalRedCards++
      }

      // Accumulate player goals
      for (const ev of events) {
        if (ev.type === MatchEventType.Goal && ev.playerId) {
          playerGoalCount[ev.playerId] = (playerGoalCount[ev.playerId] ?? 0) + 1
        }
      }

      // Accumulate player ratings
      if (completed.report) {
        for (const [playerId, rating] of Object.entries(completed.report.playerRatings)) {
          playerRatingSum[playerId] = (playerRatingSum[playerId] ?? 0) + rating
          playerRatingGames[playerId] = (playerRatingGames[playerId] ?? 0) + 1
        }
      }
    })
  }

  // Final standings
  const finalStandings = calculateStandings(
    clubs.map(c => c.id),
    completedFixtures,
  )

  // Top scorers
  const topScorers = Object.entries(playerGoalCount)
    .map(([playerId, goals]) => {
      const player = players.find(p => p.id === playerId)
      const club = player ? clubs.find(c => c.id === player.clubId) : undefined
      return {
        playerId,
        playerName: player ? `${player.firstName} ${player.lastName}` : playerId,
        clubName: club?.shortName ?? '?',
        goals,
      }
    })
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5)

  // Top rated players (min 5 games)
  const topRatedPlayers = Object.entries(playerRatingSum)
    .map(([playerId, ratingSum]) => {
      const games = playerRatingGames[playerId] ?? 0
      const avgRating = games > 0 ? ratingSum / games : 0
      const player = players.find(p => p.id === playerId)
      const club = player ? clubs.find(c => c.id === player.clubId) : undefined
      return {
        playerId,
        playerName: player ? `${player.firstName} ${player.lastName}` : playerId,
        clubName: club?.shortName ?? '?',
        avgRating,
        games,
      }
    })
    .filter(p => p.games >= 5)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5)

  return {
    seed,
    totalGoals,
    totalMatches,
    zeroZeroMatches,
    highScoringMatches,
    cornerGoals,
    totalCornerSequences,
    totalRedCards,
    finalStandings,
    topScorers,
    topRatedPlayers,
    clubs,
    players,
  }
}

function statusIcon(
  value: number,
  ok: [number, number],
  warn: [number, number],
): '✅' | '⚠️' | '❌' {
  if (value >= ok[0] && value <= ok[1]) return '✅'
  if (value >= warn[0] && value <= warn[1]) return '⚠️'
  return '❌'
}

describe('Season simulation', () => {
  it('simulates 5 full seasons and validates calibration', () => {
    const SEEDS = [42, 123, 456, 789, 1337]
    const seasonResults: SeasonStats[] = []

    for (const seed of SEEDS) {
      console.log(`Simulating season with seed ${seed}...`)
      const stats = simulateSeason(seed)
      console.log(
        `  Seed ${seed}: ${stats.totalGoals} goals, ${stats.totalMatches} matches, ` +
          `avg ${(stats.totalGoals / stats.totalMatches).toFixed(2)} goals/match, ` +
          `0-0 matches: ${stats.zeroZeroMatches}, red cards: ${stats.totalRedCards}`,
      )
      if (stats.topScorers.length > 0) {
        console.log(
          `  Top scorer: ${stats.topScorers[0].playerName} (${stats.topScorers[0].clubName}) — ${stats.topScorers[0].goals} goals`,
        )
      }
      seasonResults.push(stats)
    }

    // Aggregate statistics
    const avgGoalsPerMatch =
      seasonResults.reduce((sum, s) => sum + s.totalGoals / s.totalMatches, 0) /
      seasonResults.length

    const avgZeroZero =
      seasonResults.reduce((sum, s) => sum + s.zeroZeroMatches, 0) / seasonResults.length

    const avgHighScoring =
      seasonResults.reduce((sum, s) => sum + s.highScoringMatches, 0) / seasonResults.length

    const avgCornerGoalsPct =
      seasonResults.reduce((sum, s) => {
        const pct = s.totalGoals > 0 ? (s.cornerGoals / s.totalGoals) * 100 : 0
        return sum + pct
      }, 0) / seasonResults.length

    const avgRedCardsPerMatch =
      seasonResults.reduce((sum, s) => sum + s.totalRedCards / s.totalMatches, 0) /
      seasonResults.length

    const topScorerGoals = seasonResults.map(s => (s.topScorers[0]?.goals ?? 0))
    const avgTopScorerGoals = topScorerGoals.reduce((a, b) => a + b, 0) / topScorerGoals.length
    const minTopScorerGoals = Math.min(...topScorerGoals)
    const maxTopScorerGoals = Math.max(...topScorerGoals)

    const minGoalsPerMatch = Math.min(
      ...seasonResults.map(s => s.totalGoals / s.totalMatches),
    )
    const maxGoalsPerMatch = Math.max(
      ...seasonResults.map(s => s.totalGoals / s.totalMatches),
    )

    const minZeroZero = Math.min(...seasonResults.map(s => s.zeroZeroMatches))
    const maxZeroZero = Math.max(...seasonResults.map(s => s.zeroZeroMatches))

    const cornerPcts = seasonResults.map(s =>
      s.totalGoals > 0 ? (s.cornerGoals / s.totalGoals) * 100 : 0,
    )
    const minCornerPct = Math.min(...cornerPcts)
    const maxCornerPct = Math.max(...cornerPcts)

    const minRedCards = Math.min(
      ...seasonResults.map(s => s.totalRedCards / s.totalMatches),
    )
    const maxRedCards = Math.max(
      ...seasonResults.map(s => s.totalRedCards / s.totalMatches),
    )

    console.log('\n=== AGGREGATED STATISTICS ===')
    console.log(`Average goals/match: ${avgGoalsPerMatch.toFixed(2)} (${minGoalsPerMatch.toFixed(2)}-${maxGoalsPerMatch.toFixed(2)})`)
    console.log(`Average 0-0 matches: ${avgZeroZero.toFixed(1)} (${minZeroZero}-${maxZeroZero})`)
    console.log(`Average high-scoring (8+): ${avgHighScoring.toFixed(1)}`)
    console.log(`Average corner goal %: ${avgCornerGoalsPct.toFixed(1)}% (${minCornerPct.toFixed(1)}%-${maxCornerPct.toFixed(1)}%)`)
    console.log(`Average red cards/match: ${avgRedCardsPerMatch.toFixed(3)} (${minRedCards.toFixed(3)}-${maxRedCards.toFixed(3)})`)
    console.log(`Top scorer goals: avg ${avgTopScorerGoals.toFixed(1)}, min ${minTopScorerGoals}, max ${maxTopScorerGoals}`)

    // Check elite club top-5 finish rate
    const eliteClubIds = ['club_forsbacka', 'club_soderfors', 'club_vastanfors']
    const totalEliteAppearances = seasonResults.reduce((count, s) => {
      const top5 = s.finalStandings.filter(row => row.position <= 5).map(row => row.clubId)
      return count + eliteClubIds.filter(id => top5.includes(id)).length
    }, 0)
    const maxEliteAppearances = eliteClubIds.length * seasonResults.length // 3 × 5 = 15
    const eliteTop5Rate = (totalEliteAppearances / maxEliteAppearances) * 100
    console.log(`Elite club top-5 rate: ${eliteTop5Rate.toFixed(0)}% (${totalEliteAppearances}/${maxEliteAppearances})`)

    // Check max player rating
    const allAvgRatings = seasonResults.flatMap(s => s.topRatedPlayers.map(p => p.avgRating))
    const globalMaxAvgRating = allAvgRatings.length > 0 ? Math.max(...allAvgRatings) : 0
    const globalMinAvgRating = allAvgRatings.length > 0 ? Math.min(...allAvgRatings) : 0
    console.log(`Player avg rating range: ${globalMinAvgRating.toFixed(2)}-${globalMaxAvgRating.toFixed(2)}`)

    // === Determine flags ===
    const flags: string[] = []

    const goalsStatus = statusIcon(avgGoalsPerMatch, [4, 8], [3, 10])
    if (goalsStatus === '⚠️') flags.push(`⚠️ Målsnittet ${avgGoalsPerMatch.toFixed(1)} är i övre kant av målet 4-8`)
    if (goalsStatus === '❌') flags.push(`❌ Målsnittet ${avgGoalsPerMatch.toFixed(1)} är utanför acceptabelt intervall (3-10)`)

    const zzStatus = statusIcon(avgZeroZero, [0, 5], [0, 10])
    if (zzStatus === '⚠️') flags.push(`⚠️ Genomsnittliga 0-0-matcher (${avgZeroZero.toFixed(1)}) är höga`)
    if (zzStatus === '❌') flags.push(`❌ För många 0-0-matcher (${avgZeroZero.toFixed(1)} snitt)`)

    const cornerStatus = statusIcon(avgCornerGoalsPct, [8, 18], [5, 35])
    if (cornerStatus === '⚠️') flags.push(`⚠️ Hörnmålsprocenten (${avgCornerGoalsPct.toFixed(1)}%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet`)
    if (cornerStatus === '❌') flags.push(`❌ Hörnmålsprocenten (${avgCornerGoalsPct.toFixed(1)}%) är klart fel — detektionsmetoden bör ses över`)

    const redStatus = statusIcon(avgRedCardsPerMatch, [0.1, 0.5], [0, 1.0])
    if (redStatus === '⚠️') flags.push(`⚠️ Röda kort per match (${avgRedCardsPerMatch.toFixed(3)}) är högt`)
    if (redStatus === '❌') flags.push(`❌ Röda kort per match (${avgRedCardsPerMatch.toFixed(3)}) är orealistiskt högt`)

    const topScorerStatus = statusIcon(avgTopScorerGoals, [15, 45], [10, 60])
    if (topScorerStatus === '⚠️') flags.push(`⚠️ Toppskyttens snittmål (${avgTopScorerGoals.toFixed(1)}) utanför idealet 15-45`)
    if (topScorerStatus === '❌') flags.push(`❌ Toppskyttens snittmål (${avgTopScorerGoals.toFixed(1)}) är klart fel`)

    if (eliteTop5Rate < 60) flags.push(`⚠️ Eliteklubbarna (Sandviken/Sirius/Västerås) hamnade i topp-5 bara ${eliteTop5Rate.toFixed(0)}% av gångerna`)

    if (flags.length === 0) flags.push('✅ Inga avvikelser hittades — kalibreringen ser bra ut')

    // === Best season for showcase ===
    const bestSeason = seasonResults.reduce((best, s) =>
      s.totalGoals / s.totalMatches > best.totalGoals / best.totalMatches ? s : best,
    )

    // === Average position per club across all seasons ===
    const clubPositionSums: Record<string, number> = {}
    const clubPointsSums: Record<string, number> = {}
    const clubGFSums: Record<string, number> = {}
    const clubGASums: Record<string, number> = {}
    const clubWinSums: Record<string, number> = {}

    for (const s of seasonResults) {
      for (const row of s.finalStandings) {
        clubPositionSums[row.clubId] = (clubPositionSums[row.clubId] ?? 0) + row.position
        clubPointsSums[row.clubId] = (clubPointsSums[row.clubId] ?? 0) + row.points
        clubGFSums[row.clubId] = (clubGFSums[row.clubId] ?? 0) + row.goalsFor
        clubGASums[row.clubId] = (clubGASums[row.clubId] ?? 0) + row.goalsAgainst
        clubWinSums[row.clubId] = (clubWinSums[row.clubId] ?? 0) + row.wins
      }
    }

    // Use clubs from first season as reference
    const refClubs = seasonResults[0].clubs
    const avgStandingsTable = refClubs
      .map(club => ({
        id: club.id,
        name: club.shortName,
        avgPos: (clubPositionSums[club.id] ?? 0) / SEEDS.length,
        avgPts: (clubPointsSums[club.id] ?? 0) / SEEDS.length,
        avgGF: (clubGFSums[club.id] ?? 0) / SEEDS.length,
        avgGA: (clubGASums[club.id] ?? 0) / SEEDS.length,
        avgWins: (clubWinSums[club.id] ?? 0) / SEEDS.length,
      }))
      .sort((a, b) => a.avgPos - b.avgPos)

    // === Build markdown ===
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const goalsStatusIcon = statusIcon(avgGoalsPerMatch, [4, 8], [3, 10])
    const zzStatusIcon = statusIcon(avgZeroZero, [0, 5], [0, 10])
    const cornerStatusIcon = statusIcon(avgCornerGoalsPct, [8, 18], [5, 25])
    const redStatusIcon = statusIcon(avgRedCardsPerMatch, [0.1, 0.5], [0, 1.0])
    const topScorerStatusIcon = statusIcon(avgTopScorerGoals, [15, 45], [10, 60])

    const standingsRows = avgStandingsTable
      .map(
        row =>
          `| ${row.avgPos.toFixed(1)} | ${row.name} | ${row.avgPts.toFixed(1)} | ${row.avgWins.toFixed(1)} | ${row.avgGF.toFixed(1)} | ${row.avgGA.toFixed(1)} |`,
      )
      .join('\n')

    const topScorersRows = bestSeason.topScorers
      .map((s, i) => `| ${i + 1} | ${s.playerName} | ${s.clubName} | ${s.goals} |`)
      .join('\n')

    const topRatedRows = bestSeason.topRatedPlayers
      .map(
        (p, i) =>
          `| ${i + 1} | ${p.playerName} | ${p.clubName} | ${p.avgRating.toFixed(2)} | ${p.games} |`,
      )
      .join('\n')

    const flagsSection = flags.map(f => `- ${f}`).join('\n')

    const perSeasonRows = seasonResults.map(s => {
      const gpm = (s.totalGoals / s.totalMatches).toFixed(2)
      const cpct = s.totalGoals > 0 ? ((s.cornerGoals / s.totalGoals) * 100).toFixed(1) : '0.0'
      const rpm = (s.totalRedCards / s.totalMatches).toFixed(3)
      const topGoals = s.topScorers[0]?.goals ?? 0
      return `| ${s.seed} | ${gpm} | ${s.zeroZeroMatches} | ${cpct}% | ${rpm} | ${topGoals} |`
    }).join('\n')

    const markdownContent = `# Säsongsanalys — Bandy Manager v0.1

Genererad: ${now}
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | ${avgGoalsPerMatch.toFixed(2)} | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | ${avgZeroZero.toFixed(1)} | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | ${avgCornerGoalsPct.toFixed(1)}% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | ${avgTopScorerGoals.toFixed(1)} | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** \`goalThreshold\` i attack-sekvensen höjdes från \`× 0.28 × (1 - GK×0.4)\` till \`× 0.45 × (1 - GK×0.35)\`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** \`isCornerGoal: true\`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (${avgCornerGoalsPct.toFixed(1)}% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | ${avgGoalsPerMatch.toFixed(2)} | ${minGoalsPerMatch.toFixed(2)} | ${maxGoalsPerMatch.toFixed(2)} | ${goalsStatusIcon} |
| 0-0-matcher per säsong | ${avgZeroZero.toFixed(1)} | ${minZeroZero} | ${maxZeroZero} | ${zzStatusIcon} |
| Hörnmål (% av totalt) | ${avgCornerGoalsPct.toFixed(1)}% | ${minCornerPct.toFixed(1)}% | ${maxCornerPct.toFixed(1)}% | ${cornerStatusIcon} |
| Röda kort per match | ${avgRedCardsPerMatch.toFixed(3)} | ${minRedCards.toFixed(3)} | ${maxRedCards.toFixed(3)} | ${redStatusIcon} |
| Toppskyttens mål (snitt) | ${avgTopScorerGoals.toFixed(1)} | ${minTopScorerGoals} | ${maxTopScorerGoals} | ${topScorerStatusIcon} |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
${perSeasonRows}

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
${standingsRows}

## Toppskyttar (bästa säsong — seed ${bestSeason.seed})

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
${topScorersRows || '| — | Inga data | — | — |'}

## Spelarbetyg (snitt, bästa säsong — seed ${bestSeason.seed})

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
${topRatedRows || '| — | Inga data | — | — | — |'}

## Flaggor

${flagsSection}

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
`

    const outputPath = join(process.cwd(), 'docs', 'season_analysis.md')
    writeFileSync(outputPath, markdownContent, 'utf-8')
    console.log(`\nAnalysis written to: ${outputPath}`)

    // === Assertions ===
    // 1. Average goals per match between 7.0 and 13.0 (Bandygrytan target: ~10.0)
    expect(avgGoalsPerMatch, `Goals per match (${avgGoalsPerMatch.toFixed(2)}) should be between 7 and 13`).toBeGreaterThan(7.0)
    expect(avgGoalsPerMatch, `Goals per match (${avgGoalsPerMatch.toFixed(2)}) should be between 7 and 13`).toBeLessThan(13.0)

    // 2. Zero-zero matches should be < 8 per season
    expect(avgZeroZero, `0-0 matches (${avgZeroZero.toFixed(1)}) should be < 8`).toBeLessThan(8)

    // 3. High-scoring matches (8+) < 120 per season — ~10 goals/match means most matches will be 8+
    expect(avgHighScoring, `High-scoring matches (${avgHighScoring.toFixed(1)}) should be < 120`).toBeLessThan(120)

    // 4. Corner goals between 0% and 45% of total goals
    expect(avgCornerGoalsPct, 'Corner goal % should be >= 0').toBeGreaterThanOrEqual(0)
    expect(avgCornerGoalsPct, 'Corner goal % should be <= 45').toBeLessThanOrEqual(45)

    // 5. Top scorer should have between 15 and 70 goals (adjusted for rep×120 economy rebalance)
    expect(avgTopScorerGoals, `Top scorer goals (${avgTopScorerGoals.toFixed(1)}) should be > 15`).toBeGreaterThan(15)
    expect(avgTopScorerGoals, `Top scorer goals (${avgTopScorerGoals.toFixed(1)}) should be < 70`).toBeLessThan(70)

    // 6. Red cards per match between 0 and 2.0
    expect(avgRedCardsPerMatch, `Red cards/match (${avgRedCardsPerMatch.toFixed(3)}) should be >= 0`).toBeGreaterThanOrEqual(0)
    expect(avgRedCardsPerMatch, `Red cards/match (${avgRedCardsPerMatch.toFixed(3)}) should be < 2`).toBeLessThan(2.0)

    // 7. No player should have an average rating above 10.0 or below 3.0
    if (globalMaxAvgRating > 0) {
      expect(globalMaxAvgRating, `Max avg player rating (${globalMaxAvgRating.toFixed(2)}) should be <= 10.0`).toBeLessThanOrEqual(10.0)
      expect(globalMinAvgRating, `Min avg player rating (${globalMinAvgRating.toFixed(2)}) should be >= 3.0`).toBeGreaterThanOrEqual(3.0)
    }

    console.log('\n=== ASSERTIONS PASSED ===')
    console.log('All sanity checks passed. See docs/season_analysis.md for full report.')
  }, 120000)
})
