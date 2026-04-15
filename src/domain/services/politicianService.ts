import type { LocalPolitician, MediaProfile, PersonalInterest } from '../entities/SaveGame'
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
  const activeYouth = (game.youthTeam?.players.length ?? 0) + (game.communityActivities?.bandyplay ? 15 : 0)
  const lokStod = activeYouth * 100
  let agendaBonus = 0
  if (politician.agenda === 'youth' && game.communityActivities?.bandyplay) agendaBonus = 20000
  if (politician.agenda === 'inclusion' && game.communityActivities?.bandyplay) agendaBonus = 15000
  if (politician.agenda === 'prestige' && (club.reputation ?? 50) > 65) agendaBonus = 10000
  if (politician.agenda === 'infrastructure' && (club.facilities ?? 50) > 60) agendaBonus = 15000
  const relBonus = politician.relationship > 70 ? 10000 : 0
  return Math.round(base * generosityMod * communityMod + lokStod + agendaBonus + relBonus)
}

// Parti → typiska agendor (duplicerat = dubbel sannolikhet)
const PARTY_AGENDA_WEIGHTS: Record<string, Array<'youth' | 'inclusion' | 'prestige' | 'savings' | 'infrastructure'>> = {
  S:      ['youth', 'inclusion', 'youth', 'inclusion'],
  M:      ['savings', 'prestige', 'savings', 'prestige'],
  C:      ['youth', 'infrastructure', 'youth'],
  L:      ['infrastructure', 'prestige'],
  KD:     ['youth', 'inclusion'],
  lokalt: ['youth', 'inclusion', 'prestige', 'savings', 'infrastructure'],
}

// Kampanjlöften per agenda
const CAMPAIGN_PROMISES: Record<string, string[]> = {
  youth:          ['Satsa på ungdomsidrott i alla skolor', 'Ny idrottshall för ungdomar senast nästa år', 'Fler kommunala idrottsstipendier'],
  inclusion:      ['Idrott ska vara tillgängligt för alla oavsett plånbok', 'Avgiftsfria aktiviteter för barn under 16', 'Integrationsprojekt via föreningslivet'],
  prestige:       ['Sätt orten på kartan med toppklass-idrott', 'Bygga ett kommunalt varumärke vi kan vara stolta över', 'Attrahera regionalt intresse till vår ort'],
  savings:        ['Hålla kommunbudgeten i balans utan nya lån', 'Effektivisera alla kommunala bidrag', 'Varje skattekrona ska synas i resultaten'],
  infrastructure: ['Bygg en modern idrottsanläggning senast 2028', 'Uppgradera kommunens sportinfrastruktur', 'Konstfryst is till alla utomhusanläggningar'],
}

export function generateNewPolitician(seed: number, currentSeason: number): LocalPolitician {
  const rand = mulberry32(seed)
  const parties: Array<'S' | 'M' | 'C' | 'L' | 'KD' | 'lokalt'> = ['S', 'M', 'C', 'L', 'KD', 'lokalt']
  const names = [
    'Anna Lindgren', 'Erik Svensson', 'Maria Johansson', 'Lars Karlsson',
    'Karin Nilsson', 'Per Andersson', 'Helena Berg', 'Magnus Eriksson',
    'Birgitta Holm', 'Stefan Gustafsson', 'Lena Persson', 'Björn Olsson',
  ]
  const mediaProfiles: MediaProfile[] = ['tystlåten', 'utåtriktad', 'populist']
  const interests: PersonalInterest[] = ['bandy', 'fotboll', 'kultur', 'ingenting']

  const name = names[Math.floor(rand() * names.length)]
  const party = parties[Math.floor(rand() * parties.length)]

  // Parti-vägd agenda
  const agendaPool = PARTY_AGENDA_WEIGHTS[party] ?? ['youth', 'inclusion', 'prestige', 'savings', 'infrastructure']
  const agenda = agendaPool[Math.floor(rand() * agendaPool.length)]

  const generosity = agenda === 'savings'
    ? Math.round(20 + rand() * 20)
    : Math.round(50 + rand() * 40)
  const corruption = Math.round(rand() * 80)
  const mediaProfile = mediaProfiles[Math.floor(rand() * mediaProfiles.length)]
  const personalInterest = interests[Math.floor(rand() * interests.length)]
  const oppositionStrength = Math.round(30 + rand() * 50)
  const popularitet = Math.round(40 + rand() * 40)
  const promisePool = CAMPAIGN_PROMISES[agenda] ?? []
  const campaignPromise = promisePool[Math.floor(rand() * promisePool.length)]

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
    campaignPromise,
    personalInterest,
    mediaProfile,
    oppositionStrength,
    popularitet,
  }
}
