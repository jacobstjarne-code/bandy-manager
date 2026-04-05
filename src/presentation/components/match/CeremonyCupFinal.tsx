import type { Fixture } from '../../../domain/entities/Fixture'
import type { Club } from '../../../domain/entities/Club'
import type { CupBracket } from '../../../domain/entities/Cup'
import { truncate } from '../../utils/formatters'
import { getCupJourney } from '../../utils/finalJourneys'
import { GoldConfetti } from './GoldConfetti'

interface CeremonyCupFinalProps {
  slide: 1 | 2
  homeClubName: string
  awayClubName: string
  homeScore: number
  awayScore: number
  fixture: Fixture
  managedClubId: string | undefined
  season: number
  clubs: Club[]
  cupBracket: CupBracket | undefined
  onNavigate: () => void
}

export function CeremonyCupFinal({
  slide,
  homeClubName,
  awayClubName,
  homeScore,
  awayScore,
  fixture,
  managedClubId,
  season,
  clubs,
  cupBracket,
  onNavigate,
}: CeremonyCupFinalProps) {
  if (slide === 1) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-dark)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 300,
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 24 }}>
          CUPFINALEN
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
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-light)', letterSpacing: '1px' }}>
          SLUTSIGNAL!
        </p>
      </div>
    )
  }

  const managedIsHome = fixture.homeClubId === managedClubId
  const managedScore = managedIsHome ? homeScore : awayScore
  const opponentScore = managedIsHome ? awayScore : homeScore

  // Check penalty result: fixture from location state doesn't have it,
  // so use cupBracket.winnerId which was set by saveLiveMatchResult
  const managedWon = managedScore > opponentScore
    ? true
    : managedScore < opponentScore
    ? false
    : cupBracket?.winnerId === managedClubId
  const managedClubName = managedIsHome ? homeClubName : awayClubName
  const opponentName = managedIsHome ? awayClubName : homeClubName
  const cupJourney = managedWon && cupBracket && managedClubId
    ? getCupJourney(cupBracket, managedClubId, clubs)
    : ''

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-dark)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, overflow: 'hidden',
    }}>
      {managedWon && <GoldConfetti />}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
        {managedWon ? (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
              CUPVINNARE!
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-light)', fontWeight: 700, marginBottom: 4 }}>{managedClubName}</p>
            <p style={{ fontSize: 13, color: 'var(--text-light-secondary)', marginBottom: 20 }}>Svenska Cupen {season}</p>
            {cupJourney && (
              <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(196,122,58,0.06)', border: '1px solid rgba(196,122,58,0.2)', borderRadius: 10, textAlign: 'left' }}>
                <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Cupvägen</p>
                {cupJourney.split('\n').map((line, i) => (
                  <p key={i} style={{ fontSize: 12, color: 'var(--text-light-secondary)', marginBottom: 4 }}>{line}</p>
                ))}
              </div>
            )}
            <button
              onClick={onNavigate}
              style={{ padding: '14px 32px', background: 'var(--accent)', border: 'none', borderRadius: 12, color: 'var(--bg-dark)', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '1px' }}
            >
              Cupfest! →
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🥈</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-light-secondary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
              Cupfinalförlust
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-light)', marginBottom: 4 }}>{opponentName} vann Svenska Cupen</p>
            <p style={{ fontSize: 13, color: 'var(--text-light-secondary)', marginBottom: 32 }}>Ni kom ändå långt.</p>
            <button
              onClick={onNavigate}
              style={{ padding: '14px 32px', background: 'var(--bg-dark-surface)', border: '1px solid rgba(196,186,168,0.15)', borderRadius: 12, color: 'var(--text-light)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Fortsätt →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
