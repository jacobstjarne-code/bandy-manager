import { Diamond } from 'lucide-react'
import { useGameStore } from '../../store/gameStore'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { CALLUP_MODAL_LINES } from '../../../domain/data/landslagText'
import { positionShort } from '../../utils/formatters'
import { Icon } from '../primitives/Icon'
import { Overlay } from '../primitives/Overlay'

/**
 * CALLUP_MODAL — ceremonimodal vid landslagsuttagning, 1× per säsong.
 * Mock: docs/mockups/2026-05-23_design_landslag.html (.modal-card, kolumn 01).
 * Ikon: Diamond (lucide), guldton — INTE 🏆 (B3-regeln, design-system/DESIGN-DECISIONS.md).
 * Bonusen (bonusTkr) är redan applicerad mot klubbkassan i roundProcessor.ts —
 * modalen visar effekten, orsakar den inte.
 */
interface Props {
  game: SaveGame
}

export function CallupModal({ game }: Props) {
  const dismissCallupModal = useGameStore(s => s.dismissCallupModal)
  const modal = game.pendingCallupModal
  if (!modal) return null

  const club = game.clubs.find(c => c.id === game.managedClubId)
  const clubName = club?.shortName ?? club?.name ?? 'Klubben'
  const nameStr = modal.names.length === 1
    ? modal.names[0]
    : `${modal.names.slice(0, -1).join(', ')} och ${modal.names[modal.names.length - 1]}`

  const template = CALLUP_MODAL_LINES[game.currentSeason % CALLUP_MODAL_LINES.length]
  const body = template.replace('{spelare}', nameStr).replace('{klubb}', clubName)
  const [firstLine, ...restLines] = body.split('\n\n')

  const calledUpPlayers = modal.playerIds
    .map(id => game.players.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)

  return (
    // M4 (audit 5c9a7a8, 2026-08-24): migrerad till Overlay-primitiven —
    // tillägger role=dialog/aria-modal, fokusfälla, Escape och inert bakgrund.
    // Ny (avsedd) sidoeffekt: klick på bakgrunden stänger nu modalen, som
    // EfterklangThreadModal.tsx redan gjorde — tidigare gick det bara via
    // "Stäng"-knappen.
    <Overlay onClose={dismissCallupModal} ariaLabel="Landslagsuttagning" maxWidth={340} backdropPadding="24px 16px">
      <div style={{
        background: 'var(--bg-portal-surface)',
        border: '1px solid color-mix(in srgb, var(--gold) 18%, transparent)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <Icon icon={Diamond} size={22} color="var(--gold)" />
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 8, fontWeight: 600, letterSpacing: '4px',
          textTransform: 'uppercase', color: 'var(--gold)', textAlign: 'center',
          marginBottom: 10, opacity: 0.95,
        }}>
          ⬩ Sverige har ringt ⬩
        </p>
        <h2 style={{
          fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700,
          color: 'var(--text-light)', textAlign: 'center', marginBottom: 6,
        }}>
          Landslagsuttagning
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-light-secondary)',
          textAlign: 'center', marginBottom: 14, opacity: 0.85,
        }}>
          {calledUpPlayers.length === 1 ? '1 spelare uttagen till VM-truppen.' : `${calledUpPlayers.length} spelare uttagna till VM-truppen.`}
        </p>

        {calledUpPlayers.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', background: 'rgba(0,0,0,0.18)', borderRadius: 'var(--radius-sm)',
            marginBottom: 6, borderLeft: '2px solid var(--gold)',
          }}>
            <span className="h-micro" style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--text-muted)', minWidth: 24 }}>
              {positionShort(p.position)}
            </span>
            <span style={{ flex: 1, fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>
              {p.firstName} {p.lastName}
            </span>
            <span className="h-micro" style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--gold)', fontWeight: 700 }}>
              CA {p.currentAbility}
            </span>
          </div>
        ))}

        <p style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12,
          color: 'var(--text-light)', lineHeight: 1.5, textAlign: 'center',
          margin: '14px 0 4px', paddingTop: 12,
          borderTop: '1px dashed color-mix(in srgb, var(--gold) 18%, transparent)',
        }}>
          {firstLine}
        </p>
        {restLines.length > 0 && (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-light-secondary)',
            lineHeight: 1.5, textAlign: 'center', marginBottom: 12,
          }}>
            {restLines.join(' ')}
          </p>
        )}

        <div style={{ textAlign: 'center', padding: '8px 10px', background: 'rgba(0,0,0,0.18)', borderRadius: 'var(--radius-sm)', marginTop: 4 }}>
          <p className="h-label" style={{ textAlign: 'center' }}>
            Klubbkassa
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
            +{modal.bonusTkr} tkr
          </p>
        </div>

        <button
          onClick={dismissCallupModal}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 16 }}
        >
          Stäng
        </button>
      </div>
    </Overlay>
  )
}
