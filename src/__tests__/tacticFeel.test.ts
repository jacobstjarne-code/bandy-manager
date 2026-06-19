/**
 * Genomgång II B — "så spelar det": en mening härledd ur spelstil + faktisk kemi,
 * inte canned. Låser mentality-framingen + att tom startelva inte kraschar.
 */
import { describe, it, expect } from 'vitest'
import { getTacticFeel } from '../domain/services/chemistryService'
import { TacticMentality } from '../domain/enums'
import type { Tactic } from '../domain/entities/Club'

const tactic = (mentality: TacticMentality, lineupSlots: Record<string, string> = {}): Tactic =>
  ({ mentality, lineupSlots } as unknown as Tactic)

describe('getTacticFeel', () => {
  it('speglar spelstilen i öppningen', () => {
    expect(getTacticFeel(tactic(TacticMentality.Offensive), [], {})).toMatch(/^Tyngdpunkten ligger framåt/)
    expect(getTacticFeel(tactic(TacticMentality.Defensive), [], {})).toMatch(/^Laget sitter djupt/)
    expect(getTacticFeel(tactic(TacticMentality.Balanced), [], {})).toMatch(/^Balans/)
  })

  it('utan startelva ber den dig sätta laget (ingen krasch på tom lineup)', () => {
    expect(getTacticFeel(tactic(TacticMentality.Balanced), [], {})).toMatch(/Sätt en startelva/)
  })
})
