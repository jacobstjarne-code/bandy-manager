import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { CooldownRow } from '../CooldownRow'

type SourceKey = 'kommunen' | 'mecenat' | 'lokaltidningen'

interface SourceConfig {
  label: string
  icon: string
  dormantBody: string
}

const SOURCE_CONFIG: Record<SourceKey, SourceConfig> = {
  kommunen: {
    label: 'Kommunen',
    icon: '🏛️',
    dormantBody: 'Hallendebatten är avgjord. Inget nytt från kommunen ett tag.',
  },
  mecenat: {
    label: 'Mecenaten',
    icon: '💼',
    dormantBody: 'Eklund hörde av sig förra veckan. Det dröjer innan nästa.',
  },
  lokaltidningen: {
    label: 'Lokaltidningen',
    icon: '📰',
    dormantBody: 'Tidningen skriver om andra saker just nu.',
  },
}

interface Props {
  source: SourceKey
  game: SaveGame
}

export function SourceSecondaryCard({ source, game }: Props) {
  const config = SOURCE_CONFIG[source]
  const cooldown = game.sourceCooldowns?.[source]

  if (!cooldown || cooldown.roundsLeft <= 0) return null

  return (
    <div className="portal-secondary-card">
      <div className="portal-card-stripe portal-card-stripe-copper-dim" />
      <div className="portal-card-eyebrow">
        {config.icon} {config.label.toUpperCase()}
      </div>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--text-light-secondary)',
        lineHeight: 1.5,
        margin: '0 0 10px',
      }}>
        {config.dormantBody}
      </p>
      <CooldownRow
        roundsLeft={cooldown.roundsLeft}
        totalRounds={cooldown.totalRounds}
      />
    </div>
  )
}
