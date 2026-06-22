// Volunteer pool system — generates a roster of local helpers
// Uses the existing game.volunteers string[] as stored volunteer names

const VOLUNTEER_ROLES = [
  { role: 'Kioskvakt', activity: 'kiosk', income: 800, csBoost: 2 },
  { role: 'Lotterikassör', activity: 'lottery', income: 600, csBoost: 2 },
  { role: 'Matchvärd', activity: 'functionaries', income: 0, csBoost: 4 },
  { role: 'Bandyskoleledare', activity: 'bandyplay', income: 0, csBoost: 5 },
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
    const roleData = VOLUNTEER_ROLES[Math.floor(next() * VOLUNTEER_ROLES.length)]
    result.push({
      name: `${firstName} ${lastName}`,
      role: roleData.role,
      weeklyContrib: roleData.income,
      csBoost: roleData.csBoost,
      activity: roleData.activity,
    })
  }
  return result
}

export function getActiveVolunteerBonus(
  volunteerNames: string[],
  roster?: Volunteer[],
): { weeklyIncome: number; csBoostPerRound: number } {
  if (roster && roster.length > 0) {
    const active = roster.filter(v => volunteerNames.includes(v.name))
    return {
      weeklyIncome: active.reduce((sum, v) => sum + v.weeklyContrib, 0),
      csBoostPerRound: Math.min(1.5, active.reduce((sum, v) => sum + v.csBoost / 10, 0)),
    }
  }
  // Flat fallback: corrected averages from VOLUNTEER_ROLES (income 340, csBoost 0.32)
  const count = volunteerNames.length
  return {
    weeklyIncome: count * 340,
    csBoostPerRound: Math.min(1.5, count * 0.32),
  }
}
