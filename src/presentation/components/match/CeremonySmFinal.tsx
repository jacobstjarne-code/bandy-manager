import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { truncate } from '../../utils/formatters'
import { computePlayerRatings } from '../../utils/matchRatings'
import { GoldConfetti } from './GoldConfetti'
import { Z } from '../../utils/zIndices'

interface CeremonySmFinalProps {
  slide: 1 | 2 | 3
  homeClubName: string
  awayClubName: string
  homeScore: number
  awayScore: number
  fixture: Fixture
  managedClubId: string | undefined
  season: number
  steps: MatchStep[]
  homeLineup: TeamSelection
  awayLineup: TeamSelection
  players: Player[]
  onAdvance: () => void
  onNavigate: () => void
}

export function CeremonySmFinal({
  slide,
  homeClubName,
  awayClubName,
  homeScore,
  awayScore,
  fixture,
  managedClubId,
  season,
  steps,
  homeLineup,
  awayLineup,
  players,
  onAdvance,
  onNavigate,
}: CeremonySmFinalProps) {
  if (slide === 1) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-dark)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: Z.modal,
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 24 }}>
          SM-FINAL
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-light-secondary)', marginBottom: 8 }}>{truncate(homeClubName, 14)}</p>
            <span style={{ fontSize: 64, fontWeight: 900, color: 'var(--text-light)', fontFamily: 'var(--font-display)' }}>{homeScore}</span>
          </div>
          <span style={{ fontSize: 32, color: 'rgba(245,241,235,0.35)' }}>—</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-light-secondary)', marginBottom: 8 }}>{truncate(awayClubName, 14)}</p>
            <span style={{ fontSize: 64, fontWeight: 900, color: 'var(--text-light)', fontFamily: 'var(--font-display)' }}>{awayScore}</span>
          </div>
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-light)', letterSpacing: '1px' }}>SLUTSIGNAL!</p>
      </div>
    )
  }

  if (slide === 2) {
    const managedIsHome = fixture.homeClubId === managedClubId
    const managedScore = managedIsHome ? homeScore : awayScore
    const opponentScore = managedIsHome ? awayScore : homeScore
    const managedWon = managedScore > opponentScore
    const clubName = managedIsHome ? homeClubName : awayClubName

    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-dark)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: Z.modal, overflow: 'hidden',
      }}>
        {managedWon && <GoldConfetti />}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
          {managedWon ? (
            <>
              <div style={{ fontSize: 80, marginBottom: 16 }}>🏆</div>
              <h1 style={{
                fontSize: 28, fontWeight: 900, color: 'var(--accent)', letterSpacing: '2px',
                textTransform: 'uppercase', marginBottom: 12,
                animation: 'goldPulse 2s ease-in-out infinite',
              }}>
                SVENSKA MÄSTARE!
              </h1>
              <p style={{ fontSize: 18, color: 'var(--text-light)', fontWeight: 700, marginBottom: 4 }}>{clubName}</p>
              <p style={{ fontSize: 14, color: 'var(--text-light-secondary)', marginBottom: 32 }}>Vi vann SM-guld {season}!</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🥈</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-light-secondary)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
                SILVER
              </h1>
              <p style={{ fontSize: 15, color: 'var(--text-light)', marginBottom: 4 }}>Ni kämpade väl.</p>
              <p style={{ fontSize: 14, color: 'var(--text-light-secondary)', marginBottom: 32 }}>Silvermedaljörer {season}.</p>
            </>
          )}
          <button
            onClick={onAdvance}
            style={{
              padding: '14px 32px', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              background: managedWon ? 'var(--accent)' : 'var(--bg-dark-surface)',
              color: managedWon ? 'var(--bg-dark)' : 'var(--text-light)',
            }}
          >
            Matchens spelare →
          </button>
        </div>
      </div>
    )
  }

  // Slide 3: MVP
  const allStarters = [
    ...(homeLineup?.startingPlayerIds ?? []),
    ...(awayLineup?.startingPlayerIds ?? []),
  ]
  const allEvents = steps.flatMap(s => s.events)
  const playerRatings = computePlayerRatings(allStarters, allEvents)
  const [mvpId, mvpRating] = Object.entries(playerRatings).sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
  const mvpPlayer = mvpId ? players.find(p => p.id === mvpId) : undefined
  const mvpName = mvpPlayer ? `${mvpPlayer.firstName} ${mvpPlayer.lastName}` : 'Okänd spelare'
  const mvpPos = mvpPlayer?.position ?? ''

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-dark)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: Z.modal,
    }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 24 }}>
          MATCHENS SPELARE
        </p>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⭐</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-light)', marginBottom: 8 }}>{mvpName}</h2>
        {mvpPos && (
          <p style={{ fontSize: 13, color: 'var(--text-light-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {mvpPos}
          </p>
        )}
        <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', marginBottom: 32, fontFamily: 'var(--font-display)' }}>
          {typeof mvpRating === 'number' ? mvpRating.toFixed(1) : '–'}
        </p>
        <button
          onClick={onNavigate}
          style={{ padding: '16px 32px', background: 'var(--accent)', border: 'none', borderRadius: 12, color: 'var(--bg-dark)', fontSize: 16, fontWeight: 800, cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
        >
          Säsongsavslutning →
        </button>
      </div>
    </div>
  )
}
