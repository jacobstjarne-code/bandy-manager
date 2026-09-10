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

describe('PortalInboxCounter — lugn sammanfattningsrad', () => {
  it('dubbelvisar inte den separata beslutskön och kallar inboxposter olästa', () => {
    const base = createNewGame({
      managerName: 'Test',
      clubId: 'club_forsbacka',
      season: 2026,
      seed: 17,
    })
    const game = {
      ...base,
      deferredDecisions: [decision('d1'), decision('d2')],
      inbox: [{
        id: 'i1', date: '2026-10-01', type: 'community',
        title: 'Från orten', body: 'En kort notis.', isRead: false,
      }],
    }

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PortalInboxCounter game={game} />
      </MemoryRouter>,
    )

    expect(html).not.toContain('beslut väntar')
    expect(html).toContain('<strong>1</strong> oläst i inboxen')
  })
})
