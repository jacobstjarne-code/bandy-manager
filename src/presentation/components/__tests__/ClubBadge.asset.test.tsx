import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ClubBadge } from '../ClubBadge'

describe('ClubBadge production assets', () => {
  const productionClubs = [
    ['club_forsbacka', 'forsbacka', 'Forsbacka'],
    ['club_soderfors', 'soderfors', 'Söderfors'],
    ['club_vastanfors', 'vastanfors', 'Västanfors'],
    ['club_karlsborg', 'karlsborg', 'Karlsborg'],
    ['club_malilla', 'malilla', 'Målilla'],
    ['club_gagnef', 'gagnef', 'Gagnef'],
    ['club_halleforsnas', 'halleforsnas', 'Hälleforsnäs'],
    ['club_lesjofors', 'lesjofors', 'Lesjöfors'],
    ['club_rogle', 'rogle', 'Rögle'],
    ['club_slottsbron', 'slottsbron', 'Slottsbron'],
    ['club_skutskar', 'skutskar', 'Skutskär'],
    ['club_heros', 'heros', 'Heros'],
  ] as const

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

  it.each(productionClubs)('wires all three production sizes for %s', (clubId, slug, name) => {
    const micro = renderToStaticMarkup(<ClubBadge clubId={clubId} name={name} size={24} />)
    const compact = renderToStaticMarkup(<ClubBadge clubId={clubId} name={name} size={32} />)
    const full = renderToStaticMarkup(<ClubBadge clubId={clubId} name={name} size={64} />)

    expect(micro).toContain(`/assets/clubs/${slug}/badge-16.svg`)
    expect(compact).toContain(`/assets/clubs/${slug}/badge-32.svg`)
    expect(full).toContain(`/assets/clubs/${slug}/badge-64.svg`)
  })

  it('keeps a deterministic legacy badge for unknown club ids', () => {
    const markup = renderToStaticMarkup(
      <ClubBadge clubId="club_future" name="Framtidsklubben" size={32} />,
    )

    expect(markup).toContain('<svg')
    expect(markup).not.toContain('/assets/clubs/')
  })
})
