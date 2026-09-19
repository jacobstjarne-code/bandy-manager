import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { BetaInviteGate } from '../BetaInviteGate'

afterEach(() => vi.unstubAllEnvs())

describe('beta invitation launch flag', () => {
  it('does not block the normal game while the flag is absent', () => {
    vi.stubEnv('VITE_BETA_INVITES_ENABLED', '')
    const markup = renderToStaticMarkup(<MemoryRouter><BetaInviteGate><p>Spelet</p></BetaInviteGate></MemoryRouter>)
    expect(markup).toContain('Spelet')
    expect(markup).not.toContain('Betatestet.')
  })

  it('shows the access check before game content when the flag is enabled', () => {
    vi.stubEnv('VITE_BETA_INVITES_ENABLED', 'true')
    const markup = renderToStaticMarkup(<MemoryRouter><BetaInviteGate><p>Spelet</p></BetaInviteGate></MemoryRouter>)
    expect(markup).toContain('Betatestet.')
    expect(markup).not.toContain('<p>Spelet</p>')
  })
})
