import type { ArcType, ActiveArc } from '../entities/Narrative'

export type ArcPlayer = { firstName: string; lastName: string }

export const ARC_ICON: Record<ArcType, string> = {
  hungrig_breakthrough: '🎯',
  joker_redemption: '🃏',
  veteran_farewell: '🎖️',
  veteran_final_season: '🎖️',
  ledare_crisis: '💪',
  lokal_hero: '🏠',
  contract_drama: '📋',
  derby_echo: '',
}

export function getArcHeadline(arc: ActiveArc, player?: ArcPlayer): string {
  const initial = player ? `${player.firstName[0]}. ${player.lastName}` : arc.subject ?? '?'
  switch (arc.type) {
    case 'hungrig_breakthrough': {
      const games = (arc.data?.gamesWithoutGoal as number | undefined) ?? '?'
      return `${initial} — ${games} matcher utan mål`
    }
    case 'joker_redemption':
      return `${initial} — efter utvisningen`
    case 'veteran_final_season':
    case 'veteran_farewell':
      return `${initial} — sista säsongen`
    case 'ledare_crisis':
      return `${initial} — under press`
    case 'lokal_hero':
      return `${initial} — lokalhjältens stund`
    case 'contract_drama':
      return `${initial} — kontraktsfrågan hänger i luften`
    case 'derby_echo':
      return ''
  }
}
