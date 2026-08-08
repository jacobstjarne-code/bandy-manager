import type { Club, Tactic } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { PlayerArchetype } from '../../../domain/enums'
import { generateDetailedAnalysis } from '../../../domain/services/opponentAnalysisService'
import { tacticRows } from '../../utils/tacticData'

interface TacticStepProps {
  tacticState: Tactic
  matchWeatherData?: unknown
  startingIds: string[]
  game: SaveGame
  opponent?: Club | null
  nextFixture?: Fixture | null
  onChange: <K extends keyof Tactic>(key: K, value: Tactic[K]) => void
  onBack: () => void
  onNext: () => void
}

// Maps tactic value index (0=conservative, 1=balanced, 2=aggressive) to intensity class
function intensityClass(idx: number): string {
  return idx === 0 ? 'intensity-1' : idx === 1 ? 'intensity-2' : 'intensity-3'
}

export function TacticStep({ tacticState, startingIds, game, opponent, nextFixture, onChange, onBack, onNext }: TacticStepProps) {
  const opponentPlayers = opponent ? game.players.filter(p => opponent.squadPlayerIds.includes(p.id)) : []
  const analysis = (opponent && nextFixture)
    ? generateDetailedAnalysis(opponent, opponentPlayers, game.standings, game.fixtures, nextFixture.id)
    : null

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const cornerSpec = managedPlayers.find(
    p => p.archetype === PlayerArchetype.CornerSpecialist && startingIds.includes(p.id)
  )

  // SLUTTEST 2026-08-08 (punkt 5): läser nu analysis.suggestedMentality/
  // .suggestedPress (opponentAnalysisService.ts, samma "Yta 3"-mappning som
  // redan drev den varma remsans recommendation-text) istf en egen,
  // oberoende recentForm/tablePosition-beräkning. Rot till motsägelsen: två
  // lager läste olika signaler (den varma remsan: motståndarens truppstyrka
  // per position; denna raden: form/tabellplacering) och kunde peka åt olika
  // håll samtidigt ("Prioritera defensiven" ovanför, "Matchar förslaget.
  // Offensivt läge" tre rader ner). En källa nu, ingen egen tolkning kvar här.
  const recommendations: Partial<Record<keyof Tactic, string>> = {}
  if (analysis?.suggestedMentality) recommendations.mentality = analysis.suggestedMentality
  if (analysis?.suggestedPress) recommendations.press = analysis.suggestedPress
  recommendations.cornerStrategy = cornerSpec ? 'aggressive' : 'safe'

  // Per-key confirm/warn feedback
  function getFeedback(key: keyof Tactic): { type: 'confirm' | 'warn'; text: string } | null {
    const current = tacticState[key] as string
    const rec = recommendations[key]
    if (key === 'cornerStrategy') {
      if (current === 'aggressive' && !cornerSpec) {
        return { type: 'warn', text: 'Vi saknar hörnspecialist — aggressiva hörnor är riskfyllda.' }
      }
      if (current === 'aggressive' && cornerSpec) {
        return { type: 'confirm', text: `${cornerSpec.firstName} ${cornerSpec.lastName} är hörnspecialist — bra val.` }
      }
    }
    if (rec && current === rec && analysis) {
      if (key === 'press' && rec === 'high') return { type: 'confirm', text: 'Matchar förslaget. Motståndaren tappar struktur i högt press.' }
      if (key === 'press' && rec === 'low') return { type: 'confirm', text: 'Matchar förslaget. Defensivt läge mot stark motståndare.' }
      if (key === 'mentality' && rec === 'offensive') return { type: 'confirm', text: 'Matchar förslaget. Offensivt läge utnyttjar svag motståndare.' }
      if (key === 'mentality' && rec === 'defensive') return { type: 'confirm', text: 'Matchar förslaget. Stabilt mot topplag.' }
    }
    return null
  }

  const oppName = opponent?.shortName ?? opponent?.name ?? 'Motståndaren'

  // Opp-insight line
  const insightParts: string[] = []
  if (analysis?.formation) insightParts.push(analysis.formation)
  if (analysis?.strengths.length) insightParts.push(`stark: ${analysis.strengths[0].toLowerCase()}`)
  if (analysis?.weaknesses.length) insightParts.push(`svag: ${analysis.weaknesses[0].toLowerCase()}`)
  const insightText = insightParts.join(' · ') || (analysis?.recentForm ?? '—')

  const groups = [
    { label: 'Spelplan', keys: ['mentality', 'tempo', 'press'] as const },
    { label: 'Bollspel', keys: ['passingRisk', 'width', 'attackingFocus'] as const },
    { label: 'Fasta situationer', keys: ['cornerStrategy', 'penaltyKillStyle'] as const },
  ]

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* Opp insight */}
      {opponent && (
        <div style={{
          margin: '8px 14px 0', padding: '7px 12px',
          background: 'var(--bg-surface)',
          borderLeft: '2px solid var(--accent)',
          borderRadius: '0 8px 8px 0',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span className="h-label" style={{ flexShrink: 0 }}>
            {oppName}
          </span>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>
            {insightText}
          </span>
        </div>
      )}

      {/* Recommendation warm-stripe */}
      {analysis?.recommendation && (
        <div style={{
          margin: '5px 14px 0', padding: '7px 12px',
          background: 'var(--bg-surface)',
          borderLeft: '2px solid var(--warm)',
          borderRadius: '0 8px 8px 0',
        }}>
          <div className="h-label" style={{ color: 'var(--warm)', marginBottom: 2 }}>
            Förslag mot {oppName}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {analysis.recommendation}
          </div>
        </div>
      )}

      {/* Nudge legend */}
      {Object.keys(recommendations).length > 0 && (
        <div className="h-micro" style={{ margin: '6px 14px 0', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 4 }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--warm)', display: 'inline-block', flexShrink: 0 }} />
          = rekommenderat val
        </div>
      )}

      {/* Tactic sections */}
      {groups.map(group => {
        const rows = tacticRows.filter(r => group.keys.includes(r.key as never))
        if (!rows.length) return null
        return (
          <div key={group.label} style={{
            margin: '6px 14px 0', padding: '8px 12px 10px',
            background: 'var(--bg-surface)',
            borderLeft: '2px solid var(--accent)',
            borderRadius: '0 8px 8px 0',
          }}>
            <p className="h-label" style={{ marginBottom: 8 }}>
              {group.label}
            </p>
            {rows.map(({ label, key, options }, ri) => {
              const rec = recommendations[key]
              const feedback = getFeedback(key)
              return (
                <div key={key as string} style={{ marginBottom: ri < rows.length - 1 ? 9 : 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
                    <div className="tactic-segmented">
                      {options.map((opt, oi) => {
                        const isActive = tacticState[key] === opt.value
                        const isRec = rec === opt.value
                        return (
                          <button
                            key={opt.value}
                            className={`tactic-btn ${intensityClass(oi)}${isActive ? ' active' : ''}${isRec ? ' recommended' : ''}`}
                            onClick={() => onChange(key, opt.value as Tactic[typeof key])}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {feedback && (
                    <p className={`tactic-feedback ${feedback.type}`}>
                      {feedback.text}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, padding: '14px 14px 0', borderTop: '0.5px solid var(--border)', marginTop: 12 }}>
        <button onClick={onBack} className="btn btn-outline">← Trupp</button>
        <button onClick={onNext} className="btn btn-cta btn-primary">Nästa: Starta →</button>
      </div>
    </div>
  )
}
