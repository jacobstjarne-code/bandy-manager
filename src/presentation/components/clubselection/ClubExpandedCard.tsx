import type { ClubExtendedInfo } from '../../../domain/data/clubExtendedInfo'
import type { ClubOfferQuote } from '../../../domain/data/clubOfferQuotes'

interface Props {
  clubId: string
  clubName: string
  region: string
  arenaName: string
  supporterGroupName: string
  extendedInfo: ClubExtendedInfo
  quote: ClubOfferQuote | null
  onSelect: (clubId: string) => void
}

export function ClubExpandedCard({
  clubId,
  clubName,
  region,
  arenaName,
  supporterGroupName,
  extendedInfo,
  quote,
  onSelect,
}: Props) {
  const displayQuote = quote ?? null
  const fallbackText = extendedInfo.briefDescription

  return (
    <div
      className="card-tap"
      style={{
        background: 'var(--bg-dark-surface)',
        border: '1px solid var(--accent)',
        borderRadius: 8,
        padding: '14px 16px',
        marginTop: 16,
        position: 'relative',
        zIndex: 3,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-light)' }}>
            {clubName}
          </div>
          <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--accent)', marginTop: 2 }}>
            {region}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11, lineHeight: 1.5 }}>
        <span style={{ color: 'var(--accent)', width: 16, flexShrink: 0 }}>🏟</span>
        <span style={{ color: 'var(--text-light-secondary)' }}>
          <strong style={{ color: 'var(--text-light)', fontWeight: 600 }}>{arenaName}</strong>
          {' '}— {extendedInfo.arenaNote}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11, lineHeight: 1.5 }}>
        <span style={{ color: 'var(--accent)', width: 16, flexShrink: 0 }}>👤</span>
        <span style={{ color: 'var(--text-light-secondary)' }}>{extendedInfo.patronType}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11, lineHeight: 1.5 }}>
        <span style={{ color: 'var(--accent)', width: 16, flexShrink: 0 }}>📣</span>
        <span style={{ color: 'var(--text-light-secondary)' }}>
          <strong style={{ color: 'var(--text-light)', fontWeight: 600 }}>{supporterGroupName}</strong>
        </span>
      </div>

      <div
        style={{
          borderLeft: '2px solid var(--accent)',
          padding: '6px 0 6px 10px',
          margin: '10px 0',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 12,
          color: 'var(--text-light-secondary)',
          lineHeight: 1.5,
        }}
      >
        {displayQuote ? displayQuote.text : `"${fallbackText}"`}
      </div>

      <button
        onClick={() => onSelect(clubId)}
        className="btn btn-primary"
        style={{ width: '100%', marginTop: 8 }}
      >
        Ta över {clubName} →
      </button>
    </div>
  )
}
