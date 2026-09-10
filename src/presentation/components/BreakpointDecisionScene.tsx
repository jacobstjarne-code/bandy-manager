import type { EventChoice } from '../../domain/entities/GameEvent'
import { getConsequenceLines } from '../../domain/entities/GameEvent'
import type { DecisionCardTag } from './DecisionCard'

interface BreakpointDecisionSceneProps {
  label: string
  title: string
  body: string
  whyNowLine?: string
  choices: EventChoice[]
  primaryChoiceId?: string
  tags?: DecisionCardTag[]
  entityId?: string
  entitySource?: string
  onChoose: (choiceId: string, choiceLabel: string) => void
}

/**
 * Brytpunkten är ett avgränsat ceremoni-register, inte ännu en variant av
 * vardagskortets `.btn-primary`. `primaryChoiceId` ger bara den tyngre vägen
 * en lågmäld tint; utan uttrycklig dom förblir båda valen jämlika.
 */
export function BreakpointDecisionScene({
  label,
  title,
  body,
  whyNowLine,
  choices,
  primaryChoiceId,
  tags,
  entityId,
  entitySource,
  onChoose,
}: BreakpointDecisionSceneProps) {
  return (
    <section
      className="breakpoint-scene"
      data-decision-card="true"
      data-decision-mode="brytpunkt"
      {...(entityId ? { 'data-entity-id': entityId } : {})}
      {...(entitySource ? { 'data-entity-source': entitySource } : {})}
    >
      <p className="breakpoint-scene__genre">⬩ Brytpunkt ⬩</p>
      <p className="breakpoint-scene__setting">{whyNowLine ?? body}</p>
      <h2 className="breakpoint-scene__question">{title}</h2>
      {whyNowLine && <p className="breakpoint-scene__body">{body}</p>}
      {(label || (tags && tags.length > 0)) && (
        <div className="breakpoint-scene__context">
          {label && <span>{label}</span>}
          {tags?.map((tag, index) => <span key={`${tag.label}-${index}`}>{tag.label}</span>)}
        </div>
      )}
      <div className="breakpoint-scene__choices">
        {choices.map(choice => {
          const isWeighted = primaryChoiceId !== undefined && choice.id === primaryChoiceId
          const consequenceLines = getConsequenceLines(choice)
          const supportingLines = [choice.subtitle, ...consequenceLines].filter((line): line is string => Boolean(line))
          return (
            <button
              key={choice.id}
              type="button"
              className={`scene-choice${isWeighted ? ' weight' : ''}`}
              onClick={() => onChoose(choice.id, choice.label)}
            >
              <span className="scene-choice__text">
                {choice.label}
                {supportingLines.map((line, index) => (
                  <span key={`${line}-${index}`} className="scene-choice__sub">{line}</span>
                ))}
              </span>
              <span className="scene-choice__arrow" aria-hidden="true">→</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
