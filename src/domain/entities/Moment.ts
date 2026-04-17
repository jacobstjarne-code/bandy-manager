export type MomentSource =
  | 'derby_win'          // derbyseger
  | 'star_injury'        // stjärna skadad
  | 'mecenat_left'       // mecenat avgick
  | 'mecenat_costshare'  // mecenat täckte del av transfer
  | 'captain_crisis'     // kapten demoraliserad → lagcascad
  | 'nemesis_signed'     // nemesis värvad (bara #1-raden)
  | 'sponsor_positive'   // sponsorer reagerar positivt
  | 'sponsor_negative'   // sponsorer oroliga
  | 'transfer_story'     // historisk spelare såld
  | 'season_highlight'   // M12 — Årets match (end-of-season insert)
  | 'era_shift'          // M14 — klubbens era förändrades

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
