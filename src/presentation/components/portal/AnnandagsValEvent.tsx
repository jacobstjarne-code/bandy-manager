/**
 * AnnandagsValEvent — inline portal-card för annandagsplanering.
 * Renderas när game.pendingAnnandagsVal === true.
 * Pattern: EventCardInline-paradigm (inline, ej modal-overlay).
 *
 * Era-låsning:
 *   A (Standard)      — alla eras
 *   B (Julmarknad)    — fotfaste / establishment / legacy
 *   C (Gratisentré)   — alla eras
 *   D (Mecenat-värd)  — legacy + aktiv mecenat
 *
 * SWEDISH TEXT: All Swedish player-facing copy levereras av Opus.
 * Placeholder '[Opus]' används för alla beskrivningstexter.
 */

import { useGameStore } from '../../store/gameStore'
import type { SaveGame, ClubEra } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
}

interface ValOption {
  id: 'A' | 'B' | 'C' | 'D'
  label: string
  description: string
  meta: string
}

function buildOptions(game: SaveGame): ValOption[] {
  const era: ClubEra = game.currentEra ?? 'survival'
  const hasActiveMecenat = game.mecenater?.some(m => m.isActive) ?? false

  const options: ValOption[] = []

  // A — alltid tillgänglig
  options.push({
    id: 'A',
    label: 'Standard',
    description: 'Annandagen blir som annandagen brukar bli. Det räcker långt.',
    meta: 'Inga extra kostnader',
  })

  // B — fotfaste+
  if (era === 'fotfaste' || era === 'establishment' || era === 'legacy') {
    options.push({
      id: 'B',
      label: 'Julmarknad',
      description: 'Stånd längs långsidan, glögg och korv. Familjer som annars inte kommer hittar hit.',
      meta: '−15 000 kr · ×2.5 publik · +10 CS · 30% risk',
    })
  }

  // C — alltid tillgänglig
  options.push({
    id: 'C',
    label: 'Gratisentré',
    description: 'Portarna står öppna. Ingen behöver fundera på om de har råd att se bandy idag.',
    meta: 'Ingen biljettintäkt · +25 CS',
  })

  // D — legacy + aktiv mecenat
  if (era === 'legacy' && hasActiveMecenat) {
    const mecenat = game.mecenater?.find(m => m.isActive)
    options.push({
      id: 'D',
      label: 'Mecenat-värd',
      description: `${mecenat?.name ?? 'Mecenaten'} står för kalaset i år. Det kommer de att minnas att de gjorde.`,
      meta: `${mecenat?.name ?? 'Mecenaten'} betalar · +15 CS · +20 mecenat`,
    })
  }

  return options
}

export function AnnandagsValEvent({ game }: Props) {
  const resolveAnnandagsVal = useGameStore(s => s.resolveAnnandagsVal)
  const options = buildOptions(game)

  return (
    <div
      className="event-card-inline"
      style={{
        position: 'relative',
        margin: '0 0 8px 0',
        background: 'var(--bg-portal-surface)',
        border: '1px solid rgba(196,122,58,0.15)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px 14px 18px',
      }}
    >
      {/* Vänster-stripe */}
      <div className="portal-card-stripe portal-card-stripe-copper-wide" />

      {/* Eyebrow */}
      <p className="portal-card-eyebrow">📅 ANNANDAGSARRANGEMANG</p>

      {/* Titel */}
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12.5,
        fontWeight: 600,
        color: 'var(--text-light)',
        lineHeight: 1.35,
        marginBottom: 8,
      }}>
        Annandagsplaneringen
      </div>

      {/* Body */}
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        fontStyle: 'italic',
        color: 'var(--text-light)',
        lineHeight: 1.6,
        marginBottom: 12,
      }}>
        Annandagen är årets största dag på vallen. Folk som inte sett en match sedan förra annandagen kommer ändå. Hur vill ni ta emot dem?
      </p>

      {/* Val-knappar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt, idx) => (
          <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button
              onClick={() => resolveAnnandagsVal(opt.id)}
              className={idx === 0 ? 'btn btn-primary' : 'btn btn-outline'}
            >
              {opt.label}
            </button>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'var(--text-muted)',
              margin: 0,
              lineHeight: 1.4,
            }}>
              {opt.meta}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
