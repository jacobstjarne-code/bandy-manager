/**
 * liggare-ny-letter (RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3 + SPEC_BERATTAREN
 * §5): saveBandyLetter dual-writar nu en `letter`-liggarpost bredvid den
 * orörda `bandyLetters`-fickan (Brevarkivet läser fortsatt fickan direkt).
 */
import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateBandyLetterEvent } from '../bandyLetterService'
import { resolveEvent } from '../events/eventResolver'

function game() {
  return createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 9 })
}

describe('saveBandyLetter — letter-liggarpost (dual-write)', () => {
  it('skriver en letter-post vars fält matchar den samtidigt sparade bandyLetters-fickan', () => {
    const base = game()
    const event = Array.from({ length: 9 }, (_, i) => generateBandyLetterEvent(base, 10 + i)!)
      .find(candidate => candidate.choices.some(choice => choice.id === 'reply_accept_jersey'))!
    const choice = event.choices.find(candidate => candidate.id === 'reply_accept_jersey')!
    const resolved = resolveEvent({ ...base, pendingEvents: [event] }, event.id, choice.id, undefined, true)

    const letter = resolved.bandyLetters?.at(-1)
    const ledgerEntry = resolved.eventLedger?.find(e => e.type === 'letter')

    expect(letter).toBeDefined()
    expect(ledgerEntry).toBeDefined()
    expect(ledgerEntry?.clubId).toBe(base.managedClubId)
    expect(ledgerEntry?.season).toBe(base.currentSeason)
    expect(ledgerEntry?.significance).toBe(40)
    expect(ledgerEntry?.subjectSnapshot?.name).toBe(letter?.senderName)
    expect(ledgerEntry?.subjectSnapshot?.age).toBe(letter?.senderAge)
    expect(ledgerEntry?.letter).toEqual({ letterId: letter?.id, kind: 'fan_mail' })
  })

  it('arkivera utan svar skriver också en letter-post', () => {
    const base = game()
    const event = generateBandyLetterEvent(base, 10)!
    const resolved = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'archive_no_reply', undefined, true)

    expect(resolved.eventLedger?.find(e => e.type === 'letter')?.letter?.letterId).toBe(event.id)
  })
})
