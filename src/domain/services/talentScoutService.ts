import type { Player } from '../entities/Player'
import type { Club } from '../entities/Club'
import type { TalentSearchRequest, TalentSearchResult, TalentSuggestion } from '../entities/SaveGame'

function generateTalentNote(player: Player, _club: Club | undefined, rand: () => number): string {
  const attrs = player.attributes
  const strengths: string[] = []
  if (attrs.shooting > 70) strengths.push('starkt avslut')
  if (attrs.skating > 70) strengths.push('snabb på isen')
  if (attrs.passing > 70) strengths.push('bra speluppbyggare')
  if (attrs.defending > 70) strengths.push('solid i defensiven')
  if (attrs.workRate > 75) strengths.push('enorm arbetskapacitet')
  if (attrs.vision > 70) strengths.push('bra spelöga')

  const ageComment = player.age <= 21
    ? 'Ung och formbar — stor utvecklingspotential.'
    : player.age <= 26
    ? 'I sina bästa år. Klar att leverera direkt.'
    : 'Rutinerad. Vet vad som krävs.'

  const strengthText = strengths.length > 0
    ? `Styrkor: ${strengths.slice(0, 2).join(' och ')}.`
    : 'Allroundspelare utan tydliga svagheter.'

  void rand
  return `${strengthText} ${ageComment}`
}

export function executeTalentSearch(
  request: TalentSearchRequest,
  allPlayers: Player[],
  allClubs: Club[],
  managedClubId: string,
  rand: () => number,
  season: number,
  round: number,
): TalentSearchResult {
  const candidates = allPlayers.filter(p => {
    if (p.clubId === managedClubId) return false
    if (request.position !== 'any' && p.position !== request.position) return false
    if (p.age > request.maxAge) return false
    if (p.salary > request.maxSalary) return false
    return true
  })

  const scored = candidates.map(p => ({
    player: p,
    score: p.currentAbility * 0.6 + p.potentialAbility * 0.3 +
           (30 - Math.min(p.age, 30)) * 0.5 + rand() * 15,
  })).sort((a, b) => b.score - a.score)

  const count = 2 + (rand() > 0.5 ? 1 : 0)
  const selected = scored.slice(0, count)

  return {
    id: `ts_${season}_r${round}`,
    requestId: request.id,
    players: selected.map(({ player }): TalentSuggestion => {
      const accuracy = 4 + Math.floor(rand() * 4)
      const estimatedCA = Math.max(1, Math.min(99,
        Math.round(player.currentAbility + (rand() - 0.5) * accuracy * 2)
      ))
      const club = allClubs.find(c => c.id === player.clubId)
      return {
        playerId: player.id,
        scoutNotes: generateTalentNote(player, club, rand),
        estimatedCA,
        estimatedValue: player.marketValue ?? 50000,
      }
    }),
    season,
    round,
  }
}
