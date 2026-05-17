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
import { shouldTriggerCupFinalIntro } from '../data/scenes/cupFinalIntroScene'

const COFFEE_ROOM_COOLDOWN_ROUNDS = 3

/**
 * Avgör om en scen ska triggas för aktuellt game-state.
 * Returnerar scenId att visa, eller null om ingen scen ska triggas.
 *
 * Prioritetsordning (högst först):
 *   1. SM-finalseger (one-shot, narrativt tungt)
 *   2. Styrelsemötet (one-shot, allra först i nytt spel)
 *   3. Söndagsträningen (one-shot, etablerar truppen)
 *   4. Cup-intro (en gång per säsong, innan första cupmatch)
 *   5. Säsongssignatur-reveal (en gång per säsong)
 *   6. Kafferummet (recurring, cooldown-styrt)
 */
export function detectSceneTrigger(game: SaveGame): SceneId | null {
  if (shouldTriggerSMFinalVictory(game)) return 'sm_final_victory'
  if (shouldTriggerBoardMeeting()) return 'board_meeting'
  if (shouldTriggerSundayTraining(game)) return 'sunday_training'
  if (shouldTriggerCupFinalIntro(game)) return 'cup_final_intro'
  if (shouldTriggerCupIntro()) return 'cup_intro'
  if (shouldTriggerSeasonSignature(game)) return 'season_signature_reveal'
  if (shouldTriggerCoffeeRoom(game)) return 'coffee_room'
  return null
}

/**
 * Disabled 2026-05-10 — innehållet flyttat till season_kickoff-anslag i
 * boardAnslag.ts som visas i modal-format. Datan i boardMeetingScene.ts
 * är kvar för referens men scenen aktiveras inte längre.
 */
export function shouldTriggerBoardMeeting(): boolean {
  return false
}

/**
 * Disabled 2026-05-10 — innehållet flyttat till cup_first_match-anslag i
 * cupAnslag.ts. Datan i cupIntroScene.ts är kvar för referens men scenen
 * aktiveras inte längre.
 */
export function shouldTriggerCupIntro(): boolean {
  return false
}

/**
 * Disabled 2026-05-10 — gammal artefakt, scenen används inte längre i
 * intro-flödet. Datan i SIGNATURE_REVEAL_DATA är kvar för eventuell
 * framtida iteration (väder-koppling, mid-season-trigger, etc).
 */
export function shouldTriggerSeasonSignature(_game: SaveGame): boolean {
  return false
}

export function shouldTriggerSundayTraining(game: SaveGame): boolean {
  // One-shot vid spelets allra början (matchday 1), efter board_meeting men före första matchen.
  if ((game.shownScenes ?? []).includes('sunday_training')) return false
  if (game.currentMatchday !== 1) return false
  const anyMatchPlayed = game.fixtures.some(f => f.status === 'completed')
  if (anyMatchPlayed) return false
  return true
}

/**
 * Triggas EXKLUSIVT vid managed clubs vinst i SM-finalen (isFinaldag === true).
 * Cup-final-vinst hanteras via POKALEN-anslag (cup_done_winner i
 * anslagService.ts), inte via denna scen.
 */
export function shouldTriggerSMFinalVictory(game: SaveGame): boolean {
  if ((game.shownScenes ?? []).includes('sm_final_victory')) return false

  const managedFixtures = game.fixtures.filter(
    f =>
      f.status === FixtureStatus.Completed &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId),
  )
  if (managedFixtures.length === 0) return false

  const lastManaged = managedFixtures.sort((a, b) => b.matchday - a.matchday)[0]
  const isSMFinal = lastManaged.isFinaldag === true && !lastManaged.isCup
  if (!isSMFinal) return false

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

  // Aldrig retrigga samma matchday — gäller även override (annars loop)
  if (sinceLast < 1) return false

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
