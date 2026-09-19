/**
 * §1.5 — harnessen ska känna korridorens två stopp.
 *
 * LESSONS #62 har nu inträffat tre gånger: röstgrinden (§1), inbox-ämnesgrinden
 * (DOM_DÖDA_TEXTPOOLER) och kontraktskraven. Varje gång var orsaken densamma —
 * en tillståndsövergång som bara fanns i presentationslagret, osynlig för varje
 * mätning. Jacobs krav när stoppen beställdes: "autoResolvePendingScreen måste
 * känna båda stoppen, annars är detta LESSONS #62 nummer fyra."
 *
 * Testet låser tre saker:
 *   1. Båda stoppen står i harnessens KNOWN_SCREENS (annars svarar den
 *      `unresolvable` och varje svep stannar).
 *   2. Stoppen dräneras till null i ett anrop, som varje annan skärm.
 *   3. Stoppen inträffar faktiskt för en klubb som åker ut — annars bevisar
 *      punkt 1 och 2 ingenting.
 */
import { describe, it, expect } from 'vitest'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen, autoResolvePendingEvents } from '../fixtures'
import { advanceToNextEvent } from '../../../src/application/useCases/roundProcessor'
import { buildWeekAfterStop, buildFinalDayStop } from '../../../src/domain/services/corridorService'
import { PendingScreen } from '../../../src/domain/enums'
import type { SaveGame } from '../../../src/domain/entities/SaveGame'

const STOPS = [PendingScreen.WeekAfter, PendingScreen.FinalDay] as const

describe('§1.5 — harnessen känner korridorens stopp', () => {
  it('båda stoppen dräneras till null, ingen rapporteras som unresolvable', () => {
    const base = createHeadlessGame(0)
    for (const screen of STOPS) {
      const withStop: SaveGame = { ...base, pendingScreen: screen }
      const res = autoResolvePendingScreen(withStop)
      expect(res.unresolvable, `${screen} är okänd för harnessen`).toBe(false)
      expect(res.game.pendingScreen, `${screen} lämnades hängande`).toBeNull()
    }
  })
})

describe('§1.5 — stoppen inträffar i en riktig säsong', () => {
  it('en klubb som åker ut får Veckan efter och Finaldagen, båda med innehåll', () => {
    // Seed 11 = Heros, svagaste klubben; den kvalar inte till slutspel.
    let game: SaveGame = createHeadlessGame(11)
    let step = 31_000
    const seen = new Map<string, number>()

    for (let i = 0; i < 200; i++) {
      game = autoSelectLineup(game)
      game = autoResolvePendingEvents(game, Math.random)
      const r = advanceToNextEvent(game, step++)
      game = r.game

      const ps = game.pendingScreen
      if (ps === PendingScreen.WeekAfter || ps === PendingScreen.FinalDay) {
        const stop = ps === PendingScreen.WeekAfter ? buildWeekAfterStop(game) : buildFinalDayStop(game)
        expect(stop, `${ps} sattes men gick inte att bygga innehåll för`).not.toBeNull()
        expect(stop!.lines.length, `${ps} hade inga rader`).toBeGreaterThan(0)
        // Ingen oersatt platshållare får nå spelaren.
        for (const line of stop!.lines) expect(line.text).not.toMatch(/\{[^}]+\}/)
        expect(stop!.intro.length).toBeGreaterThan(10)
        seen.set(ps, (seen.get(ps) ?? 0) + 1)
      }

      if (r.seasonEnded || game.managerFired) break
      game = autoResolvePendingScreen(game).game
    }

    expect(seen.get(PendingScreen.WeekAfter), 'Veckan efter inträffade aldrig').toBe(1)
    expect(seen.get(PendingScreen.FinalDay), 'Finaldagen inträffade aldrig').toBe(1)
  })

  it('en klubb som går till slutspel får INTE Veckan efter', () => {
    // Seed 0 = Forsbacka, starkaste klubben.
    let game: SaveGame = createHeadlessGame(0)
    let step = 32_000
    let weekAfter = 0

    for (let i = 0; i < 200; i++) {
      game = autoSelectLineup(game)
      game = autoResolvePendingEvents(game, Math.random)
      const r = advanceToNextEvent(game, step++)
      game = r.game
      if (game.pendingScreen === PendingScreen.WeekAfter) weekAfter++
      if (r.seasonEnded || game.managerFired) break
      game = autoResolvePendingScreen(game).game
    }

    expect(weekAfter).toBe(0)
  })
})
