/**
 * CupIntroScene — kort intro innan säsongens första cupmatch.
 * Tre beats. Etablerar att cupen är pre-season — viktig men inte allvar.
 */

import { useState, useEffect } from 'react'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getCupIntroBeats } from '../../../domain/data/scenes/cupIntroScene'
import { SceneCTA } from './shared/SceneCTA'

interface Props {
  game: SaveGame
  onComplete: () => void
}

export function CupIntroScene({ game, onComplete }: Props) {
  const beats = getCupIntroBeats(game)
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentBeat = beats[currentIndex]

  useEffect(() => {
    if (!currentBeat?.autoAdvance) return
    const timer = setTimeout(() => {
      if (currentIndex < beats.length - 1) {
        setCurrentIndex(i => i + 1)
      } else {
        onComplete()
      }
    }, currentBeat.durationMs ?? 3500)
    return () => clearTimeout(timer)
  }, [currentIndex, currentBeat, beats.length, onComplete])

  if (!currentBeat) {
    return (
      <div style={{ padding: 24 }}>
        <SceneCTA label="Stäng" onClick={onComplete} />
      </div>
    )
  }

  const handleCTA = () => {
    if (currentIndex < beats.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      onComplete()
    }
  }

  const formatBody = (text: string) => {
    const parts = text.split(/(\*"[^"]*"\*|\*[^*]+\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const inner = part.slice(1, -1)
        return <em key={i}>{inner}</em>
      }
      return part.split('\n\n').map((para, j) => (
        <p key={`${i}-${j}`} style={{ margin: '0 0 12px' }}>{para}</p>
      ))
    })
  }

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
      <div style={{ padding: '30px 24px 0', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 4,
            color: 'var(--accent)',
            opacity: 0.7,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          CUPEN
        </div>
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-light)',
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          Innan serien
        </div>

        <div
          style={{
            display: 'flex',
            gap: 4,
            justifyContent: 'center',
            marginTop: 12,
            marginBottom: 20,
          }}
        >
          {beats.map((_, i) => (
            <div
              key={i}
              style={{
                width: 24,
                height: 2,
                borderRadius: 1,
                background: i <= currentIndex ? 'var(--accent)' : 'var(--border-dark)',
                opacity: i <= currentIndex ? 0.8 : 0.3,
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 16,
            color: 'var(--text-light)',
            lineHeight: 1.65,
          }}
        >
          {formatBody(currentBeat.body)}
        </div>
      </div>

      {!currentBeat.autoAdvance && currentBeat.cta && (
        <div style={{ padding: '16px 24px 32px', position: 'relative', zIndex: 1 }}>
          <SceneCTA label={currentBeat.cta} onClick={handleCTA} />
        </div>
      )}

      {currentBeat.autoAdvance && (
        <div
          style={{
            padding: '16px 24px 32px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 11,
            fontStyle: 'italic',
          }}
        >
          ...
        </div>
      )}
    </div>
  )
}
