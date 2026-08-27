import type { ClubOffer } from '../../../domain/services/offerSelectionService'
import type { ClubExtendedInfo } from '../../../domain/data/clubExtendedInfo'
import type { ClubOfferQuote } from '../../../domain/data/clubOfferQuotes'
import { ClubExpectation } from '../../../domain/enums'
import { DifficultyTag } from './DifficultyTag'

interface Props {
  offer: ClubOffer
  clubName: string
  region: string
  boardExpectation: ClubExpectation
  extendedInfo: ClubExtendedInfo
  quote: ClubOfferQuote | null
  onSelect: (clubId: string) => void
}

export function OfferCard({ offer, clubName, region, boardExpectation, extendedInfo, quote, onSelect }: Props) {
  const displayText = quote ? quote.text : `"${extendedInfo.briefDescription}"`

  return (
    <div
      className="card-tap"
      style={{
        background: 'var(--bg-dark-surface)',
        border: '1px solid var(--bg-leather)',
        borderRadius: 8,
        padding: '16px 18px',
        marginBottom: 12,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onClick={() => onSelect(offer.clubId)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(offer.clubId)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div className="h-card" style={{ color: 'var(--text-light)' }}>
            {clubName}
          </div>
          <div className="h-label" style={{ marginTop: 2 }}>
            {region}
          </div>
        </div>
        <DifficultyTag difficulty={offer.difficulty} />
      </div>

      {boardExpectation === ClubExpectation.Survive && (
        // H4 Heros (Jacobs dom 2026-08-25), text låst ordagrant — bara Heros
        // har ClubExpectation.Survive idag (worldGenerator.ts).
        <div style={{ fontSize: 11, lineHeight: 1.5, marginTop: 4, color: 'var(--text-light-secondary)' }}>
          <strong style={{ color: 'var(--text-light)', fontWeight: 600 }}>LÅGA FÖRVÄNTNINGAR</strong>
          <br />
          Styrelsen begär bara att klubben finns kvar nästa år.
        </div>
      )}

      <div
        className="h-quote"
        style={{
          borderLeft: '2px solid var(--accent)',
          padding: '8px 0 8px 12px',
          margin: '12px 0 10px',
          color: 'var(--text-light-secondary)',
          lineHeight: 1.55,
        }}
      >
        {displayText}
      </div>

      <div style={{ display: 'flex', gap: 14, paddingTop: 10, borderTop: '1px solid var(--bg-leather)', fontSize: 10, color: 'var(--text-muted)' }}>
        <div>{extendedInfo.arenaNote}</div>
      </div>
    </div>
  )
}
