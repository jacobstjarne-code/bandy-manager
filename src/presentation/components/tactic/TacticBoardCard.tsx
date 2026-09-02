import type { Player } from '../../../domain/entities/Player'
import type { Club, Tactic } from '../../../domain/entities/Club'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { getTacticConsequence } from '../../../domain/services/chemistryService'
import { getSuggestionWhyLine, type OpponentAnalysis } from '../../../domain/services/opponentAnalysisService'
import { tacticRows, TACTIC_GROUPS, type TacticRow } from '../../utils/tacticData'
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
  /** O15 (2026-08-18/19, DOM 1b): Taktikens två lägen. Standard = default (progressiv
   *  disclosure); Avancerat = alla åtta. Ägs av TaktikScreen (game.tacticAdvancedMode,
   *  persisterad via setTacticAdvancedMode) — komponenten är stateless för detta. */
  advancedMode: boolean
  onToggleAdvancedMode: (advanced: boolean) => void
  /** Standardlägets delta-rad — LÅST text (Jacob/Design), härledd i TaktikScreen via
   *  getTacticDeltaLine. undefined = första matchen någonsin (ingen rad, per spec). */
  deltaLine?: string
  /** Avancerat lägets "Vad du ändrat i år" — härledd i TaktikScreen via
   *  getTacticChangeHistoryLines. Alltid minst en rad ("utgångsläge satt"). */
  historyLines: string[]
  lineupConfirmedThisRound?: boolean
}

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
//
// O15 (2026-08-18/19, DOM 1b — "Taktikens två lägen"): progressiv disclosure, inte
// förenkling. Standardläge (default) visar förslaget som ETT sammanhållet kort +
// delta-raden ("vad skiljer mot förra matchen") + Spelplan öppen som förhandsvisning
// (den bär förslagen) + en väg in till allt. Avancerat läge visar alla åtta med
// 44px träffytor + ändringshistorik. Samma skärm, ingen egen route (brief punkt 3).
// Å2-stjärnfixen (denna leverans): FÖRESLÅS-pillen som tidigare var absolut-
// positionerad (top:-12, klippande overflow:hidden-container, KLAR ba18ea80 för
// själva klippet) är nu helt borttagen — "★" sitter i knappens EGEN layout
// (renderRow nedan), aldrig som ett flytande element ovanpå/utanför knappen.
export function TacticBoardCard({
  club, players, coach, captainPlayerId, chemistryStats, onTacticChange, matchday, nextOpponentName, opponentAnalysis,
  advancedMode, onToggleAdvancedMode, deltaLine, historyLines, lineupConfirmedThisRound = false,
}: TacticBoardCardProps) {
  const squadPlayers = players.filter(p => p.clubId === club.id)
  const tactic = club.activeTactic
  const feel = getTacticConsequence(club.activeTactic, squadPlayers, chemistryStats, opponentAnalysis, matchday ?? 0)

  // Yta 3 (Audit-syntes, 2026-07-07) + AUDIT DEL 4: suggestedMentality/suggestedPress
  // kommer från opponentAnalysisService — bara VISUELL markering, ändrar aldrig
  // club.activeTactic. "Följ rådet" (O15) sätter dem, men bara på klick.
  const recommendations: Partial<Record<keyof Tactic, string>> = {}
  if (opponentAnalysis?.suggestedMentality) recommendations.mentality = opponentAnalysis.suggestedMentality
  if (opponentAnalysis?.suggestedPress) recommendations.press = opponentAnalysis.suggestedPress
  // {coach} interpolerar mot assistentens namn (coach.name), inte initialer — Fables
  // textleverans 2026-07-07 namnger assistenten i varje varför-rad.
  const suggestionWhyLine = getSuggestionWhyLine(opponentAnalysis?.recommendation, coach.name)
  const activeSuggestions = (Object.entries(recommendations) as [keyof Tactic, string][])
    .filter(([key, rec]) => rec !== tactic[key])
  const hasAnySuggestion = activeSuggestions.length > 0

  function setTacticValue<K extends keyof Tactic>(key: K, value: Tactic[K]) {
    onTacticChange({ ...club.activeTactic, [key]: value })
  }

  // O15: "Följ rådet" sätter BARA de föreslagna fälten (idag mentality + press) —
  // aldrig alla åtta. Passivt tills tryck (Granska del 4-regeln): körs bara on-click.
  function applyRecommendations() {
    const next = { ...club.activeTactic }
    for (const [key, value] of activeSuggestions) {
      (next as Record<string, unknown>)[key] = value
    }
    onTacticChange(next)
  }

  // Delad radrenderare — Spelplan-förhandsvisningen i standardläget och alla åtta i
  // avancerat läge ritar med SAMMA funktion, så Å2-fixen (★ i knappens layout, 44px
  // träffyta) inte kan glida isär mellan de två lägena.
  function renderRow({ label, key, options }: TacticRow) {
    const rec = recommendations[key]
    const current = tactic[key] as string
    return (
      <div key={key} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '78px 1fr', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {options.map((opt, i) => {
              // B2 (SLUTTEST_KO.md 2026-08-19): opt.value kan vara ett värdeblock
              // (t.ex. press: ['medium','low'] — matchCore behandlar dem identiskt).
              // isSelected/isRec matchar mot HELA blocket; klick normaliserar till [0].
              const values = Array.isArray(opt.value) ? opt.value : [opt.value]
              const isSelected = values.includes(current)
              const isRec = rec !== undefined && values.includes(rec) && !isSelected
              return (
                <button
                  key={values.join('-')}
                  data-testid="tactic-option"
                  // Klick på en redan aktiv sammanslagen knapp ska INTE tyst skriva om
                  // t.ex. 'low' → 'medium' — det vore en spöklik ändring i tactic-
                  // change-loggen (diffTactics ser råvärdet, inte UI-blocket).
                  onClick={() => { if (!isSelected) setTacticValue(key, values[0] as Tactic[typeof key]) }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 44, textAlign: 'center', padding: '0 3px',
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    border: 'none', borderRight: i === options.length - 1 ? 'none' : '1px solid var(--border)',
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    color: isSelected ? 'var(--text-light)' : 'var(--text-muted)',
                  }}
                >
                  {opt.label}{isRec ? ' ★' : ''}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const previewGroup = TACTIC_GROUPS[0] // "Spelplan" — bär förslagen, öppen i standardläget (DOM 1b)
  const hiddenGroups = TACTIC_GROUPS.slice(1)

  return (
    <div className="card-sharp" style={{ padding: 0, overflow: 'hidden', marginBottom: 8 }}>
      {/* TAKTIK — samma tacticRows-config och sanningskälla som matchförberedelsen */}
      <div style={{ padding: '10px 12px 8px' }}>
        {/* O15: lägestoggel, persisteras via onToggleAdvancedMode (SaveGame.tacticAdvancedMode) */}
        <div className="btn-segmented" style={{ display: 'flex', width: '100%', marginBottom: 10 }}>
          {(['standard', 'advanced'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => onToggleAdvancedMode(mode === 'advanced')}
              className={`btn${(mode === 'advanced') === advancedMode ? ' active' : ''}`}
              style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px' }}
            >
              {mode === 'standard' ? 'Standard' : 'Avancerat'}
            </button>
          ))}
        </div>

        {!advancedMode && (
          <>
            {/* Delta-raden — vad som skiljer mot förra SPELADE matchen. LÅST text. */}
            {deltaLine && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '1px 2px', marginBottom: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cold)', flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.4 }}>{deltaLine}</span>
              </div>
            )}

            {/* Förslaget som ETT sammanhållet kort (inte separata rader per dimension) */}
            {hasAnySuggestion && (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid color-mix(in srgb, var(--warm) 45%, var(--border))',
                borderLeft: '3px solid var(--warm)',
                borderRadius: '0 8px 8px 0',
                padding: '12px 13px',
                marginBottom: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 9 }}>
                  {/* ds-guard: .h-display-sm (font-display via klass) istf inline fontFamily */}
                  <span className="h-display-sm" style={{ color: 'var(--warm)' }}>
                    {activeSuggestions.length}
                  </span>
                  <span className="h-label" style={{ color: 'var(--warm)' }}>
                    {activeSuggestions.length === 1 ? 'ändring föreslås' : 'ändringar föreslås'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeSuggestions.map(([key, value]) => {
                    const row = tacticRows.find(r => r.key === key)!
                    const findLabel = (v: string) => row.options.find(o => Array.isArray(o.value) ? o.value.includes(v) : o.value === v)?.label
                    const currentLabel = findLabel(tactic[key] as string) ?? String(tactic[key])
                    const newLabel = findLabel(value) ?? value
                    return (
                      <div key={key as string} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 64 }}>{row.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{currentLabel}</span>
                        <span style={{ color: 'var(--warm)', fontWeight: 700 }}>→</span>
                        {/* ds-guard: .h-num-sm (font-display via klass, inte inline) istf egen
                            inline-reimplementering av typrollen — samma serif-siffer-vikt som
                            resten av huset använder för accentuerade värden. */}
                        <span className="h-num-sm" style={{ fontSize: 12.5, color: 'var(--accent-deep)' }}>{newLabel}</span>
                      </div>
                    )
                  })}
                </div>
                {suggestionWhyLine && (
                  <p className="h-quote-sm" style={{ marginTop: 9, color: 'var(--text-secondary)' }}>
                    {suggestionWhyLine}
                  </p>
                )}
                <button onClick={applyRecommendations} className="btn btn-cta btn-primary" style={{ width: '100%', marginTop: 11 }}>
                  Följ rådet
                </button>
              </div>
            )}

            {/* Spelplan — den öppna gruppen i standardläget (bär förslagen) */}
            <p className="h-label" style={{ marginBottom: 5 }}>{previewGroup.label}</p>
            {tacticRows.filter(r => (previewGroup.keys as readonly string[]).includes(r.key)).map(renderRow)}

            {/* Väg in till avancerat — de två dolda grupperna namngivna, inte gömda tyst */}
            <button
              onClick={() => onToggleAdvancedMode(true)}
              style={{
                width: '100%', padding: '11px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8,
                cursor: 'pointer', marginTop: 2,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                🏒 {hiddenGroups.map(g => g.label).join(' · ')}
              </span>
              <span style={{ fontSize: 10, color: 'var(--accent-deep)', fontWeight: 700, letterSpacing: '0.5px' }}>
                VISA ALLA ÅTTA ›
              </span>
            </button>
          </>
        )}

        {advancedMode && (
          <>
            {/* Ändringshistorik — "Vad du ändrat i år" (LÅST format, Design) */}
            <div style={{ padding: '9px 11px', background: 'var(--bg-leather)', borderRadius: 8, marginBottom: 10 }}>
              <p className="h-label" style={{ color: 'var(--warm-light)', marginBottom: 5 }}>Vad du ändrat i år</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {historyLines.map((line, i) => (
                  <div key={i} style={{ fontSize: 10.5, color: 'var(--text-light-secondary)' }}>{line}</div>
                ))}
              </div>
            </div>

            {TACTIC_GROUPS.map((group, gi) => {
              const rows = tacticRows.filter(r => (group.keys as readonly string[]).includes(r.key))
              if (!rows.length) return null
              return (
                <div key={group.label} style={{ marginBottom: gi < TACTIC_GROUPS.length - 1 ? 10 : 0 }}>
                  <p className="h-label" style={{ marginBottom: 5 }}>{group.label}</p>
                  {rows.map(renderRow)}
                </div>
              )
            })}

            {/* Yta 3: varför-raden, kvar i avancerat (i standardläget lever den nu inuti
                förslagskortet ovan i stället, se hasAnySuggestion-blocket). */}
            {hasAnySuggestion && suggestionWhyLine && (
              <p className="h-quote-sm" style={{ marginTop: 6, color: 'var(--text-muted)' }}>
                {suggestionWhyLine}
              </p>
            )}
          </>
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
          lineupConfirmedThisRound={lineupConfirmedThisRound}
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
