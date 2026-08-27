import type { PlayoffSeries } from '../../domain/entities/Playoff'

export type QFSummaryStatus = 'advanced' | 'eliminated' | 'never_qualified'

/**
 * A-M2 (SEXSÄSONGSAUDITEN 2026-08-26) — rotorsak: QFSummaryScreen.tsx
 * härledde bara `managedAdvanced` (winnerId === managedClubId) från
 * `managedQF` och trädde in i "Ni är utslagna"-grenen så fort managedQF
 * inte var vunnen — det gällde både klubbar som FÖRLORADE kvartsfinalen
 * OCH klubbar som ALDRIG kvalificerade sig för slutspelet (managedQF är då
 * `undefined`, inte en förlorad serie). triggerQFSummary (playoffProcessor.ts)
 * sätts för ALLA sparfiler när QF-fasen avgörs, oavsett om managed club
 * ens fanns i bracket — så en klubb som slutade utanför topp 8 fick samma
 * "utslagna"-text som en klubb som spelade och förlorade en kvartsfinal.
 * Ren funktion → enhetstestbar utan att rendera skärmen.
 */
export function getQFSummaryStatus(qfMatchups: PlayoffSeries[], managedClubId: string): QFSummaryStatus {
  const managedQF = qfMatchups.find(s => s.homeClubId === managedClubId || s.awayClubId === managedClubId)
  if (!managedQF) return 'never_qualified'
  return managedQF.winnerId === managedClubId ? 'advanced' : 'eliminated'
}
