import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import { getPortraitSvg } from '../../../domain/services/portraitService'

interface Props {
  players: Player[]
  captainId?: string
  onPlayerClick: (playerId: string) => void
}

type Section = 'inner' | 'core' | 'door'

function PlayerRow({ player, isCaptain, section, onClick }: {
  player: Player
  isCaptain: boolean
  section: Section
  onClick: () => void
}) {
  const loyalty = player.loyaltyScore ?? 5
  const loyaltyColor =
    section === 'inner' ? 'var(--success)' :
    section === 'door' ? 'var(--danger)' :
    'var(--text-primary)'

  const meta: string[] = []
  if (isCaptain) meta.push('Kapten')
  meta.push(player.position)
  meta.push(`${player.age} år`)
  if (player.dayJob?.title) meta.push(player.dayJob.title)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 12px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
      }}
    >
      {/* Portrait */}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--bg-surface)',
          border: isCaptain ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        }}
        // TODO(FAS 5): byt mot riktig karaktärsillustration · se CHARACTER-BRIEF.md
        dangerouslySetInnerHTML={{ __html: getPortraitSvg(player.id, player.age, player.position) }}
      />

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {isCaptain && <span style={{ marginRight: 3 }}>⭐</span>}
          {player.firstName} {player.lastName}
        </p>
        <p style={{ fontSize: 10, color: section === 'door' ? 'var(--danger)' : 'var(--text-muted)', marginTop: 1 }}>
          {meta.join(' · ')}
        </p>
      </div>

      {/* Loyalty score */}
      <span style={{
        fontSize: 14,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        color: loyaltyColor,
        flexShrink: 0,
        minWidth: 14,
        textAlign: 'right',
      }}>
        {loyalty}
      </span>
    </div>
  )
}

export function LockerRoomCard({ players, captainId, onPlayerClick }: Props) {
  const [coreExpanded, setCoreExpanded] = useState(false)

  const inner = players
    .filter(p => p.id === captainId || (p.loyaltyScore ?? 5) >= 8)
    .sort((a, b) => {
      if (a.id === captainId) return -1
      if (b.id === captainId) return 1
      return (b.loyaltyScore ?? 5) - (a.loyaltyScore ?? 5)
    })

  const door = players
    .filter(p => !inner.find(i => i.id === p.id) && (p.loyaltyScore ?? 5) < 4)
    .sort((a, b) => (a.loyaltyScore ?? 5) - (b.loyaltyScore ?? 5))

  const core = players
    .filter(p => !inner.find(i => i.id === p.id) && !door.find(d => d.id === p.id))
    .sort((a, b) => (b.loyaltyScore ?? 5) - (a.loyaltyScore ?? 5))

  const CORE_PREVIEW = 3
  const coreVisible = coreExpanded ? core : core.slice(0, CORE_PREVIEW)
  const coreRemainder = core.length - CORE_PREVIEW

  function SectionHeader({ label, count, description, color }: { label: string; count: number; description: string; color: string }) {
    return (
      <div style={{ padding: '8px 12px 3px', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color }}>{label}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{count}</span>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{description}</p>
      </div>
    )
  }

  return (
    <div className="card-sharp" style={{ marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          👥 OMKLÄDNINGSRUMMET
        </span>
      </div>

      {inner.length > 0 && (
        <>
          <SectionHeader
            label="INRE KRETS"
            count={inner.length}
            description="Kapten och stjärnor. Röst i stora beslut."
            color="var(--success)"
          />
          {inner.map(p => (
            <PlayerRow
              key={p.id}
              player={p}
              isCaptain={p.id === captainId}
              section="inner"
              onClick={() => onPlayerClick(p.id)}
            />
          ))}
        </>
      )}

      {core.length > 0 && (
        <>
          <SectionHeader
            label="STAMMEN"
            count={core.length}
            description="Basen i laget. Löser sin bit och håller tyst."
            color="var(--text-muted)"
          />
          {coreVisible.map(p => (
            <PlayerRow
              key={p.id}
              player={p}
              isCaptain={false}
              section="core"
              onClick={() => onPlayerClick(p.id)}
            />
          ))}
          {!coreExpanded && coreRemainder > 0 && (
            <div
              onClick={() => setCoreExpanded(true)}
              style={{
                padding: '7px 12px',
                fontSize: 11,
                color: 'var(--accent)',
                cursor: 'pointer',
                textAlign: 'center',
                borderBottom: '1px solid var(--border)',
              }}
            >
              + {coreRemainder} till →
            </div>
          )}
        </>
      )}

      {door.length > 0 && (
        <>
          <SectionHeader
            label="VID DÖRREN"
            count={door.length}
            description="Missnöjda. Kan sprida dåligt humör. Hantera aktivt."
            color="var(--danger)"
          />
          {door.map(p => (
            <PlayerRow
              key={p.id}
              player={p}
              isCaptain={false}
              section="door"
              onClick={() => onPlayerClick(p.id)}
            />
          ))}
        </>
      )}
    </div>
  )
}
