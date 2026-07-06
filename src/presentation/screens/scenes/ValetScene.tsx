/**
 * ValetScene — säsongsstartens ceremoniella byggval (B1).
 * Typografisk scen (tredje ceremoninivån, Förbättring 1).
 * Renderar getValetScene(game) — all text lever i valetScene.ts.
 *
 * A-2 (Valet-scen-audit, beslut 2026-07-06 — Jacob): select→confirm, inte
 * tap-direktval. Ett tap väljer (kort eller avstå), scenen dämpar övriga
 * alternativ och visar en bekräfta-CTA med valets eget namn. onComplete
 * anropas först vid bekräftelse — Val → onComplete(nodeId), Avstå →
 * onComplete('decline'). Resolve (kostnad + facilityBuild) hanteras i
 * completeScene-actionen.
 */

import { useState } from 'react'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getValetScene } from '../../../domain/data/scenes/valetScene'
import { SceneCTA } from './shared/SceneCTA'

interface Props {
  game: SaveGame
  onComplete: (choiceId?: string) => void
}

export function ValetScene({ game, onComplete }: Props) {
  const scene = getValetScene(game)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function toggleSelect(id: string) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  const selectedCard = scene.cards.find(c => c.nodeId === selectedId)
  const confirmCta = selectedId === 'decline' ? scene.declineConfirmCta : selectedCard?.confirmCta

  return (
    <div style={{
      background: 'var(--bg-portal)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '30px 22px 28px',
      animation: 'fadeIn 300ms ease both',
    }}>
      {/* Genre */}
      <div className="h-scene-genre" style={{ marginBottom: 14 }}>
        {scene.genre}
      </div>

      {/* Prolog — italic setting */}
      <div className="h-scene-setting" style={{ marginBottom: 20 }}>
        {scene.prolog}
      </div>

      {/* Heading */}
      <div className="h-scene-title" style={{ marginBottom: 20 }}>
        {scene.heading}
      </div>

      {/* Fråga ovanför korten */}
      <div className="h-quote h-quote-light" style={{
        textAlign: 'center',
        lineHeight: 1.55,
        marginBottom: 20,
        maxWidth: 300,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        {scene.question}
      </div>

      {/* Valkort */}
      {scene.cards.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'auto' }}>
          {scene.cards.map(card => {
            const isSelected = selectedId === card.nodeId
            const isDimmed = selectedId !== null && !isSelected
            return (
              <button
                key={card.nodeId}
                onClick={() => toggleSelect(card.nodeId)}
                style={{
                  textAlign: 'left',
                  padding: '13px 14px',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-portal-surface))'
                    : 'var(--bg-portal-surface)',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  opacity: isDimmed ? 0.5 : 1,
                  transition: 'opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-light)',
                    letterSpacing: '-0.1px',
                  }}>
                    {card.label}
                  </span>
                  {/* N-4: kvalitativ bygghorisont på titelraden, som en tagg */}
                  <span className="tag tag-dark">{card.horizonLabel}</span>
                </div>
                {/* N-5: kursiv Georgia flavor-rad — "det som gör kortet till en scen" */}
                <span style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 11.5,
                  lineHeight: 1.4,
                  color: 'var(--text-light-secondary)',
                }}>
                  {card.flavor}
                </span>
                <span style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                  {card.consequenceParts.map((part, i) => (
                    <span key={i}>
                      {i > 0 && <span style={{ color: 'var(--text-light-secondary)' }}> · </span>}
                      <span style={{
                        color: part.dir === 'upp' ? 'var(--success)' : part.dir === 'ned' ? 'var(--danger-text)' : 'var(--text-light-secondary)',
                      }}>
                        {part.text}
                      </span>
                    </span>
                  ))}
                </span>
                <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                  <span style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                  }}>
                    klar om ~{card.buildRounds} omg
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="h-quote h-quote-light" style={{
          textAlign: 'center',
          marginBottom: 'auto',
          padding: '24px 0',
        }}>
          {scene.emptyNote}
        </div>
      )}

      {/* A-1: knapp-likvärdighet — inget kort är förvalt */}
      {scene.cards.length > 0 && (
        <div style={{
          fontSize: 10.5,
          color: 'var(--text-muted)',
          textAlign: 'center',
          fontStyle: 'italic',
        }}>
          {scene.noPresetNote}
        </div>
      )}

      {/* Avstå-rad */}
      <div style={{ marginTop: 24, opacity: selectedId !== null && selectedId !== 'decline' ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        <button
          onClick={() => toggleSelect('decline')}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: selectedId === 'decline' ? 'var(--accent)' : 'var(--text-muted)',
          }}>
            {scene.declineLabel}
          </span>
          <span style={{
            fontSize: 10.5,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            maxWidth: 280,
            textAlign: 'center',
            lineHeight: 1.45,
          }}>
            {scene.declineNote}
          </span>
        </button>
      </div>

      {/* A-2: bekräfta-steget — inget commitas förrän spelaren aktivt bekräftar valet */}
      {selectedId !== null && confirmCta && (
        <div style={{ marginTop: 16 }}>
          <SceneCTA label={confirmCta} onClick={() => onComplete(selectedId)} />
        </div>
      )}
    </div>
  )
}
