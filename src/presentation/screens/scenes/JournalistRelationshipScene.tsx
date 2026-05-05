/**
 * JournalistRelationshipScene — fullskärmsscen för journalistrelationen.
 * Visar relationsgrad, minneslista och outlook.
 * Pixel-värden från SPEC_JOURNALIST_KAPITEL_A mock-CSS. Justera inte.
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import { buildJournalistSceneData } from '../../../domain/data/scenes/journalistRelationshipScene'
import { SceneCTA } from './shared/SceneCTA'

interface Props {
  game: SaveGame
  onComplete: () => void
}

export function JournalistRelationshipScene({ game, onComplete }: Props) {
  if (!game.journalist) return null

  const data = buildJournalistSceneData(game.journalist, game.currentSeason)
  const isCold = data.severity === 'cold'

  const fillGradient = isCold
    ? 'linear-gradient(90deg, var(--cold) 0%, var(--cold-light) 100%)'
    : 'linear-gradient(90deg, var(--warm) 0%, var(--warm-light) 100%)'

  const fillPct = `${Math.max(2, Math.min(100, data.relationship))}%`

  return (
    <div style={{
      background: 'var(--bg-scene-deep)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* 1. SceneHeader — genre tag + namn + outlet */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          textAlign: 'center',
          padding: '18px 0 8px',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 4,
          color: 'var(--accent)',
          opacity: 0.7,
          textTransform: 'uppercase',
        }}>
          I DETTA ÖGONBLICK
        </div>
        <div style={{ padding: '6px 24px 0' }}>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-light)',
          textAlign: 'center',
          lineHeight: 1.1,
          marginBottom: 4,
        }}>
          {data.name}
        </div>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 13,
          color: 'var(--text-light-secondary)',
          fontStyle: 'italic',
          marginTop: 4,
          paddingBottom: 18,
        }}>
          {data.outlet}
        </div>
        </div>
      </div>

      {/* 2. Relations-block */}
      <div style={{ padding: '0px 24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Relation
          </span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: 'var(--text-light)', fontWeight: 700 }}>
            {data.relationship}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}> / 100</span>
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-dark)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: fillPct, height: '100%', borderRadius: 3, background: fillGradient, transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-light-secondary)', fontStyle: 'italic' }}>
          {data.statusText}
        </div>
      </div>

      {/* 3. Minneslista */}
      <div style={{ flex: 1, padding: '8px 24px 16px' }}>
        <div style={{
          fontSize: 9,
          color: 'var(--text-muted)',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Senast hörda
        </div>
        {data.memories.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Ingen kontakt ännu.
          </div>
        )}
        {data.memories.map((entry, i) => {
          const dotColor = entry.sentiment === 'positive'
            ? 'var(--success)'
            : entry.sentiment === 'negative'
            ? 'var(--danger)'
            : 'var(--text-muted)'
          const isLast = i === data.memories.length - 1
          return (
            <div key={i} style={{
              display: 'flex',
              gap: 10,
              padding: '10px 0',
              borderBottom: isLast ? 'none' : '1px solid var(--border-dark)',
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                marginTop: 6,
                flexShrink: 0,
                background: dotColor,
              }} />
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'var(--text-light)', lineHeight: 1.4 }}>
                  {entry.summary}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  Säsong {entry.season} · omg {entry.matchday}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 4. Outlook-block */}
      <div style={{
        padding: '14px 24px 18px',
        borderTop: '1px solid var(--border-dark)',
        background: 'var(--bg-scene)',
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        color: 'var(--text-light)',
        fontStyle: 'italic',
        lineHeight: 1.5,
      }}>
        <span style={{ color: 'var(--accent)', fontStyle: 'normal' }}>⟶ </span>
        {data.outlookText}
      </div>

      {/* 5. SceneCTA */}
      <div style={{ padding: '14px 20px 24px' }}>
        <SceneCTA label="Tillbaka till klubben" onClick={onComplete} />
      </div>
    </div>
  )
}
