import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { MatchWeather } from '../../../domain/entities/Weather'
import type { PlayoffBracket } from '../../../domain/entities/Playoff'
import type { Club } from '../../../domain/entities/Club'
import type { StandingRow } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import { getWeatherEmoji } from '../../../domain/services/weatherService'
import { truncate } from '../../utils/formatters'
import { getFinalJourney } from '../../utils/finalJourneys'
import { GoldConfetti } from './GoldConfetti'

const introBtn: React.CSSProperties = {
  padding: '14px 32px',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 12,
  color: 'var(--bg-dark)',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '1px',
}

const startBtn: React.CSSProperties = {
  padding: '16px',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 12,
  color: 'var(--bg-dark)',
  fontSize: 16,
  fontWeight: 800,
  cursor: 'pointer',
  letterSpacing: '1px',
}

interface FinalIntroScreenProps {
  variant: 'sm' | 'cup'
  slide: number
  onNext: () => void
  onStart: () => void
  homeClubName: string
  awayClubName: string
  homeLineup: TeamSelection
  awayLineup: TeamSelection
  season: number
  matchWeather?: MatchWeather
  bracket?: PlayoffBracket
  homeStanding?: StandingRow
  awayStanding?: StandingRow
  clubs: Club[]
  players: Player[]
  fixture: Fixture
}

export function FinalIntroScreen({
  variant,
  slide,
  onNext,
  onStart,
  homeClubName,
  awayClubName,
  homeLineup,
  awayLineup,
  season,
  matchWeather,
  bracket,
  homeStanding,
  awayStanding,
  clubs,
  players,
  fixture,
}: FinalIntroScreenProps) {
  const weatherEmoji = matchWeather ? getWeatherEmoji(matchWeather.weather.condition) : ''

  // Slide 1: Title card
  if (slide === 1) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, var(--bg-dark) 0%, var(--bg-dark) 60%, var(--bg-dark) 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {variant === 'sm' && <GoldConfetti />}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: variant === 'sm' ? 72 : 56, marginBottom: variant === 'sm' ? 24 : 20 }}>🏆</div>
          {variant === 'cup' && (
            <p style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--accent)',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>SVENSKA CUPEN</p>
          )}
          <h1 style={{
            fontSize: 28,
            fontWeight: 900,
            color: variant === 'sm' ? 'var(--accent)' : 'var(--text-light)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            {variant === 'sm' ? 'SM-FINALEN' : 'FINAL'}
          </h1>
          {variant === 'sm' && (
            <p style={{ fontSize: 16, color: 'var(--text-light-secondary)', marginBottom: 4 }}>Studenternas IP, Uppsala</p>
          )}
          <p style={{ fontSize: 14, color: 'rgba(245,241,235,0.35)', marginBottom: 4 }}>Säsong {season}</p>
          {variant === 'cup' && (
            <p style={{ fontSize: 16, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>
              {truncate(homeClubName, 14)}  vs  {truncate(awayClubName, 14)}
            </p>
          )}
          {weatherEmoji && (
            <p style={{ fontSize: 13, color: 'rgba(245,241,235,0.35)', marginBottom: variant === 'sm' ? 32 : 28 }}>
              {weatherEmoji} {matchWeather?.weather.condition}
            </p>
          )}
          {!weatherEmoji && <div style={{ marginBottom: variant === 'sm' ? 32 : 28 }} />}
          <button onClick={onNext} style={introBtn}>
            {variant === 'cup' ? 'Visa uppställning →' : 'NÄSTA →'}
          </button>
        </div>
      </div>
    )
  }

  // Slide 2: Team presentation (SM) / Lineups (Cup)
  if (slide === 2) {
    const homeStarters = homeLineup.startingPlayerIds
      .map(id => players.find(p => p.id === id))
      .filter(Boolean)
    const awayStarters = awayLineup.startingPlayerIds
      .map(id => players.find(p => p.id === id))
      .filter(Boolean)

    if (variant === 'sm') {
      const homeJourney = bracket ? getFinalJourney(bracket, fixture.homeClubId, clubs) : ''
      const awayJourney = bracket ? getFinalJourney(bracket, fixture.awayClubId, clubs) : ''
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', height: '100%',
          background: 'var(--bg-dark)', padding: '24px 16px', overflowY: 'auto',
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
            color: 'var(--accent)', textAlign: 'center', marginBottom: 24,
          }}>LAGPRESENTATION</p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{
              flex: 1, background: 'rgba(196,122,58,0.06)',
              border: '1px solid rgba(196,122,58,0.2)', borderRadius: 12, padding: '16px 12px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8 }}>
                {truncate(homeClubName, 14)}
              </p>
              {homeStanding && (
                <p style={{ fontSize: 12, color: 'var(--text-light-secondary)', marginBottom: 8 }}>
                  Plats {homeStanding.position} i serien
                </p>
              )}
              <p style={{ fontSize: 11, color: 'rgba(245,241,235,0.35)', lineHeight: 1.4 }}>{homeJourney}</p>
            </div>
            <div style={{
              flex: 1, background: 'rgba(196,122,58,0.06)',
              border: '1px solid rgba(196,122,58,0.2)', borderRadius: 12, padding: '16px 12px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8 }}>
                {truncate(awayClubName, 14)}
              </p>
              {awayStanding && (
                <p style={{ fontSize: 12, color: 'var(--text-light-secondary)', marginBottom: 8 }}>
                  Plats {awayStanding.position} i serien
                </p>
              )}
              <p style={{ fontSize: 11, color: 'rgba(245,241,235,0.35)', lineHeight: 1.4 }}>{awayJourney}</p>
            </div>
          </div>
          <button onClick={onNext} style={{ ...introBtn, padding: '14px', width: '100%' }}>NÄSTA →</button>
        </div>
      )
    }

    // Cup slide 2: lineups
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--bg-dark)', padding: '24px 16px', overflowY: 'auto',
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
          color: 'var(--accent)', textAlign: 'center', marginBottom: 24,
        }}>STARTELVORNA</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
              {truncate(homeClubName, 14)}
            </p>
            {homeStarters.map((p, i) => p && (
              <p key={i} style={{ fontSize: 12, color: 'var(--text-light-secondary)', marginBottom: 4, textAlign: 'center' }}>
                {p.firstName} {p.lastName}
              </p>
            ))}
          </div>
          <div style={{ width: 1, background: 'rgba(196,186,168,0.15)' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
              {truncate(awayClubName, 14)}
            </p>
            {awayStarters.map((p, i) => p && (
              <p key={i} style={{ fontSize: 12, color: 'var(--text-light-secondary)', marginBottom: 4, textAlign: 'center' }}>
                {p.firstName} {p.lastName}
              </p>
            ))}
          </div>
        </div>
        <button onClick={onStart} style={startBtn}>⚡ SPELA CUPFINALEN</button>
      </div>
    )
  }

  // Slide 3 (SM only): Starting lineups
  const homeStarters = homeLineup.startingPlayerIds
    .map(id => players.find(p => p.id === id))
    .filter(Boolean)
  const awayStarters = awayLineup.startingPlayerIds
    .map(id => players.find(p => p.id === id))
    .filter(Boolean)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-dark)', padding: '24px 16px', overflowY: 'auto',
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
        color: 'var(--accent)', textAlign: 'center', marginBottom: 24,
      }}>STARTELVOR</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
            {truncate(homeClubName, 14)}
          </p>
          {homeStarters.map((p, i) => p && (
            <p key={i} style={{ fontSize: 12, color: 'var(--text-light-secondary)', marginBottom: 4, textAlign: 'center' }}>
              {p.firstName} {p.lastName}
            </p>
          ))}
        </div>
        <div style={{ width: 1, background: 'rgba(196,186,168,0.15)' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
            {truncate(awayClubName, 14)}
          </p>
          {awayStarters.map((p, i) => p && (
            <p key={i} style={{ fontSize: 12, color: 'var(--text-light-secondary)', marginBottom: 4, textAlign: 'center' }}>
              {p.firstName} {p.lastName}
            </p>
          ))}
        </div>
      </div>
      <button onClick={onStart} style={startBtn}>⚡ SPELA FINALEN</button>
    </div>
  )
}
