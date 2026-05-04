/**
 * sceneTriggerService — pure function-logik för att avgöra
 * om en narrativ scen ska triggas för aktuellt game-state.
 *
 * Inga side effects, inga store-anrop. Testbar utan UI.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { SceneId } from '../entities/Scene'
import { FixtureStatus } from '../enums'
import { getCoffeeRoomScene } from './coffeeRoomService'
import { shouldTriggerBoardMeeting } from '../data/scenes/boardMeetingScene'

const COFFEE_ROOM_COOLDOWN_ROUNDS = 3

/**
 * Avgör om en scen ska triggas för aktuellt game-state.
 * Returnerar scenId att visa, eller null om ingen scen ska triggas.
 *
 * Prioritetsordning (högst först):
 *   1. SM-finalseger (one-shot, narrativt tungt)
 *   2. Söndagsträningen (one-shot, säsongsstart)
 *   3. Kafferummet (recurring, cooldown-styrt)
 */
export function detectSceneTrigger(game: SaveGame): SceneId | null {
  if (shouldTriggerSMFinalVictory(game)) return 'sm_final_victory'
  if (shouldTriggerBoardMeeting(game)) return 'board_meeting'
  if (shouldTriggerSundayTraining(game)) return 'sunday_training'
  if (shouldTriggerSeasonSignature(game)) return 'season_signature_reveal'
  if (shouldTriggerCoffeeRoom(game)) return 'coffee_room'
  return null
}

export function shouldTriggerSeasonSignature(game: SaveGame): boolean {
  if (game.currentMatchday !== 1) return false
  if (!game.currentSeasonSignature) return false
  if (game.currentSeasonSignature.id === 'calm_season') return false
  // Use dedicated field to track which season's reveal was shown
  if ((game.shownSeasonSignatureRevealSeason ?? 0) >= game.currentSeason) return false
  return true
}

export function shouldTriggerSundayTraining(game: SaveGame): boolean {
  // One-shot vid spelets början, efter board_meeting men före första matchen.
  // shownScenes garanterar att den bara visas en gång totalt.
  if ((game.shownScenes ?? []).includes('sunday_training')) return false
  const anyMatchPlayed = game.fixtures.some(f => f.status === 'completed')
  if (anyMatchPlayed) return false
  return true
}

export function shouldTriggerSMFinalVictory(game: SaveGame): boolean {
  if ((game.shownScenes ?? []).includes('sm_final_victory')) return false

  const managedFixtures = game.fixtures.filter(
    f =>
      f.status === FixtureStatus.Completed &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId),
  )
  if (managedFixtures.length === 0) return false

  const lastManaged = managedFixtures.sort((a, b) => b.matchday - a.matchday)[0]
  // Cup-final = isCup OR (cup-final i fixture-strukturen är roundNumber 4)
  const isFinal = lastManaged.isFinaldag === true ||
    (lastManaged.isCup === true && lastManaged.roundNumber >= 4)
  if (!isFinal) return false

  const isHome = lastManaged.homeClubId === game.managedClubId
  const myScore = isHome ? lastManaged.homeScore : lastManaged.awayScore
  const theirScore = isHome ? lastManaged.awayScore : lastManaged.homeScore
  // Räkna med ev. straffläggning
  if (lastManaged.penaltyResult) {
    const myPen = isHome ? lastManaged.penaltyResult.home : lastManaged.penaltyResult.away
    const theirPen = isHome ? lastManaged.penaltyResult.away : lastManaged.penaltyResult.home
    return myPen > theirPen
  }
  return myScore > theirScore
}

export function shouldTriggerCoffeeRoom(game: SaveGame): boolean {
  // Kräver riktig data — om coffeeRoomService inte hittar något att visa, trigga inte
  if (getCoffeeRoomScene(game) === null) return false

  const currentMatchday = game.currentMatchday ?? 0
  const lastShown = game.lastCoffeeSceneRound ?? -COFFEE_ROOM_COOLDOWN_ROUNDS
  const sinceLast = currentMatchday - lastShown

  if (sinceLast >= COFFEE_ROOM_COOLDOWN_ROUNDS) return true
  // Override-triggers: streak ≥3, derby win, scandal — låt cooldown vara kortare
  if (hasOverrideTrigger(game)) return true
  return false
}

function hasOverrideTrigger(game: SaveGame): boolean {
  // Streak ≥3 (vinst eller förlust)
  const recent = game.fixtures
    .filter(
      f =>
        f.status === FixtureStatus.Completed &&
        !f.isCup &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId),
    )
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 3)
  if (recent.length >= 3) {
    const results = recent.map(f => {
      const isHome = f.homeClubId === game.managedClubId
      const my = isHome ? f.homeScore : f.awayScore
      const their = isHome ? f.awayScore : f.homeScore
      return my > their ? 'win' : my < their ? 'loss' : 'draw'
    })
    if (results.every(r => r === 'win') || results.every(r => r === 'loss')) {
      return true
    }
  }
  // Aktiv skandal denna säsong
  const recentScandal = (game.scandalHistory ?? []).some(
    s => s.season === game.currentSeason && s.type !== 'small_absurdity',
  )
  return recentScandal
}
