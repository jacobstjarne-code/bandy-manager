import type { Fixture } from '../../domain/entities/Fixture'
import { getRivalry } from '../../domain/data/rivalries'

// ── E4: Card tinting based on content type ──────────────────────────────────

export type CardTintType =
  | 'derby' | 'playoff' | 'annandagen' | 'cup'
  | 'community' | 'alert' | 'negative'

// E-MA1 (BACKLOG.md): rå rgba-kluster bytta mot token-baserad color-mix.
// Varje klusters RGB var en handskriven kopia av en redan namngiven tokens hex
// (derby/playoff/annandagen bekräftat mot NextMatchCards migrering, PR-B/C2;
// cup/negative/community/alert verifierade här via exakt hex-match — --ice
// #7EB3D4=126,179,212, --danger #B05040=176,80,64, --accent #C47A3A=196,122,58
// — inte en gissning, samma tal, bara aldrig genom var()). Alpha bevarad 1:1
// som color-mix-procent.
export function getCardTint(type: CardTintType | undefined): string {
  switch (type) {
    case 'derby':      return 'color-mix(in srgb, var(--match-warn) 3%, transparent)'
    case 'playoff':    return 'color-mix(in srgb, var(--match-gold) 4%, transparent)'
    case 'annandagen': return 'color-mix(in srgb, var(--match-positive) 3%, transparent)'
    case 'cup':        return 'color-mix(in srgb, var(--ice) 4%, transparent)'
    case 'community':  return 'color-mix(in srgb, var(--accent) 2%, transparent)'
    case 'alert':      return 'color-mix(in srgb, var(--accent) 4%, transparent)'
    case 'negative':   return 'color-mix(in srgb, var(--danger) 3%, transparent)'
    default:           return 'transparent'
  }
}

// ── E5: Match atmosphere ────────────────────────────────────────────────────

export interface MatchAtmosphere {
  tint: CardTintType | undefined
  label: string | undefined
  borderAccent: string | undefined
}

export function getMatchAtmosphere(fixture: Fixture): MatchAtmosphere {
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
  const isPlayoff = fixture.isKnockout === true
  const isCup = fixture.isCup === true
  const isAnnandagen = fixture.isAnnandagen === true

  if (rivalry) {
    return {
      tint: 'derby',
      label: `🔥 DERBY — ${rivalry.name}`,
      borderAccent: 'var(--danger)',
    }
  }
  if (isPlayoff) {
    return {
      tint: 'playoff',
      label: '🏆 SLUTSPEL',
      borderAccent: 'var(--accent)',
    }
  }
  if (isCup) {
    return {
      tint: 'cup',
      label: '🏆 CUPEN',
      borderAccent: 'var(--ice)',
    }
  }
  if (isAnnandagen) {
    return {
      tint: 'annandagen',
      label: '🎄 ANNANDAGEN',
      borderAccent: undefined,
    }
  }
  return { tint: undefined, label: undefined, borderAccent: undefined }
}
