import type { Player } from '../entities/Player'

type NarrativeEntry = NonNullable<Player['narrativeLog']>[number]

export function addNarrativeEntry(
  player: Player,
  season: number,
  matchday: number,
  text: string,
  type: NarrativeEntry['type'],
): Player {
  const entry: NarrativeEntry = { season, matchday, text, type }
  const log = [...(player.narrativeLog ?? []), entry].slice(-20) // keep last 20 entries
  return { ...player, narrativeLog: log }
}

export function generateFirstGoalEntry(opponent: string, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone',
    text: `Satte sitt första A-lagsmål mot ${opponent}. En dag att minnas.`,
  }
}

export function generateHatTrickEntry(_player: Player, opponent: string, goals: number, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone',
    text: `Hattrick mot ${opponent} — ${goals} mål. Stämningen exploderade på läktarna.`,
  }
}

export function generateInjuryEntry(season: number, matchday: number, days: number): NarrativeEntry {
  return {
    season, matchday, type: 'injury',
    text: `Skadad — beräknad frånvaro ${days} dagar. Hårt slag för laget.`,
  }
}

export function generateReturnFromInjuryEntry(season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'injury',
    text: 'Tillbaka efter skadan. Kroppen håller — nu är det dags att visa sig igen.',
  }
}

export function generateDebutEntry(opponent: string, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone',
    text: `A-lagsdebut mot ${opponent}. Nerverna satt — men benen höll.`,
  }
}

export function generateGoalStreakEntry(goals: number, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'form',
    text: `${goals} mål på ${goals + 1} matcher. Formen är het just nu.`,
  }
}

export function generateMilestoneGoalEntry(total: number, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone',
    text: `Mål nummer ${total} i karriären. En siffra att vara stolt över.`,
  }
}

export function generateMilestoneGamesEntry(total: number, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone',
    text: `Match nummer ${total} i A-laget. Lojalitet och uthållighet lönar sig.`,
  }
}

export function generateAcademyPromotionEntry(season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone',
    text: 'Tar klivet upp till A-laget. Akademin levererade — nu gäller det att gripa chansen.',
  }
}

export function generateGoodMatchEntry(rating: number, goals: number, opponent: string, season: number, matchday: number): NarrativeEntry {
  const goalText = goals > 0 ? ` Stod för ${goals} mål.` : ''
  return {
    season, matchday, type: 'form',
    text: `Storspelad match mot ${opponent} (betyg ${rating.toFixed(1)}).${goalText}`,
  }
}

export function generatePoorMatchEntry(rating: number, opponent: string, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'form',
    text: `Svår dag mot ${opponent} (betyg ${rating.toFixed(1)}). En match att lägga bakom sig.`,
  }
}
