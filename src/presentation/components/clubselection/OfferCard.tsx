import type { ClubOffer } from '../../../domain/services/offerSelectionService'
import type { ClubExtendedInfo } from '../../../domain/data/clubExtendedInfo'
import type { ClubOfferQuote } from '../../../domain/data/clubOfferQuotes'
import { DifficultyTag } from './DifficultyTag'

interface Props {
  offer: ClubOffer
  clubName: string
  region: string
  extendedInfo: ClubExtendedInfo
  quote: ClubOfferQuote | null
  onSelect: (clubId: string) => void
}

export function OfferCard({ offer, clubName, region, extendedInfo, quote, onSelect }: Props) {
  const displayText = quote ? quote.text : `"${extendedInfo.briefDescription}"`
  const displayAttrib = quote ? quote.attribution : 'Klubben, generisk'

  return (
    <div
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
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-light)', lineHeight: 1.2 }}>
            {clubName}
          </div>
          <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 2 }}>
            {region}
          </div>
        </div>
        <DifficultyTag difficulty={offer.difficulty} />
      </div>

      <div
        style={{
          borderLeft: '2px solid var(--accent)',
          padding: '8px 0 8px 12px',
          margin: '12px 0 10px',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--text-light-secondary)',
          lineHeight: 1.55,
        }}
      >
        {displayText}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'normal', fontFamily: 'var(--font-body)' }}>
          — {displayAttrib}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, paddingTop: 10, borderTop: '1px solid var(--bg-leather)', fontSize: 10, color: 'var(--text-muted)' }}>
        <div>{extendedInfo.arenaNote}</div>
      </div>
    </div>
  )
}
