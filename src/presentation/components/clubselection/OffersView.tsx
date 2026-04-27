import type { ClubOffer } from '../../../domain/services/offerSelectionService'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { CLUB_EXTENDED_INFO } from '../../../domain/data/clubExtendedInfo'
import { CLUB_OFFER_QUOTES } from '../../../domain/data/clubOfferQuotes'
import { OfferCard } from './OfferCard'

interface Props {
  offers: ClubOffer[]
  onSelect: (clubId: string) => void
  onShowAll: () => void
}

export function OffersView({ offers, onSelect, onShowAll }: Props) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 70%), linear-gradient(180deg, var(--bg-dark-surface) 0%, var(--bg-dark) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, padding: '28px 22px 22px' }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 10,
            textAlign: 'center',
            opacity: 0.7,
          }}
        >
          ⬩ &nbsp;TRE SAMTAL&nbsp; ⬩
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text-light)',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 6,
          }}
        >
          Tre klubbar har ringt
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginBottom: 28,
            lineHeight: 1.5,
            padding: '0 12px',
          }}
        >
          De har hört att du letar tränarjobb. Bandysverige är ett litet rum.
        </p>

        {offers.map(offer => {
          const template = CLUB_TEMPLATES.find(t => t.id === offer.clubId)
          const extendedInfo = CLUB_EXTENDED_INFO[offer.clubId]
          if (!template || !extendedInfo) return null

          const quotePool = CLUB_OFFER_QUOTES[offer.clubId] ?? []
          const quote = quotePool.length > 0 ? quotePool[offer.quoteIndex % quotePool.length] : null

          return (
            <OfferCard
              key={offer.clubId}
              offer={offer}
              clubName={template.name}
              region={template.region}
              extendedInfo={extendedInfo}
              quote={quote}
              onSelect={onSelect}
            />
          )
        })}

        <button
          onClick={onShowAll}
          style={{
            display: 'block',
            textAlign: 'center',
            background: 'transparent',
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)',
            padding: 12,
            borderRadius: 6,
            marginTop: 8,
            fontSize: 11,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
          }}
        >
          📋 Visa alla 12 klubbar i bandysverige
        </button>
      </div>
    </div>
  )
}
