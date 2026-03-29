import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { playSound } from '../audio/soundEffects'

function choiceStyle(choiceId: string): React.CSSProperties {
  if (choiceId === 'accept' || choiceId === 'extend3') {
    return {
      background: 'var(--accent)',
      color: '#fff',
      border: 'none',
    }
  }
  if (choiceId === 'reject') {
    return {
      background: 'rgba(239,68,68,0.1)',
      color: 'var(--danger)',
      border: '1px solid rgba(239,68,68,0.35)',
    }
  }
  return {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  }
}

export function EventScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const roundSummary = useGameStore(s => s.roundSummary)
  const [idx, setIdx] = useState(0)

  const events = game?.pendingEvents ?? []

  useEffect(() => {
    if (!game) {
      navigate('/game', { replace: true })
      return
    }
    if (events.length === 0) {
      // All events resolved — go to round-summary if one exists, else dashboard
      navigate(roundSummary ? '/game/round-summary' : '/game/dashboard', { replace: true })
    }
  }, [game, events.length, navigate, roundSummary])

  if (!game || events.length === 0) return null

  const event = events[idx]
  if (!event) return null

  const relatedPlayer = event.relatedPlayerId
    ? game.players.find(p => p.id === event.relatedPlayerId)
    : null

  const relatedClub = event.relatedClubId
    ? game.clubs.find(c => c.id === event.relatedClubId)
    : null

  function handleChoice(choiceId: string) {
    playSound('click')
    resolveEvent(event.id, choiceId)
    // After resolving, remaining events shift — go to index 0 always
    setIdx(0)
  }

  const total = events.length

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      paddingTop: '60px', zIndex: 200, overflowY: 'auto',
    }}>
      <div className="card-round" style={{
        padding: '24px 20px',
        minWidth: 280, maxWidth: 360, width: '90%',
        marginBottom: 20,
        border: 'none',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
      }}>
        {/* Type badge */}
        <p style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 12,
        }}>
          Händelse
        </p>

        {/* Title */}
        <h2 style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: 14,
          lineHeight: 1.3,
        }}>
          {event.title}
        </h2>

        {/* Body */}
        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: relatedPlayer || relatedClub ? 12 : 24,
          whiteSpace: 'pre-line',
        }}>
          {event.body}
        </p>

        {/* Player / Club info pills */}
        {(relatedPlayer || relatedClub) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {relatedPlayer && (
              <span style={{
                fontSize: 12,
                background: 'rgba(196,122,58,0.1)',
                border: '1px solid rgba(196,122,58,0.3)',
                borderRadius: 20,
                padding: '4px 10px',
                color: 'var(--accent)',
                fontWeight: 600,
              }}>
                {relatedPlayer.firstName} {relatedPlayer.lastName} · Styrka {Math.round(relatedPlayer.currentAbility)}
              </span>
            )}
            {relatedClub && (
              <span style={{
                fontSize: 12,
                background: 'rgba(126,179,212,0.10)',
                border: '1px solid rgba(126,179,212,0.25)',
                borderRadius: 20,
                padding: '4px 10px',
                color: 'var(--ice)',
                fontWeight: 600,
              }}>
                {relatedClub.name}
              </span>
            )}
          </div>
        )}

        {/* Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {event.choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                ...choiceStyle(choice.id),
              }}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      {total > 1 && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8 }}>
          {idx + 1} / {total}
        </p>
      )}
    </div>
  )
}
