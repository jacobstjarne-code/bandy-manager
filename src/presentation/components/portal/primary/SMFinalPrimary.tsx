import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getWeatherEmoji } from '../../../../domain/services/weatherService'
import { getRoundDate } from '../../../../domain/services/scheduleGenerator'

/**
 * Primary-kort för SM-finaldagen.
 * Mock-referens: "SM-final"-tillståndet i portal_bag_mockup.html.
 *
 * CSS från mock (bag_architecture_mockup.html):
 * .output-card.primary.smfinal {
 *   background: linear-gradient(135deg, var(--bg-elevated) 0%, rgba(212,164,96,0.20) 100%);
 *   border-color: var(--gold);
 *   padding: 14px 16px;
 * }
 */
export function SMFinalPrimary({ game }: CardRenderProps) {
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

  // Arenan för SM-finalen — kolla om neutral venue, annars hem/borta
  const arenaName = nextFixture.arenaName
    ?? (isHome ? (club?.arenaName ?? 'Hemmaplan') : (opponent.arenaName ?? 'Studenternas IP'))
  const venueCity = nextFixture.venueCity
    ?? (isHome ? (club?.region ?? '') : (opponent.region ?? ''))

  const roundDateStr = nextFixture.isCup ? '' : getRoundDate(nextFixture.season, nextFixture.roundNumber)
  const matchDate = roundDateStr ? new Date(roundDateStr) : null
  const MONTHS = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december']
  const DAYS = ['sön','mån','tis','ons','tor','fre','lör']
  const dateStr = matchDate
    ? `${DAYS[matchDate.getDay()]} ${matchDate.getDate()} ${MONTHS[matchDate.getMonth()]}`
    : ''

  const matchWeather = (game.matchWeathers ?? []).find(mw => mw.fixtureId === nextFixture.id)
  const weatherEmoji = matchWeather ? getWeatherEmoji(matchWeather.weather.condition) : '❄️'
  const tempStr = matchWeather?.weather?.temperature !== undefined ? `${matchWeather.weather.temperature}°C` : ''
  const weatherStr = [weatherEmoji, tempStr].filter(Boolean).join(' ')

  // Säsongssammanfattning
  const standing = game.standings.find(s => s.clubId === managedId)
  const posStr = standing ? `${standing.position}:a · ${standing.points} p` : ''

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--bg-elevated) 0%, rgba(212,164,96,0.20) 100%)',
      border: '1px solid var(--match-gold)',
      borderRadius: 8,
      padding: '14px 16px',
      marginBottom: 14,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: 9,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontWeight: 700,
        marginBottom: 8,
        color: 'var(--match-gold)',
      }}>
        🏆 SM-FINAL · IMORGON
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1.2,
        color: 'var(--text-primary)',
        marginBottom: 6,
      }}>
        {arenaName}
      </div>
      <div style={{
        fontSize: 12,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        marginBottom: 14,
      }}>
        {opponent.name} · {dateStr}
        {venueCity && ` · ${venueCity}`}
      </div>

      {weatherStr && (
        <div style={{
          background: 'rgba(0,0,0,0.06)',
          padding: '10px 12px',
          borderRadius: 6,
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 9, letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>VÄDER</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{weatherStr}</div>
        </div>
      )}

      {posStr && (
        <div style={{
          display: 'flex',
          gap: 12,
          fontSize: 10,
          color: 'var(--text-muted)',
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid var(--border)',
        }}>
          <span><strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Säsongen:</strong> {posStr}</span>
        </div>
      )}

      <button
        onClick={() => navigate('/game/match')}
        style={{
          width: '100%',
          marginTop: 12,
          background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent-deep) 100%)',
          color: 'var(--text-light)',
          border: 'none',
          padding: '14px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.5px',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        Sätt lineup för finalen →
      </button>
    </div>
  )
}
