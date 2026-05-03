import { MatchEventType } from '../../../domain/enums'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'

export function choiceStyle(_choiceId: string): React.CSSProperties {
  return { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
}

export function generateQuickSummary(fixture: Fixture, managedIsHome: boolean, players: Player[]): string {
  const homeScore = fixture.homeScore
  const awayScore = fixture.awayScore
  const myScore = managedIsHome ? homeScore : awayScore
  const theirScore = managedIsHome ? awayScore : homeScore
  const margin = myScore - theirScore
  const totalGoals = homeScore + awayScore

  const goals = fixture.events.filter(e => e.type === MatchEventType.Goal)
  const lateGoals = goals.filter(e => (e.minute ?? 0) >= 55)
  const lateDecider = lateGoals.length > 0 && Math.abs(margin) <= 1

  const scorerCounts: Record<string, number> = {}
  const scorerNames: Record<string, string> = {}
  goals.forEach(e => {
    if (e.playerId) {
      scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1
      const p = players.find(pl => pl.id === e.playerId)
      scorerNames[e.playerId] = p ? p.lastName : 'Okänd'
    }
  })
  const allScorers = Object.entries(scorerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([pid, n]) => ({ name: scorerNames[pid] ?? 'Okänd', n }))

  function scorerLine(): string | null {
    if (allScorers.length === 0) return null
    if (allScorers.length === 1 && allScorers[0].n === 1) return `${allScorers[0].name} satte det enda målet.`
    if (allScorers.length === 1) return `${allScorers[0].name} svarade för samtliga ${allScorers[0].n} mål.`
    const top = allScorers[0]
    if (top.n >= 3) return `${top.name} dominerade målprotokollen med ${top.n} mål.`
    if (top.n === 2) return `${top.name} sköt två. Övriga: ${allScorers.slice(1).map(s => s.name).join(', ')}.`
    return allScorers.slice(0, 4).map(s => `${s.name} (${s.n})`).join(', ') + '.'
  }

  const lines: string[] = []

  if (myScore > theirScore) {
    if (margin >= 4) lines.push('En övertygande seger.')
    else if (margin === 3) lines.push('En klar seger.')
    else if (margin === 2) lines.push('En välförtjänt seger.')
    else if (lateDecider) lines.push('En dramatisk seger i slutminuterna.')
    else lines.push('En knapp men viktig seger.')
  } else if (myScore < theirScore) {
    if (margin <= -4) lines.push('En tungt matchdag att glömma.')
    else if (margin === -3) lines.push('En klar förlust.')
    else if (lateDecider) lines.push('En bitter förlust i matchens slutskede.')
    else lines.push('En förlust att analysera.')
  } else {
    lines.push('En poäng som känns som en förlust — eller en vinst, beroende på perspektiv.')
  }

  const sl = scorerLine()
  if (sl) lines.push(sl)

  if (totalGoals >= 10) lines.push('Många mål i en öppen match.')
  else if (totalGoals <= 2) lines.push('En tät och defensiv drabbning.')

  return lines.join(' ')
}

// Seeded random for shot map positions
export function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function ratingColor(r: number): string {
  if (r >= 8) return 'var(--success)'
  if (r >= 6.5) return 'var(--text-primary)'
  if (r >= 5) return 'var(--text-secondary)'
  return 'var(--danger)'
}
