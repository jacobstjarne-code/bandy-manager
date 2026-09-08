import type { SaveGame } from '../entities/SaveGame'
import { buildMentorshipEndedLedgerEntry } from './clubHistoryLedgerService'
import { logEvent } from './eventLedgerService'

export type MentorshipEndReason = 'graduated' | 'promoted' | 'aged_out' | 'cancelled'

/**
 * Stänger ett aktivt mentorband i både det kortlivade arbetsläget och den
 * kanoniska liggaren. Samma övergång används av uppflyttning, avbrytning,
 * tjugoårskort och rollover — inga parallella specialmekanismer.
 */
export function closeActiveMentorshipForYouth(
  game: SaveGame,
  youthPlayerId: string,
  reason: MentorshipEndReason,
  matchday = game.currentMatchday,
): Pick<SaveGame, 'mentorships' | 'mentorshipHistory' | 'eventLedger'> {
  const active = (game.mentorships ?? []).find(item => item.isActive && item.youthPlayerId === youthPlayerId)
  if (!active) {
    return {
      mentorships: game.mentorships ?? [],
      mentorshipHistory: game.mentorshipHistory ?? [],
      eventLedger: game.eventLedger,
    }
  }

  const junior = game.youthTeam?.players.find(player => player.id === youthPlayerId)
    ?? game.players.find(player => player.id === youthPlayerId)
  if (!junior) {
    return {
      mentorships: game.mentorships ?? [],
      mentorshipHistory: game.mentorshipHistory ?? [],
      eventLedger: game.eventLedger,
    }
  }

  const startEntry = [...(game.eventLedger ?? [])].reverse().find(entry =>
    entry.type === 'mentorship_started'
    && entry.subject?.kind === 'player'
    && entry.subject.id === youthPlayerId
    && entry.subject2?.kind === 'player'
    && entry.subject2.id === active.seniorPlayerId,
  )
  const seasons = Math.max(1, game.currentSeason - (startEntry?.season ?? game.currentSeason) + 1)
  const entry = buildMentorshipEndedLedgerEntry({
    clubId: game.managedClubId,
    season: game.currentSeason,
    matchday,
    juniorId: youthPlayerId,
    mentorId: active.seniorPlayerId,
    reason,
    juniorCaAtEnd: junior.currentAbility,
    seasons,
  })

  return {
    mentorships: (game.mentorships ?? []).map(item =>
      item === active ? { ...item, isActive: false } : item,
    ),
    mentorshipHistory: (game.mentorshipHistory ?? []).map(record =>
      record.youthPlayerId === youthPlayerId && !record.endSeason
        ? {
            ...record,
            endSeason: game.currentSeason,
            outcome: reason === 'graduated' || reason === 'promoted' ? 'graduated' : 'ended',
          }
        : record,
    ),
    eventLedger: logEvent(game, entry),
  }
}
