/**
 * O2-svepets prioriterade fix (2026-08-23, Jacobs dom — "fixa offer_pro nu,
 * före allt annat i O2"). generateVarselEvent:s "offer_pro"-val (mass-
 * heltidskontrakt) satte hela truppens lön till 0 kr — makeFullTimePro-
 * subeffektens value:0 tolkas inte som "saknat" av sub.value ?? p.salary.
 * Subtitlen lovar "höjd lönekostnad ×1.5" — varslet är enligt tre testare
 * spelets bästa beslut, och belönade spelaren med gratis arbetskraft.
 */
import { describe, it, expect } from 'vitest'
import { generateVarselEvent } from '../eventFactories'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'

function baseGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

describe('generateVarselEvent — "offer_pro" höjer lönen ×1.5, sätter den aldrig till 0', () => {
  it('varje berörd spelares lön blir exakt 1.5x ursprungslönen, inte 0 kr', () => {
    let game = baseGame()
    const targets = game.players.filter(p => p.clubId === game.managedClubId).slice(0, 2)
    game = {
      ...game,
      players: game.players.map(p =>
        targets.some(t => t.id === p.id) ? { ...p, salary: 20000, dayJob: { title: 'Lagerarbetare' } } : p
      ),
    }
    const event = generateVarselEvent(targets.map(t => ({ ...t, salary: 20000 })), 'ICA Maxi', game.currentSeason)
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, event.id, 'offer_pro', undefined, true)

    for (const t of targets) {
      const updated = game.players.find(p => p.id === t.id)!
      expect(updated.salary).toBe(30000)
      expect(updated.isFullTimePro).toBe(true)
    }
  })

  it('regression: value:0 skulle ha satt lönen till 0 — bekräfta att fixen inte råkat återinföra det', () => {
    let game = baseGame()
    const target = game.players.find(p => p.clubId === game.managedClubId)!
    game = {
      ...game,
      players: game.players.map(p => p.id === target.id ? { ...p, salary: 45000 } : p),
    }
    const event = generateVarselEvent([{ ...target, salary: 45000 }], 'ICA Maxi', game.currentSeason)
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, event.id, 'offer_pro', undefined, true)

    const updated = game.players.find(p => p.id === target.id)!
    expect(updated.salary).not.toBe(0)
    expect(updated.salary).toBe(67500)
  })
})
