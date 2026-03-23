import type { Fixture } from '../entities/Fixture'
import type { Player } from '../entities/Player'
import type { Club } from '../entities/Club'
import type { InboxItem, StandingRow } from '../entities/SaveGame'
import type { YouthIntakeResult } from './youthIntakeService'
import type { NotableDevelopment } from './playerDevelopmentService'
import type { TrainingFocus } from '../entities/Training'
import { InboxItemType, ClubExpectation } from '../enums'
import { trainingTypeLabel, trainingIntensityLabel } from './trainingService'

function generateId(type: InboxItemType): string {
  return `inbox_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function createMatchResultItem(
  fixture: Fixture,
  managedClubId: string,
  currentDate: string,
): InboxItem {
  const isHome = fixture.homeClubId === managedClubId
  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const opponentScore = isHome ? fixture.awayScore : fixture.homeScore

  let result: string
  if (myScore > opponentScore) {
    result = isHome
      ? `Ni vann ${myScore}-${opponentScore} hemma.`
      : `Ni vann ${myScore}-${opponentScore} borta.`
  } else if (myScore < opponentScore) {
    result = isHome
      ? `Ni förlorade ${myScore}-${opponentScore} hemma.`
      : `Ni förlorade ${myScore}-${opponentScore} borta.`
  } else {
    result = `Oavgjort ${myScore}-${opponentScore}.`
  }

  return {
    id: generateId(InboxItemType.MatchResult),
    date: currentDate,
    type: InboxItemType.MatchResult,
    title: `Matchresultat: ${fixture.homeScore}-${fixture.awayScore}`,
    body: result,
    relatedFixtureId: fixture.id,
    isRead: false,
  }
}

export function createInjuryItem(
  player: Player,
  estimatedDaysOut: number,
  currentDate: string,
): InboxItem {
  return {
    id: generateId(InboxItemType.Injury),
    date: currentDate,
    type: InboxItemType.Injury,
    title: `Skada: ${player.firstName} ${player.lastName}`,
    body: `${player.firstName} ${player.lastName} skadade sig och missar uppskattningsvis ${estimatedDaysOut} dagar.`,
    relatedPlayerId: player.id,
    isRead: false,
  }
}

export function createSuspensionItem(
  player: Player,
  gamesOut: number,
  currentDate: string,
): InboxItem {
  return {
    id: generateId(InboxItemType.Suspension),
    date: currentDate,
    type: InboxItemType.Suspension,
    title: `Avstängning: ${player.firstName} ${player.lastName}`,
    body: `${player.firstName} ${player.lastName} är avstängd i ${gamesOut} match(er).`,
    relatedPlayerId: player.id,
    isRead: false,
  }
}

export function createYouthIntakeItem(
  result: YouthIntakeResult,
  club: Club,
  currentDate: string,
  scoutTexts: Record<string, string>,
): InboxItem {
  const year = new Date(currentDate).getFullYear()
  const count = result.newPlayers.length

  let body = `${count} ungdomsspelare är klara för ${club.name} denna säsong.\n\n`

  // Highlight top prospect if any
  if (result.record.topProspectId) {
    const prospect = result.newPlayers.find((p) => p.id === result.record.topProspectId)
    if (prospect) {
      body += `Topptalang: ${prospect.firstName} ${prospect.lastName} (${prospect.position}, PA ${prospect.potentialAbility})\n`
      const scoutText = scoutTexts[prospect.id]
      if (scoutText) {
        body += `Scout: "${scoutText}"\n`
      }
      body += '\n'
    }
  }

  // Show scout texts for up to 2 players
  const toHighlight = result.newPlayers
    .slice()
    .sort((a, b) => b.potentialAbility - a.potentialAbility)
    .slice(0, 2)

  for (const p of toHighlight) {
    if (p.id === result.record.topProspectId) continue
    const text = scoutTexts[p.id]
    if (text) {
      body += `${p.firstName} ${p.lastName}: "${text}"\n`
    }
  }

  return {
    id: generateId(InboxItemType.YouthIntake),
    date: currentDate,
    type: InboxItemType.YouthIntake,
    title: `Ungdomskull ${year} klar`,
    body: body.trim(),
    isRead: false,
  }
}

export function createPlayerDevelopmentItem(
  changes: NotableDevelopment[],
  players: Player[],
  currentDate: string,
): InboxItem | null {
  if (changes.length === 0) return null

  const playerMap = new Map(players.map((p) => [p.id, p]))

  // Sort by magnitude of change, take top 5
  const sorted = [...changes].sort((a, b) => Math.abs(b.newValue - b.oldValue) - Math.abs(a.newValue - a.oldValue))
  const top5 = sorted.slice(0, 5)

  const lines = top5.map((c) => {
    const player = playerMap.get(c.playerId)
    const name = player ? `${player.firstName} ${player.lastName}` : c.playerId
    const diff = c.newValue - c.oldValue
    const sign = diff > 0 ? '+' : ''
    return `${name}: ${c.attribute} ${sign}${Math.round(diff)}`
  })

  return {
    id: generateId(InboxItemType.PlayerDevelopment),
    date: currentDate,
    type: InboxItemType.PlayerDevelopment,
    title: 'Spelarutveckling — noterbara förändringar',
    body: lines.join('\n'),
    isRead: false,
  }
}

export function createContractExpiringItem(
  player: Player,
  seasonExpiry: number,
  currentDate: string,
): InboxItem {
  return {
    id: generateId(InboxItemType.ContractExpiring),
    date: currentDate,
    type: InboxItemType.ContractExpiring,
    title: `Kontrakt går ut: ${player.firstName} ${player.lastName}`,
    body: `${player.firstName} ${player.lastName}s kontrakt går ut efter säsong ${seasonExpiry}. Överväg förlängning.`,
    relatedPlayerId: player.id,
    isRead: false,
  }
}

export function createBoardFeedbackItem(
  club: Club,
  standing: StandingRow,
  totalTeams: number,
  currentDate: string,
): InboxItem {
  let expectedPosition: number
  switch (club.boardExpectation) {
    case ClubExpectation.WinLeague:
      expectedPosition = 1
      break
    case ClubExpectation.ChallengeTop:
      expectedPosition = 3
      break
    case ClubExpectation.MidTable:
      expectedPosition = Math.round(totalTeams * 0.5)
      break
    case ClubExpectation.AvoidBottom:
      expectedPosition = totalTeams - 2
      break
  }

  const actual = standing.position
  let body: string

  if (actual <= expectedPosition) {
    // Positive feedback
    const options = [
      `Styrelsen är mycket nöjd med lagets insatser. Position ${actual} överstiger förväntningarna och vi ser ljust på fortsättningen.`,
      `Bra jobbat! Laget levererar mer än vi hade hoppats. Håll den nivån så kan vi nå något riktigt bra i år.`,
      `Styrelsen är imponerad. Position ${actual} är bättre än vad vi förväntade oss, och det märks i hela klubben.`,
      `Ni har överträffat förväntningarna. Styrelsen vill uppmuntra det arbete som görs — fortsätt på den vägen.`,
    ]
    body = options[Math.abs(actual + standing.points) % options.length]
  } else if (actual > expectedPosition + 2) {
    // Negative feedback
    const options = [
      `Styrelsen är orolig. Position ${actual} är klart under vad vi hade förväntat oss, och vi vill se en tydlig förbättring.`,
      `Vi är inte nöjda med läget. En plats på ${actual} räcker inte — vi behöver se en annan riktning framåt.`,
      `Det är dags att ta situationen på allvar. Position ${actual} ger inte det vi behöver, och styrelsen vill ha ett samtal om vägen framåt.`,
      `Resultaten är inte acceptabla. Styrelsen förväntar sig att ni tar ansvar och vänder trenden inom kort.`,
    ]
    body = options[Math.abs(actual + standing.points) % options.length]
  } else {
    // Neutral
    const options = [
      `Styrelsen noterar att laget befinner sig på position ${actual}. Det är okej för stunden, men vi förväntar oss en bättre placering framöver.`,
      `Läget är godkänt men inte tillfredsställande. Position ${actual} är nära förväntningarna, men det finns mer att hämta.`,
      `Styrelsen följer läget noga. Ni är inte långt ifrån det vi hoppas på — men det krävs mer konsistens.`,
      `En godkänd men inte imponerande period. Position ${actual} är acceptabelt för nu, men vi vill se mer.`,
    ]
    body = options[Math.abs(actual + standing.points) % options.length]
  }

  return {
    id: generateId(InboxItemType.BoardFeedback),
    date: currentDate,
    type: InboxItemType.BoardFeedback,
    title: 'Styrelsens syn på läget',
    body,
    isRead: false,
  }
}

export function createTrainingItem(
  focus: TrainingFocus,
  roundNumber: number,
  injuredPlayers: Player[],
  currentDate: string,
): InboxItem {
  const typeLabel = trainingTypeLabel(focus.type)
  const intensityLabel = trainingIntensityLabel(focus.intensity)

  let body = `Omgång ${roundNumber}: ${typeLabel} (${intensityLabel}).`

  if (injuredPlayers.length === 0) {
    body += ' Inga skador.'
  } else {
    for (const p of injuredPlayers) {
      const weeks = Math.ceil(p.injuryDaysRemaining / 7)
      body += `\n⚠️ ${p.firstName} ${p.lastName} skadades under träning. Beräknad frånvaro: ${weeks} vecka${weeks > 1 ? 'r' : ''}.`
    }
  }

  return {
    id: generateId(InboxItemType.Training),
    date: currentDate,
    type: InboxItemType.Training,
    title: `Träning: ${typeLabel}`,
    body,
    isRead: false,
  }
}
