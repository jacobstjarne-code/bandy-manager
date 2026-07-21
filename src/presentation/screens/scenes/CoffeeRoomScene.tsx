/**
 * CoffeeRoomScene — recurring scen, kafferummet.
 * 1-3 utbyten mellan klubbens funktionärer, fade-in i sekvens.
 *
 * Pixel-värden från docs/mockups/kafferummet_mockup.html. Justera inte.
 *
 * A2 (2026-07-19, A1-KAFFERUMMET-BLIR-EN-PLATS): D1 — Sture vänder sig till
 * spelaren som tredje beaten på rutinbesök (gated, en gång per besök). D2 —
 * svaret är två kursiva Georgia-repliker (replik-registret, inte valkortens
 * anatomi), select→confirm som Valet A-1/A-2, kopparram vald/dämpad ovald.
 * D5 — ingen ceremoninivå, ☕-emoji bort ur scenhuvudet (för stillsam för det
 * registret, som VictoryTrophy är för stor för sitt).
 */

import { useState } from 'react'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getCoffeeRoomScene } from '../../../domain/services/coffeeRoomService'
import { SceneHeader } from './shared/SceneHeader'
import { CoffeeExchange } from './shared/CoffeeExchange'
import { SceneCTA } from './shared/SceneCTA'

interface Props {
  game: SaveGame
  onComplete: (choiceId?: string) => void
}

export function CoffeeRoomScene({ game, onComplete }: Props) {
  const scene = getCoffeeRoomScene(game)
  const [selectedId, setSelectedId] = useState<'A' | 'B' | null>(null)

  if (!scene) {
    // Fallback: stäng scenen direkt om data försvinner mellan trigger och render
    return (
      <div style={{ padding: 24 }}>
        <SceneCTA label="Tillbaka" onClick={() => onComplete()} />
      </div>
    )
  }

  const question = scene.question

  const footerLabel = question && selectedId ? 'Säg det →' : 'Tillbaka till klubben'
  const footerAction = question && selectedId
    ? () => onComplete(`${question.questionId}:${selectedId}`)
    : () => onComplete()

  return (
    <div
      style={{
        background: 'var(--bg-scene)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '18px 24px 0' }}>
        <SceneHeader
          genre="I DETTA ÖGONBLICK"
          title={scene.meta.title}
          subtitle={scene.meta.subtitle}
          subtitleMarginBottom={20}
        />
      </div>

      <div
        style={{
          padding: '8px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {scene.exchanges.map((ex, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <CoffeeExchange exchange={ex} delay={i * 400} />
            {(i < scene.exchanges.length - 1 || question) && (
              <div
                style={{
                  alignSelf: 'center',
                  width: '30%',
                  borderBottom: '1px solid var(--border-dark)',
                  opacity: 0.5,
                }}
              />
            )}
          </div>
        ))}

        {/* D4-regressionsfix (2026-07-21) — enkelröstad reaktion utan naturlig andra-talare */}
        {scene.narratorLine && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              opacity: 0,
              animation: 'scene-fade-in-exchange 0.6s ease-out forwards',
            }}
          >
            {scene.narratorLine.speaker && (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--bg-dark-elevated)',
                  border: '1px solid var(--bg-leather)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Georgia, serif',
                  fontSize: 13,
                  color: 'var(--text-light-secondary)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {scene.narratorLine.speaker.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {scene.narratorLine.speaker && (
                <div className="h-label h-label-light">{scene.narratorLine.speaker}</div>
              )}
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 13,
                  color: 'var(--text-light)',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}
              >
                {'"' + scene.narratorLine.text + '"'}
              </div>
            </div>
          </div>
        )}

        {question && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              opacity: 0,
              animation: 'scene-fade-in-exchange 0.6s ease-out forwards',
              animationDelay: `${scene.exchanges.length * 400}ms`,
            }}
          >
            {/* D1 — Sture vänder sig till spelaren: samma talar-register som en exchange-rad, men adresserad utåt */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--bg-dark-elevated)',
                  border: '1px solid var(--bg-leather)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Georgia, serif',
                  fontSize: 13,
                  color: 'var(--text-light-secondary)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {question.speaker.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="h-label h-label-light">{question.speaker}</div>
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 13,
                    color: 'var(--text-light)',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}
                >
                  {'"' + question.text + '"'}
                </div>
              </div>
            </div>

            {/* D2 — svarsrepliker: replik-registret, inte valkort. Kopparram vald, dämpad ovald, ingen förvald. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 44 }}>
              {question.answers.map(a => {
                const isSelected = selectedId === a.id
                const isDimmed = selectedId !== null && !isSelected
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(prev => (prev === a.id ? null : a.id))}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: isSelected
                        ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-portal-surface))'
                        : 'var(--bg-portal-surface)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      opacity: isDimmed ? 0.5 : 1,
                      transition: 'opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease',
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: 'var(--text-light)',
                      lineHeight: 1.5,
                    }}
                  >
                    {'"' + a.text + '"'}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px 24px', position: 'relative', zIndex: 1 }}>
        <SceneCTA label={footerLabel} onClick={footerAction} />
      </div>
    </div>
  )
}
