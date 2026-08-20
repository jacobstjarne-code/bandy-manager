/**
 * INNEHÅLLSKONTRAKTET (O11, SLUTTEST_KO.md) — `docs/DOM_INNEHALLSKONTRAKTET_2026-08-17.md`.
 *
 * Rapportera-först besvarad, 2026-08-20: NEJ, inget enat register finns.
 * Fyra separata källor, ingen av dem en tabell: `GameEventType` (48 värden,
 * GameEvent.ts), `StorylineType` (22, Narrative.ts), `ArcType` (8,
 * Narrative.ts), `PORTAL_BEATS` (17 id:n, portalBeats.ts — den enda som
 * redan ÄR en array, inte bara en typ). 48+22+8+17 = 95 distinkta
 * narrativa former, matchar domens egen storleksuppskattning (~90-100).
 * Samma arbete som `U5`:s semanticKey-kartläggning, byggda ihop per domens
 * egen instruktion ("gör dem tillsammans, inte två gånger") — U5 var klar
 * (`4e341891`) innan detta pass startade.
 *
 * TÄCKNINGSLÄGE (ärligt, inte optimistiskt): exakt 95 rader, en per
 * canonical id ur de fyra källorna — registret är strukturellt komplett
 * och användbart som HÄNGSTABELL nu (test: contentContract.test.ts).
 * Bara en delmängd har alla sex fälten ifyllda (`filled: true`) — de
 * spårade under detta och tidigare pass i samma session (domens motiverande
 * felfall, sju pivotal beats, O2-dominansrevisionens granskade val). Resten
 * är `filled: false`, TODO-rader. Att fylla i alla 95 korrekt kräver att
 * varje källa läses individuellt — inte något att gissa sig igenom för
 * hastighetens skull, exakt det kontraktet finns för att förhindra.
 *
 * ENFORCEMENT (grinden som "failar bygget") är INTE byggd i detta pass —
 * domens "Godkänd när"-rad nämner `scripts/eventGuardInstrument.ts` som
 * del av grinden, en separat, större leverans. Detta pass svarar
 * rapportera-först-frågan och bygger registret; att koppla på en byggtid-
 * kontroll som vägrar merge av ofyllda rader är nästa steg, inte detta.
 *
 * KOPPLING TILL D1 PUNKT 4 (Jacobs dom, 2026-08-21): "därför nu"-radens
 * getWhyNowLine() läser HÄRIFRÅN (per GameEventType-rad), inte från
 * event-instansen. Ingen av de sex nu ifyllda raderna bär whyNow-data —
 * mecenatEvent/economicStress/playerUnhappy/criticalEconomy (de fyra typer
 * som faktiskt routas kritiskt, se getEventPriority i GameEvent.ts) är
 * fortfarande `filled: false`. Tills en av dem spåras och en av de fyra
 * whyNow-formerna grundas i verklig data, nedgraderar getEffectivePriority
 * (eventQueueService.ts) alla kritiska events till 'normal' — MEDVETET,
 * inte en bugg. Mekanismen aktiveras rad för rad när registret fylls i,
 * aldrig genom att gissa en brådskerad för att täcka en typ.
 */

export type ContractSource = 'GameEventType' | 'StorylineType' | 'ArcType' | 'PortalBeat'

export interface ContentContractEntry {
  id: string
  source: ContractSource
  /** Fält 1 — exakt villkor, inte en approximation. */
  trigger?: string
  /** Fält 2 — vilka fält ändras, riktning + storleksordning. 'ambient — ingen
   *  state-effekt' är ett giltigt, avsiktligt svar (domens egen regel: om
   *  svaret är "ingen" är det en notis, inte ett beslut). */
  stateEffect?: string
  /** Fält 3 — minst 1 system/person för en vanlig händelse, minst 2 som
   *  pekar isär för en systemhändelse (varsel-mallen). */
  systems?: string[]
  /** Fält 4 — engångs / N omgångar / säsongsslut / permanent. */
  lifespan?: string
  /** Fält 5 — bågens semanticKey (per båge, inte per säsong) + cooldown i
   *  säsonger. undefined cooldown på en satt semanticKey = ingen spärr. */
  semanticKey?: string
  cooldownSeasons?: number
  /** Fält 6 — var spelaren kan se att det hände efteråt. Alltid en explicit
   *  sträng, ALDRIG undefined — 'ingen' är ett giltigt, medvetet svar för
   *  ambient (skiljer "inte bedömt än" från "bedömt: ingen yta finns"). */
  recallSurface?: string
  /** true = alla sex fält verifierade mot koden. false = platshållare. */
  filled: boolean
  notes?: string

  // ── D1 punkt 4 ("därför nu"-raden) — Jacobs dom 2026-08-21: getWhyNowLine
  // läser HÄR, inte på event-instansen. Fälten sätts bara när en av de fyra
  // formerna kan grundas i faktisk, spårad data för denna rad — aldrig som
  // gissning för att "täcka" en pivotal-klassad typ. En rad utan whyNow-fält
  // är enligt domen inte pivotal, och getEffectivePriority (eventQueueService.ts)
  // nedgraderar den till 'normal' tills raden faktiskt spåras och fylls i.
  /** Redan-formaterad tidpunkt, t.ex. "omgång 14", "transferfönstret stänger". */
  deadlineLabel?: string
  /** Förnamnet på den som väntar på besked. */
  whyNowPerson?: string
  /** HELA eventet (inte ett enskilt val, se EventChoice.irreversible för det) går inte att göra ogjort. */
  wholeEventIrreversible?: boolean
  /** Det som avgörs här bär hela säsongen. */
  seasonDefining?: boolean
}

/**
 * D1 (DOM_D1_EVENTVIKTNING_2026-08-19.md) punkt 4 — "därför nu"-raden.
 * "Den sista punkten är den viktigaste: 'därför nu'-raden är inte dekoration
 * på pivotal, den är kriteriet för pivotal." Fem former, denna funktion
 * returnerar den FÖRSTA som matchar i domens prioritetsordning, eller null
 * om ingen av de fyra formerna är satt på contentContract-raden — då är
 * eventet enligt domen inte pivotal, vikten sänks (getEffectivePriority i
 * eventQueueService.ts). Copy ordagrant låst i domen, ingen ny text här.
 */
export function getWhyNowLine(entry: Pick<ContentContractEntry, 'deadlineLabel' | 'whyNowPerson' | 'wholeEventIrreversible' | 'seasonDefining'> | undefined): string | null {
  if (!entry) return null
  if (entry.deadlineLabel) return `Svaret måste komma före ${entry.deadlineLabel}.`
  if (entry.whyNowPerson) return `${entry.whyNowPerson} väntar på besked.`
  if (entry.wholeEventIrreversible) return 'Det här går inte att göra ogjort.'
  if (entry.seasonDefining) return 'Det som bestäms här bär hela våren.'
  return null
}

const GAME_EVENT_TYPE_IDS = [
  'transferBidReceived', 'contractRequest', 'playerUnhappy', 'starPerformance', 'sponsorOffer',
  'pressConference', 'dayJobConflict', 'bidWar', 'hesitantPlayer', 'communityEvent', 'patronEvent',
  'politicianEvent', 'hallDebate', 'hallProcess', 'licenseHandlingsplan', 'kommunMote', 'gentjanst',
  'icaMaxiEvent', 'patronInfluence', 'spoksponsor', 'detOmojligaValet', 'varsel', 'playerMediaComment',
  'playerPraise', 'captainSpeech', 'playerArc', 'supporterEvent', 'mecenatInteraction',
  'journalistExclusive', 'retirementCeremony', 'economicStress', 'mecenatEvent', 'academyEvent',
  'playoffEvent', 'bandyLetter', 'criticalEconomy', 'schoolAssignment', 'mecenatDinner',
  'refereeMeeting', 'riskySponsorOffer', 'mecenatWithdrawal', 'patronWithdrawal', 'mediaReaction',
  'fanLetter', 'opponentQuote', 'csPress', 'playThroughInjury', 'seasonGoalHalfway',
] as const

const STORYLINE_TYPE_IDS = [
  'rescued_from_unemployment', 'went_fulltime_pro', 'refused_to_go_pro', 'left_for_bigger_club',
  'returned_to_club', 'workplace_bond', 'journalist_feud', 'journalist_redemption', 'promotion_sacrifice',
  'career_crossroads_stayed', 'underdog_season', 'relegation_escape', 'gala_winner', 'partner_moved_here',
  'captain_rallied_team', 'hungrig_breakthrough', 'joker_vindicated', 'veteran_farewell', 'veteran_stayed',
  'lokal_hero_moment', 'contract_drama_resolved', 'derby_echo_resolved',
] as const

const ARC_TYPE_IDS = [
  'hungrig_breakthrough', 'joker_redemption', 'veteran_farewell', 'veteran_final_season',
  'ledare_crisis', 'lokal_hero', 'contract_drama', 'derby_echo',
] as const

// Egen lista (inte importerad från portalBeats.ts) — samma motiv som O6/B12
// hela sessionen: contentContract ska kunna granskas utan att köra kod, och
// en importerad array kan tysta driva isär sig från denna fil om källan
// ändras utan att någon minns att uppdatera registret. Test:et nedan
// jämför INTE mot PORTAL_BEATS.length automatiskt av samma skäl — en
// avsiktlig, synlig lista, inte en beräknad.
const PORTAL_BEAT_IDS_ALL = [
  'board_failure', 'ripple_consequence', 'callback_streak', 'callback_derby_memory', 'callback_snub',
  'callback_sale', 'callback_nemesis', 'callback_legend_mentor', 'callback_legend_debut',
  'callback_legend_record', 'season_opener', 'first_win', 'first_derby', 'halftime',
  'transfer_window_open', 'last_league_round', 'facility_completed',
] as const

function basePlaceholder(id: string, source: ContractSource): ContentContractEntry {
  return { id, source, filled: false }
}

// ── Ifyllda rader — merge:as in på canonical id, ersätter platshållaren ──
// Källor: domens motiverande felfall (Varför-tabellen), pivotal-beats
// spårade under U5 forts (denna session), O2-dominansrevisionens granskade val.
const FILLED: Partial<Record<string, Omit<ContentContractEntry, 'id' | 'source' | 'filled'>>> = {
  hesitantPlayer: {
    trigger: `Transferbud där bid.buyingClubId har lägre reputation än spelarens nuvarande klubb (hesitantPlayerEvent, eventFactories.ts:40)`,
    stateEffect: `'convince': boostMorale +15 (targetPlayerId=bid.playerId). 'accept': noOp — verifierat av O2-revisionen (2026-08-20), ingen dold effekt.`,
    systems: ['spelarmoral', 'transferbud'],
    lifespan: 'engångs',
    semanticKey: 'hesitant_player',
    cooldownSeasons: 0,
    recallSurface: 'ingen — modal stängs, ingen loggpost',
    notes: 'Domens eget referensfall för O2. Ärligt: bara två val, ingen tredje "no-op med löfte om mer"-risk kvar i denna specifika event.',
  },
  playerPraise: {
    trigger: 'Spelare med hög form/matchbelastning triggar praise-event (playerPraiseEvent-mönstret, eventFactories.ts ~199)',
    stateEffect: `'vila'-valet: boostMorale +10 — INTE en fitness/vila-effekt, spelaren spelar nästa match som vanligt. Domens Varför-tabell citerar just detta som exempel på ett löfte texten INTE höll ("Ge honom vila" → spelaren vilade inte).`,
    systems: ['spelarmoral'],
    lifespan: 'engångs',
    recallSurface: 'ingen',
    notes: 'Kvarstående gap, inte fixat i detta pass — texten kan fortfarande lova mer än effekten ger. Kräver Opus-text för att antingen korrigera löftet eller bygga en riktig vila-mekanik.',
  },
  sponsorOffer: {
    trigger: 'sponsorEvents.ts:~15-36 — exakt villkor ej vidare spårat denna session',
    stateEffect: `'send_player'-valet: income +5000, communityStanding +2, ingen modellerad kostnad. 'decline': noOp.`,
    systems: ['ekonomi', 'samhällsstöd'],
    lifespan: 'engångs',
    recallSurface: 'ingen',
    notes: 'O2-dominansfynd (0f96f1c2) — send_player dominerar decline i ren effekt-mening (se O2-rapporten för hela listan av 13 fynd).',
  },
}

const PIVOTAL_FILLED: Partial<Record<string, Omit<ContentContractEntry, 'id' | 'source' | 'filled'>>> = {
  board_failure: {
    trigger: `boardObjectives.some(status==='failed') (portalBeats.ts:134)`,
    stateEffect: 'Ingen mekanisk state-effekt — ren text/severity-eskalering (1→2→3) baserad på boardPatience. Ambient-liknande i mekanik, men severity 3 renderas som kris-band.',
    systems: ['styrelsens tålamod'],
    lifespan: 'N omgångar (tills nästa boardObjective-utvärdering)',
    semanticKey: 'board_failure',
    cooldownSeasons: 2,
    recallSurface: 'ingen egen — härleds ur boardObjectives-status i Portal',
    notes: 'Pivotal (U5 forts, c2e34591). keyFn bakar in severity+säsong i den nyckel som skrivs till shownBeats — isOnCooldown matchar separat mot det stabila beat.id.',
  },
  ripple_consequence: {
    trigger: 'pendingRippleChains[0].round === currentMatchday (portalBeats.ts:175)',
    stateEffect: 'Ingen egen — renderar en redan beräknad rippleEffectService-kedja (stjärnskada/derbyseger/mecenatavhopp), stegvis lista + klausul.',
    systems: ['varierar per trigger (Orten/Styrelsen/Sponsorerna, se STEP_VERBS)'],
    lifespan: 'engångs (visas en gång; kedjan finns kvar i arrayen för ev. framtida konsument, t.ex. en granska-vy)',
    semanticKey: 'ripple_consequence',
    cooldownSeasons: 2,
    recallSurface: 'ingen (framtida granska-vy nämnd som möjlig, inte byggd)',
    notes: 'Pivotal. keyFn (trigger+omgång+säsong) matchar aldrig "ripple_consequence" som sträng — en extra logNarrativeBeat-post på beat.id krävdes separat i dismissBeat för att isOnCooldown ska hitta träffen.',
  },
}

export const CONTENT_CONTRACT: ContentContractEntry[] = [
  ...GAME_EVENT_TYPE_IDS.map(id => ({ ...basePlaceholder(id, 'GameEventType'), ...(FILLED[id] ? { ...FILLED[id], filled: true } : {}) })),
  ...STORYLINE_TYPE_IDS.map(id => basePlaceholder(id, 'StorylineType')),
  ...ARC_TYPE_IDS.map(id => basePlaceholder(id, 'ArcType')),
  ...PORTAL_BEAT_IDS_ALL.map(id => ({ ...basePlaceholder(id, 'PortalBeat'), ...(PIVOTAL_FILLED[id] ? { ...PIVOTAL_FILLED[id], filled: true } : {}) })),
]

/** Slagning mot registret — O(n) över 95 rader, ingen indexering behövs vid denna storlek. */
export function getContentContractEntry(source: ContractSource, id: string): ContentContractEntry | undefined {
  return CONTENT_CONTRACT.find(e => e.source === source && e.id === id)
}
