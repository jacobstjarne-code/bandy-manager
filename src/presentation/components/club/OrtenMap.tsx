import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Club } from '../../../domain/entities/Club'

interface MapNode {
  id: string
  label: string
  emoji: string
  x: number
  y: number
  value: number   // 0-100
}

function nodeColor(v: number): string {
  if (v >= 70) return 'var(--success)'
  if (v >= 45) return 'var(--accent)'
  return 'var(--danger)'
}

interface OrtenMapProps {
  club: Club
  game: SaveGame
}

export function OrtenMap({ club, game }: OrtenMapProps) {
  const cs = game.communityStanding ?? 50
  const facilities = club.facilities ?? 50
  const youthQuality = club.youthQuality ?? 50
  const polRelation = game.localPolitician?.relationship ?? 50
  const sponsorMood = game.sponsorNetworkMood ?? (game.sponsors?.length > 0 ? 60 : 40)
  const volunteerStrength = (game.volunteers?.length ?? 0) > 0
    ? Math.min(100, 40 + (game.volunteers?.length ?? 0) * 10)
    : (game.communityActivities?.functionaries ? 55 : 35)

  const nodes: MapNode[] = [
    { id: 'arena',      label: 'Arena',     emoji: '🏟️', x: 140, y: 40,  value: facilities },
    { id: 'skola',      label: 'Skola',     emoji: '🏫', x: 240, y: 80,  value: youthQuality },
    { id: 'kommunen',   label: 'Kommunen',  emoji: '🏛️', x: 60,  y: 100, value: polRelation },
    { id: 'sponsorer',  label: 'Sponsorer', emoji: '💼', x: 210, y: 150, value: sponsorMood },
    { id: 'frivilliga', label: 'Frivilliga',emoji: '🤝', x: 90,  y: 155, value: volunteerStrength },
  ]

  const W = 300
  const H = 200

  // Edges: arena—skola, arena—kommunen, kommunen—frivilliga, sponsorer—frivilliga, arena—sponsorer
  const edges: [string, string][] = [
    ['arena', 'skola'],
    ['arena', 'kommunen'],
    ['kommunen', 'frivilliga'],
    ['sponsorer', 'frivilliga'],
    ['arena', 'sponsorer'],
  ]

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-body)',
      }}>
        ORTSKARTAN
      </p>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }}>
          {/* Puls-bakgrundscirkel */}
          <circle
            cx={W / 2} cy={H / 2} r={80}
            fill="none"
            stroke="rgba(196,122,58,0.08)"
            strokeWidth={2}
          />
          {/* Edges */}
          {edges.map(([a, b]) => {
            const na = nodeMap[a]
            const nb = nodeMap[b]
            if (!na || !nb) return null
            const avgVal = (na.value + nb.value) / 2
            return (
              <line
                key={`${a}-${b}`}
                x1={na.x} y1={na.y}
                x2={nb.x} y2={nb.y}
                stroke={nodeColor(avgVal)}
                strokeWidth={1.5}
                strokeOpacity={0.35}
                strokeDasharray="4,3"
              />
            )
          })}
          {/* Nodes */}
          {nodes.map(n => {
            const col = nodeColor(n.value)
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={22} fill="var(--bg-elevated)" stroke={col} strokeWidth={2} strokeOpacity={0.8} />
                <text x={n.x} y={n.y - 5} textAnchor="middle" fontSize={13}>{n.emoji}</text>
                <text x={n.x} y={n.y + 9} textAnchor="middle" fontSize={7} fill={col} fontWeight="700">{n.value}</text>
              </g>
            )
          })}
          {/* Labels below nodes */}
          {nodes.map(n => (
            <text key={`label-${n.id}`} x={n.x} y={n.y + 32} textAnchor="middle"
              fontSize={7} fill="var(--text-muted)" fontFamily="system-ui,sans-serif">
              {n.label}
            </text>
          ))}
          {/* Centre pulse value */}
          <text x={W / 2} y={H / 2 + 5} textAnchor="middle" fontSize={18} fontWeight="700"
            fill="var(--accent)" fontFamily="system-ui,sans-serif">{cs}</text>
          <text x={W / 2} y={H / 2 + 17} textAnchor="middle" fontSize={7} fill="var(--text-muted)"
            fontFamily="system-ui,sans-serif">ORTENSPULS</text>
        </svg>
      </div>
    </div>
  )
}
