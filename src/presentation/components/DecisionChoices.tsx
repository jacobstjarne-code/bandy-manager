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
  /** GEMENSAM BESLUTSMODELL (2026-08-12): 'lg' bär EventOverlay-modalens
   *  tidigare handrullade knappmått (14px text, 14×16 padding, radius 10)
   *  in i den delade komponenten — annars hade migreringen krympt en
   *  fullskärms-modals knappar till inline-kortskala (12px/7×14). Standard
   *  'sm' är oförändrad för alla ~30 befintliga anropsställen. */
  size?: 'sm' | 'lg'
}

export function DecisionChoices({ choices, onChoose, layout = 'stack', primaryChoiceId, size = 'sm' }: Props) {
  const containerStyle: React.CSSProperties = layout === 'inline'
    ? { display: 'flex', gap: 8, flexWrap: 'wrap' }
    : { display: 'flex', flexDirection: 'column', gap: 5 }

  const lgStyle: React.CSSProperties = size === 'lg'
    ? { padding: '14px 16px', fontSize: 14, borderRadius: 10 }
    : {}

  return (
    <div style={containerStyle}>
      {choices.map(choice => {
        const isPrimary = primaryChoiceId !== undefined && choice.id === primaryChoiceId
        return (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id, choice.label)}
            className={isPrimary ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ ...(layout === 'stack' ? { width: '100%', textAlign: 'left' } : undefined), ...lgStyle }}
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
