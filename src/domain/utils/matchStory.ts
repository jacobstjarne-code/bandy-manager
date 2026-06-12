import type { Fixture } from '../entities/Fixture'
import type { SaveGame } from '../entities/SaveGame'
import { MatchEventType } from '../enums'
import { formatArenaName } from './arenaName'

export function generateMatchStory(fixture: Fixture, game: SaveGame): string {
  const managedIsHome = fixture.homeClubId === game.managedClubId
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const oppClub = game.clubs.find(c => c.id !== game.managedClubId && (c.id === fixture.homeClubId || c.id === fixture.awayClubId))
  const myScore = managedIsHome ? fixture.homeScore : fixture.awayScore
  const theirScore = managedIsHome ? fixture.awayScore : fixture.homeScore

  function getPlayerName(playerId?: string): string {
    if (!playerId) return ''
    const p = game.players.find(pl => pl.id === playerId)
    return p ? `${p.firstName} ${p.lastName}` : ''
  }

  const myGoalEvents = fixture.events.filter(e => e.type === MatchEventType.Goal && e.clubId === game.managedClubId)
  const cornerGoals = myGoalEvents.filter(e => e.isCornerGoal).length

  const scorerCounts: Record<string, number> = {}
  for (const e of myGoalEvents) {
    if (e.playerId) scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1
  }
  const topScorerId = Object.entries(scorerCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topScorerGoals = topScorerId ? scorerCounts[topScorerId] : 0
  const topScorerName = topScorerId ? getPlayerName(topScorerId).split(' ').pop() : ''

  let myRunning = 0, theirRunning = 0, wasTrailing = false
  for (const e of fixture.events.filter(ev => ev.type === MatchEventType.Goal).sort((a, b) => a.minute - b.minute)) {
    if (e.clubId === game.managedClubId) myRunning++
    else theirRunning++
    if (myRunning < theirRunning) wasTrailing = true
  }

  const sentences: string[] = []

  if (myScore > theirScore) {
    if (wasTrailing) {
      sentences.push(`Seger efter vändning — ni låg under men tog två poäng till slut.`)
    } else if (myScore - theirScore >= 4) {
      sentences.push(`Övertygande seger mot ${oppClub?.shortName ?? 'motståndet'}.`)
    } else {
      sentences.push(`${myScore}–${theirScore} till slut mot ${oppClub?.shortName ?? 'motståndet'}.`)
    }
  } else if (myScore === theirScore) {
    sentences.push(`Oavgjort — ni delade poängen med ${oppClub?.shortName ?? 'motståndet'}.`)
  } else {
    sentences.push(`Förlust mot ${oppClub?.shortName ?? 'motståndet'} — ${myScore}–${theirScore}.`)
  }

  if (topScorerName && topScorerGoals >= 2) {
    sentences.push(`${topScorerName} stod för ${topScorerGoals} mål.`)
  } else if (topScorerName && topScorerGoals === 1 && myGoalEvents.length >= 1) {
    sentences.push(`Bland annat ${topScorerName} på skytteligget.`)
  }

  if (cornerGoals >= 2) {
    sentences.push(`${cornerGoals} av målen kom från hörnor — fasta situationer avgjorde.`)
  } else if (cornerGoals === 1) {
    sentences.push(`Ett hörnmål bidrog till resultatet.`)
  }

  if (fixture.attendance && managedIsHome && managedClub) {
    sentences.push(`${fixture.attendance} på ${formatArenaName(managedClub.arenaName ?? managedClub.name + 's IP')}.`)
  }

  return sentences.join(' ')
}
