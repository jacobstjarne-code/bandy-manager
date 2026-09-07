import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { NavigateFunction } from 'react-router-dom'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import type { EventLedgerEntry } from '../../../../domain/entities/Narrative'
import { OrtenTab } from '../OrtenTab'

function render(game: ReturnType<typeof createNewGame>) {
  const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
  return renderToStaticMarkup(
    <OrtenTab club={club} game={game} navigate={(() => {}) as NavigateFunction} onNavigateTab={() => {}} />,
  )
}

describe('OrtenTab — community_shift DEL 2 (Orten-vyn, konsument 3 av 4)', () => {
  it('ingen post i liggaren → ingen rad (ingen mening hellre än falsk)', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const html = render(game)
    expect(html).not.toContain('Orten vände')
    expect(html).not.toContain('Orten drog sig undan')
  })

  it('senaste community_shift-posten för DENNA klubb renders med den låsta texten', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const shift: EventLedgerEntry = {
      type: 'community_shift', semanticKey: `community_shift_${base.managedClubId}_s2_m10`,
      clubId: base.managedClubId, season: 2, matchday: 10,
      subject: { kind: 'club', id: base.managedClubId }, significance: 55,
      communityShift: { from: 48, to: 52, direction: 'up' },
    } as EventLedgerEntry
    const game = { ...base, eventLedger: [shift] }
    const html = render(game)
    expect(html).toContain('Orten vände. 48→52 — det märks på läktaren först.')
  })

  it('väljer den SENASTE posten (högst säsong/matchdag), inte en äldre', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const older: EventLedgerEntry = {
      type: 'community_shift', semanticKey: `community_shift_${base.managedClubId}_s1_m10`,
      clubId: base.managedClubId, season: 1, matchday: 10,
      subject: { kind: 'club', id: base.managedClubId }, significance: 55,
      communityShift: { from: 28, to: 32, direction: 'up' },
    } as EventLedgerEntry
    const newer: EventLedgerEntry = {
      type: 'community_shift', semanticKey: `community_shift_${base.managedClubId}_s2_m5`,
      clubId: base.managedClubId, season: 2, matchday: 5,
      subject: { kind: 'club', id: base.managedClubId }, significance: 55,
      communityShift: { from: 52, to: 48, direction: 'down' },
    } as EventLedgerEntry
    const game = { ...base, eventLedger: [older, newer] }
    const html = render(game)
    expect(html).toContain('Orten drog sig undan. 52→48. Det märks på läktaren först.')
    expect(html).not.toContain('Orten vände')
  })

  it('en annan klubbs post smittar inte över', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const otherClubId = base.clubs.find(c => c.id !== base.managedClubId)!.id
    const shift: EventLedgerEntry = {
      type: 'community_shift', semanticKey: `community_shift_${otherClubId}_s2_m10`,
      clubId: otherClubId, season: 2, matchday: 10,
      subject: { kind: 'club', id: otherClubId }, significance: 55,
      communityShift: { from: 48, to: 52, direction: 'up' },
    } as EventLedgerEntry
    const game = { ...base, eventLedger: [shift] }
    const html = render(game)
    expect(html).not.toContain('Orten vände')
  })
})
