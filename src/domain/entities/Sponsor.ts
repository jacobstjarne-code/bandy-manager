export interface Sponsor {
  id: string
  name: string
  category: string
  weeklyIncome: number
  contractRounds: number
  signedRound: number
  personality?: 'local' | 'regional' | 'foundation'
  networkMood?: number        // 0-100
  icaMaxi?: boolean           // special ICA Maxi sponsor
  icaMaxi_active?: boolean    // player visit active this season
  // M13: contextual sponsor fields
  tier?: 'fixed' | 'contextual_regional' | 'contextual_kommun' | 'contextual_catering'
  triggeredBy?: 'top4' | 'cs_over_70' | 'attendance_1000'
  triggeredSeason?: number
  expiresSeason?: number
  isOneTime?: boolean
  paidOutSeason?: number
  // H4-uppföljning (2026-08-26): engångsbeloppet, satt vid skapandetillfället
  // (contextualSponsorService.ts:checkContextualSponsors) — kommunstödet
  // skalar nu kontinuerligt med communityStanding istf ett fast belopp,
  // så utbetalningen (applyOneTimeKommunstod) måste läsa DETTA värde, inte
  // en global konstant, annars visar meddelandet ett skalat tal men
  // betalar ut det gamla fasta beloppet.
  oneTimeAmount?: number
}
