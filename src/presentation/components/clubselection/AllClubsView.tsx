import { useState } from 'react'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { CLUB_EXTENDED_INFO } from '../../../domain/data/clubExtendedInfo'
import { CLUB_OFFER_QUOTES } from '../../../domain/data/clubOfferQuotes'
import { SverigeBackdrop } from './SverigeBackdrop'
import { ClubListItem } from './ClubListItem'
import { ClubExpandedCard } from './ClubExpandedCard'

interface Props {
  onSelect: (clubId: string) => void
  onBack: () => void
}

// Region-ordning norr → söder
const REGION_ORDER = ['Norrbotten', 'Gästrikland', 'Dalarna', 'Västmanland', 'Värmland', 'Uppland', 'Södermanland', 'Småland', 'Skåne']


export function AllClubsView({ onSelect, onBack }: Props) {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)

  const grouped = new Map<string, typeof CLUB_TEMPLATES>()
  for (const region of REGION_ORDER) {
    const clubs = CLUB_TEMPLATES.filter(t => t.region === region)
    if (clubs.length > 0) grouped.set(region, clubs)
  }

  function handlePillClick(clubId: string) {
    setSelectedClubId(prev => (prev === clubId ? null : clubId))
  }

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100%', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 50% at 50% 30%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--bg-dark-surface) 0%, var(--bg-dark) 100%)',
          pointerEvents: 'none',
        }}
      />
      <SverigeBackdrop />

      <div style={{ position: 'relative', zIndex: 2, padding: '22px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button
            onClick={onBack}
            style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font-body)' }}
          >
            ← Tillbaka
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-light)', textAlign: 'center', flex: 1 }}>
            Välj din klubb
          </div>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' }}>
          Norr till söder. Tryck för mer.
        </div>

        {Array.from(grouped.entries()).map(([region, clubs]) => (
          <div key={region} style={{ marginBottom: 14 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: 'var(--accent)',
                opacity: 0.6,
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              {region}
            </div>
            {clubs.map((club) => {
              const alignment: 'center' = 'center'
              const extInfo = CLUB_EXTENDED_INFO[club.id]
              const quotePool = CLUB_OFFER_QUOTES[club.id] ?? []
              const quote = quotePool.length > 0 ? quotePool[0] : null
              return (
                <div key={club.id}>
                  <ClubListItem
                    name={club.name}
                    isSelected={selectedClubId === club.id}
                    alignment={alignment}
                    onClick={() => handlePillClick(club.id)}
                  />
                  {selectedClubId === club.id && extInfo && (
                    <ClubExpandedCard
                      clubId={club.id}
                      clubName={club.name}
                      region={club.region}
                      arenaName={club.arenaName}
                      supporterGroupName={club.supporterGroupName}
                      extendedInfo={extInfo}
                      quote={quote}
                      onSelect={onSelect}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
