import type { Club } from '../entities/Club'
import type { Player } from '../entities/Player'
import type { Fixture } from '../entities/Fixture'
import type { StandingRow } from '../entities/SaveGame'
import { PlayerPosition } from '../enums'

export interface OpponentAnalysis {
  opponentClubId: string
  fixtureId: string
  level: 'basic' | 'detailed'
  formation?: string
  style?: string
  strengths: string[]
  weaknesses: string[]
  recommendation?: string
  recentForm?: string
  tablePosition?: number
  keyPlayers: { playerId: string; name: string; position: string; estimatedCA: number }[]
}

export function generateBasicAnalysis(
  opponentClub: Club,
  opponentPlayers: Player[],
  standings: StandingRow[],
  fixtures: Fixture[],
  fixtureId: string,
): OpponentAnalysis {
  const standing = standings.find(s => s.clubId === opponentClub.id)

  const sorted = [...opponentPlayers]
    .filter(p => !p.isInjured)
    .sort((a, b) => b.currentAbility - a.currentAbility)

  const keyPlayers = sorted.slice(0, 3).map(p => ({
    playerId: p.id,
    name: `${p.firstName[0]}. ${p.lastName}`,
    position: p.position,
    estimatedCA: Math.round(p.currentAbility / 5) * 5,
  }))

  const recentResults = fixtures
    .filter(f => f.status === 'completed' &&
      (f.homeClubId === opponentClub.id || f.awayClubId === opponentClub.id))
    .sort((a, b) => b.roundNumber - a.roundNumber)
    .slice(0, 5)

  const recentWins = recentResults.filter(f => {
    const isHome = f.homeClubId === opponentClub.id
    return isHome ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
  }).length

  const recentForm = recentResults.length === 0 ? 'Okänd form'
    : recentWins >= 4 ? 'Stark form'
    : recentWins >= 2 ? 'Ojämn form'
    : 'Svag form'

  return {
    opponentClubId: opponentClub.id,
    fixtureId,
    level: 'basic',
    strengths: [],
    weaknesses: [],
    recentForm,
    tablePosition: standing?.position,
    keyPlayers,
  }
}

export function generateDetailedAnalysis(
  opponentClub: Club,
  opponentPlayers: Player[],
  standings: StandingRow[],
  fixtures: Fixture[],
  fixtureId: string,
): OpponentAnalysis {
  const basic = generateBasicAnalysis(opponentClub, opponentPlayers, standings, fixtures, fixtureId)

  const available = opponentPlayers.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
  const avgCA = available.length > 0
    ? available.reduce((s, p) => s + p.currentAbility, 0) / available.length
    : 50

  const avgByPos = (pos: PlayerPosition[]) => {
    const group = available.filter(p => pos.includes(p.position as PlayerPosition))
    return group.length > 0 ? group.reduce((s, p) => s + p.currentAbility, 0) / group.length : 0
  }

  const gkAvg = avgByPos([PlayerPosition.Goalkeeper])
  const defAvg = avgByPos([PlayerPosition.Defender])
  const midAvg = avgByPos([PlayerPosition.Midfielder])
  const fwdAvg = avgByPos([PlayerPosition.Forward])

  const strengths: string[] = []
  const weaknesses: string[] = []

  if (fwdAvg > avgCA + 5) strengths.push('Stark anfallslinje')
  if (defAvg > avgCA + 5) strengths.push('Stabilt försvar')
  if (gkAvg > avgCA + 8) strengths.push('Bra målvakt')
  if (midAvg > avgCA + 5) strengths.push('Dominant mittfält')

  if (fwdAvg > 0 && fwdAvg < avgCA - 5) weaknesses.push('Svag attack')
  if (defAvg > 0 && defAvg < avgCA - 5) weaknesses.push('Sårbart försvar')
  if (midAvg > 0 && midAvg < avgCA - 5) weaknesses.push('Svagt mittfält')

  const injured = opponentPlayers.filter(p => p.isInjured)
  if (injured.length >= 3) weaknesses.push(`Skadeproblem (${injured.length} skadade)`)

  let recommendation = 'Jämn motståndare. Spelplanen avgör.'
  if (weaknesses.some(w => w.includes('Svagt mittfält'))) {
    recommendation = 'Pressa högt och dominera mittfältet.'
  } else if (weaknesses.some(w => w.includes('Sårbart försvar'))) {
    recommendation = 'Spela offensivt — deras försvar är sårbart.'
  } else if (strengths.some(s => s.includes('Stark anfallslinje'))) {
    recommendation = 'Prioritera defensiven — de har farliga forwards.'
  }

  const styleLabel: Record<string, string> = {
    defensive: 'Defensiv',
    balanced: 'Balanserad',
    attacking: 'Offensiv',
    physical: 'Fysisk',
    technical: 'Teknisk',
  }

  return {
    ...basic,
    level: 'detailed',
    formation: opponentClub.activeTactic.formation ?? '3-3-4',
    style: styleLabel[opponentClub.preferredStyle] ?? opponentClub.preferredStyle,
    strengths,
    weaknesses,
    recommendation,
    keyPlayers: available
      .sort((a, b) => b.currentAbility - a.currentAbility)
      .slice(0, 5)
      .map(p => ({
        playerId: p.id,
        name: `${p.firstName[0]}. ${p.lastName}`,
        position: p.position,
        estimatedCA: p.currentAbility,
      })),
  }
}
