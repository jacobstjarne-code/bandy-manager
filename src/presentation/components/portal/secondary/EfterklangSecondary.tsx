import { useState } from 'react'
import type { CardRenderProps } from '../portalTypes'
import { pickEfterklang } from '../../../../domain/services/portal/pickEfterklang'
import type { EfterklangMemory } from '../../../../domain/services/portal/pickEfterklang'
import { EFTERKLANG_EYEBROW, EFTERKLANG_TYPE_ICON } from '../../../../domain/data/efterklangText'
import { Sparkline, MIN_POINTS } from '../../primitives/Sparkline'
import { SectionLabel } from '../../SectionLabel'
import { EfterklangThreadModal } from './EfterklangThreadModal'


function timingLine(mem: EfterklangMemory, currentRound: number): string {
  if (mem.sinceMatchday !== undefined && currentRound > mem.sinceMatchday) {
    const rounds = currentRound - mem.sinceMatchday
    return rounds === 1 ? 'Etablerad i omg 1' : `Sedan omg ${mem.sinceMatchday} · ${rounds} omg`
  }
  return `Senast omg ${currentRound}`
}

export function EfterklangSecondary({ game }: CardRenderProps) {
  const [openMemory, setOpenMemory] = useState<EfterklangMemory | null>(null)
  const memories = pickEfterklang(game, 2)
  if (memories.length === 0) return null

  const journalistPoints = game.scoreSnapshots?.journalistRelation ?? []
  const topMemory = memories[0]
  const eyebrow = `${EFTERKLANG_EYEBROW} · ${topMemory.objectName}`

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpenMemory(topMemory)}
        onKeyDown={e => e.key === 'Enter' && setOpenMemory(topMemory)}
        style={{
          background: 'var(--bg-portal-surface)',
          border: '1px solid var(--bg-leather)',
          borderLeft: '2px solid var(--cold)',
          borderRadius: 10,
          padding: '10px 14px',
          cursor: 'pointer',
        }}
      >
        <SectionLabel style={{ marginBottom: 2 }}>{eyebrow}</SectionLabel>

        {/* Tidsanvisning */}
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>
          {timingLine(topMemory, game.currentMatchday)}
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

        <div style={{ marginTop: 8, fontSize: 9, color: 'var(--cold)', opacity: 0.7, letterSpacing: '0.5px' }}>
          Tryck för hela tråden →
        </div>
      </div>

      {openMemory && (
        <EfterklangThreadModal memory={openMemory} onClose={() => setOpenMemory(null)} />
      )}
    </>
  )
}
