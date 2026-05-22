import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { truncate } from '../../utils/formatters'
import { getMatchHeadline, getFinalWhistleSummary } from '../../../domain/services/matchMoodService'
import { getRivalry } from '../../../domain/data/rivalries'
import { MatchEventType } from '../../../domain/enums'

interface MatchDoneOverlayProps {
  fixture: Fixture
  homeClubName: string
  awayClubName: string
  homeScore: number
  awayScore: number
  homeLineup: TeamSelection
  awayLineup: TeamSelection
  steps: MatchStep[]
  managedClubId: string | undefined
  players: Player[]
  onContinue: () => void
}

export function MatchDoneOverlay({
  fixture,
  homeClubName,
  awayClubName,
  homeScore,
  awayScore,
  steps,
  managedClubId,
  onContinue,
}: MatchDoneOverlayProps) {
  const lastStep = steps[steps.length - 1]

  const derivedPenStep = steps.find(s => s.penaltyDone && s.penaltyFinalResult)
  const penaltyResult = fixture.penaltyResult ?? derivedPenStep?.penaltyFinalResult ?? null
  const derivedOtStep = steps.find(s => s.phase === 'overtime' && s.overtimeResult)
  const overtimeResult = fixture.overtimeResult ?? derivedOtStep?.overtimeResult ?? null

  const managedIsHome = fixture.homeClubId === managedClubId
  const managedGoals = managedIsHome ? homeScore : awayScore
  const oppGoals = managedIsHome ? awayScore : homeScore
  let actualWinner: 'home' | 'away' | 'draw' = 'draw'
  if (managedGoals > oppGoals) actualWinner = managedIsHome ? 'home' : 'away'
  else if (managedGoals < oppGoals) actualWinner = managedIsHome ? 'away' : 'home'
  else if (penaltyResult) {
    actualWinner = penaltyResult.home > penaltyResult.away ? 'home' : 'away'
  } else if (overtimeResult) {
    actualWinner = overtimeResult
  }
  const managedWon = actualWinner === (managedIsHome ? 'home' : 'away')
  const managedLost = actualWinner !== 'draw' && !managedWon
  const resultColor = managedWon ? 'var(--success)' : managedLost ? 'var(--danger)' : 'var(--accent)'

  // Contextual headline (Sprint F)
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
  const margin = managedGoals - oppGoals
  const totalGoals = homeScore + awayScore
  const lateDecider = steps.some(s => s.minute >= 80 && s.events.some(e => e.type === MatchEventType.Goal))
  const halfTimeStep = steps.find(s => s.step === 30)
  const htManaged = halfTimeStep ? (managedIsHome ? halfTimeStep.homeScore : halfTimeStep.awayScore) : managedGoals
  const htOpp = halfTimeStep ? (managedIsHome ? halfTimeStep.awayScore : halfTimeStep.homeScore) : oppGoals
  const comeback = managedWon && htManaged < htOpp
  const resultLabel = getMatchHeadline(managedWon, managedLost, margin, totalGoals, !!rivalry, !!fixture.isCup, comeback, lateDecider)

  const allEvents = steps.flatMap(s => s.events)
  const lateGoalCount = steps.filter(s => s.minute >= 80 && s.events.some(e => e.type === MatchEventType.Goal)).length
  const cornerGoalCount = allEvents.filter(e => e.type === MatchEventType.Goal && e.isCornerGoal).length
  const myClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
  const suspUs = allEvents.filter(e => e.type === MatchEventType.Suspension && e.clubId === myClubId).length
  const finalSummary = getFinalWhistleSummary({
    myScore: managedGoals,
    theirScore: oppGoals,
    lateGoals: lateGoalCount,
    totalGoals,
    isHome: managedIsHome,
    cornerGoals: cornerGoalCount,
    suspensionsUs: suspUs,
    isRivalry: !!rivalry,
    rivalryName: rivalry?.name,
    isCup: !!fixture.isCup,
    isPlayoff: !!fixture.isKnockout,
    comeback,
  })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
    }}>
      <div className="card-sharp" style={{
        padding: '24px 20px',
        textAlign: 'center', minWidth: 260, maxWidth: 320, width: '90%',
        background: 'var(--bg)',
        border: 'none',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: 10 }}>
          SLUTSIGNAL
        </p>

        {fixture.isCup && (
          <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 6 }}>
            🏆 Svenska Cupen
          </p>
        )}

        {/* Score */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(homeClubName, 12)}</p>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{homeScore}</span>
          </div>
          <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>—</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(awayClubName, 12)}</p>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{awayScore}</span>
          </div>
        </div>

        {penaltyResult && homeScore === awayScore && (
          <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 6 }}>
            str. {penaltyResult.home}–{penaltyResult.away}
          </p>
        )}

        {/* Result pill */}
        <div style={{ marginBottom: 16 }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 20,
            background: resultColor,
            color: 'var(--text-light)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '1px',
          }}>
            {resultLabel}
          </span>
        </div>

        {finalSummary && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 12, padding: '0 4px' }}>
            {finalSummary}
          </p>
        )}

        {lastStep && fixture.attendance != null && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>
            🏟️ {fixture.attendance} åskådare
          </p>
        )}

        <button
          onClick={onContinue}
          style={{
            width: '100%',
            padding: '14px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: 'var(--text-light)',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Fortsätt →
        </button>
      </div>
    </div>
  )
}
