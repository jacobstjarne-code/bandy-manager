import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ClubBadge } from '../ClubBadge'

describe('ClubBadge production assets', () => {
  it('uses the compact Forsbacka asset at 40 px and below', () => {
    const markup = renderToStaticMarkup(
      <ClubBadge clubId="club_forsbacka" name="Forsbacka" size={40} />,
    )

    expect(markup).toContain('/assets/clubs/forsbacka/badge-32.svg')
    expect(markup).toContain('alt="Forsbacka klubbmärke"')
  })

  it('uses the full Forsbacka asset above 32 px', () => {
    const markup = renderToStaticMarkup(
      <ClubBadge clubId="club_forsbacka" name="Forsbacka" size={56} />,
    )

    expect(markup).toContain('/assets/clubs/forsbacka/badge-64.svg')
  })

  it('keeps legacy badges for clubs whose production asset is not ready', () => {
    const markup = renderToStaticMarkup(
      <ClubBadge clubId="club_gagnef" name="Gagnef" size={32} />,
    )

    expect(markup).toContain('<svg')
    expect(markup).not.toContain('/assets/clubs/')
  })
})
