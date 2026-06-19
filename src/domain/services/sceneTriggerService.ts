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
import { getSeasonEndPhase } from '../data/seasonEndPhase'
import { shouldTriggerBoardMeeting as boardMeetingCheck } from '../data/scenes/boardMeetingScene'
import { shouldTriggerValet } from '../data/scenes/valetScene'

const COFFEE_ROOM_COOLDOWN_ROUNDS = 3
const COFFEE_ROOM_OVERRIDE_COOLDOWN = 2

/**
 * Avgör om en scen ska triggas för aktuellt game-state.
 * Returnerar scenId att visa, eller null om ingen scen ska triggas.
 *
 * Prioritetsordning (högst först):
 *   1. Cup-finalseger (one-shot, mid-säsong)
 *   2. SM-finalseger (one-shot, narrativt tungt)
 *   3. Styrelsemötet (one-shot, allra först i nytt spel)
 *   4. Söndagsträningen (one-shot, etablerar truppen)
 *   5. Cup-intro (en gång per säsong, innan första cupmatch)
 *   6. Säsongssignatur-reveal (en gång per säsong)
 *   7. Kafferummet (recurring, cooldown-styrt)
 */
export function detectSceneTrigger(game: SaveGame): SceneId | null {
  if (shouldTriggerCupFinalVictory(game)) return 'cup_final_victory'
  if (shouldTriggerSMFinalVictory(game)) return 'sm_final_victory'
  if (boardMeetingCheck(game)) return 'board_meeting'
  if (shouldTriggerValet(game)) return 'valet'
  if (shouldTriggerSundayTraining(game)) return 'sunday_training'
  if (shouldTriggerCupFinalIntro(game)) return 'cup_final_intro'
  if (shouldTriggerCupIntro()) return 'cup_intro'
  if (shouldTriggerSeasonSignature(game)) return 'season_signature_reveal'
  if (shouldTriggerCoffeeRoom(game)) return 'coffee_room'
  return null
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
  if (getSeasonEndPhase(game) !== 'season_done') return false
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

/**
 * Triggas EXKLUSIVT vid managed clubs vinst i cup-finalen (isCup + roundNumber >= 4).
 * SM-finalseger hanteras av shouldTriggerSMFinalVictory (isFinaldag + !isCup).
 */
export function shouldTriggerCupFinalVictory(game: SaveGame): boolean {
  if ((game.shownScenes ?? []).includes('cup_final_victory')) return false

  const managedFixtures = game.fixtures.filter(
    f =>
      f.status === FixtureStatus.Completed &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId),
  )
  if (managedFixtures.length === 0) return false

  const lastManaged = managedFixtures.sort((a, b) => b.matchday - a.matchday)[0]
  const isCupFinal = lastManaged.isCup === true && lastManaged.roundNumber >= 4
  if (!isCupFinal) return false

  const isHome = lastManaged.homeClubId === game.managedClubId
  const myScore = isHome ? lastManaged.homeScore : lastManaged.awayScore
  const theirScore = isHome ? lastManaged.awayScore : lastManaged.homeScore
  if (lastManaged.penaltyResult) {
    const myPen = isHome ? lastManaged.penaltyResult.home : lastManaged.penaltyResult.away
    const theirPen = isHome ? lastManaged.penaltyResult.away : lastManaged.penaltyResult.home
    return myPen > theirPen
  }
  return (myScore ?? 0) > (theirScore ?? 0)
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
  // Override-triggers: streak exakt 3, färsk skandal — kräver sinceLast ≥ 2 (aldrig back-to-back)
  if (sinceLast >= COFFEE_ROOM_OVERRIDE_COOLDOWN && hasOverrideTrigger(game)) return true
  return false
}

function hasOverrideTrigger(game: SaveGame): boolean {
  const currentMatchday = game.currentMatchday ?? 0

  // Streak exakt 3 — avfyras när streaken FORMAS, inte vid varje efterföljande vinst/förlust.
  // Tar 4 matcher: last3 samma resultat + 4:e annorlunda (eller saknas → exakt 3 i rad).
  const recent4 = game.fixtures
    .filter(
      f =>
        f.status === FixtureStatus.Completed &&
        !f.isCup &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId),
    )
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 4)
  if (recent4.length >= 3) {
    const results = recent4.map(f => {
      const isHome = f.homeClubId === game.managedClubId
      const my = isHome ? f.homeScore : f.awayScore
      const their = isHome ? f.awayScore : f.homeScore
      return my > their ? 'win' : my < their ? 'loss' : 'draw'
    })
    const streakResult = results[0]
    const last3Same = results.slice(0, 3).every(r => r === streakResult)
    const fourthDifferent = recent4.length < 4 || results[3] !== streakResult
    if (last3Same && fourthDifferent && (streakResult === 'win' || streakResult === 'loss')) {
      return true
    }
  }

  // Skandal inom ~2 omgångar — triggerRound finns på Scandal-interfacet
  const recentScandal = (game.scandalHistory ?? []).some(
    s =>
      s.season === game.currentSeason &&
      s.type !== 'small_absurdity' &&
      s.triggerRound >= currentMatchday - 2,
  )
  return recentScandal
}
