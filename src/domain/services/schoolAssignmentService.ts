// DREAM-016: Bandyhistorisk skoluppgift
// En gång per säsong (omgång ~10, december): en ung akademispelare frågar om klubbens historia.

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import type { SeasonSummary } from '../entities/SeasonSummary'

function summarizeSeason(s: SeasonSummary): string {
  if (s.playoffResult === 'champion') return 'säsongen vi blev SM'
  if (s.playoffResult === 'finalist') return 'SM-final-säsongen'
  if (s.finalPosition <= 3) return `säsongen vi slutade ${s.finalPosition}:a`
  return `säsong ${s.season}`
}

export function generateSchoolAssignmentEvent(game: SaveGame, nextMatchday: number): GameEvent | null {
  // Once per season, trigger around matchday 10-12
  if ((game.schoolAssignmentThisSeason ?? 0) >= game.currentSeason) return null
  if (nextMatchday < 10 || nextMatchday > 12) return null

  const eventId = `event_school_assignment_${game.currentSeason}`
  if ((game.resolvedEventIds ?? []).includes(eventId)) return null
  if ((game.pendingEvents ?? []).some(e => e.id === eventId)) return null

  // Find youngest managed academy player (age ≤ 21)
  const youngPlayers = game.players
    .filter(p => p.academyClubId === game.managedClubId && p.clubId === game.managedClubId && p.age <= 21)
    .sort((a, b) => a.age - b.age)
  const youngPlayer = youngPlayers[0]
  if (!youngPlayer) return null

  const playerName = `${youngPlayer.firstName} ${youngPlayer.lastName}`

  // Build choices from game history
  const summaries = game.seasonSummaries ?? []
  const notableSeason = summaries.find(s => s.finalPosition <= 3 || s.playoffResult === 'champion' || s.playoffResult === 'finalist')
  const clubLegend = (game.clubLegends ?? [])[0]

  const choices: GameEvent['choices'] = []

  if (notableSeason) {
    choices.push({
      id: 'tell_notable',
      label: `Berätta om ${notableSeason.season}/${notableSeason.season + 1} — ${summarizeSeason(notableSeason)}`,
      effect: {
        type: 'saveSchoolAssignment' as const,
        replyText: `Det var ${notableSeason.season}/${notableSeason.season + 1}. Vi slutade ${notableSeason.finalPosition}:a i serien${notableSeason.playoffResult === 'champion' ? ' och vann SM.' : '.'}`,
      },
    })
  }

  if (clubLegend) {
    choices.push({
      id: 'tell_legend',
      label: `Berätta om ${clubLegend.name} — legenden`,
      effect: {
        type: 'saveSchoolAssignment' as const,
        replyText: `${clubLegend.name} spelade ${clubLegend.seasons} säsonger för oss och gjorde ${clubLegend.totalGoals} mål. En av de bästa som någonsin burit vår tröja.`,
      },
    })
  }

  choices.push({
    id: 'tell_now',
    label: 'Berätta om den här säsongen och vad vi bygger',
    effect: {
      type: 'saveSchoolAssignment' as const,
      replyText: `Den här säsongen handlar om att bygga något hållbart. Varje match räknas. Varje träning räknas. Det är den historia som görs just nu.`,
    },
  })

  return {
    id: eventId,
    type: 'schoolAssignment',
    title: `📚 ${playerName} har en skoluppgift`,
    body: `Akademitränaren hälsar: "${playerName} fick i uppgift att intervjua någon i klubben om vår historia. Han frågade om han fick prata med dig. Vad berättar du?"`,
    sender: { name: playerName, role: `${youngPlayer.age} år, akademi` },
    relatedPlayerId: youngPlayer.id,
    choices,
    resolved: false,
    priority: 'low',
  }
}
