import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
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
      { id: 'keep', label: 'l', effect: { type: 'noOp' } },
    ],
    resolved: false, systemhandelse: true,
  }
  return { game: { ...game, pendingEvents: [event] }, player }
}

describe('detOmojligaValet/sell — spelaren tas faktiskt bort ur klubben (H3)', () => {
  it('clubId blir free_agent och spelaren försvinner ur squadPlayerIds', () => {
    const { game, player } = makeGameWithSellEvent()
    const resolved = resolveEvent(game, 'ev_omojlig', 'sell')

    const club = resolved.clubs.find(c => c.id === resolved.managedClubId)!
    const updatedPlayer = resolved.players.find(p => p.id === player.id)!
    expect(updatedPlayer.clubId).toBe('free_agent')
    expect(club.squadPlayerIds).not.toContain(player.id)
  })

  it('O18-kandidaten "Du sålde X" skrivs bara EFTER att övergången faktiskt hände', () => {
    const { game, player } = makeGameWithSellEvent()
    const resolved = resolveEvent(game, 'ev_omojlig', 'sell')

    const candidate = resolved.seasonDecisionCandidates?.find(c => c.eventId === 'ev_omojlig')
    expect(candidate).toBeDefined()
    expect(candidate!.sentence).toContain(`Du sålde ${player.firstName} ${player.lastName}`)
    expect(candidate!.namedPerson).toBe(`${player.firstName} ${player.lastName}`)
  })

  it('relatedPlayerId saknas: resolveEvent kastar synligt istf att tyst lämna spelaren kvar', () => {
    const { game } = makeGameWithSellEvent()
    const brokenEvent: GameEvent = {
      ...game.pendingEvents![0],
      relatedPlayerId: undefined,
    }
    const brokenGame = { ...game, pendingEvents: [brokenEvent] }
    expect(() => resolveEvent(brokenGame, 'ev_omojlig', 'sell')).toThrow(/relatedPlayerId/)
  })

  it('keep-valet lämnar spelaren i truppen', () => {
    const { game, player } = makeGameWithSellEvent()
    const resolved = resolveEvent(game, 'ev_omojlig', 'keep')

    const club = resolved.clubs.find(c => c.id === resolved.managedClubId)!
    expect(club.squadPlayerIds).toContain(player.id)
  })

  // A-H9 (DOM_AH9_ARSBOKENS_BESLUT_2026-08-27.md): "keep" har en namngiven
  // person men varken irreversibilitet eller spänning (inget uttalat pris
  // för att avstå) — score 1 av 3, kvalificerar inte längre som säsongens
  // beslut-kandidat. Byggarens "Du lät det vara..."-mening finns kvar
  // (text-utan-yta, se seasonDecisionCaptureService.ts), men skrivs inte
  // längre till seasonDecisionCandidates.
  it('keep-valet skriver INGEN seasonDecisionCandidates-post (kvalificerar inte under A-H9)', () => {
    const { game } = makeGameWithSellEvent()
    const resolved = resolveEvent(game, 'ev_omojlig', 'keep')
    const candidate = resolved.seasonDecisionCandidates?.find(c => c.eventId === 'ev_omojlig')
    expect(candidate).toBeUndefined()
  })
})
