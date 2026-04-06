import { useState } from 'react'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { MatchEventType } from '../../../domain/enums'
import { truncate, positionShort } from '../../utils/formatters'
import { PlayerPosition } from '../../../domain/enums'
import { computePlayerRatings } from '../../utils/matchRatings'

export interface PressChoiceData {
  id: string
  label: string
  moraleEffect: number
  mediaQuote: string
}

export interface PressQuestion {
  journalist: string
  question: string
  choices: PressChoiceData[]
}

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
  pressQuestion?: PressQuestion
  onSeeReport: () => void
  onContinue: () => void
  onPressChoice?: (moraleEffect: number, mediaQuote: string) => void
}

export function MatchDoneOverlay({
  fixture,
  homeClubName,
  awayClubName,
  homeScore,
  awayScore,
  homeLineup,
  awayLineup,
  steps,
  managedClubId,
  players,
  pressQuestion,
  onSeeReport,
  onContinue,
  onPressChoice,
}: MatchDoneOverlayProps) {
  const [pressAnswered, setPressAnswered] = useState(false)
  const [pressQuote, setPressQuote] = useState<string | null>(null)

  const allGoalEvents = steps.flatMap(s => s.events.filter(e => e.type === MatchEventType.Goal))
  const allRedCardEvents = steps.flatMap(s => s.events.filter(e => e.type === MatchEventType.RedCard))
  const lastStep = steps[steps.length - 1]

  // Derive OT/penalty results from steps (fixture from location state doesn't have them)
  const derivedOtStep = steps.find(s => s.phase === 'overtime' && s.overtimeResult)
  const derivedPenStep = steps.find(s => s.penaltyDone && s.penaltyFinalResult)
  const penaltyResult = fixture.penaltyResult ?? derivedPenStep?.penaltyFinalResult ?? null
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

  const allStarters = [...(homeLineup.startingPlayerIds ?? []), ...(awayLineup.startingPlayerIds ?? [])]
  const allEvents = steps.flatMap(s => s.events)
  const finalRatings = computePlayerRatings(allStarters, allEvents)

  const managedStarters = (managedIsHome ? homeLineup.startingPlayerIds : awayLineup.startingPlayerIds) ?? []
  const [bestId, bestRating] = Object.entries(finalRatings)
    .filter(([id]) => managedStarters.includes(id))
    .sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
  const bestPlayer = bestId ? players.find(p => p.id === bestId) : undefined

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      paddingTop: '50px', zIndex: 200, overflowY: 'auto',
    }}>
      <div className="card-sharp" style={{
        padding: '24px 20px',
        textAlign: 'center', minWidth: 280, maxWidth: 340, width: '90%',
        background: 'var(--bg)',
        border: 'none',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: resultColor, marginBottom: 14 }}>
          SLUTSIGNAL
        </p>
        {fixture.isCup && (
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 8 }}>
            🏆 Svenska Cupen
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(homeClubName, 12)}</p>
            <span style={{ fontSize: 32, fontWeight: 800 }}>{homeScore}</span>
          </div>
          <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>—</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(awayClubName, 12)}</p>
            <span style={{ fontSize: 32, fontWeight: 800 }}>{awayScore}</span>
          </div>
        </div>

        {penaltyResult && homeScore === awayScore && (
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: -8, marginBottom: 8 }}>
            str. {penaltyResult.home}–{penaltyResult.away}
          </p>
        )}

        {(allGoalEvents.length > 0 || allRedCardEvents.length > 0) && (
          <div style={{ marginBottom: 14, textAlign: 'left' }}>
            {[...allGoalEvents, ...allRedCardEvents]
              .sort((a, b) => a.minute - b.minute)
              .map((e, i) => {
              const isHome = e.clubId === fixture.homeClubId
              const foundPlayer = e.playerId ? players.find(p => p.id === e.playerId) : undefined
              const playerName = foundPlayer ? `${foundPlayer.firstName} ${foundPlayer.lastName}` : '?'
              const shirtNum = foundPlayer?.shirtNumber != null ? `#${foundPlayer.shirtNumber} ` : ''
              const isGoal = e.type === MatchEventType.Goal
              return (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: isHome ? 'flex-start' : 'flex-end',
                  fontSize: 12, color: isGoal ? 'var(--text-secondary)' : 'var(--danger)', marginBottom: 3,
                }}>
                  {isGoal
                    ? <span>{e.minute}' 🏒 {playerName}</span>
                    : <span>{e.minute}' ⏱️ {shirtNum}{playerName} (10 min)</span>
                  }
                </div>
              )
            })}
          </div>
        )}

        {lastStep && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, textAlign: 'left', lineHeight: 1.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Skott:</span><span>{lastStep.shotsHome} — {lastStep.shotsAway}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Hörnor:</span><span>{lastStep.cornersHome} — {lastStep.cornersAway}</span>
            </div>
            {(allRedCardEvents.filter(e => e.clubId === fixture.homeClubId).length > 0 || allRedCardEvents.filter(e => e.clubId === fixture.awayClubId).length > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Utvisningar:</span><span>{allRedCardEvents.filter(e => e.clubId === fixture.homeClubId).length} — {allRedCardEvents.filter(e => e.clubId === fixture.awayClubId).length}</span>
              </div>
            )}
          </div>
        )}

        {fixture.attendance != null && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10 }}>
            🏟️ {fixture.attendance} åskådare
          </p>
        )}

        {bestPlayer && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(196,122,58,0.06)', borderRadius: 8, border: '1px solid rgba(196,122,58,0.15)' }}>
            <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 2 }}>⭐ Matchens spelare</p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
              {bestPlayer.firstName} {bestPlayer.lastName}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {positionShort(bestPlayer.position as PlayerPosition)} · {typeof bestRating === 'number' ? bestRating.toFixed(1) : '–'}
            </p>
          </div>
        )}

        {/* Presskonferens */}
        {pressQuestion && !pressAnswered && (
          <div style={{
            marginBottom: 14, padding: '12px', textAlign: 'left',
            background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
              🎤 {pressQuestion.journalist}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 10, fontStyle: 'italic' }}>
              "{pressQuestion.question}"
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pressQuestion.choices.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    onPressChoice?.(c.moraleEffect, c.mediaQuote)
                    setPressQuote(c.mediaQuote)
                    setPressAnswered(true)
                  }}
                  style={{
                    padding: '9px 12px', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text-primary)', fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {pressQuestion && pressAnswered && pressQuote && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'left' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>📰 Presskonferens</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{pressQuote}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onSeeReport}
            style={{ padding: '14px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius)', color: 'var(--text-light)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Se rapport →
          </button>
          <button
            onClick={onContinue}
            style={{ padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Fortsätt →
          </button>
        </div>
      </div>
    </div>
  )
}
