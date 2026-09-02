import type { ActiveArc } from '../entities/Narrative'

export type ArcPlayer = { firstName: string; lastName: string }

/**
 * M7 (audit 5c9a7a8, 2026-08-24): "olöst huvudtråd" — bruten ut ur
 * ActiveArcsSecondary.tsx (som ägde exakt denna urvalslogik inline) så
 * saveGameStorage.ts kan återanvända SAMMA urval för save-kortets
 * "sammanhang"-rad, istf en andra, driftande kopia av samma prioritering.
 * derby_echo exkluderas (kortlivad, matchdagsspecifik — inte en tråd att
 * "återuppta" mellan sessioner), peak vinner över building vinner över
 * resolving (en tråd på väg att avslutas är mindre "olöst" än en som eskalerar).
 */
export function pickTopActiveArcs(activeArcs: ActiveArc[] | undefined, limit: number): ActiveArc[] {
  return (activeArcs ?? [])
    .filter(a => a.type !== 'derby_echo' && a.phase !== 'resolving')
    .sort((a, b) => {
      const order: Record<string, number> = { peak: 0, building: 1, resolving: 2 }
      return (order[a.phase] ?? 1) - (order[b.phase] ?? 1)
    })
    .slice(0, limit)
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
    case 'veteran_farewell':
      return `${initial} — kontraktsfrågan hänger i luften`
    case 'lokal_hero':
      return `${initial} — lokalhjältens stund`
    case 'contract_drama':
      return `${initial} — kontraktsfrågan hänger i luften`
    case 'derby_echo':
      return ''
  }
}
