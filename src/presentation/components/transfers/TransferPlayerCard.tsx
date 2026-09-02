import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { ScoutReport } from '../../../domain/entities/Scouting'
import { positionShort, formatValue } from '../../utils/formatters'
import { Star } from 'lucide-react'

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
    <div
      className={`transfers-list-row-lg ${isScouted ? 'transfers-state-scouted-bg' : ''} ${isLast ? '' : 'transfers-row-divider'}`}
      data-entity-id={`player:${player.id}`}
      data-entity-source="TransferPlayerCard"
    >
      <div className="transfers-list-content">
        <p className="transfers-list-name-lg">
          {player.firstName} {player.lastName}
          {isBargain && <span className="transfers-bargain"><Star size={11} aria-hidden="true" /> Fynd</span>}
        </p>
        <p className="transfers-player-meta">
          {positionShort(player.position)} · {player.age} år · {club?.shortName ?? '?'} · {isScouted ? `Styrka ~${estimatedCA}` : 'Styrka ?'} · MV {formatValue(player.marketValue)}
        </p>
      </div>
      {isScouted && <span className="tag tag-copper transfers-no-shrink">Scoutad</span>}
      {windowOpen && (
        <button
          onClick={() => onBid(player.id)}
          className="btn btn-outline transfers-btn-xs"
        >
          Bud
        </button>
      )}
      {!isScouted && onScout && (
        <button
          onClick={() => !activeAssignment && scoutBudget > 0 && onScout(player)}
          disabled={!!activeAssignment || scoutBudget <= 0}
          className="btn btn-ghost transfers-btn-xs transfers-btn-xs--narrow"
        >
          Scout
        </button>
      )}
    </div>
  )
}
