import { useState } from 'react'
import { BookOpen, Lock } from 'lucide-react'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { KLUBBPARM_CHAPTERS, chapterAwaitsText } from '../../domain/data/klubbparmContent'

/**
 * Klubbpärmen — in-world föreningspärm, öppnas från menyn. Ersätter HelpOverlay.
 * Instruktion: docs/CODE_INSTRUKTION_TILLTRADET_KLUBBPARMEN_2026-06-26.md
 *
 * Code äger shell + flik-index + unlock-gating + rendering.
 * Kapiteltexten skrivs av Opus (klubbparmContent.ts) — tomma kapitel visar `[Opus]`-stub.
 *
 * Inte menykopplad än (kö steg 6 byter HelpOverlay → denna i GameHeader, efter Opus-text).
 */

interface KlubbparmOverlayProps {
  game: SaveGame
  onClose: () => void
}

export function KlubbparmOverlay({ game, onClose }: KlubbparmOverlayProps) {
  const chapters = KLUBBPARM_CHAPTERS.map(ch => ({ ch, unlocked: ch.isUnlocked(game) }))
  const firstUnlocked = chapters.find(c => c.unlocked)?.ch.id ?? KLUBBPARM_CHAPTERS[0].id
  const [activeId, setActiveId] = useState(firstUnlocked)

  const active = KLUBBPARM_CHAPTERS.find(c => c.id === activeId) ?? KLUBBPARM_CHAPTERS[0]
  const activeUnlocked = active.isUnlocked(game)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 'var(--z-overlay)', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', paddingTop: 60, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)', borderRadius: 'var(--radius-md)',
          maxWidth: 380, width: '90%',
          maxHeight: 'calc(100vh - 100px)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Läder-header-band */}
        <div style={{
          background: 'var(--bg-leather)', padding: '14px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} color="var(--text-light-secondary)" />
            <span className="h-name" style={{ color: 'var(--text-light)' }}>Klubbpärmen</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-light-secondary)', cursor: 'pointer', padding: '0 0 0 8px', flexShrink: 0 }}
            aria-label="Stäng"
          >×</button>
        </div>

        {/* Flik-index */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 12px 0', flexWrap: 'wrap', flexShrink: 0 }}>
          {chapters.map(({ ch, unlocked }) => {
            const isActive = ch.id === activeId
            return (
              <button
                key={ch.id}
                onClick={() => unlocked && setActiveId(ch.id)}
                disabled={!unlocked}
                className="h-label"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '5px 9px', borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  background: isActive ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                  color: unlocked ? (isActive ? 'var(--accent)' : 'var(--text-secondary)') : 'var(--text-muted)',
                  cursor: unlocked ? 'pointer' : 'default',
                  opacity: unlocked ? 1 : 0.55,
                  marginBottom: 4,
                }}
              >
                {!unlocked && <Lock size={9} />}
                {ch.label}
              </button>
            )
          })}
        </div>

        {/* Öppet kapitel */}
        <div style={{ padding: '14px 16px 18px', overflowY: 'auto' }}>
          {!activeUnlocked ? (
            <p className="h-micro" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Kapitlet öppnas när systemet låses upp.
            </p>
          ) : chapterAwaitsText(active) ? (
            <p className="h-micro" style={{ color: 'var(--text-muted)' }}>[Opus]</p>
          ) : (
            <>
              {active.content.paragraphs.map((p, i) => (
                <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, margin: i === 0 ? '0 0 10px' : '0 0 10px' }}>
                  {p}
                </p>
              ))}
              {active.content.tumregel && (
                <div className="card-sharp" style={{ padding: '10px 12px', marginTop: 4 }}>
                  <div className="h-label" style={{ color: 'var(--accent)' }}>Tumregel</div>
                  <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>{active.content.tumregel}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
