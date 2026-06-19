/**
 * ValetScene — säsongsstartens ceremoniella byggval (B1).
 * Typografisk scen (tredje ceremoninivån, Förbättring 1).
 * Renderar getValetScene(game) — all text lever i valetScene.ts.
 *
 * Val → onComplete(nodeId), Avstå → onComplete('decline').
 * Resolve (kostnad + facilityBuild) hanteras i completeScene-actionen.
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getValetScene } from '../../../domain/data/scenes/valetScene'

interface Props {
  game: SaveGame
  onComplete: (choiceId?: string) => void
}

const fmtTkr = (n: number) => `${Math.round(n / 1000)} tkr`

export function ValetScene({ game, onComplete }: Props) {
  const scene = getValetScene(game)

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
      <div style={{
        fontSize: 12,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        color: 'var(--text-muted)',
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
          {scene.cards.map(card => (
            <button
              key={card.nodeId}
              onClick={() => onComplete(card.nodeId)}
              style={{
                textAlign: 'left',
                padding: '13px 14px',
                background: 'var(--bg-portal-surface)',
                border: '1px solid var(--border-dark)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <span style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-light)',
                letterSpacing: '-0.1px',
              }}>
                {card.label}
              </span>
              <span style={{
                fontSize: 11.5,
                color: 'var(--text-light-secondary)',
                lineHeight: 1.4,
              }}>
                {card.consequenceLine}
              </span>
              <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                <span style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {fmtTkr(card.cost)}
                </span>
                <span style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                }}>
                  klar om ~{card.buildRounds} omg
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{
          fontSize: 12,
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginBottom: 'auto',
          padding: '24px 0',
        }}>
          {scene.emptyNote}
        </div>
      )}

      {/* Avstå-rad */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => onComplete('decline')}
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
            color: 'var(--text-muted)',
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
    </div>
  )
}
