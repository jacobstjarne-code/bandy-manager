import { useState } from 'react'
import type { CardRenderProps } from '../portalTypes'
import { pickEfterklang } from '../../../../domain/services/portal/pickEfterklang'
import type { EfterklangMemory } from '../../../../domain/services/portal/pickEfterklang'
import { EFTERKLANG_EYEBROW, EFTERKLANG_TYPE_ICON } from '../../../../domain/data/efterklangText'
import { Sparkline, MIN_POINTS } from '../../primitives/Sparkline'
import { SectionLabel } from '../../SectionLabel'
import { EfterklangThreadModal } from './EfterklangThreadModal'


/** Subrad-delar: [vänster, höger] med pip-separator emellan, eller [text] ensam. */
function timingParts(mem: EfterklangMemory, currentRound: number): string[] {
  if (mem.sinceMatchday !== undefined && currentRound > mem.sinceMatchday) {
    const rounds = currentRound - mem.sinceMatchday
    if (rounds === 1) return ['Etablerad i omg 1']
    return [`${rounds} omgångar pågående`, `senast omg ${currentRound}`]
  }
  return [`senast omg ${currentRound}`]
}

export function EfterklangSecondary({ game }: CardRenderProps) {
  const [openMemory, setOpenMemory] = useState<EfterklangMemory | null>(null)
  const memories = pickEfterklang(game, 2)
  if (memories.length === 0) return null

  const journalistPoints = game.scoreSnapshots?.journalistRelation ?? []
  const topMemory = memories[0]
  const eyebrow = `${EFTERKLANG_EYEBROW} · ${topMemory.objectName}`
  const subParts = timingParts(topMemory, game.currentMatchday)

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpenMemory(topMemory)}
        onKeyDown={e => e.key === 'Enter' && setOpenMemory(topMemory)}
        style={{
          position: 'relative',
          background: 'var(--bg-portal-surface)',
          border: '1px solid var(--bg-leather)',
          borderLeft: '2px solid var(--warm)',
          borderRadius: 10,
          padding: '10px 14px',
          cursor: 'pointer',
        }}
      >
        {/* Chevron */}
        <span style={{
          position: 'absolute', top: 12, right: 13,
          fontSize: 15, color: 'var(--warm-light)', opacity: 0.8, lineHeight: 1,
        }}>›</span>

        <SectionLabel style={{ marginBottom: 2 }}>{eyebrow}</SectionLabel>

        {/* Tidsanvisning — mono med pip-separator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.5px',
          color: 'var(--text-muted)', marginBottom: 8,
        }}>
          {subParts.map((part, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <i style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--warm)', opacity: 0.6, display: 'inline-block' }} />}
              {part}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {memories.map((mem, i) => (
            <div key={mem.type} style={i > 0 ? { borderTop: '1px solid var(--bg-leather)', paddingTop: 10 } : {}}>
              {mem.primaryText && (
                <p style={{ fontSize: 11, color: 'var(--text-light-secondary)', margin: '0 0 4px' }}>
                  {EFTERKLANG_TYPE_ICON[mem.type]} {mem.primaryText}
                </p>
              )}

              {mem.type === 'journalist' && mem.hasJournalistSparkline && journalistPoints.length >= MIN_POINTS && (
                <div style={{ marginBottom: 6 }}>
                  <Sparkline points={journalistPoints} stroke="accent" height={20} label="Relation" />
                </div>
              )}

              <p style={{ fontSize: 11, color: 'var(--text-light-secondary)', fontStyle: 'italic', margin: 0 }}>
                ↻ {mem.echo}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8, fontSize: 9, color: 'var(--warm-light)', opacity: 0.7, letterSpacing: '0.5px' }}>
          Tryck för hela tråden →
        </div>
      </div>

      {openMemory && (
        <EfterklangThreadModal memory={openMemory} onClose={() => setOpenMemory(null)} />
      )}
    </>
  )
}
