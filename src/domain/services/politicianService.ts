import type { LocalPolitician } from '../entities/SaveGame'
import type { Club } from '../entities/Club'
import type { SaveGame } from '../entities/SaveGame'
import { mulberry32 } from '../utils/random'

export function calculateKommunBidrag(
  politician: LocalPolitician,
  club: Club,
  communityStanding: number,
  game: SaveGame,
): number {
  const base = 30000
  const generosityMod = (politician.generosity ?? 60) / 100
  const communityMod = communityStanding / 50  // 0-2
  const activeYouth = (game.youthTeam?.players.length ?? 0) + (game.communityActivities?.bandySchool ? 15 : 0)
  const lokStod = activeYouth * 100
  let agendaBonus = 0
  if (politician.agenda === 'youth' && game.communityActivities?.bandySchool) agendaBonus = 20000
  if (politician.agenda === 'inclusion' && game.communityActivities?.bandySchool) agendaBonus = 15000
  if (politician.agenda === 'prestige' && (club.reputation ?? 50) > 65) agendaBonus = 10000
  if (politician.agenda === 'infrastructure' && (club.facilities ?? 50) > 60) agendaBonus = 15000
  const relBonus = politician.relationship > 70 ? 10000 : 0
  return Math.round(base * generosityMod * communityMod + lokStod + agendaBonus + relBonus)
}

export function generateNewPolitician(seed: number, currentSeason: number): LocalPolitician {
  const rand = mulberry32(seed)
  const agendas: Array<'youth' | 'inclusion' | 'prestige' | 'savings' | 'infrastructure'> =
    ['youth', 'inclusion', 'prestige', 'savings', 'infrastructure']
  const parties: Array<'S' | 'M' | 'C' | 'L' | 'KD' | 'lokalt'> = ['S', 'M', 'C', 'L', 'KD', 'lokalt']
  const names = [
    'Anna Lindgren', 'Erik Svensson', 'Maria Johansson', 'Lars Karlsson',
    'Karin Nilsson', 'Per Andersson', 'Helena Berg', 'Magnus Eriksson',
    'Birgitta Holm', 'Stefan Gustafsson', 'Lena Persson', 'Björn Olsson',
  ]

  const name = names[Math.floor(rand() * names.length)]
  const party = parties[Math.floor(rand() * parties.length)]
  const agenda = agendas[Math.floor(rand() * agendas.length)]
  const generosity = agenda === 'savings'
    ? Math.round(20 + rand() * 20)
    : Math.round(50 + rand() * 40)
  const corruption = Math.round(rand() * 80)

  return {
    name,
    title: 'Kommunalråd',
    party,
    agenda,
    relationship: 40,
    kommunBidrag: 30000,
    generosity,
    mandatExpires: currentSeason + 4,
    corruption,
  }
}
