import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getPortraitSvg } from '../../../domain/services/portraitService'

interface Props {
  players: Player[]
  captainId?: string
  game: SaveGame
  onPlayerClick: (playerId: string) => void
}

function playerHash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i)
    h = ((h << 5) - h) + c
    h |= 0
  }
  return Math.abs(h)
}

export function LockerRoomMap({ players, captainId, game, onPlayerClick }: Props) {
  const [tooltip, setTooltip] = useState<{ playerId: string; x: number; y: number } | null>(null)

  // Sortera i tre grupper (loyaltyScore: 0-10 skala)
  const inner = players.filter(p =>
    p.id === captainId || (p.loyaltyScore ?? 5) >= 8
  ).slice(0, 4)

  const outer = players.filter(p =>
    !inner.find(i => i.id === p.id) && (
      (p.loyaltyScore ?? 5) < 4 ||
      ((p.careerStats?.totalGames ?? 0) < 3)
    )
  ).slice(0, 5)

  const core = players.filter(p =>
    !inner.find(i => i.id === p.id) && !outer.find(o => o.id === p.id)
  )

  // Tilldela x-position deterministiskt per spelare inom sin zon
  function zoneX(p: Player, index: number, total: number): number {
    const h = playerHash(p.id)
    const spread = 220
    const left = 30
    if (total === 0) return left + spread / 2
    const base = left + (index / Math.max(total - 1, 1)) * spread
    const jitter = ((h % 20) - 10)  // ±10px jitter
    return Math.max(left, Math.min(left + spread, base + jitter))
  }

  const DOT = 12
  const MAP_W = 300
  const MAP_H = 180

  const tooltipPlayer = tooltip ? players.find(p => p.id === tooltip.playerId) : null

  return (
    <div className="card-sharp" style={{ padding: 12, marginBottom: 12 }}>
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
        🚪 OMKLÄDNINGSRUMMET
      </p>

      <div style={{ position: 'relative', width: MAP_W, maxWidth: '100%', height: MAP_H, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'visible', margin: '0 auto' }}>
        {/* Taktiktavla längst in */}
        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
          📋 TAKTIKTAVLA
        </div>

        {/* Bänkar längs kanterna */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'var(--border)', borderRadius: '0 0 4px 4px' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'var(--border)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: 'var(--border)' }} />

        {/* Zon-labels */}
        <div style={{ position: 'absolute', left: 8, top: 22, fontSize: 8, color: 'var(--accent)', opacity: 0.6 }}>INRE</div>
        <div style={{ position: 'absolute', left: 8, top: 82, fontSize: 8, color: 'var(--text-muted)', opacity: 0.5 }}>STAM</div>
        <div style={{ position: 'absolute', left: 8, top: 148, fontSize: 8, color: 'var(--text-muted)', opacity: 0.4 }}>DÖRREN</div>

        {/* Inre cirkel: y=28-52 */}
        {inner.map((p, i) => {
          const x = zoneX(p, i, inner.length)
          const y = 28 + (playerHash(p.id) % 16)
          const isCap = p.id === captainId
          return (
            <PlayerDot
              key={p.id}
              player={p}
              x={x} y={y}
              dotSize={DOT}
              isCaptain={isCap}
              isInner={true}
              onHover={(pid, px, py) => setTooltip({ playerId: pid, x: px, y: py })}
              onLeave={() => setTooltip(null)}
              onClick={() => onPlayerClick(p.id)}
            />
          )
        })}

        {/* Stam: y=68-112 */}
        {core.map((p, i) => {
          const x = zoneX(p, i, core.length)
          const y = 68 + (playerHash(p.id) % 36)
          return (
            <PlayerDot
              key={p.id}
              player={p}
              x={x} y={y}
              dotSize={DOT}
              isCaptain={false}
              isInner={false}
              onHover={(pid, px, py) => setTooltip({ playerId: pid, x: px, y: py })}
              onLeave={() => setTooltip(null)}
              onClick={() => onPlayerClick(p.id)}
            />
          )
        })}

        {/* Periferi: y=140-165 */}
        {outer.map((p, i) => {
          const x = zoneX(p, i, outer.length)
          const y = 140 + (playerHash(p.id) % 18)
          return (
            <PlayerDot
              key={p.id}
              player={p}
              x={x} y={y}
              dotSize={DOT}
              isCaptain={false}
              isInner={false}
              opacity={0.55}
              onHover={(pid, px, py) => setTooltip({ playerId: pid, x: px, y: py })}
              onLeave={() => setTooltip(null)}
              onClick={() => onPlayerClick(p.id)}
            />
          )
        })}

        {/* Tooltip */}
        {tooltip && tooltipPlayer && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 14, MAP_W - 120),
            top: Math.max(tooltip.y - 36, 2),
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 10,
            color: 'var(--text-primary)',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            <strong>{tooltipPlayer.firstName} {tooltipPlayer.lastName}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
              Lojalitet {(tooltipPlayer.loyaltyScore ?? 5)}/10
            </span>
          </div>
        )}
      </div>

      {/* Text-sammanfattning under kartan */}
      <p style={{ fontSize: 10, fontStyle: 'italic', marginTop: 6, color: 'var(--text-muted)' }}>
        Inre cirkel: kapten + spelare med högst lojalitet. Vid dörren: låg lojalitet.
      </p>

      {/* Kontrollera att game används (undviker lint-varning) */}
      {game.currentSeason > 0 && null}
    </div>
  )
}

interface DotProps {
  player: Player
  x: number
  y: number
  dotSize: number
  isCaptain: boolean
  isInner: boolean
  opacity?: number
  onHover: (playerId: string, x: number, y: number) => void
  onLeave: () => void
  onClick: () => void
}

function PlayerDot({ player, x, y, dotSize, isCaptain, isInner, opacity = 1, onHover, onLeave, onClick }: DotProps) {
  const border = isCaptain
    ? '2px solid var(--accent)'
    : isInner
      ? '1px solid rgba(196,122,58,0.5)'
      : '1px solid var(--border)'

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const parentRect = e.currentTarget.parentElement!.getBoundingClientRect()
        onHover(player.id, x, y)
        void rect
        void parentRect
      }}
      onMouseLeave={onLeave}
      style={{
        position: 'absolute',
        left: x - dotSize / 2,
        top: y - dotSize / 2,
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        overflow: 'hidden',
        border,
        cursor: 'pointer',
        opacity,
        transition: 'transform 0.1s',
      }}
      title={`${player.firstName} ${player.lastName}`}
      // TODO(FAS 5): byt mot riktig karaktärsillustration · se CHARACTER-BRIEF.md
      dangerouslySetInnerHTML={{ __html: getPortraitSvg(player.id, player.age, player.position) }}
    />
  )
}
