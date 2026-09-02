import { useState } from 'react'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import { getDinnerResolution } from '../../../domain/services/mecenatDinnerService'
import type { DinnerScene, DinnerOption } from '../../../domain/services/mecenatDinnerService'

interface Props {
  event: GameEvent
  onFinish: (choiceKey: string) => void
}

type Step =
  | { kind: 'intro' }
  | { kind: 'question'; qIndex: number }
  | { kind: 'reaction'; qIndex: number; option: DinnerOption }
  | { kind: 'outro'; totalHappiness: number; totalCS: number }

export function MecenatDinnerEvent({ event, onFinish }: Props) {
  const scene: DinnerScene = JSON.parse(event.sponsorData ?? '{}')
  const [step, setStep] = useState<Step>({ kind: 'intro' })
  const [chosenIds, setChosenIds] = useState<string[]>([])

  function handleOptionPick(qIndex: number, option: DinnerOption) {
    const updated = [...chosenIds, option.id]
    setChosenIds(updated)
    setStep({ kind: 'reaction', qIndex, option })
  }

  function handleReactionContinue(qIndex: number) {
    const nextQ = qIndex + 1
    if (nextQ < scene.questions.length) {
      setStep({ kind: 'question', qIndex: nextQ })
    } else {
      const resolution = getDinnerResolution(scene, `final|${chosenIds.join('|')}`)
      if (resolution) {
        setStep({
          kind: 'outro',
          totalHappiness: resolution.totalHappiness,
          totalCS: resolution.totalCommunityStanding,
        })
      }
    }
  }

  function handleOutroFinish() {
    // Encode all chosen option IDs for the resolver
    const key = `final|${chosenIds.join('|')}`
    onFinish(key)
  }

  const settingEmoji = scene.setting === 'jakt' ? '🦌' : scene.setting === 'whisky' ? '🥃' : '🧖'

  if (step.kind === 'intro') {
    return (
      <div className="mecenat-overlay">
        <div className="mecenat-card">
          <p className="mecenat-label">{settingEmoji} Mecenatens middag</p>
          <h2 className="mecenat-title">{event.title}</h2>
          <p className="mecenat-body">{scene.settingDescription}</p>
          <button className="btn btn-primary mecenat-primary-btn" onClick={() => setStep({ kind: 'question', qIndex: 0 })}>
            Sätt dig ner
          </button>
        </div>
      </div>
    )
  }

  if (step.kind === 'question') {
    const q = scene.questions[step.qIndex]
    const progress = `${step.qIndex + 1} / ${scene.questions.length}`
    return (
      <div className="mecenat-overlay">
        <div className="mecenat-card">
          <p className="mecenat-label">{settingEmoji} Fråga {progress}</p>
          <h2 className="mecenat-title">{event.title}</h2>
          <p className="mecenat-body">{q.text}</p>
          {q.options.map(opt => (
            <button
              key={opt.id}
              className="btn btn-outline mecenat-option-btn"
              onClick={() => handleOptionPick(step.qIndex, opt)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step.kind === 'reaction') {
    return (
      <div className="mecenat-overlay">
        <div className="mecenat-card">
          <p className="mecenat-label">{settingEmoji} Mecenatens svar</p>
          <h2 className="mecenat-title">{event.title}</h2>
          <p className="mecenat-body">{step.option.followUp}</p>
          <button className="btn btn-primary mecenat-primary-btn" onClick={() => handleReactionContinue(step.qIndex)}>
            Fortsätt
          </button>
        </div>
      </div>
    )
  }

  // outro
  const mood = step.totalHappiness >= 12 ? 'nöjd' : step.totalHappiness >= 5 ? 'fundersam' : 'besviken'
  const moodEmoji = step.totalHappiness >= 12 ? '😊' : step.totalHappiness >= 5 ? '🤔' : '😕'
  const csText = step.totalCS > 0
    ? `Samhällsanseendet stärks något.`
    : step.totalCS < 0
      ? `Kvällen lämnar ett lite blandat intryck utåt.`
      : ''

  return (
    <div className="mecenat-overlay">
      <div className="mecenat-card">
        <p className="mecenat-label">{settingEmoji} Middagen är slut</p>
        <h2 className="mecenat-title">{event.title}</h2>
        <p className="mecenat-body">
          {`${scene.mecenatName} verkar ${mood}. ${moodEmoji}\n\n${csText}`}
        </p>
        <button className="btn btn-primary mecenat-primary-btn" onClick={handleOutroFinish}>
          Avsluta kvällen
        </button>
      </div>
    </div>
  )
}
