import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import { PortalInboxCounter } from '../PortalInboxCounter'

function decision(id: string): GameEvent {
  return {
    id,
    type: 'sponsorOffer',
    title: id,
    body: id,
    choices: [{ id: 'yes', label: 'Ja', effect: { type: 'noOp' } }],
    resolved: false,
    deferredAt: 4,
  }
}

describe('PortalInboxCounter — KF3 väntanderad', () => {
  it('visar det kanoniska köantalet som "X beslut väntar"', () => {
    const base = createNewGame({
      managerName: 'Test',
      clubId: 'club_forsbacka',
      season: 2026,
      seed: 17,
    })
    const game = {
      ...base,
      deferredDecisions: [decision('d1'), decision('d2')],
    }

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PortalInboxCounter game={game} />
      </MemoryRouter>,
    )

    expect(html).toContain('<strong>2</strong> beslut väntar')
    expect(html).not.toContain(' i kö')
  })
})
