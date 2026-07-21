import type { SaveGame } from '../entities/SaveGame'
import type { ScandalType } from './scandalService'
import { InboxItemType } from '../enums'
import { getCharacterName } from './supporterService'
import { RIVAL_SALE_KAFFERUM, INCOMING_BID_KAFFERUM } from '../data/transferResponseText'
import { pickAnniversaryKafferum } from '../data/anniversaryKafferumText'
import { fillTemplate } from '../data/matchCommentary'
import { ANTICIPATION_KAFFERUM } from '../data/anticipationKafferumText'
import { getFatigueState } from './decisionFatigueService'
import { getUpcomingAnchor } from './calendarLookahead'
import { TRANSFER_DEADLINE_ROUND } from './portal/triggers/transferTriggers'
import { getNextManagedFixture } from './portal/triggers/matchTriggers'
import { FAREWELL_MATCH_STRINGS } from '../data/retirementText'
import { getFarewellMatchPlayer } from './retirementService'
import { COFFEE_ROOM_QUESTIONS, COFFEE_ROOM_QUESTION_SPEAKER, type CoffeeRoomAnswerOption } from '../data/coffeeRoomQuestionsText'

function hashSeed(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}

/** A2 (2026-07-19) — D1: Sture vänder sig till spelaren, tredje beaten. */
export interface CoffeeRoomQuestionPrompt {
  questionId: string
  speaker: string
  text: string
  answers: [CoffeeRoomAnswerOption, CoffeeRoomAnswerOption]
}

/**
 * D4-regressionsfix (2026-07-21) — enkelröstad reaktion utan naturlig
 * andra-talare (rival-sälj, inkommande bud, årsdagsekon, avskedsmatch,
 * resultatkommentar). Renderas som en rad, inte en tvåpersonsväxel.
 */
export interface CoffeeNarratorLine {
  speaker?: string
  text: string
}

export interface CoffeeScene {
  exchanges: Array<[string, string, string, string]>
  /** B9 T1B — index i pool som valdes; sparas i SaveGame.lastCoffeeSceneIndices */
  pickedIndices: number[]
  meta: {
    title: string
    subtitle?: string
  }
  /** D1 — gated tillägg, en gång per besök, bara på rutinbesök (generiska poolen). */
  question?: CoffeeRoomQuestionPrompt
  /** D3 — satt när scenen visar en återkomst; completeScene tar bort den ur coffeeRoomPendingReturns. */
  consumedReturnQuestionId?: string
  /** D4-regressionsfix — se CoffeeNarratorLine. Ersätter exchanges för det besöket när satt. */
  narratorLine?: CoffeeNarratorLine
}

const GENERIC_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kioskvakten', 'Ingen kommer betala 25 kr för en korv i den här kylan.', 'Kassören', 'Det sa du förra året. Vi sålde slut.'],
  ['Materialaren', 'Tre klubbor gick sönder igår.', 'Vaktmästaren', 'Beställ fem. Det blir kallt i veckan.'],
  ['Kassören', 'Har vi råd med nya tröjor?', 'Ordföranden', 'Har vi råd att INTE ha nya tröjor?'],
  ['Webbredaktören', 'Hemsidan hade 400 besök igår.', 'Kioskvakten', 'Hur många köpte korv?'],
  ['Vaktmästaren', 'Jag var ute klockan fem imorse.', 'Materialaren', 'Du säger det varje dag.'],
  ['Kassören', 'Sponsoravtalet med ICA går ut.', 'Ordföranden', 'Ring dom. Bjud på kaffe. Och korv.'],
  // Placeholder — byts ut mot dynamisk ungdomsspelare i getCoffeeRoomQuote
  ['Ungdomstränaren', '{youthName} i P19 börjar likna något.', 'Materialaren', 'Ge honom inte för stora tröjor.'],
  // Fler vardagsutbyten (Opus 2026-05-21) — bruksklubbs-vardag, Sture-ton
  ['Vaktmästaren', 'Kaffekokaren gav upp i halvtid igår.', 'Kioskvakten', 'Den höll längre än backlinjen.'],
  ['Kassören', 'Tre medlemmar har inte betalat.', 'Ordföranden', 'Jag vet vilka. Jag tar det på Konsum.'],
  ['Materialaren', 'Slipmaskinen låter inte som den ska.', 'Vaktmästaren', 'Den har låtit så i sex år. Den slipar ändå.'],
  ['Webbredaktören', 'Klippet från träningen fick tusen visningar.', 'Materialaren', 'Var det det med när du ramlade?'],
  ['Vaktmästaren', 'Värmen i klubbhuset är trasig igen.', 'Ordföranden', 'Sätt på dig något. Vi lagar den till våren.'],
  ['Ungdomstränaren', 'Två P19-killar kom för sent igen.', 'Vaktmästaren', 'Jag öppnar inte tidigare för det.'],
  ['Materialaren', 'Vi behöver nya bollar till våren.', 'Kassören', 'Skriv upp det. Listan är redan lång.'],
  ['Ordföranden', 'Bussbolaget höjde priset för bortamatcherna.', 'Kassören', 'Då sjunger laget hela vägen. Billigt nöje.'],
  ['Vaktmästaren', 'Isen bar inte i morse. För milt.', 'Materialaren', 'Det vänder. Det gör det alltid.'],
  ['Webbredaktören', 'Lokaltidningen vill ha en intervju med dig.', 'Ordföranden', 'Säg att jag är på isen. Det är jag ofta nog.'],
  ['Kassören', 'Kaffet i kafferummet är slut.', 'Kioskvakten', 'Köp på Konsum. Inte det dyra.'],
  ['Materialaren', 'Ungdomarna växer ur skridskorna fortare än vi hinner köpa.', 'Ungdomstränaren', 'Låt dem ärva. Vi gjorde det.'],
  // Utökning (Opus 2026-05-23) — brunnen var för grund, 19 rader för ett inslag som visas varje matchdag.
  // Samma ton: konkret bild, ingen förklaring, ellipsis över utrop. Sture-Forsbacka.
  ['Vaktmästaren', 'Spolade i går kväll. Det höll till morgonen.', 'Materialaren', 'Mer än man kan säga om förra veckan.'],
  ['Kioskvakten', 'Termosarna tog slut redan i första.', 'Kassören', 'Folk stannar när det går bra. Köp fler.'],
  ['Materialaren', 'En av sargbitarna sitter löst igen.', 'Vaktmästaren', 'Jag tar den på lördag. Den håller till dess.'],
  ['Ordföranden', 'Kommunen ringde om hyran.', 'Kassören', 'Sa du något?'],
  ['Kassören', 'Vi gick plus på lottringen.', 'Ordföranden', 'Då fryser vi inte i pausen i alla fall.'],
  ['Vaktmästaren', 'Det snöade in genom taket på läktaren.', 'Materialaren', 'Samma hörn som alltid?'],
  ['Kioskvakten', 'En av grabbarna glömde skridskorna hemma.', 'Ungdomstränaren', 'Han glömmer dem en gång. Sen aldrig mer.'],
  ['Materialaren', 'Nya bollarna kom. Fel färg.', 'Vaktmästaren', 'De rullar likadant.'],
  ['Webbredaktören', 'Någon klagade på matchreferatet.', 'Ordföranden', 'Då läste i alla fall någon det.'],
  ['Kassören', 'Elräkningen kom. Den var hög.', 'Vaktmästaren', 'Isen kostar. Det har den alltid gjort.'],
  ['Vaktmästaren', 'Plogbilen gick sönder mitt i.', 'Materialaren', 'Då skottar vi. Vi har gjort det förr.'],
  ['Ungdomstränaren', 'P16 vann med åtta mål i går.', 'Kioskvakten', 'Säg inget till dem. De blir bara kaxiga.'],
  ['Kioskvakten', 'Kaffet är slut igen.', 'Materialaren', 'Det är alltid slut. Det är liksom poängen med det.'],
  ['Ordföranden', 'Styrelsemötet drog över en timme.', 'Kassören', 'Vi sa samma sak som förra gången.'],
  ['Materialaren', 'Han glömde tröjorna i tvätten över helgen.', 'Vaktmästaren', 'De luktar. Men de håller.'],
  ['Vaktmästaren', 'Det var fjorton grader kallt i morse.', 'Kioskvakten', 'Då säljer vi soppa. Inte glass.'],
  ['Kassören', 'Bortalaget hörde av sig om bussen.', 'Ordföranden', 'De hittar hit. Alla gör det till slut.'],
  ['Webbredaktören', 'Bilden från matchen blev suddig.', 'Materialaren', 'Den fångade stämningen i alla fall.'],
  ['Ungdomstränaren', 'En förälder ville prata om speltid.', 'Vaktmästaren', 'Det vill de alltid. Lyssna och nicka.'],
  ['Materialaren', 'Slipstenen är nästan slut.', 'Kassören', 'Skriv upp den. Under bollarna.'],
  ['Kioskvakten', 'Det kom folk redan en timme före.', 'Ordföranden', 'Då är det något på gång.'],
  ['Vaktmästaren', 'Belysningen flimrar på ena halvan.', 'Materialaren', 'Spela mot det hållet i andra. Då märks det inte.'],
  ['Kassören', 'Vi fick en gåva från en gammal spelare.', 'Ordföranden', 'Skriv ett kort. Med handen.'],
  ['Ungdomstränaren', 'Den lille backen vägrar lämna isen.', 'Materialaren', 'Låt honom vara kvar en stund till.'],
  ['Vaktmästaren', 'Någon hade lämnat grinden öppen.', 'Kioskvakten', 'Räven igen, kanske.'],
  ['Kassören', 'Medlemsavgifterna trillar in nu.', 'Ordföranden', 'Det gör de alltid när det vänder.'],
]

// Transfer-triggered exchanges — shown after a sale/buy
const TRANSFER_SALE_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kioskvakten', '{name} lämnade. Synd, folk gillade honom.', 'Kassören', 'Pengarna gör nytta. Det är sporten.'],
  ['Materialaren', 'Tröjan med {name} på hänger fortfarande.', 'Vaktmästaren', 'Ge det ett tag. Det är inte sista tröjan vi hänger.'],
  ['Kassören', 'Affären gick igenom. Pengarna är inne.', 'Ordföranden', 'Bra. Nu handlar det om vad vi gör med dem.'],
  ['Vaktmästaren', '{name} sa hej till alla i korridoren på väg ut.', 'Materialaren', 'Det är det man minns.'],
]

const TRANSFER_BUY_EXCHANGES: Array<[string, string, string, string]> = [
  ['Vaktmästaren', 'Ny kille i omklädningsrummet. Sa knappt hej.', 'Kassören', 'Ge honom en vecka.'],
  ['Materialaren', 'Fick ta fram en ny tröja i förtid.', 'Kioskvakten', 'Numret är bra. Folk gillar jämna nummer.'],
  ['Kassören', 'Nyförvärvet kostar — men det kan bli bra.', 'Ordföranden', 'Det är investeringen som räknas.'],
  ['Kioskvakten', 'Folk frågade redan vem han är.', 'Vaktmästaren', 'Säg att han är ny. Det räcker.'],
]

const TRANSFER_DEADLINE_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kassören', 'Telefonen ringer hela tiden.', 'Ordföranden', 'Svara inte.'],
  ['Materialaren', 'Hörde att folk sniffar runt.', 'Kioskvakten', 'De ska inte ha honom. Punkt.'],
  ['Vaktmästaren', 'Sista dagarna nu. Ryktena flyger.', 'Kassören', 'Lita på tränaren. Han vet vad han gör.'],
]

// Kafferums-snack när vi har ett aktivt väntande bud på en spelare (vi köper)
const TRANSFER_PENDING_BID_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kioskvakten', 'Hörde att vi lagt bud på någon utifrån.', 'Vaktmästaren', 'Bekräftat?" Kioskvakten: "Inte än. Men ryktena stämmer oftast.'],
  ['Materialaren', 'Det pratas om en ny kille. Inget klart.', 'Kassören', 'Vänta tills det är skrivet.'],
  ['Kassören', 'Bud lagt. Nu är det bara att vänta.', 'Ordföranden', 'Det tar alltid längre tid än man tror.'],
  ['Vaktmästaren', 'Ingen vet vem det är. Alla gissar.', 'Kioskvakten', 'Det är det roligaste med transferfönstret.'],
]

const STREAK_EXCHANGES: Record<'winning' | 'losing', Array<[string, string, string, string]>> = {
  winning: [
    ['Kioskvakten', 'Hade slut på kaffe vid halvtid igår. Det har aldrig hänt.', 'Vaktmästaren', 'Inte förvånande just nu.'],
    ['Vaktmästaren', 'Grabbarna sjunger i duschen igen.', 'Materialaren', 'Bra tecken.'],
    ['Kassören', 'Biljetterna säljer sig själva nu.', 'Ordföranden', 'Berätta inte — de höjer priset.'],
  ],
  losing: [
    ['Materialaren', 'Det är tyst i duschen efter match numera.', 'Kioskvakten', 'Ja. Ingen vill prata.'],
    ['Kioskvakten', 'Korvförsäljningen har sjunkit. Folk stannar inte kvar efter slutsignalen.', 'Kassören', 'Förstår dom.'],
    ['Vaktmästaren', 'Jag plogade ensam igår. Ingen dröjde kvar.', 'Materialaren', 'Det går över. Det brukar det.'],
  ],
}

const RESULT_EXCHANGES: Record<'win' | 'loss' | 'draw', Array<[string, string]>> = {
  win: [
    ['Kioskvakten', 'Vi sålde dubbelt idag. Seger säljer.'],
    ['Vaktmästaren', 'Publiken sjöng hela vägen ut. Länge sen sist.'],
    ['Kassören', 'Två poäng och plusresultat. Jag sover gott.'],
  ],
  loss: [
    ['Kioskvakten', 'Tyst vid kiosken efteråt. Ingen ville ha korv.'],
    ['Vaktmästaren', 'Jag plogade ändå i en timme. Isen förtjänade bättre.'],
    ['Kassören', 'Vi behöver inte prata om det. Eller?'],
  ],
  draw: [
    ['Kioskvakten', 'Kryss. Folket vet inte om de ska vara nöjda.'],
    ['Vaktmästaren', 'En poäng är en poäng. Isen klagade inte.'],
  ],
}

const SCANDAL_DASHBOARD_OWN: Partial<Record<ScandalType, Array<[string, string, string, string]>>> = {
  municipal_scandal: [
    ['Kioskvakten', 'Hörde att Granskning ringde i veckan.', 'Vaktmästaren', 'Lokaltidningen eller riktiga?" Kioskvakten: "Riktiga.'],
    ['Kassören', 'Jag har räknat fram det tre gånger.', 'Ordföranden', 'Stämmer det?" Kassören: "Det är därför jag räknat tre gånger.'],
    ['Vaktmästaren', 'Politikern har slutat svara.', 'Materialaren', 'Bra. Då slipper han säga något.'],
  ],
  sponsor_collapse: [
    ['Kassören', 'Tröjorna ska tryckas om.', 'Materialaren', 'När då?" Kassören: "När någon betalat.'],
    ['Kioskvakten', 'Han ringde inte ens.', 'Vaktmästaren', 'Bara mejl?" Kioskvakten: "Bara mejl.'],
    ['Ordföranden', 'Nya förfrågningar har inte kommit än.', 'Kassören', 'Det går två veckor till.'],
  ],
  treasurer_resigned: [
    ['Vaktmästaren', 'Är det någon som öppnat kontoret?', 'Kioskvakten', 'Inte sen i tisdags." Vaktmästaren: "Då." Kioskvakten: "Då.'],
    ['Materialaren', 'Jag försökte få fram papperna till skatteverket.', 'Ordföranden', 'Och?" Materialaren: "Pärmen är där hon lämnade den.'],
    ['Kioskvakten', 'Hon kom in på matchen i lördags.', 'Kassören', 'Sa hon något?" Kioskvakten: "Hon köpte korv.'],
  ],
  phantom_salaries: [
    ['Kassören', 'Två poäng.', 'Ordföranden', 'Två." Kassören: "Det är en match.'],
    ['Vaktmästaren', 'Vi hade kunnat göra någonting bättre med tiden.', 'Materialaren', 'Vad menar du?" Vaktmästaren: "Allt.'],
    ['Kioskvakten', 'Det var inte ens samma kassör som lade upp det.', 'Materialaren', 'Spelar ingen roll nu.'],
  ],
  club_to_club_loan: [
    ['Ordföranden', 'Det skulle hjälpa bägge.', 'Kassören', 'Det blev så." Ordföranden: "Hjälpen gick åt fel håll.'],
    ['Vaktmästaren', 'Hörde att de fick poängavdraget igår.', 'Kioskvakten', 'Bra för dem att vi hjälpte till." Vaktmästaren: "Mhm.'],
  ],
  fundraiser_vanished: [
    ['Materialaren', 'Birger frågade igen idag.', 'Kioskvakten', 'Vad sa du?" Materialaren: "Att vi tittar på det.'],
    ['Kioskvakten', 'Vi ska ha medlemsmöte.', 'Vaktmästaren', 'Frivilligt?" Kioskvakten: "Inte direkt.'],
    ['Kassören', 'Polisen har inte hört av sig.', 'Ordföranden', 'Det är en månad sedan." Kassören: "Jag vet.'],
  ],
  coach_meltdown: [
    ['Vaktmästaren', 'Jag plogade tidigt idag. Han var där redan.', 'Materialaren', 'Sa något?" Vaktmästaren: "Bara hej.'],
    ['Kioskvakten', 'Assisterande verkar göra vad han kan.', 'Materialaren', 'Han är inte tränaren, det är skillnaden." Kioskvakten: "Vi får hoppas.'],
    ['Kassören', 'Ingen frågar efter ett presskonferensdatum.', 'Ordföranden', 'Bra." Kassören: "Ja. Det är bra.'],
  ],
}

const SCANDAL_DASHBOARD_OTHER: Partial<Record<ScandalType, Array<[string, string, string, string]>>> = {
  municipal_scandal: [
    ['Kioskvakten', 'Politiker bråkar om {KLUBB}-bidraget igen.', 'Vaktmästaren', 'Igen?" Kioskvakten: "Tredje gången på fem år.'],
    ['Kassören', '{KLUBB} ska räddas av kommunen.', 'Ordföranden', 'Det skulle vi också." Kassören: "Vi har ingen mark att sälja.'],
    ['Materialaren', 'Hörde att {KLUBB} fick stryk i fullmäktige.', 'Vaktmästaren', 'Av vem?" Materialaren: "Alla.'],
  ],
  sponsor_collapse: [
    ['Kioskvakten', '{KLUBB} förlorade en sponsor i veckan.', 'Kassören', 'Stor?" Kioskvakten: "Lagom.'],
    ['Vaktmästaren', 'Tror dom hade Borgvik Bygg också.', 'Materialaren', 'Då har dom det jobbigt." Vaktmästaren: "Det har alla.'],
    ['Ordföranden', '{KLUBB} söker ny huvudsponsor enligt tidningen.', 'Kassören', 'Lycka till.'],
  ],
  treasurer_resigned: [
    ['Materialaren', '{KLUBB}s kassör är borta.', 'Kioskvakten', 'Vad hände?" Materialaren: "Personliga skäl, står det.'],
    ['Kassören', 'Hörde att {KLUBB} inte kan göra transfers nu.', 'Ordföranden', 'Inte?" Kassören: "Pärmarna är låsta.'],
    ['Vaktmästaren', 'Hon var hyfsat ung.', 'Kioskvakten', 'Vem?" Vaktmästaren: "{KLUBB}s kassör.'],
  ],
  phantom_salaries: [
    ['Kassören', '{KLUBB} fick två poäng dragna.', 'Ordföranden', 'På vad?" Kassören: "Spelare som inte fanns.'],
    ['Kioskvakten', 'Skatteverket var tydligen klara med {KLUBB}.', 'Materialaren', 'Och?" Kioskvakten: "Det stod två poäng på fakturan.'],
    ['Vaktmästaren', 'Bra att vi har vår kassör.', 'Materialaren', 'Hon räknar två gånger." Vaktmästaren: "Tre.'],
  ],
  club_to_club_loan: [
    ['Ordföranden', '{KLUBB} och deras grannar gjorde en deal.', 'Kassören', 'Kreativ?" Ordföranden: "Det säger Förbundet.'],
    ['Materialaren', 'Tre poäng nästa säsong för {KLUBB}.', 'Vaktmästaren', 'Det är en tabellplats." Materialaren: "Minst.'],
    ['Kioskvakten', 'Hörde att kassören sitter på båda klubbarnas kontor.', 'Vaktmästaren', 'Då blev det som det blev.'],
  ],
  fundraiser_vanished: [
    ['Kassören', '{KLUBB}s korv-pengar är borta.', 'Vaktmästaren', '300 spänn?" Kassören: "300 tusen.'],
    ['Kioskvakten', 'Klacken i {KLUBB} står utanför kansliet.', 'Materialaren', 'Och?" Kioskvakten: "Ingen kommer ut.'],
    ['Ordföranden', 'Det är en sån grej man lär sig av.', 'Kassören', 'Att räkna oftare." Ordföranden: "Mhm.'],
  ],
  coach_meltdown: [
    ['Vaktmästaren', '{KLUBB}s tränare är borta.', 'Kioskvakten', 'Vad hände?" Vaktmästaren: "Personliga skäl.'],
    ['Materialaren', 'Han ringde en kollega här i veckan.', 'Kassören', 'Sa något?" Materialaren: "Sa att han söker hjälp.'],
    ['Kioskvakten', 'Det är såna grejer man inte glädjs över.', 'Vaktmästaren', 'Nej." Kioskvakten: "Spelar ingen roll vilket lag.'],
  ],
}

/**
 * D4-regressionsfix (2026-07-21): getCoffeeRoomScene (D4, 2026-07-19) ersatte
 * getCoffeeRoomQuote som kafferummets ram utan att portera dess innehåll —
 * en tyst halvering, upptäckt i release-svepet 2026-07-20. Detta är
 * FUSION, inte duplicering: beslutslogiken (vilken reaktion, vilken gate,
 * vilket seed) är flyttad hit oförändrad, bara omformad från getCoffeeRoomQuote:s
 * hopklämda en-rads-sträng ("X" — Y: "Z") till scenens riktiga form — en
 * tvåpersonsväxel när poolen redan är det (skandal/transfer), en
 * CoffeeNarratorLine när den inte har en naturlig andra-talare (rival-sälj,
 * inkommande bud, årsdag). getCoffeeRoomQuote hade noll konsumenter kvar
 * (grep-verifierat i release-svepet) och är raderad.
 *
 * Legend-referenser och supporter-karaktärscitat (de sista två grenarna i
 * gamla getCoffeeRoomQuote) portas INTE hit — utanför den beställda listan,
 * flaggade separat. Samma sak med klackEcho-i-kafferum och victory-echo:
 * också döda av samma regression, men inte del av denna beställning.
 */
function pickCoffeeRoomEventReaction(game: SaveGame, round: number, seed: number):
  { exchange: [string, string, string, string] } | { line: CoffeeNarratorLine } | null {
  let soldItem: typeof game.inbox[number] | undefined
  let boughtItem: typeof game.inbox[number] | undefined
  for (const item of (game.inbox ?? []).slice(-10)) {
    // M17 (textaudit 2026-07-03): TransferBidReceived = inkommande bud (någon
    // vill KÖPA en spelare av oss), inte en genomförd försäljning — säljtexterna
    // ("{name} lämnade", "Pengarna är inne") ljög om budet ännu inte accepterats.
    if (!soldItem && item.type === InboxItemType.Transfer) soldItem = item
    // M18 (textaudit 2026-07-03): InboxItemType.TransferOffer skapas ALDRIG
    // någonstans (grep-verifierat) — TRANSFER_BUY_EXCHANGES var död kod.
    // Rätt signal för "vi köpte nyss" är ett accepterat utgående bud, som
    // delar InboxItemType.TransferBidResult med avslag/tillbakadraget/mot-
    // bud — id-prefixet (transferProcessor.ts) särskiljer just accepted.
    if (!boughtItem && item.type === InboxItemType.TransferBidResult && item.id.startsWith('inbox_bid_accepted_') && !item.isRead) boughtItem = item
    if (soldItem && boughtItem) break
  }
  // M24 (textaudit 2026-07-03): 13/15 var dubblerade magiska tal — refererar
  // nu samma konstant som transferTriggers.ts:s deadline-logik.
  const deadlineRound = round >= TRANSFER_DEADLINE_ROUND - 2 && round <= TRANSFER_DEADLINE_ROUND

  if (deadlineRound && seed % 5 === 0) {
    const idx = Math.abs(seed * 3) % TRANSFER_DEADLINE_EXCHANGES.length
    return { exchange: TRANSFER_DEADLINE_EXCHANGES[idx] }
  }
  if (soldItem && seed % 3 === 0) {
    const idx = Math.abs(seed * 7) % TRANSFER_SALE_EXCHANGES.length
    const ex = TRANSFER_SALE_EXCHANGES[idx]
    const soldPlayer = soldItem.relatedPlayerId
      ? game.players.find(p => p.id === soldItem!.relatedPlayerId)
      : null
    const name = soldPlayer ? soldPlayer.lastName : 'spelaren'
    return { exchange: [ex[0], ex[1].replace('{name}', name), ex[2], ex[3]] }
  }
  if (boughtItem && seed % 3 === 1) {
    const idx = Math.abs(seed * 11) % TRANSFER_BUY_EXCHANGES.length
    return { exchange: TRANSFER_BUY_EXCHANGES[idx] }
  }

  // Aktiva väntande bud (vi har lagt bud, väntar på svar) — 33% chans
  const hasPendingBid = (game.transferBids ?? []).some(
    b => b.direction === 'outgoing' && b.status === 'pending'
  )
  if (hasPendingBid && seed % 3 === 2) {
    const idx = Math.abs(seed * 13) % TRANSFER_PENDING_BID_EXCHANGES.length
    return { exchange: TRANSFER_PENDING_BID_EXCHANGES[idx] }
  }

  // Scandal reference (25% chance when recent scandal this season)
  const recentScandal = (game.scandalHistory ?? []).find(s =>
    s.season === game.currentSeason &&
    s.triggerRound >= round - 1 &&
    s.type !== 'small_absurdity'
  )
  if (recentScandal && seed % 4 === 0) {
    const isOwn = recentScandal.affectedClubId === game.managedClubId
    const pool = isOwn ? SCANDAL_DASHBOARD_OWN[recentScandal.type] : SCANDAL_DASHBOARD_OTHER[recentScandal.type]
    if (pool && pool.length > 0) {
      const ex = pool[Math.abs(seed * 17) % pool.length]
      if (!isOwn) {
        const affectedClub = game.clubs.find(c => c.id === recentScandal.affectedClubId)
        const secondaryClub = recentScandal.secondaryClubId
          ? game.clubs.find(c => c.id === recentScandal.secondaryClubId)
          : null
        const klubb = affectedClub?.name ?? 'grannklubben'
        const andraKlubb = secondaryClub?.name ?? 'grannklubben'
        const sub = (s: string) => s.replace(/\{KLUBB\}/g, klubb).replace(/\{ANDRA_KLUBB\}/g, andraKlubb)
        return { exchange: [sub(ex[0]), sub(ex[1]), sub(ex[2]), sub(ex[3])] }
      }
      return { exchange: ex }
    }
  }

  // C-T9: rival sale kafferum — show within 3 matchdays of sale
  if (
    game.lastRivalSaleMatchday !== undefined &&
    round - (game.lastRivalSaleMatchday ?? 0) <= 3 &&
    round - (game.lastRivalSaleMatchday ?? 0) >= 0 &&
    seed % 2 === 0
  ) {
    const idx = Math.abs(seed * 19) % RIVAL_SALE_KAFFERUM.length
    return { line: { text: RIVAL_SALE_KAFFERUM[idx] } }
  }

  // C-O2: incoming bid kafferum — show within 2 matchdays when AI bids on managed player
  const incomingBidAge = round - (game.lastIncomingBidMatchday ?? -99)
  if (
    game.lastIncomingBidMatchday !== undefined &&
    incomingBidAge >= 0 && incomingBidAge <= 2 &&
    seed % 3 !== 0
  ) {
    const idx = Math.abs(seed * 31) % INCOMING_BID_KAFFERUM.length
    return { line: { text: INCOMING_BID_KAFFERUM[idx] } }
  }

  // B6: anniversary kafferum — 33% chance when medium-or-bigger unseen eko exists.
  const qualifyingAnniversaries = (game.activeAnniversaries ?? []).filter(
    a => a.echoSize !== 'small'
  )
  if (qualifyingAnniversaries.length > 0 && seed % 3 === 0) {
    const echo = qualifyingAnniversaries[Math.abs(seed * 23) % qualifyingAnniversaries.length]
    const rawKafferum = pickAnniversaryKafferum(echo)
    const subjectPlayer = echo.subjectPlayerId
      ? game.players.find(p => p.id === echo.subjectPlayerId)
      : undefined
    const text = subjectPlayer
      ? fillTemplate(rawKafferum, { subject: `${subjectPlayer.firstName} ${subjectPlayer.lastName}` })
      : rawKafferum
    return { line: { text } }
  }

  return null
}

/** Ported från gamla getCoffeeRoomQuote — kommentar för resultat-grenen nedan. */
function pickCoffeeRoomResultReaction(game: SaveGame, seed: number): { line: CoffeeNarratorLine } | null {
  const lastFixture = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.matchday - a.matchday)[0]
  if (!lastFixture || seed % 2 !== 0) return null

  const isHome = lastFixture.homeClubId === game.managedClubId
  const myScore = isHome ? lastFixture.homeScore : lastFixture.awayScore
  const theirScore = isHome ? lastFixture.awayScore : lastFixture.homeScore
  const result: 'win' | 'loss' | 'draw' = myScore > theirScore ? 'win' : myScore < theirScore ? 'loss' : 'draw'
  const pool = RESULT_EXCHANGES[result]
  const [speaker, text] = pool[Math.abs(seed * 5) % pool.length]
  return { line: { speaker, text } }
}

// R1 — fatigue kafferum-scener (Opus 2026-05-23). Tonala, ingen moral-träff.
// Warm: börjar synas att det ligger kvar. Hot: det har gått längre.
// Bandy-Sverige, understatement — inget sägs rakt ut, allt mellan raderna.
// Ingen tillrättavisning. Två gubbar vid kaffekokaren som ser, inte dömer.
const FATIGUE_WARM_EXCHANGES: Array<[string, string, string, string]> = [
  ['Magnus', 'Det låg kvar papper på tränarens bord i morse.', 'Sture', 'Det gör det ibland. Han kommer till det.'],
  ['Sture', 'Han hann inte med en kaffe idag heller.', 'Magnus', 'Det är sån vecka. Det lättar.'],
  ['Magnus', 'Mycket att hålla reda på just nu, ser det ut som.', 'Sture', 'Det är alltid något. Han reder ut det.'],
  ['Sture', 'Tränaren satt kvar när jag släckte.', 'Magnus', 'Han tänker. Det är ingen fara med det.'],
  ['Magnus', 'Telefonen ringde tre gånger under mötet.', 'Sture', 'Han svarade inte. Det säger väl något.'],
  ['Sture', 'Han bad mig ta hand om en sak. Glömde säga vilken.', 'Magnus', 'Det löser sig. Det gör det oftast.'],
  ['Magnus', 'Lappen på anslagstavlan har suttit en vecka nu.', 'Sture', 'Den får sitta. Han tar den när han hinner.'],
  ['Sture', 'Han verkar ha mycket på en gång den här perioden.', 'Magnus', 'Det hör till. Vi har sett värre.'],
]

const FATIGUE_HOT_EXCHANGES: Array<[string, string, string, string]> = [
  ['Magnus', 'Samma hög på bordet som förra veckan. Större nu.', 'Sture', 'Mm. Den där växer om man inte tar i den.'],
  ['Sture', 'Han svarade inte när jag hälsade. Såg rakt fram.', 'Magnus', 'Han har mycket. Men det börjar synas.'],
  ['Magnus', 'Det är samma frågor som legat ett tag nu.', 'Sture', 'Någon gång måste man bara ta dem. Annars tar de en.'],
  ['Sture', 'Han ser trött ut. Inte av is. Av det andra.', 'Magnus', 'Ja. Det är inte benen på honom det.'],
  ['Magnus', 'Tre saker har väntat på besked sedan i förrgår.', 'Sture', 'Han vet om det. Det är väl därför han ser ut så.'],
  ['Sture', 'Han gick hem sist igen. Lämnade lampan på.', 'Magnus', 'Jag släckte den. Sa inget.'],
  ['Magnus', 'Det hopar sig när man skjuter på det.', 'Sture', 'Jag vet. Jag har gjort samma misstag.'],
  ['Sture', 'Han bad om en veckas andrum i morse.', 'Magnus', 'Det är inte veckan som är problemet. Det är högen.'],
]

/**
 * getCoffeeRoomScene — returnerar 1-3 exchanges för Kafferummet-scenen.
 * Returnerar null om ingen omgång spelats (säsongsstart) eller data saknas.
 *
 * Exchange-format: [speakerA, textA, speakerB, textB] — samma format
 * som GENERIC_EXCHANGES internt. Texten levereras *utan* citationstecken;
 * komponenten lägger på dem vid render.
 */
export function getCoffeeRoomScene(game: SaveGame): CoffeeScene | null {
  const round = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  if (round === 0) return null

  // M67a / D4-regressionsfix (2026-07-21) — veteran_farewell-arcens sista
  // hemmamatch. Samma prioritetsnivå som ursprungligen: en gång per säsong,
  // en spelare, ska inte konkurrera bort av rutinkafferum-repliker.
  const farewellPlayer = getFarewellMatchPlayer(game, getNextManagedFixture(game))
  if (farewellPlayer) {
    const fseed = hashSeed(farewellPlayer.id.length * 17 + game.currentSeason * 31)
    const template = FAREWELL_MATCH_STRINGS[Math.abs(fseed) % FAREWELL_MATCH_STRINGS.length]
    const text = template
      .replace('{player}', farewellPlayer.lastName)
      .replace('{members}', String(game.supporterGroup?.members ?? ''))
      .replace('{leader}', getCharacterName(game, 'leader'))
    return {
      exchanges: [],
      pickedIndices: [],
      meta: { title: 'Kafferummet' },
      narratorLine: { text },
    }
  }

  // D3 (A1) — återkomsten: samma prioritetslogik som victory-echo/farewell i
  // getCoffeeRoomQuote (starkt, ovillkorat, en gång). Seedad på svaret +
  // matchday, landar deterministiskt när tröskeln är nådd — inte varje besök.
  const dueReturn = pickDueCoffeeRoomReturn(game)
  if (dueReturn) {
    const questionDef = COFFEE_ROOM_QUESTIONS.find(q => q.id === dueReturn.questionId)
    if (questionDef) {
      return {
        exchanges: [questionDef.returns[dueReturn.answerId]],
        pickedIndices: [],
        meta: { title: 'Kafferummet', subtitle: 'Tisdag förmiddag · samtalet fortsätter där det var' },
        consumedReturnQuestionId: dueReturn.questionId,
      }
    }
  }

  const hotStreak = game.fatigueHotStreak ?? 0
  if (hotStreak >= 2) {
    const { pressure } = getFatigueState(game)
    const pool = pressure === 'hot' ? FATIGUE_HOT_EXCHANGES : FATIGUE_WARM_EXCHANGES
    const matchday = game.currentMatchday ?? 1
    const seed = matchday * 17 + game.currentSeason * 29
    const idx = hashSeed(seed) % pool.length
    return {
      exchanges: [pool[idx]],
      pickedIndices: [idx],
      meta: { title: 'Kafferummet', subtitle: 'Tisdag förmiddag · lite tyngre i lokalen' },
    }
  }

  // §11.2: förväntans-ramp mot kalenderankare — egen sannolikhetsgrind (~40%,
  // 2 av 5) så den kryddar snarare än dominerar. Ligger efter hotStreak (den
  // är ett starkare, ovillkorat narrativt läge) men före den generiska poolen.
  const anchor = getUpcomingAnchor(game)
  if (anchor) {
    const anchorMatchday = game.currentMatchday ?? 0
    const anchorSeed = anchorMatchday * 41 + game.currentSeason * 13
    if (hashSeed(anchorSeed) % 5 < 2) {
      const proximity = anchor.matchdaysUntil <= 2 ? 'nara' : 'snart'
      const pool = ANTICIPATION_KAFFERUM[anchor.kind][proximity]
      if (pool.length > 0) {
        const idx = hashSeed(anchorSeed * 7) % pool.length
        return {
          exchanges: [pool[idx]],
          pickedIndices: [idx],
          meta: { title: 'Kafferummet', subtitle: 'Tisdag förmiddag · någon har redan börjat räkna dagar' },
        }
      }
    }
  }

  const matchday = game.currentMatchday ?? 0
  if (matchday === 0) return null

  // D4-regressionsfix (2026-07-21) — skandal/transfer/årsdagsreaktioner +
  // senaste-resultat-kommentar. Gate-trösklarna (seed%N) är identiska med
  // gamla getCoffeeRoomQuote, men seedet självt bytt från round-baserat till
  // matchday-baserat (samma formel som resten av scenen redan använder,
  // rad nedan) — annars är seedet KONSTANT för alla besök inom samma
  // ligarunda (round ändras bara varannan vecka, matchday varje besök),
  // vilket kan permanent svälta ut D1-frågesystemet om gaten råkar slå in
  // för en given save (hittat i test: pickCoffeeRoomResultReaction fastnade
  // på samma sida av seed%2 i 200 raka matchdagar med round-baserat seed).
  // Ligger efter hotStreak/anchor (redan tuned, orörda) men före den
  // generiska poolen — matchar var getCoffeeRoomQuote läste dem, precis
  // innan sitt eget generiska fallback.
  const reactionSeed = matchday * 11 + game.currentSeason * 31
  const eventReaction = pickCoffeeRoomEventReaction(game, round, reactionSeed)
  if (eventReaction) {
    if ('exchange' in eventReaction) {
      return {
        exchanges: [eventReaction.exchange],
        pickedIndices: [],
        meta: { title: 'Kafferummet' },
      }
    }
    return {
      exchanges: [],
      pickedIndices: [],
      meta: { title: 'Kafferummet' },
      narratorLine: eventReaction.line,
    }
  }
  const resultReaction = pickCoffeeRoomResultReaction(game, reactionSeed)
  if (resultReaction) {
    return {
      exchanges: [],
      pickedIndices: [],
      meta: { title: 'Kafferummet' },
      narratorLine: resultReaction.line,
    }
  }

  // Pool: GENERIC + ev. STREAK om streak finns
  const pool: Array<[string, string, string, string]> = []
  // Filtrera bort placeholder-rader med oresolverade tokens
  for (const ex of GENERIC_EXCHANGES) {
    if (ex[1].includes('{youthName}')) {
      const youthName = (game.youthTeam?.players ?? [])[0]?.lastName
      if (!youthName) continue
      pool.push([ex[0], ex[1].replace('{youthName}', youthName), ex[2], ex[3]])
    } else {
      pool.push(ex)
    }
  }

  // Streak-exchanges som tilläggspool när streak finns
  const recentManaged = game.fixtures
    .filter(
      f =>
        f.status === 'completed' &&
        !f.isCup &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId),
    )
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 3)
  if (recentManaged.length >= 3) {
    const results = recentManaged.map(f => {
      const isHome = f.homeClubId === game.managedClubId
      const my = isHome ? f.homeScore : f.awayScore
      const their = isHome ? f.awayScore : f.homeScore
      return my > their ? 'win' : my < their ? 'loss' : 'draw'
    })
    if (results.every(r => r === 'win')) pool.push(...STREAK_EXCHANGES.winning)
    else if (results.every(r => r === 'loss')) pool.push(...STREAK_EXCHANGES.losing)
  }

  if (pool.length === 0) return null

  // Deterministiskt antal 1-3 baserat på matchday
  const count = Math.min(pool.length, (matchday % 3) + 1)
  // B9 T1A: seed på matchday (inte ligarunda) — ändras varje matchdag, inte bara per ligarunda
  const seed = matchday * 11 + game.currentSeason * 31

  // B9 T1B: anti-upprepning — undvik index som visades senast om poolen är stor nog
  const lastIndices = new Set(game.lastCoffeeSceneIndices ?? [])

  // Plocka `count` distinkta index
  // TODO: GENERIC_EXCHANGES bör utökas — sju utbyten är för få för ett återkommande inslag (Opus levererar fler om önskat)
  const used = new Set<number>()
  const pickedIndices: number[] = []
  const exchanges: Array<[string, string, string, string]> = []
  for (let i = 0; i < count; i++) {
    let idx = hashSeed(seed * 1000 + i) % pool.length
    let guard = 0
    // Hoppa över index som redan valts ELLER som visades senast, om poolen tillåter det
    while (
      (used.has(idx) || (lastIndices.has(idx) && pool.length > count + lastIndices.size)) &&
      guard < pool.length
    ) {
      idx = (idx + 1) % pool.length
      guard++
    }
    used.add(idx)
    pickedIndices.push(idx)
    exchanges.push(pool[idx])
  }

  // D1 (A1) — tredje beaten: gated (som fatigue/anticipation), en gång per
  // besök, bara på rutinbesök (den här generiska poolen — hotStreak/anchor
  // är redan egna narrativa lägen och ska inte också bära en fråga samma
  // besök). Krascha inte på tom pool — bara sex frågor finns, alla kan vara
  // besvarade (D3-regeln: en besvarad fråga ställs aldrig igen).
  const answered = new Set(game.coffeeRoomAnsweredQuestions ?? [])
  const unanswered = COFFEE_ROOM_QUESTIONS.filter(q => !answered.has(q.id))
  const questionGateSeed = hashSeed(matchday * 43 + game.currentSeason * 19)
  let question: CoffeeRoomQuestionPrompt | undefined
  if (unanswered.length > 0 && questionGateSeed % 5 < 2) {
    const q = unanswered[0]
    question = { questionId: q.id, speaker: COFFEE_ROOM_QUESTION_SPEAKER, text: q.question, answers: q.answers }
  }

  return {
    exchanges,
    pickedIndices,
    meta: {
      title: 'Kafferummet',
      subtitle: 'Tisdag förmiddag · några stannade kvar efter mötet',
    },
    question,
  }
}

/**
 * D3 — hittar en obesvarad återkomst vars tröskel (seedad, 2-6 omgångar
 * efter svaret) är nådd. En i taget (FIFO på answeredMatchday) — samma
 * "ett beat per besök"-princip som resten av rummet.
 */
function pickDueCoffeeRoomReturn(game: SaveGame): { questionId: string; answerId: 'A' | 'B' } | null {
  const pending = game.coffeeRoomPendingReturns ?? []
  if (pending.length === 0) return null
  const currentMatchday = game.currentMatchday ?? 0
  const due = [...pending]
    .sort((a, b) => a.answeredMatchday - b.answeredMatchday)
    .find(p => {
      const delay = 2 + (hashSeed(p.questionId.length * 13 + p.answeredMatchday * 7) % 5)
      return currentMatchday >= p.answeredMatchday + delay
    })
  return due ? { questionId: due.questionId, answerId: due.answerId } : null
}
