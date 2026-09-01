import type { SaveGame } from '../entities/SaveGame'
import { FUNCTIONARY_TEMPLATES } from '../data/functionaries'
import { getFunctionaryPhase } from '../data/seasonPhases'
import { nextManagedFixture } from './situationFragments'
import { deriveUtfall } from './matchTypeAxes'

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
  const phase = getFunctionaryPhase(roundNumber, tablePosition, game.clubs.length)

  const lastFixture = lastFixtureId ? game.fixtures.find(f => f.id === lastFixtureId) : null

  let condition: 'afterWin' | 'afterLoss' | 'derby' | 'lowFinances' | null = null
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)

  if (lastFixture) {
    const utfall = deriveUtfall(lastFixture, game.managedClubId)
    if (utfall === 'vunnet') condition = 'afterWin'
    else if (utfall === 'forlorat') condition = 'afterLoss'
  }
  // M30 (textaudit 2026-07-03): derby-repliker ("Hela byn är på läktaren",
  // "Orten vaknar till liv inför derbyt") är förberedande hype och ska visas
  // FÖRE ett kommande derby — tidigare kollades lastFixture (redan spelad),
  // så repliken kunde dyka upp EFTER matchen och äta win/loss-reaktionen.
  const upcoming = nextManagedFixture(game)
  if (upcoming) {
    const upcomingOppId = upcoming.homeClubId === game.managedClubId ? upcoming.awayClubId : upcoming.homeClubId
    if (game.rivalryHistory?.[upcomingOppId]) condition = 'derby'
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
