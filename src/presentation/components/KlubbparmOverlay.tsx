import { useState } from 'react'
import { Overlay } from './primitives/Overlay'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { KLUBBPARM_CHAPTERS, chapterAwaitsText } from '../../domain/data/klubbparmContent'
import { seasonSpanLabel } from '../../domain/utils/seasonYear'
import { KlubbparmVisual } from './KlubbparmVisual'

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
  const [activeId, setActiveId] = useState(KLUBBPARM_CHAPTERS[0].id)

  const active = KLUBBPARM_CHAPTERS.find(c => c.id === activeId) ?? KLUBBPARM_CHAPTERS[0]

  const club = game.clubs.find(c => c.id === game.managedClubId)
  const clubLabel = `${(club?.shortName ?? club?.name ?? '').toUpperCase()} · ${seasonSpanLabel(game.currentSeason)}`

  return (
    <Overlay
      onClose={onClose}
      ariaLabel="Klubbpärmen"
      maxWidth={380}
      zIndex="var(--z-overlay)"
      backdropStyle={{ alignItems: 'flex-start', padding: '60px 5% 40px', overflowY: 'auto' }}
    >
      <div
        style={{
          background: 'var(--bg)',
          borderRadius: 'var(--radius-md)',
          maxWidth: 380, width: '100%',
          maxHeight: 'calc(100vh - 100px)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)',
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
          {KLUBBPARM_CHAPTERS.map(ch => {
            const isActive = ch.id === activeId
            const style: React.CSSProperties = isActive ? {
              fontFamily: 'system-ui', fontSize: 10, fontWeight: 700,
              letterSpacing: '1px', color: 'var(--bg-surface)',
              background: 'var(--accent)', borderRadius: 4, padding: '5px 10px',
              border: 'none', cursor: 'pointer',
            } : {
              fontFamily: 'system-ui', fontSize: 10, fontWeight: 600,
              letterSpacing: '1px', color: 'var(--text-secondary)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-parm)',
              borderRadius: 4, padding: '5px 10px',
              cursor: 'pointer',
            }

            return (
              <button
                key={ch.id}
                onClick={() => setActiveId(ch.id)}
                aria-current={isActive ? 'page' : undefined}
                style={style}
              >
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

          {chapterAwaitsText(active) ? (
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
              <KlubbparmVisual game={game} chapterId={active.id} chapterLabel={active.label} />
              <p style={{
                  fontSize: 13, color: 'var(--text-secondary)',
                  lineHeight: 1.55, margin: '0 0 14px',
                }}>
                {active.content.paragraphs[0]}
              </p>
              <details key={active.id} style={{ borderTop: '1px solid var(--border-parm)', paddingTop: 11 }}>
                <summary style={{
                  color: 'var(--accent)', fontFamily: 'system-ui', fontSize: 12,
                  fontWeight: 700, cursor: 'pointer' }}>
                  Läs mer
                </summary>
                <div style={{ paddingTop: 14 }}>
                  {active.content.paragraphs.slice(1).map((p, i) => (
                    <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)',
                      lineHeight: 1.55, margin: '0 0 10px' }}>{p}</p>
                  ))}
                  {active.content.tumregel && (
                    <div className="card-sharp" style={{ padding: '10px 12px', marginTop: 4 }}>
                      <p style={{ fontFamily: 'system-ui', fontSize: 9, fontWeight: 600,
                        letterSpacing: '2px', textTransform: 'uppercase',
                        color: 'var(--accent)', marginBottom: 6 }}>Tumregel</p>
                      <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                        {active.content.tumregel}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            </>
          )}
        </div>
      </div>
    </Overlay>
  )
}
