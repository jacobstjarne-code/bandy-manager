import type { Player } from '../entities/Player'
import type { AssistantCoach } from '../entities/AssistantCoach'
import { generateCoachQuote } from './assistantCoachService'

export type NoteTag = 'trött' | 'glödande' | 'missnöjd' | 'skottform' | 'vill-mer' | 'sviktande'

export interface PlayerNote {
  playerId: string
  tag: NoteTag
  quote: string
  metadata: string
}

function determineTag(p: Player): NoteTag | null {
  if (p.fitness < 50) return 'trött'
  if (p.seasonStats.goals >= 3 && p.seasonStats.gamesPlayed <= 5) return 'skottform'
  const avgRating = p.seasonStats.averageRating
  if (avgRating >= 8.0 && p.seasonStats.gamesPlayed >= 2) return 'glödande'
  const loyalty = p.loyaltyScore ?? 5
  if (loyalty <= 3 && p.morale < 40) return 'missnöjd'
  if (p.age < 24 && p.seasonStats.gamesPlayed === 0) return 'vill-mer'
  if (p.form < 35) return 'sviktande'
  return null
}

function formatMetadata(p: Player, captainPlayerId: string | undefined): string {
  const parts: string[] = []
  if (p.id === captainPlayerId) parts.push('Kapten')
  parts.push(`${p.age} år`)
  if (p.dayJob?.title) parts.push(p.dayJob.title)
  const loyalty = p.loyaltyScore
  if (loyalty != null) parts.push(`Lojalitet ${loyalty}/10`)
  return parts.join(' · ')
}

export function generatePlayerNotes(
  players: Player[],
  coach: AssistantCoach,
  captainPlayerId: string | undefined,
): PlayerNote[] {
  const notes: PlayerNote[] = []

  for (const p of players) {
    const tag = determineTag(p)
    if (!tag) continue

    const quote = generateCoachQuote(coach, {
      type: 'player-note',
      tag,
      playerName: p.firstName,
    })

    notes.push({
      playerId: p.id,
      tag,
      quote,
      metadata: formatMetadata(p, captainPlayerId),
    })

    if (notes.length >= 7) break
  }

  return notes
}
