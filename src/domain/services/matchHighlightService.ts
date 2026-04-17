import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { MatchHighlight, MatchHighlightCategory } from '../entities/SeasonSummary'
import { FixtureStatus, MatchEventType } from '../enums'
import { getRivalry } from '../data/rivalries'

interface ScoredFixture {
  f: Fixture
  score: number
  category: MatchHighlightCategory
  ourScore: number
  theirScore: number
  isHome: boolean
  margin: number
  lateGoalMinute?: number
}

function buildMatchNarrative(w: ScoredFixture, oppName: string, ourName: string): string {
  switch (w.category) {
    case 'late_winner':
      return `${w.lateGoalMinute}:e minuten. Vi gav oss inte. ${ourName} ${w.ourScore}–${w.theirScore} ${oppName}.`
    case 'derby_win':
      return `Derbyt mot ${oppName} — ${w.ourScore}–${w.theirScore}. Orten pratade om den här matchen i veckor.`
    case 'cup_drama':
      return `Cupen${w.f.roundNumber >= 4 ? ', finalen' : ''}. ${w.ourScore}–${w.theirScore}. Det sitter kvar.`
    case 'playoff_decisive':
      return `Slutspelsmatch. Vi gjorde det. ${w.ourScore}–${w.theirScore}.`
    case 'big_win':
      return `${w.ourScore}–${w.theirScore}. ${oppName} visste aldrig vad som träffade dem.`
    default:
      return `${ourName} ${w.ourScore}–${w.theirScore} ${oppName}.`
  }
}

export function selectMatchOfTheSeason(game: SaveGame): MatchHighlight | null {
  const managedFixtures = game.fixtures.filter(f =>
    f.status === FixtureStatus.Completed &&
    f.season === game.currentSeason &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (managedFixtures.length === 0) return null

  const scored: ScoredFixture[] = managedFixtures.map(f => {
    const isHome = f.homeClubId === game.managedClubId
    const ourScore = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const theirScore = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    const margin = ourScore - theirScore
    const isDerby = getRivalry(f.homeClubId, f.awayClubId) !== null

    let score = 0
    let category: MatchHighlightCategory = 'big_win'
    let lateGoalMinute: number | undefined

    // Late winner: our goal in last 5 min that clinched a win
    const ourClubId = game.managedClubId
    const lateGoal = (f.events ?? []).find(e =>
      e.type === MatchEventType.Goal &&
      e.minute >= 85 &&
      e.clubId === ourClubId &&
      margin > 0
    )
    if (lateGoal && margin > 0) {
      score += 40
      category = 'late_winner'
      lateGoalMinute = lateGoal.minute
    }

    if (isDerby && margin > 0) { score += 30; category = 'derby_win' }
    if (margin >= 5) { score += 25; if (category === 'big_win') category = 'big_win' }
    if (f.isCup && margin > 0 && (f.roundNumber ?? 0) >= 3) { score += 35; category = 'cup_drama' }
    if ((f.matchday ?? 0) > 26 && margin > 0) { score += 50; category = 'playoff_decisive' }

    return { f, score, category, ourScore, theirScore, isHome, margin, lateGoalMinute }
  })

  scored.sort((a, b) => b.score - a.score)
  const winner = scored[0]
  if (!winner || winner.score < 20) return null

  const oppClubId = winner.isHome ? winner.f.awayClubId : winner.f.homeClubId
  const opp = game.clubs.find(c => c.id === oppClubId)
  const ourClub = game.clubs.find(c => c.id === game.managedClubId)
  const narrative = buildMatchNarrative(winner, opp?.name ?? 'okänd', ourClub?.name ?? 'vi')

  const potmId = winner.f.report?.playerOfTheMatchId
  const potm = potmId ? game.players.find(p => p.id === potmId) : undefined

  return {
    fixtureId: winner.f.id,
    matchday: winner.f.matchday ?? 0,
    opponentName: opp?.name ?? 'okänd',
    homeScore: winner.f.homeScore ?? 0,
    awayScore: winner.f.awayScore ?? 0,
    isHome: winner.isHome,
    category: winner.category,
    narrative,
    potmName: potm ? `${potm.firstName} ${potm.lastName}` : undefined,
    shareImageReady: false,
  }
}
