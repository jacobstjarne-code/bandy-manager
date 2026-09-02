import type { GameEvent } from '../entities/GameEvent'
import type { SaveGame } from '../entities/SaveGame'
import { generateYouthTeam } from './academyService'

export const ACADEMY_SCHOOL_PARTNERSHIP_ROUND = 16

/**
 * C-T6: connect the existing advanced bandy school to the canonical P19 team.
 * Candidate data is stored on the event so resolving it cannot select a
 * different set of players than the decision the player was shown.
 */
export function generateAcademySchoolPartnershipEvent(
  game: SaveGame,
  nextMatchday: number,
  seed: number,
): GameEvent | null {
  if (nextMatchday !== ACADEMY_SCHOOL_PARTNERSHIP_ROUND) return null
  if (!game.communityActivities?.bandySchool || !game.youthTeam) return null

  const eventId = `event_academy_school_partnership_${game.currentSeason}`
  const alreadyExists = (game.pendingEvents ?? []).some(event => event.id === eventId)
    || (game.deferredDecisions ?? []).some(event => event.id === eventId)
    || (game.resolvedEventIds ?? []).includes(eventId)
  if (alreadyExists) return null

  const club = game.clubs.find(candidate => candidate.id === game.managedClubId)
  if (!club) return null

  const candidates = generateYouthTeam(
    club,
    game.academyLevel ?? 'basic',
    game.currentSeason,
    seed,
  ).players.slice(0, 3).map((player, index) => ({
    ...player,
    id: `youth_bandy_school_${game.currentSeason}_${club.id}_${index}`,
  }))

  return {
    id: eventId,
    type: 'academyDecision',
    title: 'Bandyskola → Akademi',
    body: 'Bandyskolan har producerat 3 barn som vill börja i P19.',
    relatedClubId: club.id,
    schoolIntakeCandidates: candidates,
    choices: [
      {
        id: 'take_all',
        label: 'Ta in alla tre',
        subtitle: '+3 spelare till P19 · −8 tkr den här säsongen',
        consequenceLevel: 'costly',
        costLabel: 'Kostar 8 tkr den här säsongen',
        effect: { type: 'income', amount: -8_000 },
      },
      {
        id: 'take_best',
        label: 'Ta in de två bästa',
        subtitle: '+2 spelare till P19 · −5 tkr den här säsongen',
        consequenceLevel: 'costly',
        costLabel: 'Kostar 5 tkr den här säsongen',
        effect: { type: 'income', amount: -5_000 },
      },
      {
        id: 'send_neighbor',
        label: 'Skicka dem till grannklubben',
        subtitle: '+8 tkr engångsersättning · −5 orten',
        effect: {
          type: 'multiEffect',
          subEffects: JSON.stringify([
            { type: 'income', amount: 8_000 },
            { type: 'communityStanding', amount: -5 },
          ]),
        },
      },
    ],
    resolved: false,
  }
}
