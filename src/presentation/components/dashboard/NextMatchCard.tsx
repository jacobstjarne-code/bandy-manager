import { ClubBadge } from '../ClubBadge'
import { BandyStickSVG } from '../Decorations'
import { IceQuality, PlayoffRound } from '../../../domain/enums'
import { getWeatherEmoji, getIceQualityLabel } from '../../../domain/services/weatherService'
import type { PlayoffSeries } from '../../../domain/entities/Playoff'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Club } from '../../../domain/entities/Club'
import type { MatchWeather } from '../../../domain/entities/Weather'
import type { Rivalry } from '../../../domain/data/rivalries'
import { getCupRoundLabel } from '../../../domain/services/cupService'

function getRoundLabel(round: PlayoffRound): string {
  if (round === PlayoffRound.QuarterFinal) return 'KF'
  if (round === PlayoffRound.SemiFinal) return 'SF'
  return 'Final'
}

function getRoundFullLabel(round: PlayoffRound): string {
  if (round === PlayoffRound.QuarterFinal) return 'Kvartsfinal'
  if (round === PlayoffRound.SemiFinal) return 'Semifinal'
  return 'SM-Final'
}

interface NextMatchCardProps {
  nextFixture: Fixture
  opponent: Club
  isHome: boolean
  rivalry: Rivalry | null
  club: Club
  game: SaveGame
  isPlayoffFixture: boolean | null | undefined
  playoffSeries: PlayoffSeries | null
  dynamicHomeWins: number
  dynamicAwayWins: number
  matchWeather: MatchWeather | undefined
  hasPendingLineup: boolean
  onNavigate: () => void
  cardLabelStyle: React.CSSProperties
}

export function NextMatchCard({
  nextFixture,
  opponent,
  isHome,
  rivalry,
  club,
  game,
  isPlayoffFixture,
  playoffSeries,
  dynamicHomeWins,
  dynamicAwayWins,
  matchWeather,
  hasPendingLineup,
  cardLabelStyle,
}: NextMatchCardProps) {
  return (
    <div className="card-stagger-1" style={{
      background: rivalry
        ? 'linear-gradient(135deg, #1a1215 0%, #0D1B2A 50%, #1a1215 100%) padding-box, linear-gradient(135deg, #DC3220, #C9A84C, #DC3220) border-box'
        : 'linear-gradient(135deg, #122235 0%, #0D1B2A 50%, #0f1e30 100%) padding-box, linear-gradient(135deg, #C9A84C, transparent 60%) border-box',
      border: '2px solid transparent',
      borderRadius: 12,
      padding: '18px',
      marginBottom: 12,
      boxShadow: '0 8px 32px rgba(201,168,76,0.12)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Watermark decoration */}
      <div style={{ position: 'absolute', top: -8, right: -8, opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}>
        <BandyStickSVG size={80} />
      </div>
      {rivalry && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          borderRadius: 99,
          background: 'linear-gradient(90deg, rgba(220,50,30,0.2), rgba(201,168,76,0.2))',
          border: '1px solid rgba(220,100,30,0.4)',
          fontSize: 11,
          fontWeight: 700,
          color: '#ff7040',
          marginBottom: 8,
          position: 'relative',
          zIndex: 1,
        }}>
          🔥 {rivalry.name}
        </div>
      )}
      <p className="section-heading" style={{ ...cardLabelStyle, position: 'relative', zIndex: 1 }}>
        {isPlayoffFixture ? `NÄSTA MATCH — ${playoffSeries ? getRoundFullLabel(playoffSeries.round).toUpperCase() : 'SLUTSPEL'}` : 'NÄSTA MATCH'}
      </p>
      {nextFixture.isCup && (() => {
        const cupMatch = game.cupBracket?.matches.find(m => m.fixtureId === nextFixture.id)
        const roundLabel = cupMatch ? getCupRoundLabel(cupMatch.round) : 'CUPMATCH'
        return (
          <p style={{ fontSize: 13, color: '#C9A84C', fontWeight: 700, marginBottom: 4, position: 'relative', zIndex: 1 }}>
            🏆 Svenska Cupen · {roundLabel}
          </p>
        )
      })()}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative', zIndex: 1 }}>
        {/* Club badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <ClubBadge clubId={game.managedClubId} name={club.name} size={36} />
          <span style={{ fontSize: 10, color: '#8A9BB0', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {club.name}
          </span>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#F0F4F8', letterSpacing: '2px' }}>VS</p>
          {isPlayoffFixture && playoffSeries ? (
            <p style={{ fontSize: 13, color: '#C9A84C', marginTop: 2, fontWeight: 700 }}>
              {getRoundLabel(playoffSeries.round)} · {dynamicHomeWins}–{dynamicAwayWins}
            </p>
          ) : nextFixture.isCup ? null : (
            <p style={{ fontSize: 13, color: '#8A9BB0', marginTop: 2 }}>Omgång {nextFixture.roundNumber}</p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <ClubBadge clubId={nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId} name={opponent.name} size={36} />
          <span style={{ fontSize: 10, color: '#8A9BB0', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {opponent.name}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Home/away pill */}
        <span style={{
          padding: '4px 10px',
          borderRadius: 99,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.5px',
          background: isHome ? 'rgba(34,197,94,0.15)' : 'rgba(37,99,235,0.15)',
          color: isHome ? '#22c55e' : '#60a5fa',
          border: `1px solid ${isHome ? 'rgba(34,197,94,0.3)' : 'rgba(37,99,235,0.3)'}`,
        }}>
          {isHome ? 'HEMMAMATCH' : 'BORTAMATCH'}
        </span>
        {/* Lineup status pill */}
        <span style={{
          padding: '4px 10px',
          borderRadius: 99,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.5px',
          background: hasPendingLineup ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
          color: hasPendingLineup ? '#22c55e' : '#f59e0b',
          border: `1px solid ${hasPendingLineup ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
        }}>
          {hasPendingLineup ? 'TRUPP KLAR ✓' : '⚠ VÄLJ TRUPP'}
        </span>
      </div>
      {matchWeather && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span>{getWeatherEmoji(matchWeather.weather.condition)}</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {matchWeather.weather.temperature > 0 ? '+' : ''}{matchWeather.weather.temperature}°
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
          <span style={{
            fontSize: 12,
            color: matchWeather.weather.iceQuality === IceQuality.Poor || matchWeather.weather.iceQuality === IceQuality.Cancelled
              ? 'var(--danger)' : 'var(--text-secondary)'
          }}>
            {getIceQualityLabel(matchWeather.weather.iceQuality)}
            {(matchWeather.weather.iceQuality === IceQuality.Poor || matchWeather.weather.iceQuality === IceQuality.Cancelled) ? ' ⚠️' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
