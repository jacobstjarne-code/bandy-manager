import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'

/**
 * B2 (2026-07-19): primärkort för cupfinaldagen. Cupfinalen hade redan
 * färdig ceremoni (cupFinalVictoryScene, cupanslagens "Pokalen är vår")
 * men portalen pekade aldrig på den i förväg — föll till next_match
 * (vikt 10). Samma gold-ceremonitier som SMFinalPrimary (primary-weight-3),
 * eftersom det också är en final, bara en pinne lägre i kortstacken
 * (weight 98 mot SM-finalens 100).
 *
 * Strukturell etikett ("🏆 CUPFINAL · IMORGON"), inte narrativ text —
 * mönsterlikt DerbyPrimary/SMFinalPrimary:s egna eyebrow-rader.
 */
export function CupFinalPrimary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId

  const nextFixture = game.fixtures
    .filter(f => f.status === 'scheduled' && (f.homeClubId === managedId || f.awayClubId === managedId))
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null

  if (!nextFixture) return null

  const opponentId = nextFixture.homeClubId === managedId ? nextFixture.awayClubId : nextFixture.homeClubId
  const opponent = game.clubs.find(c => c.id === opponentId)
  if (!opponent) return null

  const isHome = nextFixture.homeClubId === managedId
  const club = game.clubs.find(c => c.id === managedId)
  const arenaName = nextFixture.arenaName
    ?? (isHome ? (club?.arenaName ?? 'Hemmaplan') : (opponent.arenaName ?? 'Bortaplan'))

  const roundDateStr = nextFixture.date ?? ''
  const matchDate = roundDateStr ? new Date(roundDateStr) : null
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const DAYS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
  const dateStr = matchDate
    ? `${DAYS[matchDate.getDay()]} ${matchDate.getDate()} ${MONTHS[matchDate.getMonth()]}`
    : ''

  return (
    <div className="primary-card primary-weight-3" data-primary-card="true" style={{ borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
      <div className="primary-eyebrow">🏆 CUPFINAL · IMORGON</div>
      <div className="h-display-sm" style={{ color: 'var(--text-light)', marginBottom: 6 }}>
        {opponent.name} · {isHome ? 'Hemma' : 'Borta'}
      </div>
      <div style={{
        fontSize: 12,
        color: 'var(--text-light-secondary)',
        lineHeight: 1.5,
        marginBottom: 10,
      }}>
        {dateStr}{arenaName && ` · ${arenaName}`}
      </div>
      <button
        onClick={() => navigate('/game/match')}
        className="btn btn-primary"
        style={{ width: '100%', marginTop: 12 }}
      >
        Sätt lineup för cupfinalen →
      </button>
    </div>
  )
}
