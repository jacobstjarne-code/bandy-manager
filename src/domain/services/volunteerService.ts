// Volunteer pool system — generates a roster of local helpers
// Uses the existing game.volunteers string[] as stored volunteer names

import { stringHashUnsigned } from '../utils/random'

const VOLUNTEER_ROLES = [
  { role: 'Kioskvakt', activity: 'kiosk', income: 800, csBoost: 2 },
  { role: 'Lotterikassör', activity: 'lottery', income: 600, csBoost: 2 },
  { role: 'Matchvärd', activity: 'functionaries', income: 0, csBoost: 4 },
  { role: 'Bandyskoleledare', activity: 'bandySchoolBasic', income: 0, csBoost: 5 },
  { role: 'Sociala medier', activity: 'socialMedia', income: 300, csBoost: 3 },
]

const FIRST_NAMES = ['Lars', 'Karin', 'Erik', 'Gun', 'Sven', 'Britta', 'Gunnar', 'Ulla', 'Göran', 'Britt', 'Rolf', 'Inger', 'Björn', 'Marit']
const LAST_NAMES = ['Lindström', 'Andersson', 'Eriksson', 'Pettersson', 'Johansson', 'Berg', 'Holm', 'Sjögren', 'Nordin', 'Lund']

export interface Volunteer {
  name: string
  role: string
  weeklyContrib: number   // SEK per round
  csBoost: number         // community standing effect per round
  activity: string
}

/**
 * Namnet är den befintliga save-modellens stabila identitet. Profilen härleds
 * på ett enda ställe, så även startvolontärer som inte råkar ligga i årets
 * rekryteringspool får en verklig och reproducerbar roll.
 */
export function getVolunteerProfile(name: string): Volunteer {
  const roleData = VOLUNTEER_ROLES[stringHashUnsigned(name) % VOLUNTEER_ROLES.length]
  return {
    name,
    role: roleData.role,
    weeklyContrib: roleData.income,
    csBoost: roleData.csBoost,
    activity: roleData.activity,
  }
}

export function generateVolunteerRoster(seed: number, count = 5): Volunteer[] {
  // Simple deterministic generation from seed
  const result: Volunteer[] = []
  let s = seed
  function next(): number {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return Math.abs(s) / 0xffffffff
  }

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(next() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(next() * LAST_NAMES.length)]
    next() // bevara den etablerade seedsekvensen för efterföljande namn
    result.push(getVolunteerProfile(`${firstName} ${lastName}`))
  }
  return result
}

export function getActiveVolunteerBonus(
  volunteerNames: string[],
  roster?: Volunteer[],
): { weeklyIncome: number; csBoostPerRound: number } {
  if (roster && roster.length > 0) {
    const active = volunteerNames.map(name => roster.find(v => v.name === name) ?? getVolunteerProfile(name))
    return {
      weeklyIncome: active.reduce((sum, v) => sum + v.weeklyContrib, 0),
      csBoostPerRound: Math.min(1.5, active.reduce((sum, v) => sum + v.csBoost / 10, 0)),
    }
  }
  const active = volunteerNames.map(getVolunteerProfile)
  return {
    weeklyIncome: active.reduce((sum, v) => sum + v.weeklyContrib, 0),
    csBoostPerRound: Math.min(1.5, active.reduce((sum, v) => sum + v.csBoost / 10, 0)),
  }
}
