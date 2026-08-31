/**
 * Människoupplevelse-auditen mot 7024f8a (2026-08-24), H3: "Eftermatchköer
 * tappar syskonbeslut" — flera samtidiga eftermatchhändelser (Maj Bergströms
 * brev + en kontraktsfråga + en pressfråga) observerades förlora syskon när
 * ETT av dem löstes; en köad captainSpeech försvann när en sponsor löstes.
 *
 * Jacobs order: bygg invarianten (beforeIds − resolvedId = afterIds) som
 * test, rapportera rotorsak innan fix.
 *
 * UTREDNINGSRESULTAT (2026-08-24, dokumenterat här eftersom testet är
 * bevisdelen av den rapporten): resolveEvent() SJÄLV klarar invarianten för
 * varje kombination nedan — verifierat, inte antaget. Kandidater
 * systematiskt uteslutna med bevis under samma pass:
 * — KF3-budgetpasset (advanceToNextEvent, roundProcessor.ts ~1733-1772):
 *   rör bara pendingEvents när newDeferred.length>0 ELLER priorDeferred
 *   finns — no-op under budget (3), och även över budget skyddar en stabil
 *   sortering redan SYNLIGA/äldre poster (de hamnar FÖRST i `flexible`).
 * — purgeStalePlayoffCards (matchActions.ts, isPlayoffNarrativeCardStillValid):
 *   fail-OPEN för alla icke-`playoff_*`-prefixade id:n — rör aldrig
 *   captainSpeech/sponsorOffer/contractRequest.
 * — ReaktionerKort.tsx:s bulk-onResolve(ids[]): filtret
 *   (getReactionEventsForGranska, choices.length===0) är precist — kan
 *   strukturellt inte fånga upp events med riktiga val.
 * Alltså INTE samma klass som staleEventIds (en avsiktlig, snävt riktad,
 * fail-open bulkrensning — här bekräftat oskyldig). Kvarstående, INTE
 * verifierad hypotes: GranskaScreen.tsx:s handleChoice (rad ~131) uppdaterar
 * den lokala `resolvedEventIds`-vyn SYNKRONT men kör den faktiska
 * `resolveEvent(eventId, choiceId)` bakom `setTimeout(…, 600)` — en 600 ms
 * lucka mellan "ser resolvad ut" och "är faktiskt resolvad i game.pendingEvents".
 * Ingen konkret dataförlust kunde konstrueras statiskt genom den luckan,
 * men den är den enda kvarvarande platsen i kedjan där visuellt tillstånd
 * och domäntillstånd kan divergera en synlig stund — värd en riktad
 * live-repro (snabb dubbelklick över två kort, eller navigera bort under
 * fönstret) för att bekräfta eller avfärda.
 */
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'
import type { GameEvent } from '../../../entities/GameEvent'

function baseGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function captainEvent(): GameEvent {
  return {
    id: 'ev_captain', type: 'captainSpeech', title: 't', body: 'b',
    choices: [{ id: 'support', label: 'Support', effect: { type: 'noOp' } }],
    resolved: false,
  }
}
function sponsorEvent(): GameEvent {
  return {
    id: 'ev_sponsor', type: 'sponsorOffer', title: 't', body: 'b',
    choices: [{ id: 'accept', label: 'Accept', effect: { type: 'acceptSponsor' } }],
    resolved: false,
    sponsorData: JSON.stringify({ id: 'sp1', name: 'Test AB', category: 'Bygg', contractRounds: 10, weeklyIncome: 5000 }),
  }
}
function contractEvent(playerId: string): GameEvent {
  return {
    id: 'ev_contract', type: 'contractRequest', title: 't', body: 'b',
    choices: [{ id: 'reject', label: 'Avslå', effect: { type: 'rejectContract', targetPlayerId: playerId } }],
    resolved: false,
  }
}
function fanLetterEvent(): GameEvent {
  return {
    id: 'ev_fanletter', type: 'fanLetter', title: 't', body: 'b',
    choices: [],
    resolved: false,
  }
}
function multiEffectEvent(playerId: string): GameEvent {
  return {
    id: 'ev_multi', type: 'varsel', title: 't', body: 'b',
    choices: [{
      id: 'offer_pro', label: 'Erbjud', effect: {
        type: 'multiEffect',
        subEffects: JSON.stringify([{ type: 'boostMorale', amount: 5, targetPlayerId: playerId }]),
      },
    }],
    resolved: false,
  }
}

describe('pendingEvents-invarianten — beforeIds − resolvedId = afterIds (H3)', () => {
  it('resolving sponsorOffer bland tre siblings tar bort exakt ETT event-ID', () => {
    const game = baseGame()
    const playerId = game.clubs[0].squadPlayerIds[0]
    let g = { ...game, pendingEvents: [captainEvent(), sponsorEvent(), contractEvent(playerId)] }
    const beforeIds = new Set(g.pendingEvents.map(e => e.id))

    g = resolveEvent(g, 'ev_sponsor', 'accept', undefined, true)
    const afterIds = new Set(g.pendingEvents.map(e => e.id))

    beforeIds.delete('ev_sponsor')
    expect(afterIds).toEqual(beforeIds)
  })

  it('resolving captainSpeech bland fyra siblings (inkl. ambient) tar bort exakt ETT', () => {
    const game = baseGame()
    const playerId = game.clubs[0].squadPlayerIds[0]
    let g = {
      ...game,
      pendingEvents: [captainEvent(), sponsorEvent(), contractEvent(playerId), fanLetterEvent()],
    }
    const beforeIds = new Set(g.pendingEvents.map(e => e.id))

    g = resolveEvent(g, 'ev_captain', 'support', undefined, true)
    const afterIds = new Set(g.pendingEvents.map(e => e.id))

    beforeIds.delete('ev_captain')
    expect(afterIds).toEqual(beforeIds)
  })

  it('resolving ett multiEffect-val (varsel) bland siblings tar bort exakt ETT', () => {
    const game = baseGame()
    const playerId = game.clubs[0].squadPlayerIds[0]
    let g = {
      ...game,
      pendingEvents: [captainEvent(), multiEffectEvent(playerId), contractEvent(playerId)],
    }
    const beforeIds = new Set(g.pendingEvents.map(e => e.id))

    g = resolveEvent(g, 'ev_multi', 'offer_pro', undefined, true)
    const afterIds = new Set(g.pendingEvents.map(e => e.id))

    beforeIds.delete('ev_multi')
    expect(afterIds).toEqual(beforeIds)
  })

  it('resolving en ambient (choices:[]) event bland siblings tar bort exakt ETT', () => {
    const game = baseGame()
    const playerId = game.clubs[0].squadPlayerIds[0]
    let g = { ...game, pendingEvents: [fanLetterEvent(), captainEvent(), contractEvent(playerId)] }
    const beforeIds = new Set(g.pendingEvents.map(e => e.id))

    g = resolveEvent(g, 'ev_fanletter', 'auto', undefined, true)
    const afterIds = new Set(g.pendingEvents.map(e => e.id))

    beforeIds.delete('ev_fanletter')
    expect(afterIds).toEqual(beforeIds)
  })

  it('resolving i olika ordning (kontrakt sist) bevarar invarianten kumulativt', () => {
    const game = baseGame()
    const playerId = game.clubs[0].squadPlayerIds[0]
    let g = { ...game, pendingEvents: [captainEvent(), sponsorEvent(), contractEvent(playerId)] }

    g = resolveEvent(g, 'ev_captain', 'support', undefined, true)
    expect(new Set(g.pendingEvents.map(e => e.id))).toEqual(new Set(['ev_sponsor', 'ev_contract']))

    g = resolveEvent(g, 'ev_sponsor', 'accept', undefined, true)
    expect(new Set(g.pendingEvents.map(e => e.id))).toEqual(new Set(['ev_contract']))

    g = resolveEvent(g, 'ev_contract', 'reject', undefined, true)
    expect(g.pendingEvents.map(e => e.id)).toEqual([])
  })
})
