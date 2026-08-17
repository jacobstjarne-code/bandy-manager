import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'
import type { Mecenat } from '../../../entities/Mecenat'

/**
 * REPRODUKTIONSTEST — INTE FIXAT (Stickiness-audit, 2026-08-17, @0b325c10).
 * Rapporterat till Jacob, väntar på beslut om rätt distinktion — se
 * kommentaren nedan för rotorsaken. Skippat, inte failat, så suiten
 * förblir grön tills en fix landar.
 *
 * ROTORSAK: Mecenat.isActive är EN boolean som betyder TVÅ olika saker:
 *   1. "Ny mecenat, ännu inte accepterad" — sätts av applyMecenatSpawn()
 *      (eventProcessor.ts:446, isActive:false, happiness 60-79 från
 *      generateMecenat()).
 *   2. "Permanent avslutad relation" — sätts av withdrawal-blocket
 *      (eventProcessor.ts:249-251, isActive:false, happiness:0 explicit).
 *
 * eventResolver.ts's case 'mecenatHappiness' (rad 580-610) kan inte skilja
 * dem åt — den ENDA kollen är `if (!target.isActive)`, och när den är sann
 * tolkas det ALLTID som fall 1 ("Intro activation — pending mecenat
 * accepts relationship", rad 588) och sätter isActive:true igen. En
 * mecenatHappiness-effekt som når en REDAN AVSLUTAD mecenat — t.ex. ett
 * socialt event queuat mot en annan mecenat (mecenatService.ts rad 498-565
 * skapar par-effekter mec1/mec2) som fortfarande ligger oresolverat när
 * mec1 hinner sägas upp — återupplivar mecenaten permanent, tyst.
 *
 * Detta test hoppar över den faktiska händelsekedjan (queued social event
 * → withdrawal → resolve) och går direkt på den avgörande frågan: kan
 * resolveEvent någonsin sätta isActive:true på en mecenat vars happiness
 * redan är 0 och isActive redan false? Om ja är det just det som händer
 * i spelet.
 */
describe('mecenat-reaktivering — REPRODUKTION, ej fixad', () => {
  it.skip('en mecenatHappiness-effekt mot en redan uppsagd mecenat sätter felaktigt isActive tillbaka till true', () => {
    let game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })

    const withdrawnMecenat: Mecenat = {
      id: 'mecenat_test_withdrawn',
      name: 'Test Mecenat',
      gender: 'male',
      business: 'Test AB',
      businessType: 'it_miljonär',
      wealth: 3,
      personality: 'filantropen',
      influence: 20,
      happiness: 0,          // satt av withdrawal-blocket
      patience: 50,
      contribution: 50000,
      totalContributed: 150000,
      demands: [],
      socialExpectations: [],
      isActive: false,       // satt av withdrawal-blocket — SAMMA flagga som "ej accepterad ännu"
      arrivedSeason: game.currentSeason - 2,
    }
    game = { ...game, mecenater: [withdrawnMecenat] }

    // Simulerar ett socialt event som queuades MOT withdrawnMecenat innan
    // uppsägningen, och som resolveras EFTER — exakt formen mecenatService.ts
    // rad 498-565 genererar (par-effekter mellan två mecenater).
    const staleSocialEvent: GameEvent = {
      id: 'test_stale_social_event',
      type: 'mecenatSocialEvent',
      title: 't', body: 'b',
      choices: [{
        id: 'attend', label: 'Delta',
        effect: { type: 'mecenatHappiness', targetMecenatId: 'mecenat_test_withdrawn', amount: 3 },
      }],
      resolved: false,
    }
    game = { ...game, pendingEvents: [staleSocialEvent] }

    game = resolveEvent(game, 'test_stale_social_event', 'attend')

    const after = game.mecenater!.find(m => m.id === 'mecenat_test_withdrawn')!

    // ÖNSKAT beteende (failar idag): en permanent uppsagd mecenat ska
    // förbli inaktiv oavsett vilken händelse som råkar resolveras mot den.
    expect(after.isActive).toBe(false)
  })
})
