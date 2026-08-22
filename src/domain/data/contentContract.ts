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

/**
 * Medium 4 (Skutskär-auditen, 2026-08-22): "Prioritera per undertyp/instans,
 * inte bara GameEventType. En bastu är normal; ett irreversibelt stjärnsälj
 * eller ett faktiskt ultimatum är pivotal." getWhyNowLine() läste tidigare
 * ENBART den TYP-nivå-rad Jacobs D1-dom (2026-08-21) explicit band den till
 * — alla instanser av t.ex. `criticalEconomy` (en bastuinbjudan OCH ett
 * stjärnsälj-ultimatum delar samma GameEventType) fick antingen samma
 * critical-status eller samma nedgradering, aldrig särskiljda.
 *
 * `event.whyNow` (GameEvent.ts) är den nya, PER-INSTANS-satta motsvarigheten
 * — samma fyra fält, samma låsta copy (getWhyNowLine ändras inte, bara VAR
 * den läser ifrån). Konstruktionsstället sätter den bara när formen faktiskt
 * är grundad i spårad data för DEN HÄR instansen (D1:s egen disciplin,
 * oförändrad) — instansen vinner över typ-raden om båda är satta, eftersom
 * en instans-specifik brådska alltid är mer exakt än en typ-generell.
 */
export function getEffectiveWhyNowLine(event: { type: string; whyNow?: Pick<ContentContractEntry, 'deadlineLabel' | 'whyNowPerson' | 'wholeEventIrreversible' | 'seasonDefining'> }): string | null {
  const instanceLine = getWhyNowLine(event.whyNow)
  if (instanceLine) return instanceLine
  return getWhyNowLine(getContentContractEntry('GameEventType', event.type))
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
    trigger: 'postAdvanceEvents.ts:~599 (generateSponsorOffer, sponsorService.ts) — en gång per omgång om activeSponsors<maxSponsors.',
    stateEffect: `Plain (ingen rival i samma kategori): 'accept' lägger till sponsorn, ingen kostnad. 'reject': noOp — ren kvitteringsknapp, O2-dominansfynd (0f96f1c2). Konfliktvariant (O1, 2026-08-22, en aktiv sponsor i samma kategori finns redan): 'accept' lägger till den nya OCH nollställer rivalens contractRounds (avtalet slutar) OCH communityStanding -6. 'reject': noOp, rivalen behåller sin plats.`,
    systems: ['ekonomi', 'communityStanding (bara konfliktvarianten)'],
    lifespan: 'engångs',
    recallSurface: 'ingen',
    notes: 'O1 (DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md) — sponsorn med ett problem, högst prioriterade kandidaten, byggd 2026-08-22. 4/5 av mallen: punkt 2 (spelare/funktionär redan mött) ouppfylld, sponsorer är företag. Därför INTE systemhandelse:true. Text (title/body/subtitles på konfliktvarianten) väntar Opus — placeholder \'[Opus]\' i koden.',
  },

  // ── De fyra kritiska typerna (Jacobs order, 2026-08-22) — spårade FÖRST,
  // före de återstående 85, eftersom D1 punkt 4:s self-kontroll (2026-08-21)
  // nedgraderar ALLA fyra till 'normal' tills whyNow-data finns här. whyNow-
  // fälten lämnas medvetet TOMMA — se notes för vad var och en saknar.
  // Opus skriver raderna där en form faktiskt går att grunda i text.
  playerUnhappy: {
    trigger: 'player.morale < 35 OCH bänkad (ej startande) i minst 2 av senaste 3 spelade matcher för hanterade klubben (postAdvanceEvents.ts:128-151).',
    stateEffect: `'promise'-valet: boostMorale +10 (targetPlayerId). 'hold': noOp — missnöjet kvarstår oadresserat, ingen nedåtgående konsekvens modellerad om spelaren ignoreras.`,
    systems: ['spelarmoral'],
    lifespan: 'engångs per säsong (event-id inkluderar currentSeason — samma spelare kan trigga igen nästa säsong)',
    recallSurface: 'ingen',
    notes: 'whyNow SAKNAS. Bäst grundade kandidat: "person väntar" (whyNowPerson) — spelaren i relatedPlayerId är bokstavligen den som väntar på besked, förnamnet är redan känd data, inte påhittat. Men OM detta faktiskt bär tillräcklig brådska för overlay/pivotal-behandling (jämfört med t.ex. hesitantPlayer, som redan är overlay-fri) är ett tonval — flaggat, inte satt.',
  },
  economicStress: {
    trigger: 'managedClub.finances mellan -100 000 och +50 000 kr ("stress-zonen"), throttlead till max 1 händelse per 6 omgångar (game.lastEconomicStressRound). Tre slumpmässigt valda flavor-varianter (materialarens klubbor / bussbolagets avtal / kioskvaktens korvavtal), ingen unik semantisk identitet per variant.',
    stateEffect: 'Litet ekonomiskt val per variant: -5000 till +4000 kr, eller en moraleDelta -2 (materialar-variantens "vänta"-val). Ingen av de tre bär en verklig kris.',
    systems: ['ekonomi'],
    lifespan: 'engångs, kan återkomma var 6:e omgång så länge zonen gäller',
    recallSurface: 'ingen',
    notes: 'whyNow SAKNAS — och detta är den mest tveksamma av de fyra. Innehållet (klubbinköp, korvavtal) bär ingen verklig brådska i NÅGON av de tre varianterna. Detta kan vara fel typ att ge overlay-behandling ÖVERHUVUDTAGET — om Opus dömer att ingen whyNow-form passar bör svaret vara att sänka basprioriteten i getEventPriority (GameEvent.ts), inte att skriva en konstruerad brådskerad.',
  },
  mecenatEvent: {
    trigger: 'ÅTTA separata undertyper, samma GameEventType, olika villkor (mecenatService.ts): (a) generateMecenatIntroEvent — ny mecenat presenterar sig, triggervillkor satt vid mecenat-generering, ej vidare spårat. (b) generateSocialEvent — periodisk social inbjudan (jakt/middag/golf/bastu/vin/segling/hockey/vernissage), typ vald slumpmässigt ur mecenatens businessType, säsongsfiltrerad. (c–f) generateSilentShoutEvent — fyra trösklar på mecenat.silentShout: 30–49 medieomnämnande (15% chans/omgång), 50–69 transferförslag (20% chans, kräver namngiven spelare), 70–89 taktikpress (15% chans, kräver ej redan offensiv taktik), 90+ styrelsehot (20% chans). (g) generateMecenatConflictEvent — två mecenater med motstridiga önskemål, triggervillkor ej vidare spårat. (h) generateMecenatAllianceEvent — två mecenater vill samfinansiera samma projekt, triggervillkor ej vidare spårat. (i) checkMecenatRetirement — mecenat.yearsActive ≥ retirementThreshold (default 6) ELLER age ≥ 70, ej redan announced.',
    stateEffect: 'Nästan alla varianter: mecenatHappiness ±5 till ±30 beroende på val. Konflikt/allians: multiEffect på båda mecenaternas happiness samtidigt. Retirement: ingen direkt stateeffekt i själva announcement-eventet.',
    systems: ['mecenatrelation', 'ekonomi (enstaka varianter, t.ex. intervention-kostnad)'],
    lifespan: 'engångs per tillfälle — silentShout-varianterna kan återkomma om siffran stiger igen efter en tidigare händelse',
    recallSurface: 'ingen enhetlig — varierar per undertyp, ej kartlagd denna session',
    notes: 'whyNow SAKNAS, och frågan är svårare än för de andra tre: 8 verkliga undertyper delar ETT contentContract-id. En enda whyNow-rad kan inte rättvist representera alla åtta (en 90+ styrelsehot-händelse bär uppenbart mer brådska än en golfinbjudan). Om Opus vill aktivera mekanismen träffsäkert för mecenatEvent krävs sannolikt ett beslut PER undertyp (t.ex. bara styrelsehot-varianten får whyNow), vilket i sin tur kräver att event-konstruktionen kan skicka undertyps-specifik whyNow-data — en mindre kodändring utöver bara textrader. Flaggat, inte byggt.',
  },
  criticalEconomy: {
    trigger: 'managedClub.finances < -200 000 kr (economicCrisisService.ts). Fas 1 (awareness) triggar direkt. Fas 2 (pressure) triggar 3 omgångar efter fas 1 startade, om ej redan löst. Fas 3 (decision) triggar 5 omgångar efter fas 1, om ej löst.',
    stateEffect: 'Fas 1: inget direkt, möte bokas. Fas 2: "present_plan" −20 000 kr, "accept_loss" löser krisen naturligt. Fas 3 (tre vägar): "sell_star" +350 000 kr + spelaren SÄLJS (permanent), "take_loan" +300 000 kr löpande kostnad, "ask_mecenat" +200 000 kr − mecenatlojalitet 30. Fas 3s sell_star är redan O19-märkt systemhandelse:true.',
    systems: ['ekonomi', 'spelartrupp (fas 3, sälj-alternativet)', 'mecenatrelation (fas 3, mecenat-alternativet)'],
    lifespan: 'en sammanhängande båge över minst 5 omgångar (fas 1→2→3), sedan löst för säsongen',
    recallSurface: 'ingen',
    notes: 'whyNow SAKNAS, men detta är den STARKASTE kandidaten av de fyra. Fas 1 och 2s kroppstext antyder redan deadlines ("Jag vill träffa dig. I morgon.", "inom två veckor") men INGEN av dem är en mekanisk deadline i koden (fas 3 triggar strikt matchday-baserat, oavsett vad texten lovar) — att sätta deadlineLabel från dessa citat vore att koda in ett löfte texten inte håller, samma klass av fel som playerPraise-fyndet. Renare kandidat: wholeEventIrreversible på fas 3 — men bara ETT av dess tre val (sell_star) är faktiskt irreversibelt, inte hela eventet, så D1s befintliga CHOICE-nivå-mekanism (punkt 3, redan byggd) är rätt verktyg där, inte event-nivå. Cross-referens: sell_star-valet saknar fortfarande consequenceLevel/irreversible (D1 punkt 3s fält, "opt-in, inga befintliga events sätter dem än") — värt att sätta OAVSETT whyNow-beslutet, separat, litet jobb.',
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
