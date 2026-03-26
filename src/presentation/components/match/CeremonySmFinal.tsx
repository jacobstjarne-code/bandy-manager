import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { truncate } from '../../utils/formatters'
import { computePlayerRatings } from '../../utils/matchRatings'
import { GoldConfetti } from './GoldConfetti'

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
        position: 'fixed', inset: 0, background: '#0D1B2A',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 300,
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 24 }}>
          SM-FINAL
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 8 }}>{truncate(homeClubName, 14)}</p>
            <span style={{ fontSize: 64, fontWeight: 900, color: '#F0F4F8' }}>{homeScore}</span>
          </div>
          <span style={{ fontSize: 32, color: '#4A6080' }}>—</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 8 }}>{truncate(awayClubName, 14)}</p>
            <span style={{ fontSize: 64, fontWeight: 900, color: '#F0F4F8' }}>{awayScore}</span>
          </div>
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#F0F4F8', letterSpacing: '1px' }}>SLUTSIGNAL!</p>
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
        position: 'fixed', inset: 0, background: '#0D1B2A',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, overflow: 'hidden',
      }}>
        {managedWon && <GoldConfetti />}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
          {managedWon ? (
            <>
              <div style={{ fontSize: 80, marginBottom: 16 }}>🏆</div>
              <h1 style={{
                fontSize: 28, fontWeight: 900, color: '#C9A84C', letterSpacing: '2px',
                textTransform: 'uppercase', marginBottom: 12,
                animation: 'goldPulse 2s ease-in-out infinite',
              }}>
                SVENSKA MÄSTARE!
              </h1>
              <p style={{ fontSize: 18, color: '#F0F4F8', fontWeight: 700, marginBottom: 4 }}>{clubName}</p>
              <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 32 }}>Vi vann SM-guld {season}!</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🥈</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#8A9BB0', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
                SILVER
              </h1>
              <p style={{ fontSize: 15, color: '#F0F4F8', marginBottom: 4 }}>Ni kämpade väl.</p>
              <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 32 }}>Silvermedaljörer {season}.</p>
            </>
          )}
          <button
            onClick={onAdvance}
            style={{
              padding: '14px 32px', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              background: managedWon ? '#C9A84C' : '#1e3450',
              color: managedWon ? '#0D1B2A' : '#F0F4F8',
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
      position: 'fixed', inset: 0, background: '#0D1B2A',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 300,
    }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 24 }}>
          MATCHENS SPELARE
        </p>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⭐</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#F0F4F8', marginBottom: 8 }}>{mvpName}</h2>
        {mvpPos && (
          <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {mvpPos}
          </p>
        )}
        <p style={{ fontSize: 32, fontWeight: 800, color: '#C9A84C', marginBottom: 32 }}>
          {typeof mvpRating === 'number' ? mvpRating.toFixed(1) : '–'}
        </p>
        <button
          onClick={onNavigate}
          style={{ padding: '16px 32px', background: '#C9A84C', border: 'none', borderRadius: 12, color: '#0D1B2A', fontSize: 16, fontWeight: 800, cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
        >
          Säsongsavslutning →
        </button>
      </div>
    </div>
  )
}
