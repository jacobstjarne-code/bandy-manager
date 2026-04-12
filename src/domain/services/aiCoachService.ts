import { mulberry32 } from '../utils/random'

export type CoachStyle = 'defensive' | 'offensive' | 'pragmatic' | 'corner-focused'

export interface AICoach {
  name: string
  style: CoachStyle
  quote: string
}

const FIRST_NAMES = ['Leif', 'Björn', 'Håkan', 'Stefan', 'Per', 'Johan', 'Anders', 'Mikael', 'Lars', 'Gunnar', 'Ulf', 'Rolf', 'Kent', 'Peter', 'Sven']
const LAST_NAMES  = ['Berglund', 'Lindqvist', 'Eriksson', 'Holm', 'Persson', 'Karlsson', 'Nilsson', 'Johansson', 'Pettersson', 'Svensson', 'Larsson', 'Andersson', 'Gustafsson', 'Magnusson', 'Sandberg']

const STYLE_QUOTES: Record<CoachStyle, string[]> = {
  defensive: [
    'Noll bakåt vinner matcher.',
    'Defensiv soliditet är grunden för allt.',
    'Vi släpper inte in mål — vi vinner inte poäng.',
    'Baklinjen är laget.',
  ],
  offensive: [
    'Vi spelar för att göra mål, inte för att hindra dem.',
    'Anfall är bästa försvar.',
    'Mer mål än motståndaren — alltid.',
    'Vi anfaller tills det är klart.',
  ],
  pragmatic: [
    'Tre poäng — hur som helst.',
    'Resultatet räknas. Inget annat.',
    'Vi anpassar oss till varje match.',
    'Pragmatism vinner ligor.',
  ],
  'corner-focused': [
    'Hörnan är det enda anfallsvapnet som alltid fungerar.',
    'Vi driller hörnor varje dag. Varje dag.',
    'Specialsituationer vinner matcher.',
    'Nio av tio mål i slutspel kommer från standardsituationer.',
  ],
}

const STYLE_LABELS: Record<CoachStyle, string> = {
  defensive: 'Defensiv',
  offensive: 'Offensiv',
  pragmatic: 'Pragmatiker',
  'corner-focused': 'Hörn-specialist',
}

export function getCoachStyleLabel(style: CoachStyle): string {
  return STYLE_LABELS[style]
}

export function generateAICoaches(clubIds: string[], seed: number): Record<string, AICoach> {
  const rand = mulberry32(seed + 88888)
  const styles: CoachStyle[] = ['defensive', 'offensive', 'pragmatic', 'corner-focused']
  const result: Record<string, AICoach> = {}

  for (const clubId of clubIds) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
    const last  = LAST_NAMES[Math.floor(rand()  * LAST_NAMES.length)]
    const style = styles[Math.floor(rand() * styles.length)]
    const quotes = STYLE_QUOTES[style]
    const quote = quotes[Math.floor(rand() * quotes.length)]
    result[clubId] = { name: `${first} ${last}`, style, quote }
  }

  return result
}
