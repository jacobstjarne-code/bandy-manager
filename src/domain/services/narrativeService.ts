import type { Player } from '../entities/Player'
import { formatRating } from '../format'

type NarrativeEntry = NonNullable<Player['diary']>[number]

export function addNarrativeEntry(
  player: Player,
  season: number,
  matchday: number,
  text: string,
  type: NarrativeEntry['type'],
): Player {
  const entry: NarrativeEntry = { season, matchday, text, type }
  const log = [...(player.diary ?? []), entry].slice(-20) // keep last 20 entries
  return { ...player, diary: log }
}

/**
 * Ren renderare — tar redan verifierade parametrar (opponent/season/matchday).
 * Den faktiska "är detta verkligen första målet"-verifieringen
 * (prevCareerGoals === 0) sker i anroparen (statsProcessor.ts), inte här —
 * citatdeklarationen hör hemma där, inte i en formaterare utan egen
 * speldataåtkomst.
 */
export function generateFirstGoalEntry(opponent: string, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone', semanticKey: 'first_team_goal',
    text: `Satte sitt första A-lagsmål mot ${opponent}. En dag att minnas.`,
  }
}

export function generateHatTrickEntry(_player: Player, opponent: string, goals: number, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone', semanticKey: `hat_trick_${goals}`,
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

/**
 * Ren renderare, samma mönster som generateFirstGoalEntry ovan —
 * verifieringen (prevCareerGames === 0 && p.promotedFromAcademy) sker i
 * statsProcessor.ts, inte här.
 */
export function generateDebutEntry(opponent: string, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone', semanticKey: 'first_team_debut',
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
    season, matchday, type: 'milestone', semanticKey: `career_goals_${total}`,
    text: `Mål nummer ${total} i karriären. En siffra att vara stolt över.`,
  }
}

export function generateMilestoneGamesEntry(total: number, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone', semanticKey: `career_games_${total}`,
    text: `Match nummer ${total} i A-laget. Lojalitet och uthållighet lönar sig.`,
  }
}

export function generateAcademyPromotionEntry(season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'milestone', semanticKey: 'academy_promotion',
    text: 'Tar klivet upp till A-laget. Akademin levererade — nu gäller det att gripa chansen.',
  }
}

/**
 * Ren renderare, samma mönster som ovan — rating/goals är redan lästa och
 * verifierade av statsProcessor.ts innan de skickas in.
 */
export function generateGoodMatchEntry(rating: number, goals: number, opponent: string, season: number, matchday: number): NarrativeEntry {
  const goalText = goals > 0 ? ` Stod för ${goals} mål.` : ''
  return {
    season, matchday, type: 'form',
    text: `Storspelad match mot ${opponent} (betyg ${formatRating(rating)}).${goalText}`,
  }
}

export function generatePoorMatchEntry(rating: number, opponent: string, season: number, matchday: number): NarrativeEntry {
  return {
    season, matchday, type: 'form',
    text: `Svår dag mot ${opponent} (betyg ${formatRating(rating)}). En match att lägga bakom sig.`,
  }
}
