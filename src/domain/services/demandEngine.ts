import type { SaveGame } from '../entities/SaveGame'
import type { DemandCategory, PendingDemand } from '../entities/Demand'
import {
  PATRON_PLAYTIME_DEMANDS,
  DEMAND_LEAGUE_POSITION_LINES,
  DEMAND_YOUTH_FOCUS_LINES,
  DEMAND_VISIBLE_MONEY_LINES,
} from '../data/patronData'

/**
 * Gemensam kravmotor — Mecenat + Patron (2026-07-19).
 *
 * Delnings-bedömning (rapporterad innan bygget slutfördes, avgör refaktor
 * vs. tillägg): Mecenat.demands (MecenatDemand[], rika objekt) och
 * Patron.demands (string[], rå text läst direkt av tre UI-konsumenter —
 * dailyBriefingService/patronTriggers/PatronDemandPrimary) har GENUINT
 * olika publika former och olika konsumenter. Att tvinga in dem i EN
 * gemensam datastruktur hade antingen brutit Patrons tre string[]-
 * konsumenter eller utarmat Mecenats typade form — ingen vinst, bara
 * churn. DÄRFÖR: bara UTVÄRDERINGSLOGIKEN delas (denna fil) — kategorival,
 * deadline, uppfyllt-kontroll, textgenerering. Varje entitet skriver
 * resultatet till sin EGEN publika form via en tunn adapter i
 * eventProcessor.ts. Livscykel-tracking (PendingDemand, nedan) ÄR delad
 * rakt av — identisk form för båda, inget publikt kontrakt att skydda.
 *
 * Balans mot demands.length>=3-tröskeln (Mecenat, redan fullt byggd
 * nedströms — se eventProcessor.ts): ett krav tar DEMAND_WINDOW_MATCHDAYS
 * omgångar att avgöra, och ett nytt genereras bara med sannolikhet per
 * berättigad omgång (se eventProcessor.ts's generering) — inte
 * garanterat varje gång föregående avgjorts. Det sprider ut
 * misslyckande-serien över mer än en säsong under otur, istf att
 * mecenater kan trilla i withdrawal-tröskeln på några omgångar.
 */

export type { DemandCategory, PendingDemand }

export const DEMAND_WINDOW_MATCHDAYS = 8

const CATEGORIES: DemandCategory[] = ['playtime', 'league_position', 'youth_focus', 'visible_money']

/** Deterministisk kategorival — seed byggs av callern på säsong/matchday/entitets-id, aldrig Math.random. */
export function pickDemandCategory(seed: number): DemandCategory {
  return CATEGORIES[Math.abs(seed) % CATEGORIES.length]
}

interface DemandContext {
  seed: number
  targetPlayerId?: string
  favoritePlayerName?: string
  favoriteRelation?: string
}

/**
 * Textinnehåll — alla fyra kategorier levererade (Jacob, 2026-07-19), nio
 * rader var. 'playtime' interpolerar {favorit}/{relation}
 * (PATRON_PLAYTIME_DEMANDS). De tre andra har inga {token} — kraven är
 * generella (verifierat: ingen .replace() behövs för dem).
 */
export function generateDemandDescription(category: DemandCategory, ctx: DemandContext): string {
  if (category === 'playtime') {
    const template = PATRON_PLAYTIME_DEMANDS[Math.abs(ctx.seed) % PATRON_PLAYTIME_DEMANDS.length]
    return template
      .replace('{favorit}', ctx.favoritePlayerName ?? 'en av spelarna')
      .replace('{relation}', ctx.favoriteRelation ?? 'bekant')
  }
  const pool = category === 'league_position' ? DEMAND_LEAGUE_POSITION_LINES
    : category === 'youth_focus' ? DEMAND_YOUTH_FOCUS_LINES
    : DEMAND_VISIBLE_MONEY_LINES
  return pool[Math.abs(ctx.seed) % pool.length]
}

/** Bygger ett nytt PendingDemand — tar snapshot av vad uppfyllt-kollen ska mäta mot. */
export function createPendingDemand(
  game: SaveGame,
  category: DemandCategory,
  createdRound: number,
  ctx: DemandContext,
): PendingDemand {
  const snapshotValue = category === 'playtime' && ctx.targetPlayerId
    ? (game.players.find(p => p.id === ctx.targetPlayerId)?.seasonStats?.gamesPlayed ?? 0)
    : undefined

  return {
    category,
    description: generateDemandDescription(category, ctx),
    targetPlayerId: ctx.targetPlayerId,
    createdRound,
    deadlineRound: createdRound + DEMAND_WINDOW_MATCHDAYS,
    snapshotValue,
  }
}

/**
 * Uppfyllt-kontroll per kategori. Kräver rimliga men UPPNÅBARA trösklar
 * (Jacobs krav: "krav ska ha tidsram och vara möjliga att uppfylla").
 */
export function isDemandFulfilled(game: SaveGame, demand: PendingDemand, managedClubId: string): boolean {
  switch (demand.category) {
    case 'playtime': {
      if (!demand.targetPlayerId) return false
      const player = game.players.find(p => p.id === demand.targetPlayerId)
      if (!player) return false
      const gamesSinceCreated = (player.seasonStats?.gamesPlayed ?? 0) - (demand.snapshotValue ?? 0)
      return gamesSinceCreated >= 3
    }
    case 'league_position': {
      const standing = game.standings?.find(s => s.clubId === managedClubId)
      if (!standing) return false
      const totalTeams = game.standings?.length ?? 12
      return standing.position <= Math.ceil(totalTeams / 2)
    }
    case 'youth_focus': {
      return game.academyLevel !== 'basic' || game.communityActivities?.bandySchool === true
    }
    case 'visible_money': {
      const managedClub = game.clubs.find(c => c.id === managedClubId)
      return game.communityActivities?.vipTent === true || managedClub?.hasIndoorArena === true
    }
  }
}
