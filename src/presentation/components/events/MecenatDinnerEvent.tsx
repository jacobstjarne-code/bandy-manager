import { useState } from 'react'
import type { GameEvent } from '../../../domain/entities/GameEvent'
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

  function sumEffects(ids: string[]) {
    let happiness = 0, cs = 0, financial = 0
    for (const qid of ['q0', 'q1', 'q2']) {
      const chosen = ids.find(id => id.startsWith(qid + '_'))
      if (!chosen) continue
      const q = scene.questions.find(q => q.id === qid)
      const opt = q?.options.find(o => o.id === chosen)
      if (!opt) continue
      happiness += opt.effect.happiness
      cs += opt.effect.communityStanding
      financial += opt.effect.financial ?? 0
    }
    return { happiness, cs, financial }
  }

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
      const { happiness, cs } = sumEffects(chosenIds)
      setStep({ kind: 'outro', totalHappiness: happiness, totalCS: cs })
    }
  }

  function handleOutroFinish() {
    // Encode all chosen option IDs for the resolver
    const key = `final|${chosenIds.join('|')}`
    onFinish(key)
  }

  const settingEmoji = scene.setting === 'jakt' ? '🦌' : scene.setting === 'whisky' ? '🥃' : '🧖'

  const cardStyle: React.CSSProperties = {
    padding: '24px 20px',
    minWidth: 280,
    maxWidth: 360,
    width: '90%',
    background: 'var(--bg)',
    borderRadius: 16,
    boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
    marginBottom: 20,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 6,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: 10,
    lineHeight: 1.3,
  }

  const bodyStyle: React.CSSProperties = {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: 20,
    whiteSpace: 'pre-line',
  }

  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 10,
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1.4,
    marginBottom: 8,
  }

  const wrapStyle: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: '60px', zIndex: 'var(--z-modal)' as unknown as number, overflowY: 'auto',
  }

  if (step.kind === 'intro') {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <p style={labelStyle}>{settingEmoji} Mecenatens middag</p>
          <h2 style={titleStyle}>{event.title}</h2>
          <p style={bodyStyle}>{scene.settingDescription}</p>
          <button style={btnStyle} onClick={() => setStep({ kind: 'question', qIndex: 0 })}>
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
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <p style={labelStyle}>{settingEmoji} Fråga {progress}</p>
          <h2 style={titleStyle}>{event.title}</h2>
          <p style={bodyStyle}>{q.text}</p>
          {q.options.map(opt => (
            <button
              key={opt.id}
              style={btnStyle}
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
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <p style={labelStyle}>{settingEmoji} Mecenatens svar</p>
          <h2 style={titleStyle}>{event.title}</h2>
          <p style={bodyStyle}>{step.option.followUp}</p>
          <button style={btnStyle} onClick={() => handleReactionContinue(step.qIndex)}>
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
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <p style={labelStyle}>{settingEmoji} Middagen är slut</p>
        <h2 style={titleStyle}>{event.title}</h2>
        <p style={bodyStyle}>
          {`${scene.mecenatName} verkar ${mood}. ${moodEmoji}\n\n${csText}`}
        </p>
        <button
          style={{ ...btnStyle, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700 }}
          onClick={handleOutroFinish}
        >
          Avsluta kvällen
        </button>
      </div>
    </div>
  )
}
