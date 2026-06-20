interface DecisionChoice {
  id: string
  label: string
  subtitle?: string
}

interface Props {
  choices: DecisionChoice[]
  onChoose: (choiceId: string, label: string) => void
  layout?: 'inline' | 'stack'
  primaryChoiceId?: string
}

export function DecisionChoices({ choices, onChoose, layout = 'stack', primaryChoiceId }: Props) {
  const containerStyle: React.CSSProperties = layout === 'inline'
    ? { display: 'flex', gap: 8, flexWrap: 'wrap' }
    : { display: 'flex', flexDirection: 'column', gap: 5 }

  return (
    <div style={containerStyle}>
      {choices.map(choice => {
        const isPrimary = primaryChoiceId !== undefined && choice.id === primaryChoiceId
        return (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id, choice.label)}
            className={isPrimary ? 'btn btn-primary' : 'btn btn-outline'}
            style={layout === 'stack' ? { width: '100%', textAlign: 'left' } : undefined}
          >
            {choice.label}
            {choice.subtitle && (
              <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>
                {choice.subtitle}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
