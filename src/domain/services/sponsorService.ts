const FIRST_NAMES = [
  'Bengtsson', 'Karlsson', 'Lindström', 'Eriksson', 'Pettersson',
  'Johansson', 'Andersson', 'Nilsson', 'Lundqvist', 'Bergström',
  'Svensson', 'Holm', 'Nyström', 'Larsson', 'Hedlund',
  'Gustafsson', 'Wikström', 'Forsberg', 'Nordin', 'Sundberg',
]

const BUSINESS_TYPES = [
  { suffix: 'Rör & VVS', category: 'VVS' },
  { suffix: 'Bil', category: 'Bil' },
  { suffix: 'Bygg AB', category: 'Bygg' },
  { suffix: 'Golv & Kakel', category: 'Bygg' },
  { suffix: 'El & Installation', category: 'El' },
  { suffix: 'Åkeri', category: 'Transport' },
  { suffix: 'Maskin', category: 'Maskin' },
  { suffix: 'Begravningsbyrå', category: 'Övrigt' },
  { suffix: 'Redovisning', category: 'Tjänster' },
  { suffix: 'Pizzeria', category: 'Mat' },
  { suffix: 'Frisör', category: 'Tjänster' },
  { suffix: 'Snickeri', category: 'Bygg' },
  { suffix: 'Skrot & Metall', category: 'Industri' },
  { suffix: 'Livs', category: 'Mat' },
  { suffix: 'Tapetserarverkstad', category: 'Bygg' },
  { suffix: 'Motor & Däck', category: 'Bil' },
  { suffix: 'Städ & Service', category: 'Tjänster' },
  { suffix: 'Trädgård & Skog', category: 'Jord' },
  { suffix: 'Stuguthyrning', category: 'Turism' },
  { suffix: 'IT-lösningar', category: 'Tech' },
]

import type { Sponsor } from '../entities/SaveGame'

function generateSponsorName(rand: () => number): { name: string; category: string } {
  const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
  const biz = BUSINESS_TYPES[Math.floor(rand() * BUSINESS_TYPES.length)]
  const name = rand() > 0.3
    ? `${first}s ${biz.suffix}`
    : `${biz.suffix} ${first}`
  return { name, category: biz.category }
}

export function generateSponsorOffer(
  clubReputation: number,
  currentSponsors: number,
  maxSponsors: number,
  round: number,
  rand: () => number
): Sponsor | null {
  if (currentSponsors >= maxSponsors) return null
  if (rand() > 0.20) return null

  const { name, category } = generateSponsorName(rand)
  const baseIncome = 1500 + Math.round(clubReputation * 50 + rand() * 2000)
  const contractRounds = 8 + Math.floor(rand() * 9)

  return {
    id: `sponsor_${round}_${Math.floor(rand() * 99999)}`,
    name,
    category,
    weeklyIncome: Math.round(baseIncome / 500) * 500,
    contractRounds,
    signedRound: round,
  }
}
