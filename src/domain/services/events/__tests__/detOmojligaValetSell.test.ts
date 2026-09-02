import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'
import { composeSeasonDecisionSentence } from '../../seasonDecisionCaptureService'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'

/**
 * H3 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24) —
 * end-to-end genom den RIKTIGA resolveEvent()-vägen, inte bara
 * captureSystemDecision() i isolering (se seasonDecisionCaptureService.test.ts
 * för den delen). Kör hela kedjan: special-caset i eventResolver.ts som
 * flyttar spelaren till free_agent OCH bort ur squadPlayerIds, den hårda
 * assertionen som ska krascha om det misslyckas, och O18-kandidaten som
 * bygger "Du sålde X"-meningen.
 */
function makeGameWithSellEvent() {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const player = game.players.find(p => p.clubId === game.managedClubId)!
  const event: GameEvent = {
    id: 'ev_omojlig', type: 'detOmojligaValet', title: 't', body: 'b',
    relatedPlayerId: player.id,
    choices: [
      {
        id: 'sell', label: 'l', effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { type: 'income', amount: 180000 },
          { type: 'communityStanding', amount: -12 },
          { type: 'fanMood', amount: -15 },
          { type: 'journalistRelationship', amount: -10 },
        ]) },
      },
      { id: 'keep', label: 'l', effect: { type: 'multiEffect', subEffects: JSON.stringify([
        { type: 'communityStanding', amount: 5 },
        { type: 'fanMood', amount: 8 },
      ]) } },
    ],
    resolved: false, systemhandelse: true,
  }
  return { game: { ...game, pendingEvents: [event] }, player }
}

describe('detOmojligaValet/sell — spelaren tas faktiskt bort ur klubben (H3)', () => {
  it('clubId blir free_agent och spelaren försvinner ur squadPlayerIds', () => {
    const { game, player } = makeGameWithSellEvent()
    const resolved = resolveEvent(game, 'ev_omojlig', 'sell', undefined, true)

    const club = resolved.clubs.find(c => c.id === resolved.managedClubId)!
    const updatedPlayer = resolved.players.find(p => p.id === player.id)!
    expect(updatedPlayer.clubId).toBe('free_agent')
    expect(club.squadPlayerIds).not.toContain(player.id)
  })

  // MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 2 — RETIRE-STEGET:
  // eventResolver.ts skriver inte längre seasonDecisionCandidates, bara
  // liggaren. Samma påstående ("mening skrivs bara EFTER att övergången
  // faktiskt hände"), verifierat via composeSeasonDecisionSentence i stället.
  it('O18-liggarposten "Du sålde X" skrivs bara EFTER att övergången faktiskt hände', () => {
    const { game, player } = makeGameWithSellEvent()
    const resolved = resolveEvent(game, 'ev_omojlig', 'sell', undefined, true)

    const entry = resolved.eventLedger?.find(e => e.semanticKey === 'detOmojligaValet:sell')
    expect(entry).toBeDefined()
    expect(entry!.subject).toEqual({ kind: 'player', id: player.id })
    expect(composeSeasonDecisionSentence(entry!, resolved)).toContain(`Du sålde ${player.firstName} ${player.lastName}`)
  })

  it('relatedPlayerId saknas: resolveEvent kastar synligt istf att tyst lämna spelaren kvar', () => {
    const { game } = makeGameWithSellEvent()
    const brokenEvent: GameEvent = {
      ...game.pendingEvents![0],
      relatedPlayerId: undefined,
    }
    const brokenGame = { ...game, pendingEvents: [brokenEvent] }
    expect(() => resolveEvent(brokenGame, 'ev_omojlig', 'sell', undefined, true)).toThrow(/relatedPlayerId/)
  })

  it('keep-valet lämnar spelaren i truppen', () => {
    const { game, player } = makeGameWithSellEvent()
    const clubBefore = game.clubs.find(c => c.id === game.managedClubId)!
    const resolved = resolveEvent(game, 'ev_omojlig', 'keep', undefined, true)

    const club = resolved.clubs.find(c => c.id === resolved.managedClubId)!
    expect(club.squadPlayerIds).toContain(player.id)
    expect(club.finances).toBe(clubBefore.finances)
    expect(resolved.communityStanding).toBe((game.communityStanding ?? 50) + 5)
    expect(resolved.fanMood).toBe((game.fanMood ?? 50) + 8)
  })

  it('produktionskortet lovar kassadeltat, inte en garanterad räddning eller ospårad licenseffekt', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 3 })
    const prospect = base.players.find(p => p.clubId === base.managedClubId && p.currentAbility > 50)!
    const game = {
      ...base,
      currentSeason: 2,
      patron: { name: 'P', business: 'B', influence: 20, happiness: 50, contribution: 1, isActive: true },
      mecenater: [],
      transferBids: [],
      pendingEvents: [],
      resolvedEventIds: [],
      players: base.players.map(p => p.id === prospect.id ? { ...p, promotedFromAcademy: true } : p),
      clubs: base.clubs.map(c => c.id === base.managedClubId ? { ...c, finances: -100000 } : c),
    }
    let event: GameEvent | undefined
    for (let lowAt = 0; lowAt < 40 && !event; lowAt += 1) {
      let call = 0
      const rand = () => call++ === lowAt ? 0.01 : 0.99
      event = generatePostAdvanceEvents(game, [], 1, rand)
        .find(candidate => candidate.type === 'detOmojligaValet')
    }

    expect(event).toBeDefined()
    expect(event!.body).toContain('stärker du kassan')
    expect(event!.body).not.toContain('räddar du klubben')
    expect(event!.choices.find(choice => choice.id === 'sell')?.subtitle).toContain('journalistrelation')
    expect(event!.choices.find(choice => choice.id === 'keep')).toMatchObject({
      label: 'Behåll honom — låt underskottet bestå',
      subtitle: expect.stringContaining('kassan oförändrad'),
    })
  })

  // A-H9 (DOM_AH9_ARSBOKENS_BESLUT_2026-08-27.md): "keep" har en namngiven
  // person men varken irreversibilitet eller spänning (inget uttalat pris
  // för att avstå) — score 1 av 3, kvalificerar inte längre som säsongens
  // beslut-kandidat. Byggarens "Du lät det vara..."-mening finns kvar
  // (text-utan-yta, se seasonDecisionCaptureService.ts), men skrivs inte
  // längre till liggaren (Fas 2 — qualifies() gatar dual-writet, oförändrat).
  it('keep-valet skriver INGEN liggarpost (kvalificerar inte under A-H9)', () => {
    const { game } = makeGameWithSellEvent()
    const resolved = resolveEvent(game, 'ev_omojlig', 'keep', undefined, true)
    const entry = resolved.eventLedger?.find(e => e.semanticKey === 'detOmojligaValet:keep')
    expect(entry).toBeUndefined()
  })
})
