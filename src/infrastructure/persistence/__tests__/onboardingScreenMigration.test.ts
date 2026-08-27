/**
 * M1 (audit 5c9a7a8, 2026-08-24): en save skapad FÖRE denna fix saknar
 * onboardingScreen helt. Backfyllen måste ge 'tilltrade' — INTE 'arrival'
 * — annars kastas en spelare som redan var mitt i Tillträdet (satt upp
 * elva, övat hörna) bakåt till Ankomsten nästa gång de laddar in, en ren
 * regression den här fixen inte ska orsaka.
 */
import { describe, it, expect } from 'vitest'
import { migrateSaveGame } from '../saveGameMigration'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

function makeLegacyIncompleteSave() {
  const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
  delete raw.onboardingScreen
  raw.onboardingComplete = false
  return raw
}

describe('migrateSaveGame — M1: onboardingScreen-backfyll för gamla saves', () => {
  it('gammal save mitt i onboarding utan fältet får "tilltrade" (bevarar tidigare routerbeteende)', () => {
    const raw = makeLegacyIncompleteSave()
    const migrated = migrateSaveGame(raw)
    expect(migrated.onboardingScreen).toBe('tilltrade')
  })

  it('en redan FÄRDIG gammal save (onboardingComplete true) får inte fältet påtvingat', () => {
    const raw = makeLegacyIncompleteSave()
    raw.onboardingComplete = true
    const migrated = migrateSaveGame(raw)
    expect(migrated.onboardingScreen).toBeUndefined()
  })

  it('en NY save (createNewGame) har redan "arrival" innan migrering ens körs', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    expect(game.onboardingScreen).toBe('arrival')
  })
})
