import type { Fixture } from '../entities/Fixture'
import type { Player } from '../entities/Player'
import type { Club } from '../entities/Club'
import type { InboxItem } from '../entities/SaveGame'
import type { YouthIntakeResult } from './youthIntakeService'
import type { NotableDevelopment } from './playerDevelopmentService'
import type { TrainingFocus } from '../entities/Training'
import { InboxItemType } from '../enums'
import { positionShort } from '../format'
import { SUSPENSION_INCIDENT_LINES, SUSPENSION_INCIDENT_MULTI_LINES } from '../data/suspensionText'
import { trainingTypeLabel, trainingIntensityLabel } from './trainingService'
import { getInjurySeverity, DIAGNOSIS_LINES, pickRecoveryLine } from '../data/injuryDoctorText'
import type { DoctorIdentity } from '../data/injuryDoctorText'
import { deriveUtfall } from './matchTypeAxes'

function generateId(type: InboxItemType): string {
  return `inbox_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function createMatchResultItem(
  fixture: Fixture,
  managedClubId: string,
  currentDate: string,
  clubs: Club[],
): InboxItem {
  const isHome = fixture.homeClubId === managedClubId
  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const opponentScore = isHome ? fixture.awayScore : fixture.homeScore

  const homeClub = clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = clubs.find(c => c.id === fixture.awayClubId)
  const homeShort = homeClub?.shortName ?? 'Hemma'
  const awayShort = awayClub?.shortName ?? 'Borta'

  const prefix = fixture.isCup ? 'Cupen' : 'Matchresultat'
  const title = `${prefix}: ${homeShort}–${awayShort} ${fixture.homeScore}–${fixture.awayScore}`

  let result: string
  const utfall = deriveUtfall(fixture, managedClubId)
  const decider = fixture.penaltyResult ? ' efter straffar' : fixture.overtimeResult ? ' efter förlängning' : ''
  if (utfall === 'vunnet') {
    result = isHome
      ? `Ni vann${decider} ${myScore}–${opponentScore} hemma.`
      : `Ni vann${decider} ${myScore}–${opponentScore} borta.`
  } else if (utfall === 'forlorat') {
    result = isHome
      ? `Ni förlorade${decider} ${myScore}–${opponentScore} hemma.`
      : `Ni förlorade${decider} ${myScore}–${opponentScore} borta.`
  } else {
    result = `Oavgjort ${myScore}–${opponentScore}.`
  }

  return {
    id: generateId(InboxItemType.MatchResult),
    date: currentDate,
    type: InboxItemType.MatchResult,
    title,
    body: result,
    relatedFixtureId: fixture.id,
    isRead: false,
  }
}

/**
 * Pool 1a (2026-07-18): body bär doktorns diagnos (DIAGNOSIS_LINES, per
 * severity via getInjurySeverity) istf en mekanisk "missar N dagar"-mening.
 * Radantalet flyttat till titeln (veckor, samma konvention som
 * matchInjuryService.ts's generateInjuryInboxItem) så at-a-glance-läget
 * bevaras trots att body nu är prosa. Deterministisk radval: samma
 * charCodeAt-hash-mönster som createSuspensionItem nedan använder i samma fil.
 */
export function createInjuryItem(
  player: Player,
  estimatedDaysOut: number,
  currentDate: string,
  doctor?: DoctorIdentity,
): InboxItem {
  const spelare = `${player.firstName} ${player.lastName}`
  const severity = getInjurySeverity(estimatedDaysOut)
  const lines = DIAGNOSIS_LINES[severity]
  const lineIdx = Math.abs(player.id.charCodeAt(0) + estimatedDaysOut) % lines.length
  const body = lines[lineIdx].replace(/\{spelare\}/g, spelare)
  const weeksOut = Math.max(1, Math.ceil(estimatedDaysOut / 7))

  return {
    id: generateId(InboxItemType.Injury),
    date: currentDate,
    type: InboxItemType.Injury,
    title: `Skada: ${spelare} (${weeksOut} v borta)`,
    body,
    relatedPlayerId: player.id,
    isRead: false,
    fromRole: doctor?.name,
  }
}

/**
 * @cites Player.suspensionCause, gamesOut
 */
export function createSuspensionItem(
  player: Player,
  gamesOut: number,
  currentDate: string,
): InboxItem {
  const cause = player.suspensionCause
  const spelareStr = `${player.firstName} ${player.lastName}`
  let body: string
  if (cause) {
    // PÅSTÅENDEGRINDEN väg 2 (2026-08-24, Jacobs dom): gamesOut > 1 (alltid
    // 3, aldrig ett mellanting — se playerStateProcessor.ts) väljer nu
    // SUSPENSION_INCIDENT_MULTI_LINES, textpoolen som legat oåtkomlig sedan
    // C-U1 (2026-05-25) eftersom suspensionGamesRemaining aldrig kunde bli
    // mer än 1 förrän nu. Ingen orsaksklassificering i texten (tackling mot
    // armbåge finns inte i datan) — bara att nämnden såg allvarligt på det.
    const pool = gamesOut > 1 ? SUSPENSION_INCIDENT_MULTI_LINES : SUSPENSION_INCIDENT_LINES
    const template = pool[Math.abs(player.id.charCodeAt(0) + cause.sinceMatchday) % pool.length]
    body = template
      .replace('{spelare}', spelareStr)
      .replace('{motståndare}', cause.opponentName)
      .replace('{omg}', String(cause.sinceMatchday))
      .replace('{kvar}', String(gamesOut))
  } else {
    body = `${spelareStr} är avstängd i ${gamesOut} match(er).`
  }
  return {
    id: generateId(InboxItemType.Suspension),
    date: currentDate,
    type: InboxItemType.Suspension,
    title: `Avstängning: ${spelareStr}`,
    body,
    relatedPlayerId: player.id,
    isRead: false,
  }
}

export function createRecoveryItem(
  player: Player,
  currentDate: string,
): InboxItem {
  const spelare = `${player.firstName} ${player.lastName}`
  return {
    id: generateId(InboxItemType.Recovery),
    date: currentDate,
    type: InboxItemType.Recovery,
    title: `Tillbaka: ${spelare}`,
    body: pickRecoveryLine(player.id, spelare),
    relatedPlayerId: player.id,
    isRead: false,
  }
}

/** Pool 1c: eftersnack när spela-på-gamblet avgjorts. body = en av
 *  PLAY_THROUGH_AFTERMATH-raderna (redan Opus-text, injuryDoctorText.ts) —
 *  skickas in färdig, ingen ny copy skrivs här. */
export function createPlayThroughAftermathItem(
  player: Player,
  aftermathLine: string,
  currentDate: string,
): InboxItem {
  return {
    id: generateId(InboxItemType.Injury),
    date: currentDate,
    type: InboxItemType.Injury,
    title: `Läkarbesked: ${player.firstName} ${player.lastName}`,
    body: aftermathLine,
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
      // Språkläcka (audit 2026-08-29): rå positions-enum ("goalkeeper") + rå "PA".
      // positionShort är kanonisk; "potential" är ordet ScoutingTab redan använder.
      body += `Topptalang: ${prospect.firstName} ${prospect.lastName} (${positionShort(prospect.position)}, potential ${prospect.potentialAbility})\n`
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

/**
 * roundNumber här är bara en etikett för omgången som just nu processas
 * (anroparen skickar in nextRound direkt, trainingProcessor.ts) — ingen
 * sortering/ordning över fixtures, så det är inte samma klass av fel som
 * roundNumber-som-spelordning (se batch-05.md).
 *
 * @cites focus.type, focus.intensity, roundNumber, injuredPlayers
 */
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
    title: `Träning omg ${roundNumber}: ${typeLabel}`,
    body,
    isRead: false,
    injuredPlayerCount: injuredPlayers.length,
  }
}
