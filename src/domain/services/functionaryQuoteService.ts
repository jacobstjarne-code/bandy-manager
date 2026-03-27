import type { SaveGame } from '../entities/SaveGame'
import { FUNCTIONARY_TEMPLATES } from '../data/functionaries'
import { getSeasonPhase } from '../data/seasonPhases'

export interface FunctionaryQuote {
  name: string
  role: string
  quote: string
}

export function getFunctionaryQuote(
  game: SaveGame,
  roundNumber: number,
  lastFixtureId?: string,
): FunctionaryQuote | null {
  // Only use func_* characters (the new functionary system)
  const characters = (game.namedCharacters ?? []).filter(c => c.id.startsWith('func_'))
  if (characters.length === 0) return null

  const standing = game.standings?.find(s => s.clubId === game.managedClubId)
  const tablePosition = standing?.position ?? 6
  const phase = getSeasonPhase(roundNumber, tablePosition, game.clubs.length)

  const lastFixture = lastFixtureId ? game.fixtures.find(f => f.id === lastFixtureId) : null

  let condition: 'afterWin' | 'afterLoss' | 'derby' | 'lowFinances' | null = null
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)

  if (lastFixture) {
    const isHome = lastFixture.homeClubId === game.managedClubId
    const myScore = isHome ? (lastFixture.homeScore ?? 0) : (lastFixture.awayScore ?? 0)
    const theirScore = isHome ? (lastFixture.awayScore ?? 0) : (lastFixture.homeScore ?? 0)
    const oppId = isHome ? lastFixture.awayClubId : lastFixture.homeClubId
    const isRival = !!(game.rivalryHistory?.[oppId])
    if (isRival) condition = 'derby'
    else if (myScore > theirScore) condition = 'afterWin'
    else if (myScore < theirScore) condition = 'afterLoss'
  }
  if (!condition && (managedClub?.finances ?? 0) < 0) condition = 'lowFinances'

  // Seeded random by round
  let s = roundNumber * 7919 + (game.currentSeason ?? 2025) * 31
  function rand() {
    s = ((s * 1664525 + 1013904223) | 0) >>> 0
    return s / 0xffffffff
  }

  const funcIdx = Math.floor(rand() * Math.min(characters.length, FUNCTIONARY_TEMPLATES.length))
  const character = characters[funcIdx]
  const template = FUNCTIONARY_TEMPLATES[funcIdx]
  if (!template || !character) return null

  let pool: string[] = []
  if (condition && template.quotesByCondition?.[condition]) {
    pool = template.quotesByCondition[condition]!
  } else if (template.quotesByPhase[phase]) {
    pool = template.quotesByPhase[phase]!
  }
  if (pool.length === 0) return null

  return {
    name: character.name,
    role: template.roleDescription,
    quote: pool[Math.floor(rand() * pool.length)],
  }
}
