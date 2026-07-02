// Skadad-kortets kontextrad — proportionerlig mot allvarlighetsgrad.
// Bandy-understatement: lätt skada dramatiseras inte, lång skada får väga.
// Picken är deterministisk per spelare (samma skada → samma rad varje omgång).
// Opus-satt copy.

import { seededPick } from '../utils/random'

interface InjuryContextArgs {
  lastName: string
  daysRemaining: number
  injuredCount: number
  isKeyPlayer: boolean
  seedId: string
}

const KEY_PLAYER_LINES: string[] = [
  '{lastName} är en av era bästa. Det känns i laget.',
  '{lastName} borta. Den sortens spelare ersätts inte rakt av.',
]

const MANY_INJURED_LINES: string[] = [
  '{count} borta. Truppen är tunn nu.',
  '{count} på skadelistan. Det börjar bli ett pussel att få ihop laget.',
]

const SHORT_LINES: string[] = [   // ~1 vecka
  'Ute en match. Inget mer dramatiskt än så.',
  'Borta en omgång. Tillbaka innan det hinner märkas.',
  'Missar en match. Sånt händer en lång vinter.',
]

const MEDIUM_LINES: string[] = [  // 2–3 veckor
  'Borta ett par veckor. Får lösas med dem som finns.',
  'Ett par veckor i fysioterapin. Truppen får bära det så länge.',
]

const LONG_LINES: string[] = [    // 4+ veckor
  'Borta länge. Det syns på träningarna innan det syns i tabellen.',
  'Ute en månad eller mer. Sånt sätter sig i ett lag.',
]

function seedFromId(id: string): number {
  let s = 0
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0
  return s
}

export function injuryContextLine(args: InjuryContextArgs): string {
  const { lastName, daysRemaining, injuredCount, isKeyPlayer, seedId } = args
  const seed = seedFromId(seedId)

  if (isKeyPlayer) {
    return seededPick(KEY_PLAYER_LINES, seed).replace('{lastName}', lastName)
  }
  if (injuredCount >= 4) {
    return seededPick(MANY_INJURED_LINES, seed).replace('{count}', String(injuredCount))
  }

  const weeks = Math.ceil(daysRemaining / 7)
  const pool = weeks <= 1 ? SHORT_LINES : weeks <= 3 ? MEDIUM_LINES : LONG_LINES
  return seededPick(pool, seed).replace('{lastName}', lastName)
}
