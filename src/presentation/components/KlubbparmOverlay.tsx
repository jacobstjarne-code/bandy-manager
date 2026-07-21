import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Icon } from './primitives/Icon'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { KLUBBPARM_CHAPTERS, chapterAwaitsText } from '../../domain/data/klubbparmContent'
import { seasonSpanLabel } from '../../domain/utils/seasonYear'

/**
 * Klubbpärmen — in-world föreningspärm, öppnas från menyn. Ersätter HelpOverlay.
 * Mock: docs/incoming/Intro & Guide - Tillträdet + Klubbpärmen (fristående).html
 *
 * Ljus #EDE8DF (= var(--bg)) bakgrund, läderband i topp, notebook-vy med röd marginal.
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

  const club = game.clubs.find(c => c.id === game.managedClubId)
  const clubLabel = `${(club?.shortName ?? club?.name ?? '').toUpperCase()} · ${seasonSpanLabel(game.currentSeason)}`

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 'var(--z-overlay)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 60, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: 'var(--radius-md)',
          maxWidth: 380, width: '90%',
          maxHeight: 'calc(100vh - 100px)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Läder-header-band */}
        <div style={{
          background: 'var(--bg-leather)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 800,
              color: 'var(--text-light)', margin: 0, lineHeight: 1.2,
            }}>Klubbpärmen</p>
            <p style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 8,
              letterSpacing: '1.5px', color: 'var(--text-light-secondary)',
              margin: '3px 0 0',
            }}>{clubLabel}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 20,
              color: 'var(--text-light-secondary)', cursor: 'pointer',
              padding: '0 0 0 12px', flexShrink: 0,
            }}
            aria-label="Stäng"
          >×</button>
        </div>

        {/* Flik-index */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          padding: '12px 16px',
          background: 'var(--bg-parm-tabs)',
          borderBottom: '1px solid var(--border-parm)',
          flexShrink: 0,
        }}>
          {chapters.map(({ ch, unlocked }) => {
            const isActive = ch.id === activeId
            const style: React.CSSProperties = isActive ? {
              fontFamily: 'system-ui', fontSize: 10, fontWeight: 700,
              letterSpacing: '1px', color: 'var(--bg-surface)',
              background: 'var(--accent)', borderRadius: 4, padding: '5px 10px',
              border: 'none', cursor: 'pointer',
            } : unlocked ? {
              fontFamily: 'system-ui', fontSize: 10, fontWeight: 600,
              letterSpacing: '1px', color: 'var(--text-secondary)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-parm)',
              borderRadius: 4, padding: '5px 10px',
              cursor: 'pointer',
            } : {
              fontFamily: 'system-ui', fontSize: 10, fontWeight: 600,
              letterSpacing: '1px', color: 'var(--text-parm-locked)',
              background: 'var(--bg-parm-locked)',
              border: '1px dashed var(--border-parm)',
              borderRadius: 4, padding: '5px 10px',
              cursor: 'default',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }

            return (
              <button
                key={ch.id}
                onClick={() => unlocked && setActiveId(ch.id)}
                disabled={!unlocked}
                style={style}
              >
                {!unlocked && <Icon icon={Lock} size={9} />}
                {ch.label}
              </button>
            )
          })}
        </div>

        {/* Kapitel-innehåll — notebook-vy med röd marginal */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '18px 20px',
          background: 'var(--bg-surface)',
          position: 'relative',
        }}>
          {/* Notebook-marginalstreck */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 1,
            background: 'repeating-linear-gradient(180deg, var(--border-parm) 0 4px, transparent 4px 12px)',
            pointerEvents: 'none',
          }} />

          {!activeUnlocked ? (
            <p style={{
              fontFamily: 'system-ui', fontSize: 11,
              color: 'var(--text-muted)', fontStyle: 'italic',
            }}>
              Kapitlet öppnas när systemet låses upp.
            </p>
          ) : chapterAwaitsText(active) ? (
            // Säkerhetsnät, inte förväntad väg — se chapterAwaitsText/KLUBBPARM_CHAPTERS
            // i klubbparmContent.ts. Ny kapitel-post utan text = denna raden syns.
            <p style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>[Opus]</p>
          ) : (
            <>
              <p style={{
                fontFamily: 'system-ui', fontSize: 9, fontWeight: 600,
                letterSpacing: '2.5px', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 10,
              }}>
                Kapitel · {active.label}
              </p>
              {active.content.paragraphs.map((p, i) => (
                <p key={i} style={{
                  fontSize: 13, color: 'var(--text-secondary)',
                  lineHeight: 1.55, margin: '0 0 10px',
                }}>
                  {p}
                </p>
              ))}
              {active.content.tumregel && (
                <div className="card-sharp" style={{ padding: '10px 12px', marginTop: 4 }}>
                  <p style={{
                    fontFamily: 'system-ui', fontSize: 9, fontWeight: 600,
                    letterSpacing: '2px', textTransform: 'uppercase',
                    color: 'var(--accent)', marginBottom: 6,
                  }}>Tumregel</p>
                  <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                    {active.content.tumregel}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
