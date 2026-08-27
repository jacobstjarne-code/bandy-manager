import type { Player } from '../../../domain/entities/Player'
import type { ScoutReport } from '../../../domain/entities/Scouting'
import { positionShort, formatSalary } from '../../utils/formatters'
import { getCandidateScore } from '../../../domain/services/retirementDecisionService'

interface FreeAgentListProps {
  freeAgents: Player[]
  windowOpen: boolean
  scoutReports: Record<string, ScoutReport>
  onSign: (agentId: string) => void
}

// SEXSÄSONGSAUDITEN 2026-08-26, SPÅR 2a: en nyvärvning kan redan vid
// signering ha ett kontraktskronologi-relaterat pensionsvillkor uppfyllt
// (getCandidateScore, samma formel som seasonEndProcessor.ts använder för
// pensionsbeslutskandidaten vid säsongsslut — se retirementDecisionService.ts).
// Beslutet triggas ändå aldrig förrän NÄSTA säsongsskifte (getRetirementCandidate
// filtrerar på game.managedClubId, anropas bara i seasonEndProcessor.ts) —
// så "pensionerar sig samma stund" kan inte inträffa, men en tränare som
// investerar i en veteran utan att veta att pensionsbeslutet väntar redan
// till våren är precis den risken audit-fyndet pekar på. Flaggas här, innan
// signering, inte efter.
const RETIREMENT_RISK_THRESHOLD = 1

export function FreeAgentList({ freeAgents, windowOpen, scoutReports, onSign }: FreeAgentListProps) {
  if (freeAgents.length === 0) {
    return (
      <div className="card-sharp transfers-empty-state">
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Inga fria agenter tillgängliga just nu. Fria agenter dyker upp vid säsongsslut.</p>
      </div>
    )
  }

  return (
    <div className="card-sharp" style={{ overflow: 'hidden' }}>
      {freeAgents.map((agent, index) => {
        const retirementRisk = getCandidateScore(agent) >= RETIREMENT_RISK_THRESHOLD
        return (
          <div key={agent.id} className="transfers-list-row-lg" style={{ borderBottom: index < freeAgents.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div className="transfers-list-content">
              <p className="transfers-list-name-lg">
                {agent.firstName} {agent.lastName}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {positionShort(agent.position)} · Styrka {scoutReports[agent.id] ? `~${scoutReports[agent.id].estimatedCA}` : '?'} · {formatSalary(agent.salary)}
              </p>
              {retirementRisk && (
                <p style={{ fontSize: 11, color: 'var(--warm)', marginTop: 3 }}>
                  ⚠️ Kan bli aktuell för pensionsbeslut redan till nästa säsong
                </p>
              )}
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
        )
      })}
    </div>
  )
}
