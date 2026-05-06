import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { ScoutReport } from '../../../domain/entities/Scouting'
import { positionShort } from '../../utils/formatters'

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

interface TransferPlayerCardProps {
  player: Player
  club?: Club
  report?: ScoutReport
  windowOpen: boolean
  isLast: boolean
  activeAssignment: boolean
  scoutBudget: number
  onBid: (playerId: string) => void
  onScout?: (player: Player) => void
}

export function TransferPlayerCard({
  player,
  club,
  report,
  windowOpen,
  isLast,
  activeAssignment,
  scoutBudget,
  onBid,
  onScout,
}: TransferPlayerCardProps) {
  const isScouted = !!report
  const estimatedCA = report?.estimatedCA
  const isBargain = isScouted && estimatedCA && player.marketValue > 0 && (estimatedCA / (player.marketValue / 5000)) > 1.3

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 14px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      gap: 10,
      borderLeft: isScouted ? '3px solid var(--accent)' : '3px solid transparent',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)' }}>
          {player.firstName} {player.lastName}
          {isBargain && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>⭐ Fynd</span>}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
          {positionShort(player.position)} · {player.age} år · {club?.shortName ?? '?'} · {isScouted ? `Styrka ~${estimatedCA}` : 'Styrka ?'} · MV {formatValue(player.marketValue)}
        </p>
      </div>
      {isScouted && <span className="tag tag-copper" style={{ flexShrink: 0 }}>Scoutad</span>}
      {windowOpen && (
        <button
          onClick={() => onBid(player.id)}
          className="btn btn-outline"
          style={{ flexShrink: 0, padding: '5px 10px', fontSize: 11, fontWeight: 600 }}
        >
          💰 Bud
        </button>
      )}
      {!isScouted && onScout && (
        <button
          onClick={() => !activeAssignment && scoutBudget > 0 && onScout(player)}
          disabled={!!activeAssignment || scoutBudget <= 0}
          className="btn btn-ghost"
          style={{ flexShrink: 0, padding: '5px 8px', fontSize: 11, opacity: !activeAssignment && scoutBudget > 0 ? 1 : 0.5 }}
        >
          🔍
        </button>
      )}
    </div>
  )
}
