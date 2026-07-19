// Kravmotor (2026-07-19) — delad livscykel-form för Mecenat och Patron.
// Entitetslagret äger typen (Mecenat.ts/Community.ts importerar härifrån);
// demandEngine.ts (domain/services) importerar samma typ, inte tvärtom —
// respekterar den vanliga lager-riktningen (services beror på entities).

export type DemandCategory = 'playtime' | 'league_position' | 'youth_focus' | 'visible_money'

export interface PendingDemand {
  category: DemandCategory
  description: string
  targetPlayerId?: string
  createdRound: number
  deadlineRound: number
  /** Baslinje vid skapandet (t.ex. spelarens gamesPlayed för 'playtime') — hur uppfyllt-kollen mäter förändring. */
  snapshotValue?: number
}
