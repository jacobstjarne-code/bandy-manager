import { describe, expect, it } from 'vitest'
import type { EventLedgerEntry } from '../../entities/Narrative'
import {
  MOMENT_VIEW_CLAIM_CONTRACTS,
  renderMomentViewFromLedger,
} from '../momentViewTemplates'

const context = {
  subjectName: 'Test Spelare',
  matchday: 7,
  season: 3,
  significance: 60,
}

function post(overrides: Partial<EventLedgerEntry>): EventLedgerEntry {
  return {
    type: 'sponsor_positive',
    semanticKey: 'test:s3:m7',
    clubId: 'club_test',
    season: 3,
    matchday: 7,
    significance: 60,
    ...overrides,
  }
}

describe('momentvyernas deklarerade påstående→bevis-kontrakt', () => {
  it('varje mall pekar på sin egen EventLedgerType som beviskälla', () => {
    for (const [source, contract] of Object.entries(MOMENT_VIEW_CLAIM_CONTRACTS)) {
      expect(contract.provenBy).toMatchObject({
        source: 'eventLedger',
        ledgerType: source,
      })
    }
  })

  it('renderar inte en liggartyp som saknar en deklarerad mall', () => {
    expect(renderMomentViewFromLedger(post({ type: 'decision' }), context)).toBeNull()
  })

  it('kräver den deklarerade spelarkällan innan sponsorvärvning påstås', () => {
    const contextualSponsor = post({ subject: undefined })

    expect(renderMomentViewFromLedger(contextualSponsor, context)).toBeNull()
  })

  it('renderar sponsorvärvningen när liggarposten faktiskt pekar ut spelaren', () => {
    const playerSigning = post({ subject: { kind: 'player', id: 'player_test' } })

    expect(renderMomentViewFromLedger(playerSigning, context)?.body)
      .toContain('värvningen av Test Spelare')
  })
})
