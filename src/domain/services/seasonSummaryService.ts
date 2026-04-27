import type { SaveGame } from '../entities/SaveGame'
import type { SeasonSummary } from '../entities/SeasonSummary'
import type { Fixture } from '../entities/Fixture'
import { ClubExpectation, FixtureStatus, MatchEventType, PlayoffRound } from '../enums'
import { getRivalry } from '../data/rivalries'

function generateStoryTriggers(game: SaveGame): SeasonSummary['storyTriggers'] {
  const managedClubId = game.managedClubId
  const managedPlayers = game.players.filter(p => p.clubId === managedClubId)
  const triggers: NonNullable<SeasonSummary['storyTriggers']> = []

  // 1. Academy star: promoted from academy, ≥10 games, avgRating ≥7.0
  const academyStar = managedPlayers.find(p =>
    p.promotedFromAcademy === true &&
    p.seasonStats.gamesPlayed >= 10 &&
    p.seasonStats.averageRating >= 7.0
  )
  if (academyStar) {
    triggers.push({
      type: 'academyStarBorn',
      headline: `Akademistjärna: ${academyStar.firstName} ${academyStar.lastName}`,
      body: `${academyStar.firstName} ${academyStar.lastName} klev fram ur akademin och spelade ${academyStar.seasonStats.gamesPlayed} matcher med ett snittbetyg på ${academyStar.seasonStats.averageRating.toFixed(1)}.`,
      relatedPlayerId: academyStar.id,
    })
  }

  // 2. Hat trick hero: careerMilestones with type 'hatTrick' this season
  if (triggers.length < 3) {
    const hatTrickHero = managedPlayers.find(p =>
      (p.careerMilestones ?? []).some(m => m.type === 'hatTrick' && m.season === game.currentSeason)
    )
    if (hatTrickHero) {
      triggers.push({
        type: 'hatTrickHero',
        headline: `Hattrick: ${hatTrickHero.firstName} ${hatTrickHero.lastName}`,
        body: `${hatTrickHero.firstName} ${hatTrickHero.lastName} satte hattrick under säsongen — en prestation som går till historien.`,
        relatedPlayerId: hatTrickHero.id,
      })
    }
  }

  // 3. Comeback king: was injured, came back, ≥5 goals, ≤15 games
  if (triggers.length < 3) {
    const comebackKing = managedPlayers.find(p =>
      p.isInjured === false &&
      p.injuryProneness > 0 &&
      p.seasonStats.goals >= 5 &&
      p.seasonStats.gamesPlayed <= 15 &&
      p.seasonStats.gamesPlayed > 0
    )
    if (comebackKing) {
      triggers.push({
        type: 'comebackKing',
        headline: `Comebackkung: ${comebackKing.firstName} ${comebackKing.lastName}`,
        body: `Trots skadebekymmer kämpade ${comebackKing.firstName} ${comebackKing.lastName} sig tillbaka och satte ${comebackKing.seasonStats.goals} mål på bara ${comebackKing.seasonStats.gamesPlayed} matcher.`,
        relatedPlayerId: comebackKing.id,
      })
    }
  }

  return triggers.length > 0 ? triggers : undefined
}

type MomentWithScore = NonNullable<SeasonSummary['keyMoments']>[number] & { score: number }

function computeKeyMoments(
  game: SaveGame,
  clubFixtures: Fixture[],
  managedPlayers: { id: string; firstName: string; lastName: string }[],
): NonNullable<SeasonSummary['keyMoments']> {
  const moments: MomentWithScore[] = []

  for (const f of clubFixtures) {
    const isHome = f.homeClubId === game.managedClubId
    const myScore = isHome ? f.homeScore : f.awayScore
    const theirScore = isHome ? f.awayScore : f.homeScore
    const margin = myScore - theirScore
    const opponentId = isHome ? f.awayClubId : f.homeClubId
    const opponent = game.clubs.find(c => c.id === opponentId)
    const oppName = opponent?.shortName ?? opponent?.name ?? '?'
    const scoreStr = isHome ? `${myScore}–${theirScore}` : `${theirScore}–${myScore}`
    const rivalry = getRivalry(f.homeClubId, f.awayClubId)
    const isDerby = !!rivalry

    // Big win (3+ goal margin)
    if (margin >= 3) {
      moments.push({ round: f.roundNumber, type: 'bigWin', fixtureId: f.id,
        headline: `Stor seger mot ${oppName} (${scoreStr})`,
        body: `Omgång ${f.roundNumber}: En övertygande seger med ${margin} måls marginal. Laget visade klass.`,
        score: margin * 10 + (isDerby ? 20 : 0) })
    }

    // Big loss (3+ goal margin)
    if (margin <= -3) {
      moments.push({ round: f.roundNumber, type: 'bigLoss', fixtureId: f.id,
        headline: `Tung förlust mot ${oppName} (${scoreStr})`,
        body: `Omgång ${f.roundNumber}: En svår dag på plan. ${Math.abs(margin)} måls förlust var svår att smälta.`,
        score: Math.abs(margin) * 8 + (isDerby ? 20 : 0) })
    }

    // Derby result
    if (isDerby && margin !== 0) {
      if (margin > 0) {
        moments.push({ round: f.roundNumber, type: 'derbyWin', fixtureId: f.id,
          headline: `Derbyvinst! ${rivalry!.name} (${scoreStr})`,
          body: `Omgång ${f.roundNumber}: En seger som laget och supportrarna länge minns. Derbyt vann vi.`,
          score: 35 + margin * 5 })
      } else {
        moments.push({ round: f.roundNumber, type: 'derbyLoss', fixtureId: f.id,
          headline: `Derbyförlust — ${rivalry!.name} (${scoreStr})`,
          body: `Omgång ${f.roundNumber}: Ett derby vi gärna glömmer. Rivalen vann och fansen var besvikna.`,
          score: 25 })
      }
    }

    // Hat trick: 3+ goals by one managed player
    const goalsByPlayer: Record<string, number> = {}
    for (const evt of f.events) {
      if (evt.type === MatchEventType.Goal && evt.playerId && evt.clubId === game.managedClubId) {
        goalsByPlayer[evt.playerId] = (goalsByPlayer[evt.playerId] ?? 0) + 1
      }
    }
    for (const [pid, goals] of Object.entries(goalsByPlayer)) {
      if (goals >= 3) {
        const p = managedPlayers.find(pl => pl.id === pid)
        const name = p ? `${p.firstName} ${p.lastName}` : 'Okänd'
        moments.push({ round: f.roundNumber, type: 'hatTrick', fixtureId: f.id, relatedPlayerId: pid,
          headline: `Hattrick — ${name} mot ${oppName}`,
          body: `Omgång ${f.roundNumber}: ${name} satte ${goals} mål. En prestation att minnas länge.`,
          score: 30 + (goals - 3) * 10 })
        break
      }
    }

    // Late winner: won by 1, scoring goal in minute >= 80
    if (margin === 1) {
      const lateGoals = f.events.filter(e =>
        e.type === MatchEventType.Goal && e.clubId === game.managedClubId && (e.minute ?? 0) >= 80)
      if (lateGoals.length > 0) {
        const scorer = lateGoals[lateGoals.length - 1]
        const p = scorer.playerId ? managedPlayers.find(pl => pl.id === scorer.playerId) : null
        moments.push({ round: f.roundNumber, type: 'lateWinner', fixtureId: f.id, relatedPlayerId: scorer.playerId,
          headline: `Sent avgörande mot ${oppName} (${scoreStr})`,
          body: `Omgång ${f.roundNumber}: ${p ? `${p.firstName} ${p.lastName}` : 'Avslutning'} satte avgörande sent. Tre poäng trots allt.`,
          score: 25 + (isDerby ? 20 : 0) })
      }
    }

    // Comeback: we trailed (first goal was opponent's) but won
    if (margin > 0) {
      const firstGoal = f.events.find(e => e.type === MatchEventType.Goal)
      if (firstGoal && firstGoal.clubId !== game.managedClubId) {
        moments.push({ round: f.roundNumber, type: 'comeback', fixtureId: f.id,
          headline: `Comeback mot ${oppName} (${scoreStr})`,
          body: `Omgång ${f.roundNumber}: Laget vände ett underläge och tog tre poäng. Mental styrka.`,
          score: 28 + margin * 5 })
      }
    }
  }

  // One moment per fixture (highest score wins), then top 5 chronologically
  const byFixture = new Map<string, MomentWithScore>()
  for (const m of moments) {
    const key = m.fixtureId ?? `${m.round}_${m.type}`
    const existing = byFixture.get(key)
    if (!existing || m.score > existing.score) byFixture.set(key, m)
  }

  return [...byFixture.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.round - b.round)
    .map(({ score: _s, ...rest }) => rest)
}

function ordinal(n: number): string {
  if (n === 1) return '1:a'
  if (n === 2) return '2:a'
  return `${n}:e`
}

export type { SeasonSummary }

export function generateSeasonSummary(game: SaveGame, communityStandingEnd?: number): SeasonSummary {
  const managedClubId = game.managedClubId
  const club = game.clubs.find(c => c.id === managedClubId)!
  const managedPlayers = game.players.filter(p => p.clubId === managedClubId)

  // Completed league fixtures for managed club this season (no cup)
  const clubFixtures = game.fixtures.filter(f =>
    f.status === FixtureStatus.Completed &&
    f.season === game.currentSeason &&
    !f.isCup &&
    f.roundNumber <= 22 &&
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
      case ClubExpectation.ChallengeTop: return 5
      case ClubExpectation.WinLeague: return 2
    }
  }

  const threshold = expectationThreshold(boardExpectation)
  const metExpectation = finalPosition <= threshold || (boardExpectation === ClubExpectation.WinLeague && isChampion)

  // Exceeded: significantly better than threshold
  const exceededThresholds: Record<ClubExpectation, number> = {
    [ClubExpectation.AvoidBottom]: 6,
    [ClubExpectation.MidTable]: 3,
    [ClubExpectation.ChallengeTop]: 2,
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
    const pts = clubScore > oppScore ? 2 : clubScore === oppScore ? 1 : 0
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
      cumulativePoints += clubScore > oppScore ? 2 : clubScore === oppScore ? 1 : 0
    }
    roundPoints.push(cumulativePoints)
  }

  // Injuries — MatchEventType.Injury is never emitted by the match engine
  const totalInjuries = 0
  const mostInjuredPlayer = null

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

  // Cup result
  const cup = game.cupBracket
  let cupResult: SeasonSummary['cupResult'] = null
  if (cup) {
    if (cup.winnerId === managedClubId) {
      cupResult = 'winner'
    } else if (cup.matches.some(m => m.round === 4 && (m.homeClubId === managedClubId || m.awayClubId === managedClubId))) {
      cupResult = 'finalist'
    } else if (cup.matches.some(m => m.round === 3 && (m.homeClubId === managedClubId || m.awayClubId === managedClubId))) {
      cupResult = 'semifinal'
    } else if (cup.matches.some(m => m.round === 2 && (m.homeClubId === managedClubId || m.awayClubId === managedClubId))) {
      cupResult = 'quarter'
    } else {
      cupResult = 'eliminated'
    }
  }

  // Standings snapshot
  const standingsSnapshot = game.standings.map(s => ({
    clubId: s.clubId,
    position: s.position,
    points: s.points,
  }))

  // Narrative summary
  const expectationText: Record<ClubExpectation, string> = {
    [ClubExpectation.AvoidBottom]: 'undvika nedflyttning',
    [ClubExpectation.MidTable]: 'hålla mittentabellen',
    [ClubExpectation.ChallengeTop]: 'utmana toppen',
    [ClubExpectation.WinLeague]: 'vinna ligan',
  }

  let narrative = ''
  if (isChampion) {
    narrative = `En historisk säsong! ${club.name} tog SM-guldet ${game.currentSeason + 1} i en strålande slutspelskampanj.`
  } else if (expectationVerdict === 'exceeded') {
    narrative = `${club.name} överträffade alla förväntningar och slutade på ${ordinal(finalPosition)} plats — styrelsen förväntade sig bara att ${expectationText[boardExpectation]}.`
  } else if (expectationVerdict === 'met') {
    narrative = `En solid säsong för ${club.name}. ${ordinal(finalPosition)} plats uppfyller styrelsens krav på att ${expectationText[boardExpectation]}.`
  } else {
    narrative = `En besvikelse. ${club.name} slutade på ${ordinal(finalPosition)} plats — långt ifrån styrelsens mål att ${expectationText[boardExpectation]}.`
  }

  if (formTrend === 'improving') {
    narrative += ' Formen förbättrades tydligt under säsongens andra halva.'
  } else if (formTrend === 'declining' && finalPosition > 3) {
    // Guard: top-3 finishes shouldn't get a "tung avslutning" narrative
    narrative += ' En stark inledning följdes dessvärre av en tung avslutning.'
  }

  if (topScorer && topScorer.goals >= 5) {
    narrative += ` ${topScorer.name} stod för ${topScorer.goals} mål och var lagets viktigaste offensiva kraft.`
  }

  // Storyline references in narrative
  const seasonStorylines = (game.storylines ?? []).filter(s => s.season === game.currentSeason && s.resolved)
  if (seasonStorylines.length > 0) {
    const storyTexts: string[] = []
    const proStories = seasonStorylines.filter(s => s.type === 'went_fulltime_pro')
    if (proStories.length > 0) {
      storyTexts.push(`${proStories.length} spelare blev heltidsproffs — ett modigt steg.`)
    }
    const varselStories = seasonStorylines.filter(s => s.type === 'rescued_from_unemployment')
    if (varselStories.length > 0) {
      storyTexts.push('Klubben höll ihop trots varslet.')
    }
    const captainStories = seasonStorylines.filter(s => s.type === 'captain_rallied_team')
    if (captainStories.length > 0) {
      storyTexts.push('Kaptenen samlade laget i en svår period.')
    }
    if (storyTexts.length > 0) {
      narrative += ' ' + storyTexts.join(' ')
    }
  }

  // Cup result in narrative
  if (cupResult === 'winner' && isChampion) {
    narrative += ' Dessutom säkrades Svenska Cupen — en magnifik dubbel!'
  } else if (cupResult === 'winner') {
    narrative += ' Svenska Cupen vanns — en bedrift som lyser upp säsongen.'
  } else if (cupResult === 'finalist') {
    narrative += ' I cupen nådde laget finalen men fick nöja sig med silver.'
  }

  const storyTriggers = generateStoryTriggers(game)
  const baseKeyMoments = computeKeyMoments(game, clubFixtures, managedPlayers)

  // Merge resolved arc storylines into keyMoments (max 7 total, arcs ranked at 80 impact)
  const arcStorylineTypes = new Set([
    'hungrig_breakthrough', 'joker_vindicated', 'veteran_farewell', 'veteran_stayed',
    'lokal_hero_moment', 'captain_rallied_team', 'contract_drama_resolved', 'derby_echo_resolved',
  ])
  const resolvedArcStories = (game.storylines ?? []).filter(
    s => s.season === game.currentSeason && arcStorylineTypes.has(s.type as string) && s.resolved
  )
  type KeyMoment = NonNullable<SeasonSummary['keyMoments']>[number]
  const arcMoments: KeyMoment[] = resolvedArcStories.slice(0, 2).map(arc => ({
    round: arc.matchday,
    type: 'bigWin' as const, // placeholder type — displayed via displayText
    headline: arc.displayText,
    body: arc.description,
    relatedPlayerId: arc.playerId,
  }))
  const allMoments = [...baseKeyMoments, ...arcMoments]
  const keyMoments = allMoments.slice(0, 7)

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
    cupResult,
    standingsSnapshot,
    storyTriggers,
    keyMoments: keyMoments.length > 0 ? keyMoments : undefined,
    communityStandingStart: game.communityStanding ?? 50,
    communityStandingEnd: communityStandingEnd ?? game.communityStanding ?? 50,
    communityHighlights: [],
  }
}
