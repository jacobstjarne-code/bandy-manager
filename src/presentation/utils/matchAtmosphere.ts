import type { Fixture } from '../../domain/entities/Fixture'
import { getRivalry } from '../../domain/data/rivalries'
import { getRoundDate } from '../../domain/services/scheduleGenerator'

// ── E4: Card tinting based on content type ──────────────────────────────────

export type CardTintType =
  | 'derby' | 'playoff' | 'annandagen' | 'cup'
  | 'community' | 'alert' | 'negative'

export function getCardTint(type: CardTintType | undefined): string {
  switch (type) {
    case 'derby':      return 'rgba(196,80,50,0.03)'
    case 'playoff':    return 'rgba(196,168,76,0.04)'
    case 'annandagen': return 'rgba(100,140,80,0.03)'
    case 'cup':        return 'rgba(126,179,212,0.04)'
    case 'community':  return 'rgba(196,122,58,0.02)'
    case 'alert':      return 'rgba(196,122,58,0.04)'
    case 'negative':   return 'rgba(176,80,64,0.03)'
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
  // Annandagen: 26 dec — kolla beräknat datum, inte omgångsnummer (mer robust mot schema-variationer)
  const fixtureDate = !isCup ? getRoundDate(fixture.season, fixture.roundNumber) : ''
  const isAnnandagen = fixtureDate.endsWith('-12-26')

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
