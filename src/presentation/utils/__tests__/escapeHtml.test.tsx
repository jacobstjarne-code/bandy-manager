import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { escapeHtml } from '../escapeHtml'
import { SundayTrainingPlayerList } from '../../screens/scenes/shared/SundayTrainingPlayerList'

// Säkerhetsgenomgång 2026-09-25: namn ur en importerad sparfil får aldrig
// bli markup när de sätts in i text som renderas med dangerouslySetInnerHTML.
const payload = '<img src=x onerror="alert(1)">'

describe('escapeHtml', () => {
  it('neutraliserar markup men lämnar vanliga namn orörda', () => {
    expect(escapeHtml(payload)).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
    expect(escapeHtml('Åström-Nyberg')).toBe('Åström-Nyberg')
    expect(escapeHtml("O'Hara & Co")).toBe('O&#39;Hara &amp; Co')
  })

  it('ett elakt spelarnamn i söndagsträningen renderas som text', () => {
    const markup = renderToStaticMarkup(
      <SundayTrainingPlayerList players={[{ initial: 'X', name: payload, text: 'kom först.' } as never]} />,
    )
    expect(markup).not.toContain('<img')
    expect(markup).toContain('&lt;img')
  })
})
