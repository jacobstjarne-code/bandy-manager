/**
 * Pass 2 (CODE_KORORDER_GENOMGANG_2026-09-12 §1, punkt 5) — utsplittrad ur
 * contentContract.ts: den filen är ett 267 kB revisionsregister (trigger/
 * stateEffect/systems/lifespan/semanticKey/recallSurface/notes för alla 93
 * poster), men produktionskoden (EventOverlay.tsx, eventQueueService.ts)
 * läser bara EN sak ur den — "därför nu"-raden (D1 punkt 4). Den fulla
 * proseregistret hörde ändå bara hemma i huvudchunken via den kopplingen.
 *
 * Den här filen bär bara det getWhyNowLine/getEffectiveWhyNowLine faktiskt
 * behöver: id, source och de fyra whyNow-fälten. contentContract.ts:s stora
 * CONTENT_CONTRACT-array (testerna, TS-assertionerna, guard-scriptet) är
 * den enda sanningen för själva innehållet — WHYNOW_ENTRIES nedan är en
 * projektion av samma id:n, inte en andra källa. Om en post någonsin får
 * whyNow-fält ifyllda i contentContract.ts måste samma fält speglas hit
 * (contentContract.test.ts jämför de två så de inte kan glida isär, se
 * "whyNow-projektionen matchar CONTENT_CONTRACT" nedan).
 */

export type ContractSource = 'GameEventType' | 'StorylineType' | 'ArcType' | 'PortalBeat'

export interface WhyNowFields {
  /** Redan-formaterad tidpunkt, t.ex. "omgång 14", "transferfönstret stänger". */
  deadlineLabel?: string
  /** Förnamnet på den som väntar på besked. */
  whyNowPerson?: string
  /** HELA eventet (inte ett enskilt val) går inte att göra ogjort. */
  wholeEventIrreversible?: boolean
  /** Det som avgörs här bär hela säsongen. */
  seasonDefining?: boolean
}

export interface ContentContractWhyNowEntry extends WhyNowFields {
  id: string
  source: ContractSource
}

// Genererad ur contentContract.ts:s CONTENT_CONTRACT (2026-09-12) — samtliga
// 93 id:n har idag inga whyNow-fält satta på typ-nivå (all "därför nu"-text
// kommer per instans via event.whyNow, satt av event-fabrikerna). Arrayen
// finns ändå komplett så en framtida typ-nivå-rad kan få whyNow-fält utan
// att lookupmekanismen behöver byggas om.
export const WHYNOW_ENTRIES: ContentContractWhyNowEntry[] = [
  { id: 'transferBidReceived', source: 'GameEventType' },
  { id: 'contractRequest', source: 'GameEventType' },
  { id: 'playerUnhappy', source: 'GameEventType' },
  { id: 'starPerformance', source: 'GameEventType' },
  { id: 'sponsorOffer', source: 'GameEventType' },
  { id: 'pressConference', source: 'GameEventType' },
  { id: 'dayJobConflict', source: 'GameEventType' },
  { id: 'bidWar', source: 'GameEventType' },
  { id: 'hesitantPlayer', source: 'GameEventType' },
  { id: 'communityEvent', source: 'GameEventType' },
  { id: 'patronEvent', source: 'GameEventType' },
  { id: 'politicianEvent', source: 'GameEventType' },
  { id: 'hallDebate', source: 'GameEventType' },
  { id: 'hallProcess', source: 'GameEventType' },
  { id: 'licenseHandlingsplan', source: 'GameEventType' },
  { id: 'kommunMote', source: 'GameEventType' },
  { id: 'gentjanst', source: 'GameEventType' },
  { id: 'icaMaxiEvent', source: 'GameEventType' },
  { id: 'patronInfluence', source: 'GameEventType' },
  { id: 'spoksponsor', source: 'GameEventType' },
  { id: 'detOmojligaValet', source: 'GameEventType' },
  { id: 'varsel', source: 'GameEventType' },
  { id: 'playerMediaComment', source: 'GameEventType' },
  { id: 'playerPraise', source: 'GameEventType' },
  { id: 'captainSpeech', source: 'GameEventType' },
  { id: 'playerArc', source: 'GameEventType' },
  { id: 'supporterEvent', source: 'GameEventType' },
  { id: 'mecenatInteraction', source: 'GameEventType' },
  { id: 'journalistExclusive', source: 'GameEventType' },
  { id: 'retirementCeremony', source: 'GameEventType' },
  { id: 'economicStress', source: 'GameEventType' },
  { id: 'mecenatEvent', source: 'GameEventType' },
  { id: 'academyEvent', source: 'GameEventType' },
  { id: 'academyDecision', source: 'GameEventType' },
  { id: 'playoffEvent', source: 'GameEventType' },
  { id: 'bandyLetter', source: 'GameEventType' },
  { id: 'criticalEconomy', source: 'GameEventType' },
  { id: 'schoolAssignment', source: 'GameEventType' },
  { id: 'mecenatDinner', source: 'GameEventType' },
  { id: 'refereeMeeting', source: 'GameEventType' },
  { id: 'riskySponsorOffer', source: 'GameEventType' },
  { id: 'mecenatWithdrawal', source: 'GameEventType' },
  { id: 'patronWithdrawal', source: 'GameEventType' },
  { id: 'fanLetter', source: 'GameEventType' },
  { id: 'opponentQuote', source: 'GameEventType' },
  { id: 'csPress', source: 'GameEventType' },
  { id: 'playThroughInjury', source: 'GameEventType' },
  { id: 'seasonGoalHalfway', source: 'GameEventType' },
  { id: 'burnoutRelief', source: 'GameEventType' },
  { id: 'communityActivityRenewal', source: 'GameEventType' },
  { id: 'burnoutCeiling', source: 'GameEventType' },
  { id: 'jobbet_forsvann', source: 'GameEventType' },
  { id: 'rescued_from_unemployment', source: 'StorylineType' },
  { id: 'went_fulltime_pro', source: 'StorylineType' },
  { id: 'workplace_bond', source: 'StorylineType' },
  { id: 'journalist_feud', source: 'StorylineType' },
  { id: 'journalist_redemption', source: 'StorylineType' },
  { id: 'promotion_sacrifice', source: 'StorylineType' },
  { id: 'underdog_season', source: 'StorylineType' },
  { id: 'relegation_escape', source: 'StorylineType' },
  { id: 'gala_winner', source: 'StorylineType' },
  { id: 'captain_rallied_team', source: 'StorylineType' },
  { id: 'hungrig_breakthrough', source: 'StorylineType' },
  { id: 'joker_vindicated', source: 'StorylineType' },
  { id: 'veteran_farewell', source: 'StorylineType' },
  { id: 'veteran_stayed', source: 'StorylineType' },
  { id: 'lokal_hero_moment', source: 'StorylineType' },
  { id: 'contract_drama_resolved', source: 'StorylineType' },
  { id: 'derby_echo_resolved', source: 'StorylineType' },
  { id: 'hungrig_breakthrough', source: 'ArcType' },
  { id: 'joker_redemption', source: 'ArcType' },
  { id: 'veteran_farewell', source: 'ArcType' },
  { id: 'lokal_hero', source: 'ArcType' },
  { id: 'contract_drama', source: 'ArcType' },
  { id: 'derby_echo', source: 'ArcType' },
  { id: 'board_failure', source: 'PortalBeat' },
  { id: 'ripple_consequence', source: 'PortalBeat' },
  { id: 'callback_manager_return', source: 'PortalBeat' },
  { id: 'callback_streak', source: 'PortalBeat' },
  { id: 'callback_derby_memory', source: 'PortalBeat' },
  { id: 'callback_snub', source: 'PortalBeat' },
  { id: 'callback_sale', source: 'PortalBeat' },
  { id: 'callback_nemesis', source: 'PortalBeat' },
  { id: 'callback_legend_mentor', source: 'PortalBeat' },
  { id: 'callback_legend_debut', source: 'PortalBeat' },
  { id: 'callback_legend_record', source: 'PortalBeat' },
  { id: 'season_opener', source: 'PortalBeat' },
  { id: 'first_win', source: 'PortalBeat' },
  { id: 'first_derby', source: 'PortalBeat' },
  { id: 'halftime', source: 'PortalBeat' },
  { id: 'transfer_window_open', source: 'PortalBeat' },
  { id: 'last_league_round', source: 'PortalBeat' },
  { id: 'facility_completed', source: 'PortalBeat' },
]

export function getWhyNowEntry(source: ContractSource, id: string): ContentContractWhyNowEntry | undefined {
  return WHYNOW_ENTRIES.find(e => e.source === source && e.id === id)
}

/**
 * D1 (docs/dom/DOM_D1_EVENTVIKTNING_2026-08-19.md) punkt 4 — "därför nu"-raden.
 * Fem former, denna funktion returnerar den FÖRSTA som matchar i domens
 * prioritetsordning, eller null om ingen är satt. Copy ordagrant låst i
 * domen, ingen ny text här.
 */
export function getWhyNowLine(entry: WhyNowFields | undefined): string | null {
  if (!entry) return null
  if (entry.deadlineLabel) return `Svaret måste komma före ${entry.deadlineLabel}.`
  if (entry.whyNowPerson) return `${entry.whyNowPerson} väntar på besked.`
  if (entry.wholeEventIrreversible) return 'Det här går inte att göra ogjort.'
  if (entry.seasonDefining) return 'Det som bestäms här bär hela våren.'
  return null
}

/**
 * `event.whyNow` (per instans, GameEvent.ts) vinner över typ-nivå-raden om
 * båda är satta — en instans-specifik brådska är alltid mer exakt än en
 * typ-generell. Se contentContract.ts:s fulla dokumentation av bakgrunden.
 */
export function getEffectiveWhyNowLine(event: { type: string; whyNow?: WhyNowFields }): string | null {
  const instanceLine = getWhyNowLine(event.whyNow)
  if (instanceLine) return instanceLine
  return getWhyNowLine(getWhyNowEntry('GameEventType', event.type))
}
