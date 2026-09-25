import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { BetaInviteGate } from '../BetaInviteGate'
import { normalizeBetaCode } from '../../../infrastructure/attention/attentionClient'

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
    expect(markup).toContain('Betan är stängd. Skriv in din kod så öppnar vi.')
    // Serverrenderingen stannar avsiktligt i tillträdeskontrollen. Fältets
    // hjälprad visas först när kontrollen svarat, så den hör inte till detta
    // SSR-kontrakt.
    expect(markup).not.toContain('<p>Spelet</p>')
  })

  it('betafynd 2: en installation med sparat tillträde släpps in direkt', () => {
    vi.stubEnv('VITE_BETA_INVITES_ENABLED', 'true')
    localStorage.setItem('bandy-attention-installation-v1', JSON.stringify({ installationId: 'install-1', token: 't' }))
    localStorage.setItem('bandy-beta-access-v1', 'install-1')
    try {
      const markup = renderToStaticMarkup(<MemoryRouter><BetaInviteGate><p>Spelet</p></BetaInviteGate></MemoryRouter>)
      expect(markup).toContain('<p>Spelet</p>')
      // Tillträdet gäller installationen, inte telefonen.
      localStorage.setItem('bandy-beta-access-v1', 'install-2')
      const other = renderToStaticMarkup(<MemoryRouter><BetaInviteGate><p>Spelet</p></BetaInviteGate></MemoryRouter>)
      expect(other).not.toContain('<p>Spelet</p>')
    } finally {
      localStorage.removeItem('bandy-attention-installation-v1')
      localStorage.removeItem('bandy-beta-access-v1')
    }
  })

  it('betafynd 5: klienten normaliserar koden som servern', () => {
    expect(normalizeBetaCode(' abcde-fghjk ')).toBe('ABCDEFGHJK')
    expect(normalizeBetaCode('o1l2i 34567')).toBe('0112134567')
    const legacy = 'aB3_-xY9aB3_-xY9aB3_-xY9aB3_-xY9'
    expect(normalizeBetaCode(legacy)).toBe(legacy)
  })

  it('uses the canonical hyphenated domain in the invite help', async () => {
    const [{ readFile }, { resolve }] = await Promise.all([
      import('node:fs/promises'), import('node:path'),
    ])
    const source = await readFile(resolve(process.cwd(), 'src/presentation/components/BetaInviteGate.tsx'), 'utf8')
    expect(source).toContain('bandy-manager.se')
    expect(source).not.toContain('bandymanager.se')
  })
})
