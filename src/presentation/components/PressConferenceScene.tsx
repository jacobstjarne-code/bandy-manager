import type { GameEvent } from '../../domain/entities/GameEvent'
import type { Journalist } from '../../domain/entities/SaveGame'
import { DecisionChoices } from './DecisionChoices'

/**
 * GEMENSAM BESLUTSMODELL (2026-08-12): INTE migrerad till DecisionCard.
 * Chrome:et (tvådelad header, journalist-kortet med citerad fråga) är en
 * bespok scen, inte en "situation → val"-kortform — DecisionCard hade tvingat
 * in en avsändare/etikett-rad och en title/body-uppdelning som inte matchar
 * hur en presskonferens faktiskt är byggd (fråga, inte påstående). Knapp-
 * lagret delar däremot DecisionChoices (se render nedan) — det var den enda
 * delen som faktiskt var en dubblett av de andra åtta ställningarna.
 */
interface Props {
  event: GameEvent
  journalist: Journalist | undefined
  onChoice: (choiceId: string) => void
}

export function PressConferenceScene({ event, journalist, onChoice }: Props) {
  const style = journalist?.style ?? 'neutral'

  const styleLabel =
    style === 'provocative' ? 'Provokativ' :
    style === 'supportive'  ? 'Stödjande' :
    'Neutral'

  // Extract question text from body (format: "frågan")
  const question = event.body.replace(/^"|"$/g, '')

  // AUDIT DEL 3 (2026-08-11): strukturerat fält istf title-prefix-parse.
  // event.title.replace('🎤 Presskonferens — ', '') var en no-op —
  // pressConferenceService.ts sätter bara 'Presskonferens — ' (ingen emoji)
  // — en tidsinställd bugg, samma mönster som gameFlowActions.ts:s youth-
  // resultat hade. journalist-propen bär redan samma data strukturerat.
  const titleParts = journalist ? `${journalist.name}, ${journalist.outlet}` : styleLabel

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      paddingTop: '48px', zIndex: 300, overflowY: 'auto',
    }}>
      <div className="card-sharp" style={{
        minWidth: 280, maxWidth: 360, width: '90%',
        marginBottom: 20,
        background: 'var(--bg)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        padding: 0,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {/* TODO(FAS 1): byt mot piktogram · press · se ICON-BRIEF.md */}
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            🎤 PRESSKONFERENS
          </p>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
            {journalist ? `${journalist.name} · ${journalist.outlet}` : styleLabel}
          </span>
        </div>

        {/* Journalist card */}
        <div style={{
          margin: '14px 16px 0',
          padding: '10px 14px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8,
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
            {titleParts}
          </p>
          <p style={{
            fontSize: 14,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            margin: 0,
          }}>
            "{question}"
          </p>
        </div>

        {/* Choices — GEMENSAM BESLUTSMODELL (2026-08-12): handrullade knappar
            → delad DecisionChoices. Scenen (header/journalist-kort/citat)
            förblir bespok, se DecisionCard.tsx:s doc-kommentar. */}
        <div style={{ padding: '12px 16px 16px' }}>
          <DecisionChoices
            choices={event.choices}
            onChoose={(choiceId) => onChoice(choiceId)}
          />
        </div>
      </div>
    </div>
  )
}
