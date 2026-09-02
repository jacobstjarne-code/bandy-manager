// MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Skärpning 3 (Opus dom,
// 2026-09-01): 'mecenat_left' släppt — deklarerad här sedan tidigare men
// aldrig faktiskt konstruerad som ett Moment någonstans (mecenatens avhopp
// triggar bara en ripple, se rippleEffectService.ts's egen 'mecenat_left'-
// trigger, en annan union). Alla kvarvarande källor nedan är nu även
// EventLedgerType-medlemmar (Narrative.ts) — se momentLedgerService.ts.
export type MomentSource =
  | 'derby_win'          // derbyseger
  | 'star_injury'        // stjärna skadad
  | 'mecenat_costshare'  // mecenat täckte del av transfer
  | 'captain_crisis'     // kapten demoraliserad → lagcascad
  | 'nemesis_signed'     // nemesis värvad (bara #1-raden)
  | 'sponsor_positive'   // sponsorer reagerar positivt
  | 'sponsor_negative'   // sponsorer oroliga
  | 'transfer_story'     // historisk spelare såld
  | 'season_highlight'   // M12 — Årets match (end-of-season insert)
  | 'era_shift'          // M14 — klubbens era förändrades
  | 'rival_sale'         // C-T9 — sålt spelare till rivalklubben

export interface Moment {
  id: string
  source: MomentSource
  matchday: number
  season: number
  title: string           // kort rubrik, ~40 tecken
  body: string            // 2-3 rader prosa, narrativt
  subjectPlayerId?: string
  subjectClubId?: string
}
