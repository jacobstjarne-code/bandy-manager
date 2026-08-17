import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'
import type { Mecenat } from '../../../entities/Mecenat'

/**
 * K5 (SLUTTEST-KÖN, 2026-08-17) — FIXAD. Var reproduktion-ej-fixad i
 * Stickiness-auditen (@0b325c10); Jacobs designbeslut löste distinktionen:
 * mecenatHappiness ska inte kunna röra en permanent avskedad mecenat ALLS,
 * inget villkorat undantag.
 *
 * ROTORSAK: Mecenat.isActive var EN boolean som betydde TVÅ olika saker —
 * "ny mecenat, ej accepterad ännu" (applyMecenatSpawn) och "permanent
 * avslutad relation" (withdrawal-blocket, eventProcessor.ts:249-251).
 * eventResolver.ts's case 'mecenatHappiness' kunde inte skilja dem åt och
 * tolkade ALLTID `!isActive` som "väntar på intro" — en mecenatHappiness-
 * effekt som nådde en redan avskedad mecenat (t.ex. ett queuat socialt
 * par-event, mecenatService.ts:498-565, som fortfarande låg oresolverat när
 * motparten hann sägas upp) återupplivade den permanent, tyst.
 *
 * FIX: Mecenat.permanentlyWithdrawn — satt EN gång vid avsked, aldrig
 * återställt. eventResolver.ts kollar den FÖRE isActive i både top-level
 * case 'mecenatHappiness' och multiEffect-sub-varianten, och breakar utan
 * någon som helst mutation om den är satt.
 */
function makeWithdrawnMecenat(): Mecenat {
  return {
    id: 'mecenat_test_withdrawn',
    name: 'Test Mecenat',
    gender: 'male',
    business: 'Test AB',
    businessType: 'it_miljonär',
    wealth: 3,
    personality: 'filantropen',
    influence: 20,
    happiness: 0,               // satt av withdrawal-blocket
    patience: 50,
    contribution: 50000,
    totalContributed: 150000,
    demands: [],
    socialExpectations: [],
    isActive: false,            // satt av withdrawal-blocket
    permanentlyWithdrawn: true, // satt av withdrawal-blocket — den nya, entydiga källan
    arrivedSeason: 6,
  }
}

describe('K5 — permanent avskedad mecenat kan inte röras av mecenatHappiness', () => {
  it('top-level mecenatHappiness-effekt mot en avskedad mecenat gör ingenting alls', () => {
    let game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    game = { ...game, mecenater: [makeWithdrawnMecenat()] }

    // Simulerar ett socialt event som queuades MOT mecenaten innan uppsägningen,
    // och som resolveras EFTER — exakt formen mecenatService.ts:498-565
    // genererar (par-effekter mellan två mecenater).
    const staleSocialEvent: GameEvent = {
      id: 'test_stale_social_event',
      type: 'mecenatSocialEvent',
      title: 't', body: 'b',
      choices: [{
        id: 'attend', label: 'Delta',
        effect: { type: 'mecenatHappiness', targetMecenatId: 'mecenat_test_withdrawn', amount: 3, value: -5000 },
      }],
      resolved: false,
    }
    game = { ...game, pendingEvents: [staleSocialEvent] }
    const startFinances = game.clubs.find(c => c.id === game.managedClubId)!.finances

    game = resolveEvent(game, 'test_stale_social_event', 'attend')

    const after = game.mecenater!.find(m => m.id === 'mecenat_test_withdrawn')!
    expect(after.isActive).toBe(false)
    expect(after.happiness).toBe(0)
    // "Rör inte alls" gäller även kostnadssidan av effekten.
    expect(game.clubs.find(c => c.id === game.managedClubId)!.finances).toBe(startFinances)
  })

  it('multiEffect-subEffect mecenatHappiness mot en avskedad mecenat gör ingenting alls', () => {
    let game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    game = { ...game, mecenater: [makeWithdrawnMecenat()] }

    const staleMultiEvent: GameEvent = {
      id: 'test_stale_multi_event',
      type: 'mecenatSocialEvent',
      title: 't', body: 'b',
      choices: [{
        id: 'attend', label: 'Delta',
        effect: {
          type: 'multiEffect',
          subEffects: JSON.stringify([{ type: 'mecenatHappiness', targetMecenatId: 'mecenat_test_withdrawn', amount: 15 }]),
        },
      }],
      resolved: false,
    }
    game = { ...game, pendingEvents: [staleMultiEvent] }

    game = resolveEvent(game, 'test_stale_multi_event', 'attend')

    const after = game.mecenater!.find(m => m.id === 'mecenat_test_withdrawn')!
    expect(after.isActive).toBe(false)
    expect(after.happiness).toBe(0)
  })
})
