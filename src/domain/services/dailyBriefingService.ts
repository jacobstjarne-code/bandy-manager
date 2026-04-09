import type { SaveGame } from '../entities/SaveGame'
import { getRivalry } from '../data/rivalries'
import { getTransferWindowStatus } from './transferWindowService'
import { FixtureStatus } from '../enums'

export interface Briefing {
  text: string
  navigateTo?: { path: string; state?: Record<string, unknown> }
}

function getNextManagedFixture(game: SaveGame) {
  return game.fixtures
    .filter(f => f.status === FixtureStatus.Scheduled && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null
}

function findHotPlayer(game: SaveGame): { name: string; goals: number; matches: number } | null {
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const completed = game.fixtures.filter(f => f.status === FixtureStatus.Completed && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 5)

  for (const player of managedPlayers) {
    let goals = 0
    for (const fixture of completed) {
      const playerGoals = fixture.events.filter(e => e.type === 'goal' && e.playerId === player.id).length
      goals += playerGoals
    }
    if (goals >= 3) {
      return { name: `${player.firstName} ${player.lastName}`, goals, matches: completed.length }
    }
  }
  return null
}

function findAcademyProspect(game: SaveGame): { name: string; ca: number } | null {
  const youth = game.youthTeam
  if (!youth?.players?.length) return null
  const top = youth.players
    .filter(p => p.currentAbility >= 35)
    .sort((a, b) => b.currentAbility - a.currentAbility)[0]
  if (!top) return null
  return { name: `${top.firstName} ${top.lastName}`, ca: top.currentAbility }
}

function getTransferWindowCountdown(game: SaveGame): { opening: boolean; roundsUntil: number } | null {
  const status = getTransferWindowStatus(game.currentDate)
  const date = new Date(game.currentDate)
  const month = date.getMonth() + 1

  if (status.status !== 'closed') return null

  // Estimate rounds until next window based on current month
  // Season runs Oct–Mar: ~2 rounds/month
  let monthsUntil: number
  if (month >= 11 || month <= 7) {
    // Closed Nov–Dec → Jan (winter window)
    if (month >= 11) monthsUntil = 14 - month  // Nov=3, Dec=2
    else monthsUntil = 8 - month               // Feb=6, Mar=5, ... Jul=1
    // We care about closeness (≤3 rounds away)
    const roundsUntil = monthsUntil * 2
    if (roundsUntil <= 4) {
      return { opening: true, roundsUntil }
    }
  }
  return null
}

function getLatestHeadline(game: SaveGame): string | null {
  const recent = game.inbox
    .filter(i => i.title && (i.type === 'media' || i.type === 'mediaEvent' || i.type === 'matchResult'))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 1)[0]
  return recent?.title ?? null
}

export function generateBriefing(game: SaveGame): Briefing | null {
  // 1. Derby?
  const nextFixture = getNextManagedFixture(game)
  if (nextFixture) {
    const rivalry = getRivalry(nextFixture.homeClubId, nextFixture.awayClubId)
    if (rivalry) {
      const opponentId = nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId
      const h = game.rivalryHistory?.[opponentId]
      const histText = h ? `V${h.wins} O${h.draws} F${h.losses} i historiken.` : 'Historiken börjar nu.'
      return { text: `🔥 Derby. ${rivalry.name}. ${histText}` }
    }
  }

  // 2. Spelare i form (≥3 mål senaste 5)
  const hot = findHotPlayer(game)
  if (hot) {
    return { text: `📈 ${hot.name} i glödande form — ${hot.goals} mål senaste ${hot.matches} matcherna.` }
  }

  // 3. Patron har krav
  if (game.patron?.isActive && game.patron.demands?.length) {
    return { text: `👤 ${game.patron.name}: "${game.patron.demands[0]}"` }
  }

  // 4. Akademispelare hög CA
  const prospect = findAcademyProspect(game)
  if (prospect) {
    return {
      text: `🎓 ${prospect.name} (P19) börjar visa A-lagsklass — befordra?`,
      navigateTo: { path: '/game/club', state: { tab: 'akademi' } },
    }
  }

  // 5. Transferfönster nära
  const windowInfo = getTransferWindowCountdown(game)
  if (windowInfo) {
    return { text: `💼 Transferfönstret ${windowInfo.opening ? 'öppnar' : 'stänger'} om ${windowInfo.roundsUntil} omgångar.` }
  }

  // 6. Tidningsrubrik
  const headline = getLatestHeadline(game)
  if (headline) {
    return { text: `📰 ${game.localPaperName ?? 'Lokaltidningen'}: ${headline}` }
  }

  return null
}
