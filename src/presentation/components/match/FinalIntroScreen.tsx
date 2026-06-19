import { useState } from 'react'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { MatchWeather } from '../../../domain/entities/Weather'
import type { PlayoffBracket } from '../../../domain/entities/Playoff'
import type { Club } from '../../../domain/entities/Club'
import type { StandingRow } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getWeatherEmoji, getConditionLabel } from '../../../domain/services/weatherService'
import { truncate } from '../../utils/formatters'
import { getFinalIntroScene } from '../../../domain/data/scenes/finalIntroScene'
import type { FinalTier } from '../../../domain/data/scenes/finalIntroScene'

const startBtn: React.CSSProperties = {
  padding: '16px',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 'var(--radius)',
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
  game?: SaveGame
  tier?: FinalTier
}

function serieOrdinal(pos: number): string {
  if (pos === 1) return '1:a'
  if (pos === 2) return '2:a'
  if (pos === 3) return '3:a'
  return `${pos}:e`
}

function getPlayoffRecord(bracket: PlayoffBracket, clubId: string): string {
  let w = 0, l = 0
  const series = [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? [])]
  for (const s of series) {
    if (s.homeClubId === clubId) { w += s.homeWins; l += s.awayWins }
    else if (s.awayClubId === clubId) { w += s.awayWins; l += s.homeWins }
  }
  return w > 0 || l > 0 ? `${w}–${l}` : '–'
}

// ── SM-final uppspelet (typografisk scen, A3-mock 2026-06-11) ───────────────

function SmFinalUppspelet({
  fixture,
  bracket,
  homeStanding,
  awayStanding,
  game,
  tier,
  onNext,
}: {
  fixture: Fixture
  bracket?: PlayoffBracket
  homeStanding?: StandingRow
  awayStanding?: StandingRow
  game?: SaveGame
  tier: FinalTier
  onNext: () => void
}) {
  const scene = game ? getFinalIntroScene(game, fixture, tier) : null
  const isGold = tier === 'gold'

  const managedClubId = game?.managedClubId
  const managedStanding = managedClubId
    ? (fixture.homeClubId === managedClubId ? homeStanding : awayStanding)
    : homeStanding
  const seriePos = managedStanding?.position ? serieOrdinal(managedStanding.position) : '–'
  const slutspelRecord = bracket && managedClubId ? getPlayoffRecord(bracket, managedClubId) : '–'

  const stripeStyle: React.CSSProperties = isGold ? {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    background: 'linear-gradient(180deg, var(--gold), var(--gold-deep))',
    zIndex: 3,
  } : {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    background: 'var(--accent)',
    zIndex: 3,
  }

  const heroLines = scene?.hero.split('\n') ?? []
  const ingressLines = scene?.ingress.split('\n') ?? []

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--bg-scene)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Left gold/copper stripe */}
      <div style={stripeStyle} />

      {/* Illustration (gold only) */}
      {isGold && (
        <div style={{ position: 'relative', height: 290, flexShrink: 0, overflow: 'hidden' }}>
          <img
            src="/assets/illustrations/final.jpg"
            alt="SM-final"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', display: 'block' }}
          />
          {/* Gradient fade into bg-scene */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(14,12,9,.45) 0%, rgba(14,12,9,0) 20%, rgba(26,22,18,0) 45%, rgba(26,22,18,.55) 78%, #1a1612 100%)',
          }} />
          {/* Eyebrow on image */}
          <p style={{
            position: 'absolute', left: 0, right: 0, top: 14, zIndex: 2,
            fontSize: 8, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase',
            textAlign: 'center', color: 'var(--gold)', opacity: 0.8,
            textShadow: '0 1px 6px rgba(0,0,0,.6)',
            margin: 0,
          }}>
            {scene?.eyebrow ?? '⬩ SM-FINAL ⬩'}
          </p>
        </div>
      )}

      {/* Text section */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
        padding: '0 20px', position: 'relative', marginTop: isGold ? -30 : 48, zIndex: 2,
      }}>
        {/* Eyebrow (copper — no illustration) */}
        {!isGold && (
          <p style={{
            fontSize: 8, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase',
            textAlign: 'center', color: 'var(--accent)', opacity: 0.8, margin: '0 0 16px',
          }}>
            {scene?.eyebrow ?? '⬩ SLUTSPEL ⬩'}
          </p>
        )}

        {/* Hero */}
        <h2 style={{
          fontFamily: 'Georgia, serif', fontSize: 23, fontWeight: 700,
          color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.2,
          textShadow: '0 1px 8px rgba(0,0,0,.55)', margin: 0,
        }}>
          {heroLines.map((line, i) => (
            <span key={i}>{line}{i < heroLines.length - 1 && <br />}</span>
          ))}
        </h2>

        {/* Ingress */}
        <p style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12.5,
          color: 'var(--text-light-secondary)', textAlign: 'center', lineHeight: 1.55, marginTop: 10,
        }}>
          {ingressLines.map((line, i) => (
            <span key={i}>{line}{i < ingressLines.length - 1 && <br />}</span>
          ))}
        </p>

        {/* Stat row */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 22, marginTop: 18,
          paddingTop: 14, borderTop: `0.5px solid rgba(212,184,96,${isGold ? '.3' : '.15'})`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <b style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--text-light)', display: 'block' }}>
              {seriePos}
            </b>
            <span style={{ fontSize: 7.5, letterSpacing: 1, color: 'var(--text-light-secondary)', textTransform: 'uppercase' }}>
              {scene?.statLabels.serien ?? 'Serien'}
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <b style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--text-light)', display: 'block' }}>
              {slutspelRecord}
            </b>
            <span style={{ fontSize: 7.5, letterSpacing: 1, color: 'var(--text-light-secondary)', textTransform: 'uppercase' }}>
              {scene?.statLabels.slutspel ?? 'Slutspelet'}
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        style={{
          alignSelf: 'center', margin: '0 0 26px',
          padding: '11px 26px',
          border: `1.5px solid ${isGold ? 'var(--gold)' : 'var(--accent)'}`,
          borderRadius: 8, color: 'var(--text-light)',
          fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const,
          background: 'transparent', cursor: 'pointer',
        }}
      >
        {scene?.ctaToLineup ?? 'LAGEN →'}
      </button>
    </div>
  )
}

// ── SM-final lagpresentation ──────────────────────────────────────────────────

function SmFinalLagpresentation({
  fixture,
  homeClubName,
  awayClubName,
  homeStanding,
  awayStanding,
  game,
  tier,
  onStart,
}: {
  fixture: Fixture
  homeClubName: string
  awayClubName: string
  homeStanding?: StandingRow
  awayStanding?: StandingRow
  game?: SaveGame
  tier: FinalTier
  onStart: () => void
}) {
  const scene = game ? getFinalIntroScene(game, fixture, tier) : null
  const isGold = tier === 'gold'

  const stripeStyle: React.CSSProperties = isGold ? {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    background: 'linear-gradient(180deg, var(--gold), var(--gold-deep))',
  } : {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    background: 'var(--accent)',
  }

  const homeInitial = homeClubName.charAt(0).toUpperCase()
  const awayInitial = awayClubName.charAt(0).toUpperCase()

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--bg-scene)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={stripeStyle} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '22px 18px 0', position: 'relative' }}>
        {/* Eyebrow */}
        <p style={{
          fontSize: 8, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase',
          textAlign: 'center', color: isGold ? 'var(--gold)' : 'var(--accent)', opacity: 0.8, margin: 0,
        }}>
          ⬩ LAGEN ⬩
        </p>

        {/* Matchup */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 16 }}>
          {/* Home */}
          <div style={{ textAlign: 'center', width: 104 }}>
            <div style={{
              width: 54, height: 60,
              borderRadius: '8px 8px 50% 50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 17, color: '#fff',
              margin: '0 auto',
              background: 'radial-gradient(circle at 38% 30%, #7a4a28, #4a2c16)',
              border: '1.5px solid var(--accent)',
            }}>
              {homeInitial}
            </div>
            <h4 style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'var(--text-light)', marginTop: 7, fontWeight: 700 }}>
              {truncate(homeClubName, 12)}
            </h4>
            {homeStanding && (
              <p style={{ fontSize: 8.5, color: 'var(--text-light-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                {serieOrdinal(homeStanding.position)} i serien
              </p>
            )}
          </div>

          <span style={{ fontFamily: "'Courier New', ui-monospace, monospace", fontSize: 10, color: 'var(--text-muted)' }}>
            MOT
          </span>

          {/* Away */}
          <div style={{ textAlign: 'center', width: 104 }}>
            <div style={{
              width: 54, height: 60,
              borderRadius: '8px 8px 50% 50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 17, color: '#fff',
              margin: '0 auto',
              background: 'radial-gradient(circle at 38% 30%, #3a5a78, #1e3448)',
              border: '1.5px solid var(--ice)',
            }}>
              {awayInitial}
            </div>
            <h4 style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'var(--text-light)', marginTop: 7, fontWeight: 700 }}>
              {truncate(awayClubName, 12)}
            </h4>
            {awayStanding && (
              <p style={{ fontSize: 8.5, color: 'var(--text-light-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                {serieOrdinal(awayStanding.position)} i serien
              </p>
            )}
          </div>
        </div>

        {/* Keyline — assisterande tränarens replik */}
        {scene?.keyline && (
          <div style={{
            marginTop: 16, padding: '10px 12px',
            background: 'var(--bg-portal-surface)',
            borderRadius: 8,
            borderLeft: '2px solid var(--gold-deep)',
          }}>
            <p style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11,
              color: 'var(--text-light-secondary)', lineHeight: 1.5, margin: 0,
            }}>
              "{scene.keyline.quote}"
            </p>
            <span style={{
              display: 'block', fontSize: 8, letterSpacing: 1,
              color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4,
            }}>
              {scene.keyline.speaker}
            </span>
          </div>
        )}

        {/* Venue */}
        <p style={{
          textAlign: 'center',
          fontFamily: "'Courier New', ui-monospace, monospace",
          fontSize: 8.5, letterSpacing: 1, color: 'var(--text-muted)',
          marginTop: 14, textTransform: 'uppercase',
        }}>
          Studenternas IP · Uppsala
        </p>
      </div>

      <button
        onClick={onStart}
        style={{
          alignSelf: 'center', margin: '0 0 26px',
          padding: '11px 26px',
          border: `1.5px solid ${isGold ? 'var(--gold)' : 'var(--accent)'}`,
          borderRadius: 8, color: 'var(--text-light)',
          fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const,
          background: 'transparent', cursor: 'pointer',
        }}
      >
        {scene?.ctaToKickoff ?? 'TILL AVSPARK →'}
      </button>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function FinalIntroScreen({
  variant,
  slide,
  onNext,
  onStart,
  homeClubName,
  awayClubName,
  homeLineup,
  awayLineup,
  matchWeather,
  bracket,
  homeStanding,
  awayStanding,
  players,
  fixture,
  game,
  tier = 'gold',
}: FinalIntroScreenProps) {
  const [smStep, setSmStep] = useState<1 | 2>(1)

  // SM-final: new two-step typographic scene (replaces old 3-slide design)
  if (variant === 'sm') {
    if (smStep === 1) {
      return (
        <SmFinalUppspelet
          fixture={fixture}
          bracket={bracket}
          homeStanding={homeStanding}
          awayStanding={awayStanding}
          game={game}
          tier={tier}
          onNext={() => setSmStep(2)}
        />
      )
    }
    return (
      <SmFinalLagpresentation
        fixture={fixture}
        homeClubName={homeClubName}
        awayClubName={awayClubName}
        homeStanding={homeStanding}
        awayStanding={awayStanding}
        game={game}
        tier={tier}
        onStart={onStart}
      />
    )
  }

  // ── Cup variant (unchanged) ────────────────────────────────────────────────
  const weatherEmoji = matchWeather ? getWeatherEmoji(matchWeather.weather.condition) : ''

  if (slide === 1) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'var(--bg-dark)',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 24px', overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: 'var(--accent)',
            letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 4,
          }}>SVENSKA CUPEN</p>
          <h1 style={{
            fontSize: 56, fontWeight: 900, color: 'var(--text-light)',
            letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 8,
          }}>
            FINAL
          </h1>
          <p style={{ fontSize: 16, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>
            {truncate(homeClubName, 14)} vs {truncate(awayClubName, 14)}
          </p>
          {weatherEmoji && (
            <p style={{ fontSize: 13, color: 'rgba(245,241,235,0.35)', marginBottom: 28 }}>
              {weatherEmoji} {matchWeather ? getConditionLabel(matchWeather.weather.condition) : ''}
            </p>
          )}
          {!weatherEmoji && <div style={{ marginBottom: 28 }} />}
          <button
            onClick={onNext}
            style={{
              padding: '14px 32px', background: 'var(--accent)', border: 'none',
              borderRadius: 'var(--radius)', color: 'var(--bg-dark)',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '1px',
            }}
          >
            Visa uppställning →
          </button>
        </div>
      </div>
    )
  }

  // Cup slide 2: lineups
  const homeStarters = homeLineup.startingPlayerIds
    .map(id => players.find(p => p.id === id))
    .filter(Boolean)
  const awayStarters = awayLineup.startingPlayerIds
    .map(id => players.find(p => p.id === id))
    .filter(Boolean)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', position: 'fixed', inset: 0, zIndex: 300,
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
      <button onClick={onStart} style={startBtn}>SPELA CUPFINALEN</button>
    </div>
  )
}
