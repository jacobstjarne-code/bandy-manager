export type GameEventType =
  | 'transferBidReceived'
  | 'contractRequest'
  | 'playerUnhappy'
  | 'starPerformance'
  | 'sponsorOffer'
  | 'pressConference'
  | 'dayJobConflict'
  | 'bidWar'
  | 'hesitantPlayer'
  | 'communityEvent'
  | 'patronEvent'
  | 'politicianEvent'
  | 'hallDebate'
  | 'hallProcess'
  | 'licenseHandlingsplan'
  | 'kommunMote'
  | 'gentjanst'
  | 'icaMaxiEvent'
  | 'patronInfluence'
  | 'spoksponsor'
  | 'detOmojligaValet'
  | 'varsel'
  | 'playerMediaComment'
  | 'playerPraise'
  | 'captainSpeech'
  | 'playerArc'
  | 'supporterEvent'
  | 'mecenatInteraction'
  | 'journalistExclusive'
  | 'retirementCeremony'
  | 'economicStress'
  | 'mecenatEvent'
  | 'academyEvent'
  | 'playoffEvent'
  | 'bandyLetter'
  | 'criticalEconomy'
  | 'schoolAssignment'
  | 'mecenatDinner'
  | 'refereeMeeting'
  | 'riskySponsorOffer'
  | 'mecenatWithdrawal'
  | 'patronWithdrawal'
  | 'mediaReaction'
  | 'fanLetter'
  | 'opponentQuote'
  | 'csPress'
  | 'playThroughInjury'
  | 'seasonGoalHalfway'
  | 'burnoutRelief'
  // ANSPRÅK 4, spak 3 (DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md):
  // nyhetstretmillen. "Supportrarna tröttnar på X — förnya för Y kr?"
  | 'communityActivityRenewal'

/**
 * D1 (DOM_D1_EVENTVIKTNING_2026-08-19.md) punkt 3 — konsekvensmarkören.
 * Domen namnger fyra nivåer (neutral/positiv/kostsam/irreversibel), men
 * 'irreversibel' modelleras HÄR som en egen boolean (choice.irreversible)
 * i stället för ett fjärde enum-värde — domen säger uttryckligen att ett
 * val kan vara BÅDA kostsamt OCH irreversibelt samtidigt ("Är valet både
 * kostsamt och irreversibelt: båda raderna, kostnaden först"), vilket en
 * ren enum inte kan uttrycka utan ett femte "bådadera"-värde. Se
 * getConsequenceLines() nedan för den mekaniska, testbara regeln.
 */
export type ConsequenceLevel = 'neutral' | 'positive' | 'costly'

export interface EventChoice {
  id: string
  label: string
  subtitle?: string    // Consequence preview: "💛 +8 fanMood · ⭐ +3 reputation"
  /** D1 punkt 3. 'neutral'/'positive' visar ALDRIG en markör (facit-förbud,
   *  O12 — att märka ut det goda valet är facit). 'costly' visar costLabel.
   *  ALDRIG --danger eller ⚠ i renderingslagret — hård spärr i domen: rött
   *  läser som "fel", en spelare som ser rött på ett val lär sig att spelet
   *  har en åsikt om det. */
  consequenceLevel?: ConsequenceLevel
  /** Redan-formaterad kostnadstext för consequenceLevel==='costly', ordagrant
   *  kopierad från D1:s låsta copy — t.ex. "Kostar 45 tkr", "Kostar 18 tkr/mån",
   *  "Kostar 45 tkr nu, 6 tkr/mån sen", "Kostar en plats i truppen",
   *  "Kostar relationen till {namn}". Ingen ny formattering i renderingslagret. */
  costLabel?: string
  /** Sant om valet inte går att ändra i efterhand. Oberoende av
   *  consequenceLevel — se getConsequenceLines(). */
  irreversible?: boolean
  effect: EventEffect
}

/**
 * D1 punkt 3 — den mekaniska regeln för vilka konsekvensrader ett val visar.
 * Ren funktion, ingen rendering: DecisionChoices.tsx anropar den för att
 * bestämma vilka rader (om några) som ska stå under valets etikett.
 *
 * "Kostsam: exakta pengar, alltid... Irreversibel: en EGEN rad under
 * alternativet, samma dämpade register... Är valet både kostsamt och
 * irreversibelt: båda raderna, kostnaden först."
 */
export function getConsequenceLines(
  choice: Pick<EventChoice, 'consequenceLevel' | 'costLabel' | 'irreversible'>,
): string[] {
  const lines: string[] = []
  if (choice.consequenceLevel === 'costly' && choice.costLabel) {
    lines.push(choice.costLabel)
  }
  if (choice.irreversible) {
    lines.push('Går inte att ändra.')
  }
  return lines
}

export interface EventSender {
  name: string
  role: string
}

export interface EventEffect {
  type:
    | 'acceptTransfer'
    | 'rejectTransfer'
    | 'counterOffer'
    | 'extendContract'
    | 'rejectContract'
    | 'boostMorale'
    | 'acceptSponsor'
    | 'pressResponse'
    | 'noOp'
    | 'openNegotiation'
    | 'makeFullTimePro'
    | 'raiseBid'
    | 'setCommunity'
    | 'patronHappiness'
    | 'politicianRelationship'
    | 'kommunBidragChange'
    | 'facilitiesUpgrade'
    | 'kommunGamble'
    | 'tempFacilities'
    | 'income'
    | 'reputation'
    | 'fanMood'
    | 'communityStanding'
    | 'journalistRelationship'
    | 'patronInfluence'
    | 'boardPatience'
    | 'multiEffect'
    | 'teamBoostMorale'
    | 'supporterMood'
    | 'mecenatHappiness'
    | 'spawnPatron'
    | 'patronWithdrawn'
    | 'finance'
    | 'moraleDelta'
    | 'saveBandyLetter'
    | 'startEconomicCrisis'
    | 'resolveEconomicCrisis'
    | 'saveSchoolAssignment'
    | 'scoutBudget'
    | 'refereeRelationship'
    | 'setLegendRole'
    | 'hallProcess'
    | 'playThroughInjury'
    | 'releasePlayer'
    // O2 lager 3 (Jacobs dom 2026-08-24): läser targetPlayerId + amount,
    // samma konvention som boostMorale. developmentRate (INTE
    // potentialAbility — det är en fast ceiling, krymper aldrig annars i
    // kodbasen, Jacobs rättade dom) och discipline (redan läst av
    // disciplineRisk i matchmotorn, matchCore.ts) — permanenta, tysta
    // motvikter till hungrig_peak_event/joker_peak_event (arcService.ts).
    | 'developmentRateDelta'
    | 'disciplineDelta'
    // ANSPRÅK 4, spak 3: nyhetsinvesteringen. Läser `communityKey` (vilken av
    // de nio CS-aktiviteterna som förnyas) + `amount` (kostnaden, NEGATIV —
    // samma teckenkonvention som setCommunity/finance). Nollställer
    // aktivitetens staleness-klocka (communityActivitiesSince). Rör ALDRIG
    // communityStanding direkt — domens SKYDDAT-punkt: förnyelsen sänker inte
    // CS, den UTEBLIVNA förnyelsen låter staleness göra det.
    | 'renewCommunityActivity'
  value?: number
  refereeId?: string
  amount?: number
  targetPlayerId?: string
  targetClubId?: string
  targetMecenatId?: string
  bidId?: string
  sponsorData?: string  // commercial sponsor data (riskySponsorOffer)
  patronData?: string   // patron emergence data (spawnPatron)
  mediaQuote?: string
  communityKey?: string
  communityValue?: string
  // For multiEffect: serialized array of sub-effects
  subEffects?: string
  // For saveBandyLetter / saveSchoolAssignment — reply text embedded in choice
  replyText?: string
  // For startEconomicCrisis / resolveEconomicCrisis
  crisisPhase?: string
  removePlayerId?: string
  /** O2 lager 1 (Jacobs dom 2026-08-24): resolveEconomicCrisis, crisisPhase
   *  'mecenat' (ask_mecenat-valet) — mecenaten targetMecenatId förlorar
   *  denna mängd happiness. "Lojalitet −30" var tidigare bara ett löfte i
   *  labeln, aldrig kodat. */
  mecenatHappinessDelta?: number
  legendRole?: string
  /** B1 §5: JSON-serialiserad HallProcessUpdate för hallProcess-effekten. */
  hallProcessData?: string
  /** O2 lager 1 (Jacobs dom 2026-08-24): extendContract — antal säsonger
   *  kontraktet förlängs. Ersätter den tidigare choice.id==='extend3'-gissningen
   *  i eventResolver.ts, som bara täckte det EN konstruktionsstället kände till. */
  contractYears?: number
}

export type EventPriority = 'critical' | 'high' | 'normal' | 'low'

/**
 * HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md) — NÄR/VAR ett beslut
 * surfar. HELT SKILD AXEL FRÅN EventPriority ovan: priority styr sorteringen
 * inom kön och overlay-vs-inline-routningen (eventQueueService.ts), tier styr
 * om beslutet över huvud taget får en dashboard-yta och om det är undantaget
 * throttlen. De klassificerar olika och mappar inte 1:1 — ett 'low'-prioriterat
 * licenskrav är 'must', ett 'critical'-prioriterat playerUnhappy är 'month'.
 *
 *  - 'must'       Deadline-drivet, oåterkalleligt om det ignoreras. Medlemskapet
 *                 är STÄNGT (Jacobs dom): kontraktsdeadline + licenskrav.
 *                 Undantaget throttlen — surfar alltid, defereras aldrig.
 *  - 'month'      Väntar begripligt men syns. Sponsor/mecenat/anläggning/kommun.
 *                 Throttlas som förut. Batchas till ETT sekundärt kort.
 *  - 'background' Press, orten, småval. Får ALDRIG ett dashboard-kort.
 */
export type DecisionTier = 'must' | 'month' | 'background'

/**
 * HIGH 11 — HUR kortet ser ut. Tredje, oberoende axeln (tier = när/var,
 * priority = köordning, mode = visuell vikt). "Tre lägen i samma system, inte
 * sex komponenter": lågmäld notis · verkligt dilemma · dramatisk brytpunkt.
 * Typ-nivå-default i decisionTierService.getDecisionMode(); en enskild instans
 * får åsidosätta via GameEvent.mode (samma per-instans-konvention som
 * priority?/whyNow).
 */
export type DecisionMode = 'notis' | 'dilemma' | 'brytpunkt'

export function getEventPriority(type: GameEventType): EventPriority {
  switch (type) {
    case 'mecenatEvent':
    case 'economicStress':
    case 'playerUnhappy':
      return 'critical'
    case 'patronEvent':
    case 'pressConference':
    case 'politicianEvent':
    case 'kommunMote':
    case 'hallDebate':
    case 'hallProcess':
    case 'mecenatDinner':
      return 'high'
    case 'criticalEconomy':
      return 'critical'
    case 'transferBidReceived':
    case 'contractRequest':
    case 'academyEvent':
    case 'playoffEvent':
    // O4 (DOM_BURNOUT_2026-08-17.md): "Aldrig pivotal" — burnoutRelief är en
    // återkommande, sjukdomsartad situation, inte ett unikt ödesögonblick.
    case 'burnoutRelief':
    // ANSPRÅK 4, spak 3: en verklig utgift ur kassan, men aldrig en frist och
    // aldrig ett ödesögonblick — samma vikt som akademins och slutspelets kort.
    case 'communityActivityRenewal':
      return 'normal'
    case 'bandyLetter':
    case 'schoolAssignment':
    case 'mediaReaction':
    case 'fanLetter':
    case 'opponentQuote':
      return 'low'
    default:
      return 'low'
  }
}

export interface GameEvent {
  id: string
  type: GameEventType
  title: string
  body: string
  choices: EventChoice[]
  sender?: EventSender       // Named person + role
  relatedPlayerId?: string
  // M3 (audit 5c9a7a8, 2026-08-24): för händelser som namnger FLERA specifika
  // spelare i title/body (t.ex. juniorlandslagets "1-2 utvalda") men bara har
  // EN relatedPlayerId-plats. Resolvern ska verka på EXAKT dessa spelare, inte
  // återhärleda ett urval genom att filtrera hela truppen på nytt vid
  // resolveringstillfället — den filtreringen kan ge ett annat, större urval
  // än vad kortet faktiskt visade spelaren.
  selectedPlayerIds?: string[]
  relatedClubId?: string
  relatedBidId?: string
  relatedFixtureId?: string
  sponsorData?: string
  resolved: boolean
  followUpText?: string      // Simple follow-up inbox text (3-5 matchdays later)
  priority?: EventPriority   // defaults to getEventPriority(type) if not set
  deferredAt?: number        // matchday när eventet hamnade i kön (R1 age tracking)
  /** HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md) — per-instans
   *  åsidosättande av typ-nivåns läge (getDecisionMode, decisionTierService.ts).
   *  Domen: "En måste kan vara ett dilemma (kontrakt: betala/sälj) eller en
   *  brytpunkt (licens nekad)" — samma GameEventType, olika dramatisk vikt
   *  beroende på situationen. Sätts bara vid konstruktionsstället när DEN HÄR
   *  instansen faktiskt bär en annan vikt än sin typ. undefined = typ-läget. */
  mode?: DecisionMode
  /** HIGH 11 — matchdagen då fristen går ut. Satt på måste-nivåns event
   *  (contractRequest, licenseHandlingsplan) så förvarningen
   *  (getUpcomingMustDeadlines, decisionTierService.ts) kan räkna omgångar
   *  kvar. Samma valfria-fält-konvention som deferredAt ovan. undefined =
   *  ingen känd frist (alla icke-måste-event idag). */
  deadlineRound?: number
  systemhandelse?: boolean   // O19 (SLUTTEST_KO.md): uppfyller varsel-mallens fem kriterier
                              // (DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md). Ren datamärkning —
                              // ingen räknare/cooldown/säsongsbudget läser fältet ännu.
  /** O1 (SLUTTEST_KO.md, varsel-mallen, "sponsorn med ett problem"): satt bara
   *  på sponsorOffer-events där en ny sponsor konkurrerar med en redan
   *  aktiv sponsor i samma kategori. Id:t på den rivaliserande sponsorn vars
   *  contractRounds nollställs (avslutas) om spelaren accepterar den nya. */
  terminateSponsorId?: string
  /** O1: communityStanding-kostnaden (negativ) för att avsluta rivalens
   *  avtal när spelaren accepterar den nya sponsorn. undefined = ingen kostnad
   *  (den vanliga sponsorOffer-varianten utan konflikt). */
  communityStandingDelta?: number
  /** Batch-av-tre (D1 punkt 4, dömd 2026-08-21). Gränsen för att batcha är
   *  DELAD ORSAK, inte antal — sätts vid konstruktionsstället när flera
   *  events uppstår ur SAMMA händelse (t.ex. tre kontrakt vid fönster-
   *  öppning). getBatchSiblings (eventQueueService.ts) grupperar pending
   *  events på detta fält, aldrig på type/tidpunkt. INGET nuvarande
   *  konstruktionsställe sätter fältet — event-genereringen är idag
   *  medvetet kapad till ~2/omgång (postAdvanceEvents.ts), så en verklig
   *  samma-orsak-skur förekommer inte i spelet ännu. Mekanismen är byggd
   *  och redo; ingen konsument fyller den. Se SLUTTEST_KO.md. */
  triggerGroupId?: string
  /** High 4 (Skutskär-auditen, 2026-08-22): pressminnet. Satt av
   *  generatePressConference() när frågan är en storyline-override —
   *  `press_storyline_${story.id}`. Callern (roundProcessor.ts) loggar denna
   *  som en narrativeBeatLog-post NÄR EVENTET GENERERAS (frågan visas), inte vid
   *  resolution — repetitionen auditen fångade var i FRÅGAN, inte svaret.
   *  storylineBudgetOk() i pressConferenceService.ts läser samma logg och
   *  tillåter högst två poster per storyline-id och säsong (en huvudfråga,
   *  en uppföljning). undefined för icke-storyline-frågor. */
  storylinePressKey?: string
  /** HIGH 7 (audit 2026-08-29, docs/incoming/
   *  BANDY_MANAGER_AUDIT_5_SASONGER_KUL_STICKINESS_VISUELL_2026-08-29.md):
   *  cooldown-nycklarna för de manager-svar som ERBJÖDS i den här
   *  presskonferensen (`press_response_${response.id}`, en per choice —
   *  inte bara det svaret spelaren till slut klickar). Satt av
   *  generatePressConference() (pressConferenceService.ts). Callern
   *  (roundProcessor.ts) loggar var och en som en narrativeBeatLog-post
   *  NÄR EVENTET GENERERAS (frågan visas) — samma skrivmönster som
   *  storylinePressKey/mecenatSocialKey. buildPressResponses() läser samma
   *  logg (isOnCooldown, minSeasonsApart=1) för att undvika att exakt
   *  samma replik erbjuds igen samma säsong. undefined för icke-press-events. */
  pressResponseKeys?: string[]
  /** Medium 4 (Skutskär-auditen, 2026-08-22): per-INSTANS "därför nu"-signal
   *  — samma fyra former och samma låsta copy som contentContract.ts:s
   *  typ-nivå-fält (getWhyNowLine, oförändrad), men satt på EVENTET, inte
   *  bara på dess GameEventType. Löser "en bastuinbjudan och ett irreversibelt
   *  stjärnsälj delar samma typ men inte samma brådska" — getEffectiveWhyNowLine
   *  (contentContract.ts) läser denna FÖRST, faller tillbaka på typ-raden.
   *  Sätts bara vid konstruktionsstället när formen är grundad i faktisk,
   *  spårad data för DEN HÄR instansen — aldrig gissat för att täcka en typ. */
  whyNow?: {
    deadlineLabel?: string
    whyNowPerson?: string
    wholeEventIrreversible?: boolean
    seasonDefining?: boolean
  }
  /** Medium 2 (Skutskär-auditen, 2026-08-22): mecenat-socialpoolens säsongsminne.
   *  Satt av generateSocialEvent() (mecenatService.ts) till `mecenat_social_${type}`
   *  — samma bastuinbjudan (eller vilken social-typ som helst) fick tidigare rulla
   *  om obegränsat eftersom varje mecenat höll sitt EGET `lastSocialRound`-minne,
   *  utan koppling mecenater emellan eller mellan typer. Callern (roundProcessor.ts)
   *  loggar denna som en narrativeBeatLog-post när eventet genereras — samma
   *  skrivmönster som storylinePressKey. mecenatSocialBudgetOk()/mecenatSocialUsedTypes()
   *  (mecenatService.ts) läser samma logg: max två sociala mecenatbeats per säsong
   *  totalt, aldrig samma typ två gånger. */
  mecenatSocialKey?: string
  /** SPÅR 3, A-H4a (SEXSÄSONGSAUDITEN 2026-08-26, docs/incoming/
   *  BANDY_MANAGER_AUDIT_6_SASONGER_2026-08-26.md #H4): journalistreportagets
   *  säsongs- och spelarrotationsminne. Satt av `generateJournalistExclusiveEvent`
   *  (eventFactories.ts) till `journalist_exclusive_player_${player.id}` —
   *  den gamla dedupen jämförde `roundPlayed` mot sig självt (alltid sant,
   *  aldrig en spärr) och valde alltid lagets högst rankade friska spelare,
   *  vilket lät samma spelare (och samma citat) återkomma flera gånger per
   *  karriär, inklusive två raka slutspelsmatcher. Callern (roundProcessor.ts)
   *  loggar denna som en narrativeBeatLog-post NÄR EVENTET GENERERAS — samma
   *  skrivmönster som storylinePressKey/mecenatSocialKey. Läses av
   *  `journalistExclusiveBudgetOk`/`pickJournalistExclusiveSubject`
   *  (postAdvanceEvents.ts): högst en gång per säsong totalt, och inte samma
   *  spelare igen förrän hela den aktuella truppen rullat ett varv. */
  journalistExclusiveKey?: string
}

// ── Follow-up system ──────────────────────────────────────────────────────

export interface FollowUp {
  id: string
  triggerEventId: string
  matchdaysDelay: number
  createdMatchday: number
  type: string
  data?: Record<string, unknown>
}

export interface TransferBid {
  id: string
  playerId: string
  buyingClubId: string
  sellingClubId: string
  offerAmount: number
  offeredSalary: number
  contractYears: number
  direction: 'incoming' | 'outgoing'
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  createdRound: number
  expiresRound: number
  counterCount?: number
  bidRejectedByPlayer?: boolean  // C-T1: player refused after club accepted
}
