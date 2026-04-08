import type { Player } from '../../../domain/entities/Player'
import type { ScoutReport } from '../../../domain/entities/Scouting'
import { positionShort, formatCurrency } from '../../utils/formatters'

interface FreeAgentListProps {
  freeAgents: Player[]
  windowOpen: boolean
  scoutReports: Record<string, ScoutReport>
  onSign: (agentId: string) => void
}

export function FreeAgentList({ freeAgents, windowOpen, scoutReports, onSign }: FreeAgentListProps) {
  if (freeAgents.length === 0) {
    return (
      <div className="card-round" style={{ padding: '20px 16px' }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Inga fria agenter tillgängliga just nu. Fria agenter dyker upp vid säsongsslut.</p>
      </div>
    )
  }

  return (
    <div className="card-round" style={{ overflow: 'hidden' }}>
      {freeAgents.map((agent, index) => (
        <div key={agent.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: index < freeAgents.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {agent.firstName} {agent.lastName}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {positionShort(agent.position)} · Styrka {scoutReports[agent.id] ? `~${scoutReports[agent.id].estimatedCA}` : '?'} · {formatCurrency(agent.salary)}/mån
            </p>
          </div>
          <button
            onClick={() => windowOpen && onSign(agent.id)}
            disabled={!windowOpen}
            className={`btn ${windowOpen ? 'btn-copper' : 'btn-ghost'}`}
            style={{ flexShrink: 0, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: windowOpen ? 'pointer' : 'not-allowed', opacity: windowOpen ? 1 : 0.6 }}
          >
            Värva
          </button>
        </div>
      ))}
    </div>
  )
}
