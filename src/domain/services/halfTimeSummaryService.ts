import type { SaveGame } from '../entities/SaveGame'
import { MatchEventType } from '../enums'
import { getRivalry } from '../data/rivalries'

export interface HalfTimeMoment {
  emoji: string
  headline: string
  body: string
  round: number
  relatedPlayerId?: string
}

export interface HalfTimeSummary {
  position: number
  points: number
  pointsToTop8: number
  pointsToLeader: number
  tableText: string
  moments: HalfTimeMoment[]    // top 3 from autumn fixtures
  arcText: string | null
  coachTip: string
}

export function generateHalfTimeSummary(game: SaveGame): HalfTimeSummary {
  const managedClubId = game.managedClubId
  const managedPlayers = game.players.filter(p => p.clubId === managedClubId)

  // ── Tabellposition ──
  const standing = game.standings.find(s => s.clubId === managedClubId)
  const position = standing?.position ?? 99
  const points = standing?.points ?? 0
  const top8Standing = game.standings.find(s => s.position === 8)
  const leaderStanding = game.standings.find(s => s.position === 1)
  const pointsToTop8 = position <= 8 ? 0 : (top8Standing?.points ?? points) - points
  const pointsToLeader = (leaderStanding?.points ?? points) - points

  const tableText = position <= 8
    ? `Ni ligger ${position}:a med ${points} poäng — i slutspelszonen.`
    : `Ni ligger ${position}:a med ${points} poäng — ${pointsToTop8} poäng från slutspelsplatsen.`

  // ── Höstens stunder (liga-omgång 1-11) ──
  const autumnFixtures = game.fixtures.filter(
    f => (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
         f.status === 'completed' &&
         !f.isCup &&
         f.roundNumber <= 11
  )

  type ScoredMoment = HalfTimeMoment & { score: number }
  const candidates: ScoredMoment[] = []

  for (const f of autumnFixtures) {
    const isHome = f.homeClubId === managedClubId
    const myScore = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const theirScore = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    const margin = myScore - theirScore
    const opponentId = isHome ? f.awayClubId : f.homeClubId
    const opponent = game.clubs.find(c => c.id === opponentId)
    const oppName = opponent?.shortName ?? opponent?.name ?? '?'
    const scoreStr = isHome ? `${myScore}–${theirScore}` : `${theirScore}–${myScore}`
    const rivalry = getRivalry(f.homeClubId, f.awayClubId)

    if (rivalry && margin > 0) {
      candidates.push({ emoji: '🏆', headline: `Derbyvinst mot ${oppName}`, body: `${scoreStr} i ${rivalry.name}.`, round: f.roundNumber, score: 40 })
    } else if (rivalry && margin < 0) {
      candidates.push({ emoji: '😤', headline: `Derbyförlust mot ${oppName}`, body: `${scoreStr} i ${rivalry.name}. En att glömma.`, round: f.roundNumber, score: 30 })
    }

    if (margin >= 3) {
      candidates.push({ emoji: '💥', headline: `Stor seger mot ${oppName}`, body: `${scoreStr} — överlägset.`, round: f.roundNumber, score: margin * 10 })
    } else if (margin <= -3) {
      candidates.push({ emoji: '😔', headline: `Tung förlust mot ${oppName}`, body: `${scoreStr} — svårt att smälta.`, round: f.roundNumber, score: Math.abs(margin) * 8 })
    }

    // Hat trick
    const goalsByPlayer: Record<string, number> = {}
    for (const evt of f.events ?? []) {
      if (evt.type === MatchEventType.Goal && evt.playerId && evt.clubId === managedClubId) {
        goalsByPlayer[evt.playerId] = (goalsByPlayer[evt.playerId] ?? 0) + 1
      }
    }
    for (const [pid, goals] of Object.entries(goalsByPlayer)) {
      if (goals >= 3) {
        const p = managedPlayers.find(pl => pl.id === pid)
        const name = p ? `${p.firstName} ${p.lastName}` : 'Okänd'
        candidates.push({ emoji: '🎯', headline: `Hattrick — ${name}`, body: `${goals} mål mot ${oppName} (${scoreStr}).`, round: f.roundNumber, relatedPlayerId: pid, score: 35 })
        break
      }
    }

    // Comeback
    if (margin > 0) {
      const firstGoal = (f.events ?? []).find(e => e.type === MatchEventType.Goal)
      if (firstGoal && firstGoal.clubId !== managedClubId) {
        candidates.push({ emoji: '💪', headline: `Comeback mot ${oppName}`, body: `Vände underläge till ${scoreStr}.`, round: f.roundNumber, score: 28 })
      }
    }

    // Late winner
    if (margin === 1) {
      const lateGoals = (f.events ?? []).filter(e =>
        e.type === MatchEventType.Goal && e.clubId === managedClubId && (e.minute ?? 0) >= 80
      )
      if (lateGoals.length > 0) {
        candidates.push({ emoji: '⏱️', headline: `Sent avgörande mot ${oppName}`, body: `${scoreStr} — målgång sent.`, round: f.roundNumber, score: 22 })
      }
    }
  }

  // One per fixture, top 3 by score, then chronological
  const byFixtureId: Record<number, ScoredMoment> = {}
  for (const c of candidates) {
    const key = c.round
    if (!byFixtureId[key] || c.score > byFixtureId[key].score) byFixtureId[key] = c
  }
  const moments: HalfTimeMoment[] = Object.values(byFixtureId)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .sort((a, b) => a.round - b.round)
    .map(({ score: _s, ...rest }) => rest)

  // ── Arc-uppdatering ──
  const activeArc = (game.activeArcs ?? []).find(a => a.phase !== 'resolving')
  let arcText: string | null = null
  if (activeArc?.playerId) {
    const p = game.players.find(pl => pl.id === activeArc.playerId)
    if (p) {
      const name = `${p.firstName} ${p.lastName}`
      if (activeArc.type === 'hungrig_breakthrough') {
        arcText = `🔥 ${name} har fortfarande inte gjort mål — genombrott krävs.`
      } else if (activeArc.type === 'veteran_farewell') {
        arcText = `🏅 ${name}s kontrakt tickar — beslut krävs före mars.`
      } else if (activeArc.type === 'contract_drama') {
        arcText = `📋 ${name} i blåsväder — kontraktsfrågan hänger i luften.`
      } else if (activeArc.type === 'ledare_crisis') {
        arcText = `🦁 ${name} försöker hålla ihop laget under krisperioden.`
      } else if (activeArc.type === 'joker_redemption') {
        arcText = `🎭 ${name} delar fansen — vad händer i vår?`
      }
    }
  }

  // ── Tränartips ──
  const awayFixtures = autumnFixtures.filter(f => f.awayClubId === managedClubId)
  const awayWins = awayFixtures.filter(f => (f.awayScore ?? 0) > (f.homeScore ?? 0)).length
  const awayLosses = awayFixtures.filter(f => (f.awayScore ?? 0) < (f.homeScore ?? 0)).length

  const cornerGoals = autumnFixtures.reduce((sum, f) =>
    sum + (f.events ?? []).filter(e => e.type === MatchEventType.Goal && e.clubId === managedClubId && e.isCornerGoal).length, 0)
  const totalGoals = autumnFixtures.reduce((sum, f) =>
    sum + (f.events ?? []).filter(e => e.type === MatchEventType.Goal && e.clubId === managedClubId).length, 0)
  const cornerRatio = totalGoals > 0 ? cornerGoals / totalGoals : 0

  const last5 = autumnFixtures.slice(-5)
  const last5Points = last5.reduce((sum, f) => {
    const isH = f.homeClubId === managedClubId
    const our = isH ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const their = isH ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    return sum + (our > their ? 2 : our === their ? 1 : 0)
  }, 0)

  const club = game.clubs.find(c => c.id === managedClubId)
  const finances = club?.finances ?? 0

  let coachTip: string
  if (last5Points >= 8) {
    coachTip = 'Formen pekar uppåt inför våren. Håll kursen och tro på planen.'
  } else if (awayLosses >= 3 && awayFixtures.length >= 4) {
    coachTip = 'Bortaformen oroar. Överväg en försiktigare taktik på bortaplan inför vårens matcher.'
  } else if (cornerRatio < 0.12 && totalGoals > 0) {
    coachTip = 'Ni skapar få hörnmålsmöjligheter. En hörnspecialist i transferfönstret kan göra skillnad.'
  } else if (awayWins >= 2 && awayFixtures.length >= 3) {
    coachTip = 'Stark bortaform — ni tar poäng överallt. Utnyttja det i vårens bortatunga program.'
  } else if (finances < 0) {
    coachTip = 'Kassan krymper. Se över lönekostnaderna eller leta efter ny sponsor inför våren.'
  } else {
    coachTip = `Ni har ${points} poäng efter halva säsongen. En stabil grund att bygga vidare på.`
  }

  return { position, points, pointsToTop8, pointsToLeader, tableText, moments, arcText, coachTip }
}
