import type { Player } from '../../../domain/entities/Player'
import type { Club, Tactic } from '../../../domain/entities/Club'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { getTacticConsequence } from '../../../domain/services/chemistryService'
import { getSuggestionWhyLine, type OpponentAnalysis } from '../../../domain/services/opponentAnalysisService'
import { tacticRows } from '../../utils/tacticData'
import { FormationView } from './FormationView'
import { NotesView } from './NotesView'

interface TacticBoardCardProps {
  club: Club
  players: Player[]
  coach: AssistantCoach
  captainPlayerId: string | undefined
  chemistryStats: Record<string, number>
  onTacticChange: (tactic: Tactic) => void
  matchday?: number
  nextOpponentName?: string
  opponentAnalysis?: OpponentAnalysis
}

const TACTIC_GROUPS = [
  { label: 'Spelplan', keys: ['mentality', 'tempo', 'press'] as const },
  { label: 'Bollspel', keys: ['passingRisk', 'width', 'attackingFocus'] as const },
  { label: 'Fasta situationer', keys: ['cornerStrategy', 'penaltyKillStyle'] as const },
]

// Genomgång II B: en taktik-hemvist, platt. Taktiken är samma sanningskälla
// (club.activeTactic) som matchförberedelsen skriver till; kemin är ett alltid-synligt
// lager på planen, anteckningarna ett kort under.
//
// AUDIT DEL 4 (2026-08-12): tidigare redigerade denna ytan bara mentality (1 av 8
// dimensioner) medan TacticStep (matchförberedelsen) redigerade alla 8 via samma
// club.activeTactic — en dubblett av RoundSummary/Granska-klassen. Nu delad config
// (tacticRows, tacticData.ts) och FÖRESLÅS-badgen gäller varje dimension som har ett
// förslag (idag: mentality, press — de två fält opponentAnalysisService beräknar),
// inte bara mentalitet. Förslaget förblir passivt: inget förväljs, inget
// auto-appliceras, knappen sätter fortfarande bara värdet on-click.
export function TacticBoardCard({
  club, players, coach, captainPlayerId, chemistryStats, onTacticChange, matchday, nextOpponentName, opponentAnalysis,
}: TacticBoardCardProps) {
  const squadPlayers = players.filter(p => p.clubId === club.id)
  const tactic = club.activeTactic
  const feel = getTacticConsequence(club.activeTactic, squadPlayers, chemistryStats, opponentAnalysis, matchday ?? 0)

  // Yta 3 (Audit-syntes, 2026-07-07) + AUDIT DEL 4: suggestedMentality/suggestedPress
  // kommer från opponentAnalysisService — bara VISUELL markering, ändrar aldrig
  // club.activeTactic. Knappen sätter fortfarande bara det egna fältet on-click.
  const recommendations: Partial<Record<keyof Tactic, string>> = {}
  if (opponentAnalysis?.suggestedMentality) recommendations.mentality = opponentAnalysis.suggestedMentality
  if (opponentAnalysis?.suggestedPress) recommendations.press = opponentAnalysis.suggestedPress
  // {coach} interpolerar mot assistentens namn (coach.name), inte initialer — Fables
  // textleverans 2026-07-07 namnger assistenten i varje varför-rad.
  const suggestionWhyLine = getSuggestionWhyLine(opponentAnalysis?.recommendation, coach.name)
  const hasAnySuggestion = Object.entries(recommendations).some(([key, rec]) => rec !== tactic[key as keyof Tactic])

  function setTacticValue<K extends keyof Tactic>(key: K, value: Tactic[K]) {
    onTacticChange({ ...club.activeTactic, [key]: value })
  }

  return (
    <div className="card-sharp" style={{ padding: 0, overflow: 'hidden', marginBottom: 8 }}>
      {/* TAKTIK — samma tacticRows-config och sanningskälla som matchförberedelsen */}
      <div style={{ padding: '10px 12px 8px' }}>
        {TACTIC_GROUPS.map((group, gi) => {
          const rows = tacticRows.filter(r => group.keys.includes(r.key as never))
          if (!rows.length) return null
          return (
            <div key={group.label} style={{ marginBottom: gi < TACTIC_GROUPS.length - 1 ? 10 : 0 }}>
              <p className="h-label" style={{ marginBottom: 5 }}>
                {group.label}
              </p>
              {rows.map(({ label, key, options }, ri) => {
                const rec = recommendations[key]
                const current = tactic[key] as string
                const showSuggestion = rec !== undefined && rec !== current
                return (
                  <div key={key} style={{ marginBottom: ri < rows.length - 1 ? 6 : 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '78px 1fr', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                      <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                        {options.map((opt, i) => (
                          <button
                            key={opt.value}
                            onClick={() => setTacticValue(key, opt.value as Tactic[typeof key])}
                            style={{
                              position: 'relative',
                              flex: 1, textAlign: 'center', padding: '6px 3px',
                              fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                              cursor: 'pointer', fontFamily: 'var(--font-body)',
                              border: 'none', borderRight: i === options.length - 1 ? 'none' : '1px solid var(--border)',
                              background: current === opt.value ? 'var(--accent)' : 'transparent',
                              color: current === opt.value ? 'var(--text-light)' : 'var(--text-muted)',
                            }}
                          >
                            {opt.label}
                            {/* Yta 3 / AUDIT DEL 4: förslagsmarkör — visuell, ändrar aldrig
                                fältet självt. Pillen bär bara "assistentens förslag";
                                namnet hör hemma i varför-raden. */}
                            {showSuggestion && opt.value === rec && (
                              <span style={{
                                position: 'absolute', top: -6, right: -2,
                                fontSize: 6.5, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase',
                                background: 'var(--copper)', color: 'var(--text-light)',
                                borderRadius: 99, padding: '2px 4px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                              }}>
                                FÖRESLÅS
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
        {/* Yta 3: varför-raden — vem föreslår + varför, härledd ur recommendation
            (getSuggestionWhyLine). Nivå 2 (animation vid byte) väntar på Design
            efter denna nivå 1. Gäller nu hela förslaget, inte bara mentalitet. */}
        {hasAnySuggestion && suggestionWhyLine && (
          <p className="h-quote-sm" style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            {suggestionWhyLine}
          </p>
        )}
      </div>

      {/* Planen + kemi-lager (alltid synligt) */}
      <div style={{ padding: '4px 12px 0' }}>
        <p className="h-label" style={{ marginBottom: 6 }}>
          📋 Planen · {club.activeTactic.formation ?? '3-3-4'}
        </p>
      </div>

      <div style={{ padding: '0 12px 4px' }}>
        <FormationView
          tactic={club.activeTactic}
          players={squadPlayers}
          onChange={onTacticChange}
          chemistryStats={chemistryStats}
        />
        {/* Så spelar det — härlett ur spelstil + faktisk kemi */}
        <p className="h-quote-sm" style={{ textAlign: 'center', lineHeight: 1.45, marginTop: 8 }}>
          {feel}
        </p>
      </div>

      {/* Anteckningar — som kort under, inte en egen flik */}
      <div style={{ margin: '8px 12px 0', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 11px' }}>
        <p className="h-label" style={{ marginBottom: 4 }}>
          🗒 Assistentens anteckningar
        </p>
        <NotesView
          coach={coach}
          players={squadPlayers}
          captainPlayerId={captainPlayerId}
          matchday={matchday}
          nextOpponentName={nextOpponentName}
        />
      </div>
    </div>
  )
}
