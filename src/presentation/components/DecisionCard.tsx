import type { CSSProperties } from 'react'
import type { EventChoice } from '../../domain/entities/GameEvent'
import { DecisionChoices } from './DecisionChoices'
import { SectionLabel } from './SectionLabel'

/**
 * GEMENSAM BESLUTSMODELL (2026-08-12) — den delade "situation → val → resolve"-
 * ställningen, inte bara knapparna (DecisionChoices bar redan bara de). Bär
 * wrapper, avsändare/etikett, brödtext, tagg-rad, och resolved-vs-unresolved-
 * grenen — sju stycken oberoende återimplementerade ställningar (fyra i
 * GranskaOversikt, en i GranskaSpelare, EventOverlay, EventCardInline).
 *
 * Props formade efter de FAKTISKA skillnaderna mellan de sju (inte gissade
 * i förväg — samtliga sju lästes rad för rad innan denna fil skrevs):
 *
 * - size: EventOverlay är en fullskärms-modal med större typsnitt (title
 *   16/h-display-sm, body 14, tag-piller 12/radius 20) eftersom den ÄR
 *   skärmens enda fokus. Granska/EventCardInline lever inline bredvid annat
 *   innehåll och håller den mindre skalan (title 13, body 12, tag-piller
 *   11/radius 99). Att tvinga EventOverlay till inline-skalan hade krympt
 *   en modal — en visuell regression, inte en refaktor.
 * - shape: 'sharp' (8px, Granska/Portal) vs 'round' (14px + skugga,
 *   EventOverlay — redan DS-kanon för "narrativ/interaktion") vs 'none'
 *   (GranskaSpelares "KRING SPELARNA"-kort grupperar flera events INUTI en
 *   delad card-sharp, hairline-separerade — DecisionCard renderar då bara
 *   innehållet, anropssidan äger ytterramen).
 * - theme: ljus (Granska/EventOverlay, text-primary) vs mörk (EventCardInline,
 *   portal-tokens, text-light).
 * - accent: vänster border-accent + asymmetrisk radie (presskonferens/
 *   CS-pressfråga) vs platt (kritiska events/domarmöte/spelarhändelser).
 * - bodyAsQuote: .h-quote-citat (presskonferens/CS-pressfråga/domarmöte) vs
 *   vanligt stycke (kritiska events/spelarhändelser).
 * - entityId/entitySource: EventOverlay/EventCardInline bär entitets-dedup-
 *   grindens taggning (AUDIT DEL 2, 2026-08-12) — måste passera oförändrat.
 *
 * Två platser (PressConferenceScene, CeremonyRetirement) migrerades INTE hit
 * — bespoka helskärms-scener (egen header/journalist-kort respektive namn/
 * stats/ceremoni-layout), inte en "situation + val"-kortform. Se
 * commit-meddelandet för den fulla avvikelserapporten.
 */

export interface DecisionCardTag {
  label: string
  tone: 'accent' | 'ice'
}

interface DecisionCardProps {
  size?: 'sm' | 'lg'
  shape?: 'sharp' | 'round' | 'none'
  theme?: 'light' | 'dark'
  accent?: boolean
  entityId?: string
  entitySource?: string
  style?: CSSProperties

  label: string
  /** Bold 13px headline (kritiska events, spelarhändelser). */
  title?: string
  /** Muted 10-12px sub-rad — avsändarinfo ovanför ett citat-body (presskonferens/
   *  CS-pressfråga/domarmöte). Ömsesidigt uteslutande med title i praktiken. */
  subtitle?: string
  body: string
  bodyAsQuote?: boolean
  tags?: DecisionCardTag[]

  resolved: boolean
  chosenLabel?: string
  choices: EventChoice[]
  onChoose: (choiceId: string, choiceLabel: string) => void
  choicesLayout?: 'stack' | 'inline'
  primaryChoiceId?: string
}

const TAG_TONE_STYLE: Record<DecisionCardTag['tone'], CSSProperties> = {
  accent: {
    background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
    border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
    color: 'var(--accent)',
  },
  ice: {
    background: 'color-mix(in srgb, var(--ice) 10%, transparent)',
    border: '1px solid color-mix(in srgb, var(--ice) 25%, transparent)',
    color: 'var(--ice)',
  },
}

function DecisionCardContent({
  size = 'sm', theme = 'light', label, title, subtitle, body, bodyAsQuote, tags,
  resolved, chosenLabel, choices, onChoose, choicesLayout = 'stack', primaryChoiceId,
}: Omit<DecisionCardProps, 'shape' | 'accent' | 'entityId' | 'entitySource' | 'style'>) {
  const bodyColor = theme === 'dark' ? 'var(--text-light)' : 'var(--text-primary)'
  const secondaryColor = theme === 'dark' ? 'var(--text-light-secondary)' : 'var(--text-secondary)'
  const isLg = size === 'lg'
  return (
    <>
      <SectionLabel style={{ marginBottom: resolved ? 4 : 6 }}>{label}</SectionLabel>
      {resolved ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--success)' }}>✓</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{chosenLabel}</span>
        </div>
      ) : (
        <>
          {title && (
            isLg
              ? <h2 className="h-display-sm" style={{ marginBottom: 14 }}>{title}</h2>
              : <p style={{ fontSize: 13, fontWeight: 700, color: bodyColor, marginBottom: 5, lineHeight: 1.3 }}>{title}</p>
          )}
          {subtitle && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{subtitle}</p>
          )}
          {(() => {
            // Rena informationskort utan val (GranskaSpelares "KRING SPELARNA"
            // kan ha events utan choices — ren info, inget att besluta) ska
            // inte lämna en tom marginal där knapparna annars hade suttit.
            const hasChoices = choices.length > 0
            const bodyMargin = hasChoices ? 8 : 0
            return bodyAsQuote ? (
              <p className="h-quote" style={{ color: bodyColor, marginBottom: bodyMargin }}>{body}</p>
            ) : (
              <p style={{ fontSize: isLg ? 14 : 12, color: secondaryColor, lineHeight: isLg ? 1.6 : 1.45, marginBottom: hasChoices ? (isLg ? (tags?.length ? 12 : 24) : 8) : 0, whiteSpace: 'pre-line' }}>{body}</p>
            )
          })()}
          {tags && tags.length > 0 && (
            <div style={{ display: 'flex', gap: isLg ? 8 : 6, flexWrap: 'wrap', marginBottom: isLg ? 24 : 8 }}>
              {tags.map((tag, i) => (
                <span key={i} style={{ fontSize: isLg ? 12 : 11, borderRadius: isLg ? 20 : 99, padding: isLg ? '4px 10px' : '3px 8px', fontWeight: 600, ...TAG_TONE_STYLE[tag.tone] }}>{tag.label}</span>
              ))}
            </div>
          )}
          {choices.length > 0 && (
            <DecisionChoices choices={choices} onChoose={onChoose} layout={choicesLayout} primaryChoiceId={primaryChoiceId} size={size} />
          )}
        </>
      )}
    </>
  )
}

export function DecisionCard({ shape = 'sharp', accent, entityId, entitySource, style, ...content }: DecisionCardProps) {
  if (shape === 'none') {
    return <DecisionCardContent {...content} />
  }
  const isRound = shape === 'round'
  return (
    <div
      className={isRound ? 'card-round' : 'card-sharp'}
      style={{
        margin: isRound ? '0 0 20px' : '0 0 3px',
        padding: isRound ? '24px 20px' : '10px 12px',
        ...(accent ? { borderLeft: '3px solid var(--warm)', borderRadius: '0 8px 8px 0' } : {}),
        ...(isRound ? { minWidth: 280, maxWidth: 360, width: '90%', background: 'var(--bg)', border: 'none', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' } : {}),
        ...style,
      }}
      {...(entityId ? { 'data-entity-id': entityId } : {})}
      {...(entitySource ? { 'data-entity-source': entitySource } : {})}
    >
      <DecisionCardContent {...content} />
    </div>
  )
}
