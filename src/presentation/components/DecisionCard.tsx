import type { CSSProperties } from 'react'
import type { EventChoice, DecisionMode } from '../../domain/entities/GameEvent'
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
  /** HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md) — den semantiska
   *  nivån: "Tre lägen i samma system, inte sex komponenter: lågmäld notis ·
   *  verkligt dilemma · dramatisk brytpunkt." Bara VISUELL VIKT inom det
   *  befintliga skalet, bara tokens. Default 'dilemma' = exakt dagens
   *  utseende (inga extra stilar appliceras alls), så de sju befintliga
   *  anropsställena är oförändrade tills de medvetet skickar ett läge. */
  mode?: DecisionMode
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
  /** D1 punkt 4 — "därför nu"-raden (getWhyNowLine). Samma dämpade register
   *  som subtitle, aldrig --danger/⚠. undefined = ingen rad, inte pivotal. */
  whyNowLine?: string

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

/**
 * HIGH 11 — lägenas visuella vikt. ENDAST tokens (design-system/
 * colors_and_type.css), inga råa hex/rgba (CLAUDE.md PORT 2). 'dilemma'
 * returnerar tomma objekt: default-läget ska vara bit-identiskt med hur
 * korten ser ut idag, annars är detta en omdesign av sju ytor i smyg.
 */
function modeWrapperStyle(mode: DecisionMode, isRound: boolean): CSSProperties {
  if (mode === 'notis') {
    // Lägst vikt: tunnare, dovare ram — kortet ska kunna passeras.
    return {
      border: '1px solid color-mix(in srgb, var(--border) 55%, transparent)',
      boxShadow: 'none',
    }
  }
  if (mode === 'brytpunkt') {
    // Högst vikt: accentkant (samma grepp som `accent`-flaggan redan
    // etablerat) + upplyft skugga. Radien följer formen — en round-modal
    // ska inte plötsligt bli asymmetrisk.
    return {
      borderLeft: '3px solid var(--accent)',
      ...(isRound ? {} : { borderRadius: '0 8px 8px 0' }),
      boxShadow: 'var(--shadow-raised)',
    }
  }
  return {}
}

function DecisionCardContent({
  size = 'sm', theme = 'light', mode = 'dilemma', label, title, subtitle, body, bodyAsQuote, tags, whyNowLine,
  resolved, chosenLabel, choices, onChoose, choicesLayout = 'stack', primaryChoiceId,
}: Omit<DecisionCardProps, 'shape' | 'accent' | 'entityId' | 'entitySource' | 'style'>) {
  const isNotis = mode === 'notis'
  const bodyColor = theme === 'dark' ? 'var(--text-light)' : 'var(--text-primary)'
  const secondaryColor = isNotis
    ? 'var(--text-muted)'
    : (theme === 'dark' ? 'var(--text-light-secondary)' : 'var(--text-secondary)')
  const titleWeight = isNotis ? 600 : 700
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
              : <p style={{ fontSize: 13, fontWeight: titleWeight, color: bodyColor, marginBottom: 5, lineHeight: 1.3 }}>{title}</p>
          )}
          {subtitle && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{subtitle}</p>
          )}
          {whyNowLine && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: isLg ? 12 : 6 }}>{whyNowLine}</p>
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
  const mode = content.mode ?? 'dilemma'
  return (
    <div
      className={isRound ? 'card-round' : 'card-sharp'}
      data-decision-card="true"
      data-decision-mode={mode}
      style={{
        margin: isRound ? '0 0 20px' : '0 0 3px',
        padding: isRound ? '24px 20px' : '10px 12px',
        // Ordningen är avsiktlig och OFÖRÄNDRAD från före HIGH 11 vad gäller
        // accent↔isRound (isRound:s `border: none` nollar en accent-kant på
        // en round-modal — så har det alltid fungerat). Läget läggs FÖRST,
        // alltså underst: en explicit `accent` (presskonferens/CS-pressfråga)
        // och round-modalens egen chrome vinner över lägets vikt.
        ...modeWrapperStyle(mode, isRound),
        ...(accent ? { borderLeft: '3px solid var(--warm)', borderRadius: '0 8px 8px 0' } : {}),
        ...(isRound ? { minWidth: 280, maxWidth: 360, width: '90%', background: 'var(--bg)', border: 'none', boxShadow: 'var(--shadow-modal)' } : {}),
        ...style,
      }}
      {...(entityId ? { 'data-entity-id': entityId } : {})}
      {...(entitySource ? { 'data-entity-source': entitySource } : {})}
    >
      <DecisionCardContent {...content} />
    </div>
  )
}
