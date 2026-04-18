import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { playSound } from '../audio/soundEffects'
import { PressConferenceScene } from './PressConferenceScene'
import { MecenatDinnerEvent } from './events/MecenatDinnerEvent'
import { getEventPriority } from '../../domain/entities/GameEvent'

function choiceStyle(_choiceId: string): React.CSSProperties {
  return {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  }
}

export function EventOverlay() {
  const game = useGameStore(s => s.game)
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const location = useLocation()

  // Block events during live match, match setup, match result, and review — review handles events inline
  const isMatchScreen = location.pathname.includes('/match/live') || location.pathname === '/game/match' || location.pathname === '/game/match-result' || location.pathname === '/game/review'
  const events = game?.pendingEvents ?? []

  const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 }
  const event = (game && events.length > 0 && !isMatchScreen)
    ? ([...events]
        .sort((a, b) => {
          const pa = a.priority ?? getEventPriority(a.type)
          const pb = b.priority ?? getEventPriority(b.type)
          return priorityOrder[pa] - priorityOrder[pb]
        })
        .find(e => !e.resolved) ?? events[0])
    : null

  // Auto-resolve pressConference events if journalist data is missing — avoids blocking the event queue
  useEffect(() => {
    if (!event) return
    if (event.type === 'pressConference' && !game?.journalist) {
      console.warn('[EventOverlay] Missing journalist, auto-resolving event', { eventId: event.id })
      resolveEvent(event.id, event.choices[0]?.id ?? 'no_choice')
    }
  }, [event?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!game || events.length === 0 || isMatchScreen || !event) return null

  const relatedPlayer = event.relatedPlayerId
    ? game.players.find(p => p.id === event.relatedPlayerId)
    : null

  const relatedClub = event.relatedClubId
    ? game.clubs.find(c => c.id === event.relatedClubId)
    : null

  const activeEvent = event  // non-null: guarded by early return above
  function handleChoice(choiceId: string) {
    playSound('click')
    resolveEvent(activeEvent.id, choiceId)
  }

  const total = events.length

  // Presskonferens: dedikerad visuell scen istf generisk overlay
  if (event.type === 'pressConference') {
    if (!game.journalist) {
      return null  // useEffect handles auto-resolve
    }
    return (
      <PressConferenceScene
        event={event}
        journalist={game.journalist}
        onChoice={handleChoice}
      />
    )
  }

  // DREAM-017: Mecenatens middag — interaktiv scen
  if (event.type === 'mecenatDinner') {
    return (
      <MecenatDinnerEvent
        event={event}
        onFinish={handleChoice}
      />
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      paddingTop: '60px', zIndex: 'var(--z-modal)', overflowY: 'auto',
    }}>
      <div className="card-round" style={{
        padding: '24px 20px',
        minWidth: 280, maxWidth: 360, width: '90%',
        marginBottom: 20,
        background: 'var(--bg)',
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
          marginBottom: event.sender ? 6 : 12,
        }}>
          Händelse
        </p>

        {/* Sender */}
        {event.sender && (
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
            {event.sender.name}, {event.sender.role}
          </p>
        )}

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
          {total} händelse{total > 1 ? 'r' : ''} kvar
        </p>
      )}
    </div>
  )
}
