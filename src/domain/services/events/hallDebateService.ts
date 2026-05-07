import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import { HALL_DEBATE_EVENTS } from '../../data/hallDebateData'

const COOLDOWN = 8
const MAX_PER_SEASON = 3

export function generateHallDebateEvent(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
): GameEvent | null {
  // Pre-conditions
  if (game.currentSeason < 2) return null
  if ((game.hallDebateCount ?? 0) >= MAX_PER_SEASON) return null
  if (currentRound - (game.lastHallDebateRound ?? 0) < COOLDOWN) return null

  const politician = game.localPolitician
  const boardPatience = game.boardPatience ?? 70

  // Determine which event pool to use
  let poolKey: keyof typeof HALL_DEBATE_EVENTS

  if (politician?.agenda === 'infrastructure' || politician?.agenda === 'prestige') {
    poolKey = 'kommunenFrågar'
  } else if (politician?.agenda === 'savings') {
    poolKey = 'kommunenFrågar'
  } else if (boardPatience <= 40) {
    poolKey = 'styrelseSplittrad'
  } else {
    // Check for spelarePerspektiv triggers
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const youngPlayers = managedPlayers.filter(p => p.age < 23)
    const hasEnoughYoung = youngPlayers.length >= 2
    const hasInjured = managedPlayers.some(p => p.isInjured)

    if (hasEnoughYoung || hasInjured) {
      poolKey = 'spelarePerspektiv'
    } else {
      // Random pick between styrelseSplittrad and spelarePerspektiv
      poolKey = ((currentRound + game.currentSeason) % 2 === 0) ? 'styrelseSplittrad' : 'spelarePerspektiv'
    }
  }

  const debateEvent = HALL_DEBATE_EVENTS[poolKey]
  const variantCount = debateEvent.bodyVariants.length
  const variantIdx = (currentRound + game.currentSeason * 13) % variantCount
  const body = debateEvent.bodyVariants[variantIdx]
    .replace('{politiker}', politician?.name ?? 'Kommunalrådet')

  const eid = `hall_${poolKey}_r${currentRound}_s${game.currentSeason}`
  if (alreadyQueued.has(eid)) return null

  return {
    id: eid,
    type: 'hallDebate',
    title: debateEvent.title,
    body,
    choices: debateEvent.choices.map(c => ({
      id: c.id,
      label: c.label,
      subtitle: c.narrative ?? c.effects ?? '',
      effect: { type: 'noOp' as const },
    })),
    resolved: false,
  }
}
