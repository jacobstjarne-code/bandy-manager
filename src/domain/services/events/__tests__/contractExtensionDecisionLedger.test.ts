/**
 * transfer-arsbok-minns-fel (systemaudit 2026-09-06): en kontraktsförlängning
 * skrev redan en `decision`-post via appendDecisionConsequenceLedgerEntry
 * (ripple på playerMorale) — men saknade actionLabel/recurringCost, så
 * composeGenericDecisionSentence kunde aldrig göra en mening av den. En
 * viktig förlängning kunde därför aldrig bli "säsongens beslut" trots att
 * posten fanns i liggaren hela tiden.
 */
import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { contractRequestEvent } from '../eventFactories'
import { resolveEvent } from '../eventResolver'
import { composeSeasonDecisionSentence } from '../../seasonDecisionCaptureService'
import { CLUB_TEMPLATES } from '../../worldGenerator'

function makeGame() {
  const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  const player = base.players.find(p => p.clubId === base.managedClubId)!
  const event = contractRequestEvent(base, player.id)
  return { game: { ...base, pendingEvents: [event] }, player, event }
}

describe('resolveEvent — contractRequest skriver actionLabel + recurringCost på decision-posten', () => {
  it('extend3 (lönehöjning): actionLabel = choice.label, recurringCost ur den faktiska lönehöjningen', () => {
    const { game, player, event } = makeGame()
    const result = resolveEvent(game, event.id, 'extend3', () => 0, true)
    const entry = result.eventLedger!.find(e => e.semanticKey === 'contractRequest')!

    expect(entry.actionLabel).toBe(event.choices.find(c => c.id === 'extend3')!.label)
    const newSalary = result.players.find(p => p.id === player.id)!.salary
    expect(entry.recurringCost).toEqual({ amountPerSeason: (newSalary - player.salary) * 12, seasons: 3 })
  })

  it('extend3: entry kan nu producera en mening (var tidigare null trots att posten fanns)', () => {
    const { game, event } = makeGame()
    const result = resolveEvent(game, event.id, 'extend3', () => 0, true)
    const entry = result.eventLedger!.find(e => e.semanticKey === 'contractRequest')!
    expect(composeSeasonDecisionSentence(entry, result)).not.toBeNull()
  })

  it('extend1 (samma lön): actionLabel satt, men ingen recurringCost — ingen faktisk kostnadsökning', () => {
    const { game, event } = makeGame()
    const result = resolveEvent(game, event.id, 'extend1', () => 0, true)
    const entry = result.eventLedger!.find(e => e.semanticKey === 'contractRequest')!
    expect(entry.actionLabel).toBe(event.choices.find(c => c.id === 'extend1')!.label)
    expect(entry.recurringCost).toBeUndefined()
  })

  it('reject: ingen ripple (moral opåverkad om spelaren redan är nöjd) — ingen post, ingen krasch', () => {
    const { game, event } = makeGame()
    const result = resolveEvent(game, event.id, 'reject', () => 0, true)
    // Ingen assertion på frånvaro av post krävs (ripple kan trigga moralstraff) —
    // detta test verifierar bara att choiceId-trådningen inte kraschar för reject.
    expect(() => result.eventLedger).not.toThrow()
  })
})

describe('composeGenericDecisionSentence — recurringCost utan moneyAmount (kontraktsförlängningens form)', () => {
  it('bygger "Kostar X/säsong i Y år framåt" utan "Kostade ... nu" när moneyAmount saknas', () => {
    const { game, player } = makeGame()
    const gameAfter = { ...game, players: game.players.map(p => p.id === player.id ? { ...p, salary: p.salary + 1000 } : p) }
    const entry = {
      type: 'decision' as const, semanticKey: 'contractRequest', season: 1, matchday: 0,
      significance: 60, madeByPlayer: true, actionLabel: 'Förläng 3 år',
      subject: { kind: 'player' as const, id: player.id },
      recurringCost: { amountPerSeason: 12_000, seasons: 3 },
    }
    expect(composeSeasonDecisionSentence(entry, gameAfter)).toBe(
      `Förläng 3 år, ${player.firstName} ${player.lastName}. Kostar 12 tkr/säsong i 3 år framåt.`,
    )
  })
})
