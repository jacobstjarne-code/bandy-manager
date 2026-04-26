import type { Player } from '../../../domain/entities/Player'

interface CareerJourneyProps {
  player: Player
  currentSeason?: number
}

type EntryType = 'milestone' | 'injury' | 'form' | 'storyline' | 'transfer' | 'other'

interface JourneyEntry {
  matchday: number
  text: string
  type: EntryType
}

function entryIcon(type: EntryType): string {
  if (type === 'milestone') return '⭐'
  if (type === 'injury') return '🩹'
  if (type === 'form') return '📈'
  if (type === 'storyline') return '📖'
  if (type === 'transfer') return '→'
  return '•'
}

export function CareerJourney({ player, currentSeason }: CareerJourneyProps) {
  const hasNarrative = (player.narrativeLog?.length ?? 0) > 0
  const hasSeasonsPlayed = (player.careerStats?.seasonsPlayed ?? 0) >= 2

  if (!hasNarrative && !hasSeasonsPlayed) return null

  const entriesBySeason = new Map<number, JourneyEntry[]>()

  for (const n of player.narrativeLog ?? []) {
    const existing = entriesBySeason.get(n.season) ?? []
    existing.push({ matchday: n.matchday, text: n.text, type: n.type as EntryType })
    entriesBySeason.set(n.season, existing)
  }

  for (const m of player.careerMilestones ?? []) {
    if (m.type === 'hatTrick') continue
    const text = m.type === 'debutGoal' ? 'Första A-lagsmålet'
      : m.type === 'games100' ? '100 A-lagsmatcher'
      : m.type === 'goals50' ? '50 karriärmål'
      : m.description
    const existing = entriesBySeason.get(m.season) ?? []
    existing.push({ matchday: m.round, text, type: 'milestone' })
    entriesBySeason.set(m.season, existing)
  }

  for (const [season, entries] of entriesBySeason) {
    entriesBySeason.set(season, entries.sort((a, b) => a.matchday - b.matchday))
  }

  const sortedSeasons = Array.from(entriesBySeason.keys()).sort((a, b) => b - a)

  if (sortedSeasons.length === 0) return null

  return (
    <div style={{ marginTop: 12, marginBottom: 4 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        🏒 KARRIÄRRESA
      </p>
      {sortedSeasons.map(season => {
        const entries = entriesBySeason.get(season) ?? []
        const visible = entries.slice(0, 4)
        const overflow = entries.length - 4
        const isCurrent = currentSeason !== undefined && season === currentSeason
        return (
          <div key={season} style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: isCurrent ? 700 : 400 }}>
              Säsong {season}
            </p>
            {visible.map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, paddingBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--accent)', flexShrink: 0, minWidth: 14 }}>
                  {entryIcon(entry.type)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {entry.text}
                </span>
              </div>
            ))}
            {overflow > 0 && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 20 }}>
                + {overflow} till
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
