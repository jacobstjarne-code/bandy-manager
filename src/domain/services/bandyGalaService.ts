import type { SaveGame, StorylineEntry } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import { InboxItemType } from '../enums'
import type { InboxItem } from '../entities/SaveGame'

// ── Awards ──────────────────────────────────────────────────────────────────

export interface GalaNomination {
  award: GalaAward
  playerId: string
  playerName: string
  clubName: string
  stat: string        // "18 mål", "7.2 snittbetyg"
}

export type GalaAward =
  | 'arets_spelare'       // Årets spelare (bäst CA i ligan)
  | 'arets_forward'       // Årets forward (flest mål)
  | 'arets_malvakt'       // Årets målvakt (bäst betyg, GK)
  | 'arets_nykomling'     // Årets nykomling (störst CA-ökning, ålder ≤22)
  | 'arets_veteran'       // Årets veteran (bäst betyg, ålder ≥32)

const AWARD_LABELS: Record<GalaAward, string> = {
  arets_spelare: 'Årets spelare',
  arets_forward: 'Årets forward',
  arets_malvakt: 'Årets målvakt',
  arets_nykomling: 'Årets nykomling',
  arets_veteran: 'Årets veteran',
}

// ── Generate nominations from season stats ──────────────────────────────────

export function generateNominations(game: SaveGame): GalaNomination[] {
  const nominations: GalaNomination[] = []
  const allPlayers = game.players.filter(p => p.seasonStats.gamesPlayed >= 5)

  // Årets spelare — highest CA
  const bestPlayer = [...allPlayers].sort((a, b) => b.currentAbility - a.currentAbility)[0]
  if (bestPlayer) {
    const club = game.clubs.find(c => c.id === bestPlayer.clubId)
    nominations.push({
      award: 'arets_spelare',
      playerId: bestPlayer.id,
      playerName: `${bestPlayer.firstName} ${bestPlayer.lastName}`,
      clubName: club?.shortName ?? '?',
      stat: `Styrka ${Math.round(bestPlayer.currentAbility)}`,
    })
  }

  // Årets forward — most goals
  const forwards = allPlayers.filter(p => p.position === 'forward')
  const topScorer = [...forwards].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0]
  if (topScorer && topScorer.seasonStats.goals >= 3) {
    const club = game.clubs.find(c => c.id === topScorer.clubId)
    nominations.push({
      award: 'arets_forward',
      playerId: topScorer.id,
      playerName: `${topScorer.firstName} ${topScorer.lastName}`,
      clubName: club?.shortName ?? '?',
      stat: `${topScorer.seasonStats.goals} mål`,
    })
  }

  // Årets målvakt — best avg rating among GKs
  const gks = allPlayers.filter(p => p.position === 'goalkeeper' && p.seasonStats.averageRating > 0)
  const bestGK = [...gks].sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating)[0]
  if (bestGK) {
    const club = game.clubs.find(c => c.id === bestGK.clubId)
    nominations.push({
      award: 'arets_malvakt',
      playerId: bestGK.id,
      playerName: `${bestGK.firstName} ${bestGK.lastName}`,
      clubName: club?.shortName ?? '?',
      stat: `${bestGK.seasonStats.averageRating.toFixed(1)} betyg`,
    })
  }

  // Årets nykomling — biggest CA increase, age ≤22
  const youngPlayers = allPlayers.filter(p => p.age <= 22 && p.startSeasonCA != null)
  const bestYoung = [...youngPlayers].sort((a, b) =>
    (b.currentAbility - (b.startSeasonCA ?? b.currentAbility)) -
    (a.currentAbility - (a.startSeasonCA ?? a.currentAbility))
  )[0]
  if (bestYoung && (bestYoung.currentAbility - (bestYoung.startSeasonCA ?? bestYoung.currentAbility)) >= 3) {
    const club = game.clubs.find(c => c.id === bestYoung.clubId)
    const improvement = Math.round(bestYoung.currentAbility - (bestYoung.startSeasonCA ?? bestYoung.currentAbility))
    nominations.push({
      award: 'arets_nykomling',
      playerId: bestYoung.id,
      playerName: `${bestYoung.firstName} ${bestYoung.lastName}`,
      clubName: club?.shortName ?? '?',
      stat: `+${improvement} CA denna säsong`,
    })
  }

  // Årets veteran — best avg rating, age ≥32
  const veterans = allPlayers.filter(p => p.age >= 32 && p.seasonStats.averageRating > 0)
  const bestVet = [...veterans].sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating)[0]
  if (bestVet) {
    const club = game.clubs.find(c => c.id === bestVet.clubId)
    nominations.push({
      award: 'arets_veteran',
      playerId: bestVet.id,
      playerName: `${bestVet.firstName} ${bestVet.lastName}`,
      clubName: club?.shortName ?? '?',
      stat: `${bestVet.seasonStats.averageRating.toFixed(1)} betyg`,
    })
  }

  return nominations
}

// ── Generate gala event for season end ──────────────────────────────────────

export function generateGalaEvent(
  game: SaveGame,
  nominations: GalaNomination[],
): GameEvent {
  const managedWinners = nominations.filter(n => {
    const p = game.players.find(pl => pl.id === n.playerId)
    return p?.clubId === game.managedClubId
  })

  const nomineeList = nominations
    .map(n => `${AWARD_LABELS[n.award]}: ${n.playerName} (${n.clubName}) — ${n.stat}`)
    .join('\n')

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const hasWinner = managedWinners.length > 0

  return {
    id: `event_gala_${game.currentSeason}`,
    type: 'communityEvent',
    title: '🏆 Bandygalan',
    body: `Bandygalan ${game.currentSeason + 1} — årets prisutdelning!\n\n${nomineeList}${hasWinner ? `\n\n${managedClub?.name} har ${managedWinners.length} pristagare!` : ''}`,
    choices: [
      {
        id: 'attend',
        label: 'Gå på galan — visa upp klubben',
        subtitle: hasWinner ? '⭐ +3 reputation · 💛 +5 fanMood' : '⭐ +1 reputation',
        effect: hasWinner
          ? { type: 'multiEffect', subEffects: JSON.stringify([
              { type: 'reputation', amount: 3 },
              { type: 'fanMood', amount: 5 },
            ]) }
          : { type: 'reputation', amount: 1 },
      },
      {
        id: 'skip',
        label: 'Skippa — fokusera på träning',
        subtitle: 'Inga effekter',
        effect: { type: 'noOp' },
      },
    ],
    resolved: false,
  }
}

// ── Generate gala inbox items + storylines ──────────────────────────────────

export function generateGalaInbox(
  nominations: GalaNomination[],
  game: SaveGame,
): { inboxItems: InboxItem[]; storylines: StorylineEntry[] } {
  const inboxItems: InboxItem[] = []
  const storylines: StorylineEntry[] = []
  const currentMatchday = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((m, f) => Math.max(m, f.roundNumber), 0)

  for (const nom of nominations) {
    const player = game.players.find(p => p.id === nom.playerId)
    if (!player) continue
    const isManaged = player.clubId === game.managedClubId

    if (isManaged) {
      inboxItems.push({
        id: `inbox_gala_${nom.award}_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: `🏆 ${nom.playerName} vann ${AWARD_LABELS[nom.award]}!`,
        body: `${nom.playerName} utsågs till ${AWARD_LABELS[nom.award]} på Bandygalan. ${nom.stat}.`,
        relatedPlayerId: nom.playerId,
        isRead: false,
      })

      storylines.push({
        id: `story_gala_${nom.award}_${game.currentSeason}`,
        type: 'gala_winner',
        season: game.currentSeason,
        matchday: currentMatchday,
        playerId: nom.playerId,
        description: 'gala_winner',
        displayText: `${nom.playerName} vann ${AWARD_LABELS[nom.award]} på Bandygalan ${game.currentSeason + 1}`,
        resolved: true,
      })
    }
  }

  return { inboxItems, storylines }
}
