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
      style={{
        background: 'var(--bg-surface)',
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
        <span style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-light)', fontWeight: 600 }}>{arenaName}</strong>
          {' '}— {extendedInfo.arenaNote}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11, lineHeight: 1.5 }}>
        <span style={{ color: 'var(--accent)', width: 16, flexShrink: 0 }}>👤</span>
        <span style={{ color: 'var(--text-secondary)' }}>{extendedInfo.patronType}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11, lineHeight: 1.5 }}>
        <span style={{ color: 'var(--accent)', width: 16, flexShrink: 0 }}>📣</span>
        <span style={{ color: 'var(--text-secondary)' }}>
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
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        {displayQuote ? displayQuote.text : `"${fallbackText}"`}
        {displayQuote && (
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'normal', fontFamily: 'var(--font-body)' }}>
            — {displayQuote.attribution}
          </div>
        )}
      </div>

      <button
        onClick={() => onSelect(clubId)}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent-deep) 100%)',
          color: 'var(--text-light)',
          border: 'none',
          padding: 12,
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.5px',
          cursor: 'pointer',
          marginTop: 8,
          fontFamily: 'var(--font-body)',
        }}
      >
        Ta över {clubName} →
      </button>
    </div>
  )
}
