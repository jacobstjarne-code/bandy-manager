import type { ClubEra } from './SaveGame'
import type { MatchHighlightCategory } from './SeasonSummary'

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

/** transfer_story's rollklassning — samma fyra strängar som transferProcessor.ts's lokala `role`-variabel. */
export type TransferRole = 'kapten' | 'klackfavorit' | 'legend' | 'akademiprodukt'

export interface Moment {
  id: string
  source: MomentSource
  matchday: number
  season: number
  title: string           // kort rubrik, ~40 tecken
  body: string            // 2-3 rader prosa, narrativt
  subjectPlayerId?: string
  subjectClubId?: string
  // MIGRATIONSPLAN_HANDELSELIGGAREN Skärpning 4 (2026-09-02, Opus dom):
  // body-konstruktionen för dessa tre källor branchar på ett klassificerande
  // värde (olika MENING per gren, inte bara ett namn i samma mening) — måste
  // bäras strukturerat hit så en branchad vy-mall kan skrivas efter att
  // title/body strippats till liggaren. Bara EN sätts per Moment, källan
  // avgör vilken. Kopieras rakt in på EventLedgerEntry i buildMomentLedgerEntry.
  eraLabel?: ClubEra                      // era_shift — eran den skiftade TILL
  transferRole?: TransferRole             // transfer_story
  // matchCategory: Code-fynd (2026-09-02, ej i ursprungsordern) — season_highlight
  // bygger sin narrative-sträng ur matchHighlightService.ts's 7-vägs switch på
  // MatchHighlightCategory (late_winner/derby_win/cup_drama/playoff_decisive/
  // big_win/comeback/underdog_upset), inte fast prosa. Flaggat till Opus.
  matchCategory?: MatchHighlightCategory  // season_highlight
}
