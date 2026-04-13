import type { GameEvent } from '../../domain/entities/GameEvent'
import type { Journalist } from '../../domain/entities/SaveGame'

interface Props {
  event: GameEvent
  journalist: Journalist | undefined
  onChoice: (choiceId: string) => void
}

export function PressConferenceScene({ event, journalist, onChoice }: Props) {
  const rel = journalist?.relationship ?? 50
  const style = journalist?.style ?? 'neutral'

  const styleColor =
    style === 'provocative' ? 'var(--danger)' :
    style === 'supportive'  ? 'var(--success)' :
    'var(--text-muted)'

  const styleLabel =
    style === 'provocative' ? 'Provokativ' :
    style === 'supportive'  ? 'Stödjande' :
    'Neutral'

  const relLabel =
    rel >= 70 ? 'Vänlig' :
    rel <= 30 ? 'Fientlig' :
    'Neutral'

  // Extract question text from body (format: "frågan")
  const question = event.body.replace(/^"|"$/g, '')

  // Extract context from title (format: "🎤 Presskonferens — Namn, Tidning")
  const titleParts = event.title.replace('🎤 Presskonferens — ', '')

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      paddingTop: '48px', zIndex: 300, overflowY: 'auto',
    }}>
      <div className="card-sharp" style={{
        minWidth: 280, maxWidth: 360, width: '90%',
        marginBottom: 20,
        background: 'var(--bg)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        padding: 0,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            🎤 PRESSKONFERENS
          </p>
          <span style={{ fontSize: 9, color: styleColor, fontWeight: 600 }}>
            {styleLabel === relLabel ? styleLabel : `${styleLabel} · ${relLabel}`}
          </span>
        </div>

        {/* Journalist card */}
        <div style={{
          margin: '14px 16px 0',
          padding: '10px 14px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8,
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
            {titleParts}
          </p>
          <p style={{
            fontSize: 14,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            margin: 0,
          }}>
            "{question}"
          </p>
        </div>

        {/* Choices */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {event.choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => onChoice(choice.id)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              {choice.label}
              {choice.subtitle && (
                <span style={{
                  display: 'block',
                  fontSize: 10,
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  marginTop: 3,
                }}>
                  {choice.subtitle}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
