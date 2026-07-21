import { useState } from 'react'
import type { CardRenderProps } from '../portalTypes'
import { pickEfterklang } from '../../../../domain/services/portal/pickEfterklang'
import type { EfterklangMemory } from '../../../../domain/services/portal/pickEfterklang'
import { EFTERKLANG_TYPE_ICON, EFTERKLANG_EYEBROW } from '../../../../domain/data/efterklangText'
import { Sparkline, MIN_POINTS } from '../../primitives/Sparkline'
import { EfterklangThreadModal } from './EfterklangThreadModal'

// B2/B3 — flöde-layout (mock 2026-06-03_design_efterklang_flode.html, kolumn 2–3).
// Generisk rubrik + trådräknare. Per rad: vem (ikon + namn) → premiss (dämpad) → eko (italic).
// Hela raden är tappbar och öppnar SIN egen tråd (rad-identitet = tråd-identitet, bug #1).
// B3-färgregel: warm-light default; nemesis + rivalSale får dämpad danger-rosa (--match-warn).
// Två toner totalt — Efterklangs ton är stillsam, inte fem-färgad.
function nameColor(type: EfterklangMemory['type']): string {
  return type === 'nemesis' || type === 'rivalSale' ? 'var(--match-warn)' : 'var(--warm-light)'
}

export function EfterklangSecondary({ game }: CardRenderProps) {
  const [openMemory, setOpenMemory] = useState<EfterklangMemory | null>(null)
  const memories = pickEfterklang(game, 2)
  if (memories.length === 0) return null

  const journalistPoints = game.scoreSnapshots?.journalistRelation ?? []
  const countLabel = memories.length === 1 ? '1 tråd' : `${memories.length} trådar`

  return (
    <>
      <div
        style={{
          background: 'var(--bg-portal-surface)',
          borderLeft: '2px solid var(--warm)',
          borderRadius: '0 8px 8px 0',
          padding: '11px 13px 12px',
        }}
      >
        {/* Generisk rubrik + trådräknare */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 8, letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--warm-light)', fontWeight: 700 }}>
            {EFTERKLANG_EYEBROW}
          </span>
          <span className="h-micro" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px' }}> {/* ds-exempt: intentional ui-monospace metadata */}
            {countLabel}
          </span>
        </div>

        {memories.map((mem, i) => {
          const showSpark = mem.type === 'journalist' && mem.hasJournalistSparkline && journalistPoints.length >= MIN_POINTS
          const declining = showSpark && journalistPoints[journalistPoints.length - 1] < journalistPoints[0]
          return (
            <div
              key={mem.type}
              role="button"
              tabIndex={0}
              onClick={() => setOpenMemory(mem)}
              onKeyDown={e => e.key === 'Enter' && setOpenMemory(mem)}
              style={{
                padding: i === 0 ? '2px 0 9px' : '9px 0',
                borderTop: i === 0 ? 'none' : '1px solid color-mix(in srgb, var(--accent) 10%, transparent)',
                cursor: 'pointer',
              }}
            >
              {/* Vem-rad: ikon + namn (mono-uppercase mini-eyebrow) + chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, lineHeight: 1 }}>{EFTERKLANG_TYPE_ICON[mem.type]}</span>
                <span className="h-label" style={{ color: nameColor(mem.type) }}>
                  {mem.objectName}
                </span>
                <span style={{ marginLeft: 'auto', color: 'var(--warm)', opacity: 0.55, fontSize: 13, lineHeight: 1 }}>›</span>
              </div>

              {/* Premiss — dämpad anchor */}
              {mem.premiss && (
                <p style={{ fontSize: 11, color: 'var(--text-light-secondary)', lineHeight: 1.4, margin: '0 0 4px', opacity: 0.78 }}>
                  {mem.premiss}
                </p>
              )}

              {/* Eko — italic Georgia payoff */}
              <p className="h-quote-sm h-quote-light" style={{ lineHeight: 1.45, margin: 0 }}>
                “{mem.echo}”
              </p>

              {/* Journalist-sparkline — endast under journalist-ekot, smal mini-rad */}
              {showSpark && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Relation
                  </span>
                  <div style={{ width: 70 }}>
                    <Sparkline
                      points={journalistPoints}
                      stroke="cold"
                      height={14}
                      markers={declining ? [{ index: journalistPoints.length - 1, color: 'var(--danger)', size: 2 }] : undefined}
                      label="Relation"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {openMemory && (
        <EfterklangThreadModal memory={openMemory} onClose={() => setOpenMemory(null)} />
      )}
    </>
  )
}
