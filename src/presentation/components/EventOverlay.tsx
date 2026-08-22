import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { playSound } from '../audio/soundEffects'
import { PressConferenceScene } from './PressConferenceScene'
import { MecenatDinnerEvent } from './events/MecenatDinnerEvent'
import type { GameEvent } from '../../domain/entities/GameEvent'
import { getNextEvent } from '../../domain/services/eventQueueService'
import { getEffectiveWhyNowLine } from '../../domain/data/contentContract'
import { DecisionCard } from './DecisionCard'

interface EventOverlayProps {
  // Optionellt: om GameShell/GameGuard redan har räknat ut nästa event via attentionRouter
  // används det direkt. Annars faller EventOverlay tillbaka på getNextEvent(game).
  event?: GameEvent
}

export function EventOverlay({ event: eventProp }: EventOverlayProps = {}) {
  const game = useGameStore(s => s.game)
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const location = useLocation()

  // Block events during live match, match setup, match result, and review — review handles events inline
  const isMatchScreen = location.pathname.includes('/match/live') || location.pathname === '/game/match' || location.pathname === '/game/match-result' || location.pathname === '/game/review'

  // B1: använd prop från GameShell (via attentionRouter) om tillgänglig, annars eget fallback
  const event = isMatchScreen
    ? null
    : (eventProp ?? (game ? getNextEvent(game) : null))

  // Auto-resolve pressConference events if journalist data is missing — avoids blocking the event queue
  useEffect(() => {
    if (!event) return
    if (event.type === 'pressConference' && !game?.journalist) {
      console.warn('[EventOverlay] Missing journalist, auto-resolving event', { eventId: event.id })
      resolveEvent(event.id, event.choices[0]?.id ?? 'no_choice')
    }
  }, [event?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!game || isMatchScreen || !event) return null

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

  const total = game.pendingEvents?.filter(e => !e.resolved).length ?? 1

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

  // Entitets-dedup-grinden (2026-08-12): se EventCardInline.tsx för samma resonemang.
  const entityId = event.relatedBidId ? `bid:${event.relatedBidId}` : `event:${event.id}`

  const tags = [
    ...(relatedPlayer ? [{ label: `${relatedPlayer.firstName} ${relatedPlayer.lastName} · Styrka ${Math.round(relatedPlayer.currentAbility)}`, tone: 'accent' as const }] : []),
    ...(relatedClub ? [{ label: relatedClub.name, tone: 'ice' as const }] : []),
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        paddingTop: '60px', zIndex: 'var(--z-modal)', overflowY: 'auto',
      }}
    >
      <DecisionCard
        shape="round"
        size="lg"
        entityId={entityId}
        entitySource="EventOverlay"
        label={event.sender ? `${event.sender.name}, ${event.sender.role}` : 'Händelse'}
        title={event.title}
        body={event.body}
        tags={tags}
        whyNowLine={getEffectiveWhyNowLine(event) ?? undefined}
        resolved={false}
        choices={event.choices}
        onChoose={(id) => handleChoice(id)}
      />

      {/* Progress */}
      {total > 1 && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8 }}>
          {total} händelse{total > 1 ? 'r' : ''} kvar
        </p>
      )}
    </div>
  )
}
