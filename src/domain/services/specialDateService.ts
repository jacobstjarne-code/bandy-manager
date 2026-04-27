import { mulberry32 } from '../utils/random'
import {
  SpecialDateContext,
  ANNANDAGSBANDY_BRIEFING,
  ANNANDAGSBANDY_COMMENTARY,
  ANNANDAGSBANDY_COMMENTARY_LORE,
  NYARSBANDY_BRIEFING,
  NYARSBANDY_COMMENTARY,
  FINALDAG_BRIEFING_PLAYING,
  FINALDAG_BRIEFING_SPECTATOR,
  FINALDAG_COMMENTARY_PLAYING,
  FINALDAG_COMMENTARY_SPECTATOR,
  FINALDAG_COMMENTARY_LORE,
  FINALDAG_COMMENTARY_3X30,
  CUPFINAL_BRIEFING_PLAYING,
  CUPFINAL_BRIEFING_SPECTATOR,
  CUPFINAL_COMMENTARY_PLAYING,
  CUPFINAL_COMMENTARY_SPECTATOR,
  CUPFINAL_COMMENTARY_LORE,
  SM_FINAL_VENUE,
} from '../data/specialDateStrings'
import { getRivalry } from '../data/rivalries'
import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'

// ── Core utilities ────────────────────────────────────────────────────────────

export function substitute(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(ctx[key as string] ?? `{${key}}`))
}

export function pickVariant<T>(pool: T[], season: number, matchday: number): T {
  const rand = mulberry32(season * 1000 + matchday)
  return pool[Math.floor(rand() * pool.length)]
}

// Slumpar lore-pool med ~15% sannolikhet (separat seed för att inte påverka
// variant-ordningen inom samma matchday)
export function pickCommentary(
  standard: string[],
  lore: string[] | undefined,
  season: number,
  matchday: number,
): string {
  const rand = mulberry32(season * 7919 + matchday * 31)
  const useLore = lore !== undefined && lore.length > 0 && rand() < 0.15
  const pool = useLore ? lore! : standard
  return pickVariant(pool, season, matchday)
}

// ── Context builder ───────────────────────────────────────────────────────────

export function buildSpecialDateContext(fixture: Fixture, game: SaveGame): SpecialDateContext {
  const isHome = fixture.homeClubId === game.managedClubId
  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)

  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)

  return {
    isHomePlayer: isHome,
    homeClubName: homeClub?.name ?? '',
    awayClubName: awayClub?.name ?? '',
    arenaName: fixture.arenaName ?? managedClub?.arenaName ?? '',
    venueCity: fixture.venueCity ?? (isHome ? managedClub?.region ?? '' : ''),
    isDerby: !!rivalry,
    rivalryName: rivalry?.name,
    tipoffHour: '13:00',
    isPlayerInFinal: fixture.isFinaldag === true,
    isUnderdog: fixture.isFinaldag
      ? (managedClub?.reputation ?? 50) < 50
      : undefined,
    hasJourneyToFinal: fixture.isCup
      ? (game.cupBracket?.matches.filter(m =>
          (m.homeClubId === game.managedClubId || m.awayClubId === game.managedClubId) &&
          m.winnerId === game.managedClubId && !m.isBye
        ).length ?? 0) >= 3
      : undefined,
  }
}

// ── Commentary pickers (live match) ──────────────────────────────────────────

export function pickSpecialDateCommentary(
  type: 'annandagen' | 'nyarsbandy' | 'finaldag' | 'cupfinal',
  ctx: SpecialDateContext,
  season: number,
  matchday: number,
): string {
  switch (type) {
    case 'annandagen': {
      return pickCommentary(ANNANDAGSBANDY_COMMENTARY, ANNANDAGSBANDY_COMMENTARY_LORE, season, matchday)
    }
    case 'nyarsbandy': {
      const template = pickVariant(NYARSBANDY_COMMENTARY, season, matchday)
      return substitute(template, { arenaName: ctx.arenaName })
    }
    case 'finaldag': {
      return pickFinaldagCommentary(ctx, season, matchday)
    }
    case 'cupfinal': {
      const standard = ctx.isPlayerInFinal ? CUPFINAL_COMMENTARY_PLAYING : CUPFINAL_COMMENTARY_SPECTATOR
      const template = pickCommentary(standard, CUPFINAL_COMMENTARY_LORE, season, matchday)
      return substitute(template, {
        arenaName: ctx.arenaName,
        homeClubName: ctx.homeClubName,
        awayClubName: ctx.awayClubName,
      })
    }
  }
}

export function pickFinaldagCommentary(ctx: SpecialDateContext, season: number, matchday: number): string {
  // 3×30-trigger tar 100% prioritet — triggas av ovanligt väder (som Studan 2010)
  if (ctx.weather?.matchFormat === '3x30') {
    return pickVariant(FINALDAG_COMMENTARY_3X30, season, matchday)
  }
  const standard = ctx.isPlayerInFinal ? FINALDAG_COMMENTARY_PLAYING : FINALDAG_COMMENTARY_SPECTATOR
  const template = pickCommentary(standard, FINALDAG_COMMENTARY_LORE, season, matchday)
  return substitute(template, {
    homeClubName: ctx.homeClubName,
    awayClubName: ctx.awayClubName,
    arenaName: ctx.arenaName,
  })
}

// ── Briefing pickers ──────────────────────────────────────────────────────────

export function annandagsbandyBriefing(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(ANNANDAGSBANDY_BRIEFING, season, matchday)
  return substitute(template, {
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
    arenaName: ctx.arenaName,
    rivalryName: ctx.rivalryName ?? 'Derbyt',
  })
}

export function nyarsbandyBriefing(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(NYARSBANDY_BRIEFING, season, matchday)
  return substitute(template, {
    tipoffHour: ctx.tipoffHour ?? '13:00',
    arenaName: ctx.arenaName,
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
  })
}

export function finaldagBriefingPlaying(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(FINALDAG_BRIEFING_PLAYING, season, matchday)
  return substitute(template, {
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
    arenaName: SM_FINAL_VENUE.arenaName,
  })
}

export function finaldagBriefingSpectator(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(FINALDAG_BRIEFING_SPECTATOR, season, matchday)
  return substitute(template, {
    homeClubName: ctx.homeClubName,
    awayClubName: ctx.awayClubName,
  })
}

export function cupFinalBriefingPlaying(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(CUPFINAL_BRIEFING_PLAYING, season, matchday)
  return substitute(template, {
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
    arenaName: ctx.arenaName,
    journeyLine: ctx.hasJourneyToFinal ? 'Tre rundor och inga förluster — nu sista.' : 'Vi är här.',
  })
}

export function cupFinalBriefingSpectator(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(CUPFINAL_BRIEFING_SPECTATOR, season, matchday)
  return substitute(template, {
    homeClubName: ctx.homeClubName,
    awayClubName: ctx.awayClubName,
    venueCity: ctx.venueCity,
  })
}
