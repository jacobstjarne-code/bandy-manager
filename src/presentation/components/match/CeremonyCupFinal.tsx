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
        position: 'fixed', inset: 0, background: '#0D1B2A',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 300,
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 24 }}>
          CUPFINALEN
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
        <p style={{ fontSize: 20, fontWeight: 700, color: '#F0F4F8', letterSpacing: '1px' }}>
          SLUTSIGNAL!
        </p>
      </div>
    )
  }

  const managedIsHome = fixture.homeClubId === managedClubId
  const managedScore = managedIsHome ? homeScore : awayScore
  const opponentScore = managedIsHome ? awayScore : homeScore
  const managedWon = managedScore > opponentScore
  const managedClubName = managedIsHome ? homeClubName : awayClubName
  const opponentName = managedIsHome ? awayClubName : homeClubName
  const cupJourney = managedWon && cupBracket && managedClubId
    ? getCupJourney(cupBracket, managedClubId, clubs)
    : ''

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
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#C9A84C', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
              CUPVINNARE!
            </h1>
            <p style={{ fontSize: 18, color: '#F0F4F8', fontWeight: 700, marginBottom: 4 }}>{managedClubName}</p>
            <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 20 }}>Svenska Cupen {season}</p>
            {cupJourney && (
              <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, textAlign: 'left' }}>
                <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Cupvägen</p>
                {cupJourney.split('\n').map((line, i) => (
                  <p key={i} style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 4 }}>{line}</p>
                ))}
              </div>
            )}
            <button
              onClick={onNavigate}
              style={{ padding: '14px 32px', background: '#C9A84C', border: 'none', borderRadius: 12, color: '#0D1B2A', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '1px' }}
            >
              Cupfest! →
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🥈</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#8A9BB0', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
              Cupfinalförlust
            </h1>
            <p style={{ fontSize: 15, color: '#F0F4F8', marginBottom: 4 }}>{opponentName} vann Svenska Cupen</p>
            <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 32 }}>Ni kom ändå långt.</p>
            <button
              onClick={onNavigate}
              style={{ padding: '14px 32px', background: '#1e3450', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, color: '#F0F4F8', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Fortsätt →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
