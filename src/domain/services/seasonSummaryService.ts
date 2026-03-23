import type { SaveGame } from '../entities/SaveGame'
import type { SeasonSummary } from '../entities/SeasonSummary'
import { ClubExpectation, FixtureStatus, PlayoffRound } from '../enums'

export type { SeasonSummary }

export function generateSeasonSummary(game: SaveGame): SeasonSummary {
  const managedClubId = game.managedClubId
  const club = game.clubs.find(c => c.id === managedClubId)!
  const managedPlayers = game.players.filter(p => p.clubId === managedClubId)

  // Completed fixtures for managed club this season
  const clubFixtures = game.fixtures.filter(f =>
    f.status === FixtureStatus.Completed &&
    f.season === game.currentSeason &&
    f.roundNumber <= 22 &&  // only regular season
    (f.homeClubId === managedClubId || f.awayClubId === managedClubId)
  ).sort((a, b) => a.roundNumber - b.roundNumber)

  const standing = game.standings.find(s => s.clubId === managedClubId)
  const finalPosition = standing?.position ?? 12
  const points = standing?.points ?? 0
  const wins = standing?.wins ?? 0
  const draws = standing?.draws ?? 0
  const losses = standing?.losses ?? 0
  const goalsFor = standing?.goalsFor ?? 0
  const goalsAgainst = standing?.goalsAgainst ?? 0
  const goalDifference = standing?.goalDifference ?? 0

  // Playoff result
  const bracket = game.playoffBracket
  let playoffResult: SeasonSummary['playoffResult'] = null
  if (bracket) {
    if (bracket.champion === managedClubId) {
      playoffResult = 'champion'
    } else if (bracket.final?.homeClubId === managedClubId || bracket.final?.awayClubId === managedClubId) {
      playoffResult = bracket.final?.loserId === managedClubId ? 'finalist' : null
    }
    if (playoffResult === null) {
      const allSeries = [
        ...bracket.quarterFinals,
        ...bracket.semiFinals,
        ...(bracket.final ? [bracket.final] : []),
      ]
      for (const s of allSeries) {
        if (s.loserId === managedClubId) {
          playoffResult = s.round === PlayoffRound.QuarterFinal ? 'quarterfinal'
            : s.round === PlayoffRound.SemiFinal ? 'semifinal'
            : 'finalist'
          break
        }
      }
    }
    if (playoffResult === null && finalPosition > 8) {
      playoffResult = 'didNotQualify'
    }
  } else if (finalPosition > 8) {
    playoffResult = 'didNotQualify'
  }

  // Board expectation check
  const boardExpectation = club.boardExpectation
  const isChampion = playoffResult === 'champion'

  function expectationThreshold(e: ClubExpectation): number {
    switch (e) {
      case ClubExpectation.AvoidBottom: return 10
      case ClubExpectation.MidTable: return 7
      case ClubExpectation.ChallengeTop: return 3
      case ClubExpectation.WinLeague: return 1
    }
  }

  const threshold = expectationThreshold(boardExpectation)
  const metExpectation = finalPosition <= threshold || (boardExpectation === ClubExpectation.WinLeague && isChampion)

  // Exceeded: significantly better than threshold
  const exceededThresholds: Record<ClubExpectation, number> = {
    [ClubExpectation.AvoidBottom]: 6,
    [ClubExpectation.MidTable]: 3,
    [ClubExpectation.ChallengeTop]: 1,
    [ClubExpectation.WinLeague]: 1,
  }
  const exceeded = finalPosition <= exceededThresholds[boardExpectation] || (boardExpectation === ClubExpectation.WinLeague && isChampion)
  const expectationVerdict: SeasonSummary['expectationVerdict'] = exceeded ? 'exceeded' : metExpectation ? 'met' : 'failed'

  // Player stats
  const sortedByGoals = [...managedPlayers].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)
  const sortedByAssists = [...managedPlayers].sort((a, b) => b.seasonStats.assists - a.seasonStats.assists)
  const sortedByRating = [...managedPlayers]
    .filter(p => p.seasonStats.gamesPlayed >= 5)
    .sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating)

  const topScorer = sortedByGoals[0]?.seasonStats.goals > 0 ? {
    playerId: sortedByGoals[0].id,
    name: `${sortedByGoals[0].firstName} ${sortedByGoals[0].lastName}`,
    goals: sortedByGoals[0].seasonStats.goals,
    assists: sortedByGoals[0].seasonStats.assists,
  } : null

  const topAssister = sortedByAssists[0]?.seasonStats.assists > 0 ? {
    playerId: sortedByAssists[0].id,
    name: `${sortedByAssists[0].firstName} ${sortedByAssists[0].lastName}`,
    assists: sortedByAssists[0].seasonStats.assists,
  } : null

  const topRated = sortedByRating[0] ? {
    playerId: sortedByRating[0].id,
    name: `${sortedByRating[0].firstName} ${sortedByRating[0].lastName}`,
    avgRating: Math.round(sortedByRating[0].seasonStats.averageRating * 10) / 10,
    games: sortedByRating[0].seasonStats.gamesPlayed,
  } : null

  // Most improved (using startSeasonCA)
  const improvedCandidates = managedPlayers
    .filter(p => p.startSeasonCA !== undefined && p.startSeasonCA > 0)
    .map(p => ({ p, gain: p.currentAbility - (p.startSeasonCA ?? p.currentAbility) }))
    .filter(x => x.gain > 0)
    .sort((a, b) => b.gain - a.gain)

  const mostImproved = improvedCandidates[0] ? {
    playerId: improvedCandidates[0].p.id,
    name: `${improvedCandidates[0].p.firstName} ${improvedCandidates[0].p.lastName}`,
    caGain: Math.round(improvedCandidates[0].gain),
    startCA: Math.round(improvedCandidates[0].p.startSeasonCA ?? 0),
    endCA: Math.round(improvedCandidates[0].p.currentAbility),
  } : null

  // U21 best player
  const u21Players = managedPlayers
    .filter(p => p.age <= 21 && p.seasonStats.gamesPlayed >= 3)
    .sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating)

  const youngPlayer = u21Players[0] ? {
    playerId: u21Players[0].id,
    name: `${u21Players[0].firstName} ${u21Players[0].lastName}`,
    age: u21Players[0].age,
    goals: u21Players[0].seasonStats.goals,
    avgRating: Math.round(u21Players[0].seasonStats.averageRating * 10) / 10,
  } : null

  // Team stats from fixtures
  let totalGoals = 0, totalCornerGoals = 0, totalCleanSheets = 0
  let homeWins = 0, homeDraws = 0, homeLosses = 0
  let awayWins = 0, awayDraws = 0, awayLosses = 0
  let biggestWin: SeasonSummary['biggestWin'] = null
  let worstLoss: SeasonSummary['worstLoss'] = null
  let maxWinDiff = 0, maxLossDiff = 0

  for (const f of clubFixtures) {
    const isHome = f.homeClubId === managedClubId
    const clubScore = isHome ? f.homeScore : f.awayScore
    const oppScore = isHome ? f.awayScore : f.homeScore
    const oppId = isHome ? f.awayClubId : f.homeClubId
    const oppName = game.clubs.find(c => c.id === oppId)?.shortName ?? oppId

    totalGoals += clubScore
    if (oppScore === 0) totalCleanSheets++

    // Corner goals from events
    const cornerGoals = f.events.filter(e => e.isCornerGoal && e.clubId === managedClubId).length
    totalCornerGoals += cornerGoals

    if (isHome) {
      if (clubScore > oppScore) homeWins++
      else if (clubScore === oppScore) homeDraws++
      else homeLosses++
    } else {
      if (clubScore > oppScore) awayWins++
      else if (clubScore === oppScore) awayDraws++
      else awayLosses++
    }

    const diff = clubScore - oppScore
    if (diff > maxWinDiff) {
      maxWinDiff = diff
      biggestWin = { opponent: oppName, score: `${clubScore}-${oppScore}`, round: f.roundNumber }
    }
    if (diff < -maxLossDiff) {
      maxLossDiff = Math.abs(diff)
      worstLoss = { opponent: oppName, score: `${clubScore}-${oppScore}`, round: f.roundNumber }
    }
  }

  // Total assists from player stats
  const totalAssists = managedPlayers.reduce((sum, p) => sum + p.seasonStats.assists, 0)

  // Streaks
  let currentWinStreak = 0, longestWinStreak = 0
  let currentLossStreak = 0, longestLossStreak = 0

  for (const f of clubFixtures) {
    const isHome = f.homeClubId === managedClubId
    const clubScore = isHome ? f.homeScore : f.awayScore
    const oppScore = isHome ? f.awayScore : f.homeScore

    if (clubScore > oppScore) {
      currentWinStreak++
      currentLossStreak = 0
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak)
    } else if (clubScore < oppScore) {
      currentLossStreak++
      currentWinStreak = 0
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak)
    } else {
      currentWinStreak = 0
      currentLossStreak = 0
    }
  }

  // First/second half points
  let firstHalfPoints = 0, secondHalfPoints = 0
  for (const f of clubFixtures) {
    const isHome = f.homeClubId === managedClubId
    const clubScore = isHome ? f.homeScore : f.awayScore
    const oppScore = isHome ? f.awayScore : f.homeScore
    const pts = clubScore > oppScore ? 3 : clubScore === oppScore ? 1 : 0
    if (f.roundNumber <= 11) firstHalfPoints += pts
    else secondHalfPoints += pts
  }

  const formTrend: SeasonSummary['formTrend'] =
    secondHalfPoints > firstHalfPoints * 1.15 ? 'improving'
    : secondHalfPoints < firstHalfPoints * 0.85 ? 'declining'
    : 'stable'

  // Points per round for chart
  const roundPoints: number[] = []
  let cumulativePoints = 0
  for (let r = 1; r <= 22; r++) {
    const f = clubFixtures.find(fx => fx.roundNumber === r)
    if (f) {
      const isHome = f.homeClubId === managedClubId
      const clubScore = isHome ? f.homeScore : f.awayScore
      const oppScore = isHome ? f.awayScore : f.homeScore
      cumulativePoints += clubScore > oppScore ? 3 : clubScore === oppScore ? 1 : 0
    }
    roundPoints.push(cumulativePoints)
  }

  // Injuries (count currently injured players)
  const injuredPlayers = managedPlayers.filter(p => p.isInjured)
  const totalInjuries = injuredPlayers.length
  const mostInjuredPlayer = totalInjuries > 0 ? {
    name: `${injuredPlayers[0].firstName} ${injuredPlayers[0].lastName}`,
    injuries: 1,
  } : null

  // Finances
  const startFinances = game.seasonStartFinances ?? club.finances
  const endFinances = club.finances
  const financialChange = endFinances - startFinances

  // Youth intake for this season
  const youthRecords = game.youthIntakeHistory.filter(
    r => r.season === game.currentSeason && r.clubId === managedClubId
  )
  const youthIntakeCount = youthRecords.reduce((sum, r) => sum + r.playerIds.length, 0)

  const topProspectId = youthRecords.find(r => r.topProspectId)?.topProspectId
  const topProspectPlayer = topProspectId ? game.players.find(p => p.id === topProspectId) : null
  const bestYouthProspect = topProspectPlayer ? {
    name: `${topProspectPlayer.firstName} ${topProspectPlayer.lastName}`,
    position: topProspectPlayer.position,
    potential: Math.round(topProspectPlayer.potentialAbility),
  } : null

  // Narrative summary
  const expectationText: Record<ClubExpectation, string> = {
    [ClubExpectation.AvoidBottom]: 'undvika nedflyttning',
    [ClubExpectation.MidTable]: 'hålla mittentabellen',
    [ClubExpectation.ChallengeTop]: 'utmana toppen',
    [ClubExpectation.WinLeague]: 'vinna ligan',
  }

  let narrative = ''
  if (isChampion) {
    narrative = `En historisk säsong! ${club.name} tog SM-guldet ${game.currentSeason} i en strålande slutspelskampanj.`
  } else if (expectationVerdict === 'exceeded') {
    narrative = `${club.name} överträffade alla förväntningar och slutade på ${finalPosition}:e plats — styrelsen förväntade sig bara att ${expectationText[boardExpectation]}.`
  } else if (expectationVerdict === 'met') {
    narrative = `En solid säsong för ${club.name}. ${finalPosition}:e plats uppfyller styrelsens krav på att ${expectationText[boardExpectation]}.`
  } else {
    narrative = `En besvikelse. ${club.name} slutade på ${finalPosition}:e plats — långt ifrån styrelsens mål att ${expectationText[boardExpectation]}.`
  }

  if (formTrend === 'improving') {
    narrative += ' Formen förbättrades tydligt under säsongens andra halva.'
  } else if (formTrend === 'declining') {
    narrative += ' En stark inledning följdes dessvärre av en tung avslutning.'
  }

  if (topScorer && topScorer.goals >= 5) {
    narrative += ` ${topScorer.name} stod för ${topScorer.goals} mål och var lagets viktigaste offensiva kraft.`
  }

  return {
    season: game.currentSeason,
    clubId: managedClubId,
    clubName: club.name,
    finalPosition,
    points,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference,
    playoffResult,
    boardExpectation,
    metExpectation,
    expectationVerdict,
    topScorer,
    topAssister,
    topRated,
    mostImproved,
    youngPlayer,
    totalGoals,
    totalAssists,
    totalCornerGoals,
    totalCleanSheets,
    longestWinStreak,
    longestLossStreak,
    biggestWin,
    worstLoss,
    homeRecord: { wins: homeWins, draws: homeDraws, losses: homeLosses },
    awayRecord: { wins: awayWins, draws: awayDraws, losses: awayLosses },
    firstHalfPoints,
    secondHalfPoints,
    formTrend,
    totalInjuries,
    mostInjuredPlayer,
    startFinances,
    endFinances,
    financialChange,
    youthIntakeCount,
    bestYouthProspect,
    roundPoints,
    narrativeSummary: narrative,
  }
}
