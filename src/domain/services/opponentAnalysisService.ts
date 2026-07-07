import type { Club } from '../entities/Club'
import type { Player } from '../entities/Player'
import type { Fixture } from '../entities/Fixture'
import type { StandingRow } from '../entities/SaveGame'
import { PlayerPosition, TacticMentality } from '../enums'

export interface OpponentAnalysis {
  opponentClubId: string
  fixtureId: string
  level: 'basic' | 'detailed'
  formation?: string
  style?: string
  strengths: string[]
  weaknesses: string[]
  recommendation?: string
  /** Yta 3 (Audit-syntes, 2026-07-07): recommendation mappad till en TacticMentality,
   *  så Analys→Taktik-bryggan kan markera den föreslagna knappen utan att TacticBoardCard
   *  behöver tolka fritext. undefined = "Jämn motståndare" — ingen falsk föreslagen knapp
   *  när analysen faktiskt inte lutar. Se mapRecommendationToMentality() nedan. */
  suggestedMentality?: TacticMentality
  recentForm?: string
  tablePosition?: number
  keyPlayers: { playerId: string; name: string; position: string; estimatedCA: number }[]
}

/**
 * Yta 3 (Audit-syntes, 2026-07-07): enda källan för recommendation → TacticMentality.
 * Testbar isolerat från resten av analysgenereringen. Bara de tre riktade
 * rekommendationerna ger ett förslag — "Jämn motståndare" ger avsiktligt undefined.
 *
 * Balanced har MEDVETET ingen väg in — jämn motståndare föreslår ingenting (Fables
 * textdömning 2026-07-07: en falsk "Balanserad föreslås"-pill hade sagt att assistenten
 * har en åsikt när den inte har det, värre än ingen pill alls). Två rekommendationer
 * mappar till Offensive, en till Defensive — det är en spegling av analystjänstens
 * egen recommendation-logik (fler offensiva utfall), inte en design-obalans. Lägger
 * någon till en balans-rekommendation i generateDetailedAnalysis utan att uppdatera
 * denna funktion faller den tyst till undefined — det är rätt reservläge, men om
 * avsikten var en Balanced-väg, uppdatera HÄR, inte bara i analysgenereringen.
 */
export function mapRecommendationToMentality(recommendation: string | undefined): TacticMentality | undefined {
  if (recommendation === 'Pressa högt och dominera mitten.') return TacticMentality.Offensive
  if (recommendation === 'Spela offensivt — deras försvar är sårbart.') return TacticMentality.Offensive
  if (recommendation === 'Prioritera defensiven — de har farliga forwards.') return TacticMentality.Defensive
  return undefined
}

/**
 * Yta 3 textleverans (Fable, 2026-07-07): varför-raden under SPELSTIL-knapparna.
 * En variant per aktiv recommendation, assistentens röst (Sixten-registret — kort,
 * konkret, understatement). Namnger vad assistenten SÅG, inte en order — "Stå stadigt
 * först" i defensivfallet bär avsiktligt att det är en start, inte ett låst läge.
 * "Jämn motståndare"-fallet har ingen rad här — det gates redan bort i presentations-
 * lagret via suggestedMentality===undefined, aldrig ett saknat-mall-fall.
 */
const RECOMMENDATION_WHY_LINE: Record<string, (coachName: string) => string> = {
  'Pressa högt och dominera mitten.': (coach) =>
    `${coach} såg det: deras halvlinje är tunn. Pressa högt, ta mitten.`,
  'Spela offensivt — deras försvar är sårbart.': (coach) =>
    `${coach} såg en spricka i deras försvar. Våga framåt.`,
  'Prioritera defensiven — de har farliga forwards.': (coach) =>
    `${coach} varnar för deras forwards. Stå stadigt först.`,
}

/** Yta 3: recommendation + assistentens namn → varför-raden. undefined om ingen
 *  aktiv rekommendation mappar (inkl. "Jämn motståndare", som aldrig ska ha en rad). */
export function getSuggestionWhyLine(recommendation: string | undefined, coachName: string): string | undefined {
  if (!recommendation) return undefined
  const template = RECOMMENDATION_WHY_LINE[recommendation]
  return template ? template(coachName) : undefined
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
  if (midAvg > avgCA + 5) strengths.push('Stark halvlinje')

  if (fwdAvg > 0 && fwdAvg < avgCA - 5) weaknesses.push('Svag attack')
  if (defAvg > 0 && defAvg < avgCA - 5) weaknesses.push('Sårbart försvar')
  if (midAvg > 0 && midAvg < avgCA - 5) weaknesses.push('Svag halvlinje')

  const injured = opponentPlayers.filter(p => p.isInjured)
  if (injured.length >= 3) weaknesses.push(`Skadeproblem (${injured.length} skadade)`)

  let recommendation = 'Jämn motståndare. Spelplanen avgör.'
  if (weaknesses.some(w => w.includes('Svag halvlinje'))) {
    recommendation = 'Pressa högt och dominera mitten.'
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
    suggestedMentality: mapRecommendationToMentality(recommendation),
    keyPlayers: available
      .sort((a, b) => b.currentAbility - a.currentAbility)
      .slice(0, 5)
      .map(p => ({
        playerId: p.id,
        name: `${p.firstName[0]}. ${p.lastName}`,
        position: p.position,
        estimatedCA: Math.round(p.currentAbility),
      })),
  }
}
