import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import type { Fixture } from '../entities/Fixture'
import { getRivalry } from '../data/rivalries'
import { MatchEventType } from '../enums'
import { deriveUtfall, computeTrailedAtHalf } from './matchTypeAxes'
import {
  isTemplateEligible,
  type TemplateEligibility,
  type EligibilityContext,
} from './templateEligibilityService'
import { isOnCooldown } from './narrativeLogService'
import { recentlySurfaced, RECENCY_WINDOW_BY_CHANNEL } from './narrativeCoordinatorService'

export const JOURNALISTS = ['SVT Nyheter', 'Bandyplay', 'Lokaltidningen', 'Sportbladet', 'Bandypuls', 'Expressen', 'DN', 'Radiosporten']

// ── Journalist questions (per context, each paired with fitting response IDs) ──

interface PressQuestion {
  text: string
  preferIds: string[]  // response IDs that directly answer this question
  minRound?: number    // earliest round this question makes sense
  minScandalThisSeason?: boolean  // requires at least one scandal this season
  // M54 (textaudit 2026-07-04): kontextgates frågepoolen saknade, svarssystemet
  // redan har (matchesContext). Alla opt-in — utelämnad flagga = ingen gate.
  requireTrailedAtHalf?: boolean  // (a) "vände underläge till seger"
  requireLateEqualizer?: boolean  // (b) "kvitterade sent"
  requireDrawStreak3?: boolean    // (c) "oavgjort i tre raka"
  requireHome?: boolean           // (d) {arenaName} är alltid managed clubs egen arena
  // U2 (SLUTTEST_KO.md, 2026-08-17): symptom 3 (hemmakryss → "poäng på
  // bortaplan") och symptom 2 (cupfinal → "två viktiga poäng") — plats/
  // ligapoäng-gates saknades helt, bara requireHome fanns.
  requireAway?: boolean
  requireLeaguePoints?: boolean   // matchen gav faktiskt ligapoäng (liga, inte cup/slutspel)
  // PÅSTÅENDEKARTAN (2026-08-24): "Ni dominerade mittfältet" saknade helt en
  // gate — ställdes så fort contextKey==='win', oavsett skotten. fixture.report
  // .shotsHome/shotsAway/onTargetHome/onTargetAway ligger redan nedskrivna
  // (samma fält GranskaShotmap.tsx läser), bara aldrig kopplade hit.
  requireMidfieldDominance?: boolean
}

const QUESTIONS: Record<string, PressQuestion[]> = {
  bigWin: [
    { text: 'Bandysverige skakas av rubriker just nu — ni vinner ändå. Är det ett tecken på något?', preferIds: ['bw_c1', 'bw_h2', 'bw_d2'], minScandalThisSeason: true },
    { text: 'Det är turbulent runt sporten den här säsongen. Hur håller ni er fokuserade?', preferIds: ['bw_h4', 'bw_d1', 'cl04'], minScandalThisSeason: true },
    { text: 'Tidningarna pratar mer om ekonomi än bandy just nu. Hur landar det hos er?', preferIds: ['bw_d2', 'bw_h1', 'cl07'], minScandalThisSeason: true },
    { text: 'Det är inte den lugnaste säsongen för svensk bandy. Märks det i kalendern eller bara på rubrikerna?', preferIds: ['bw_h1', 'bw_d1', 'cl04'], minScandalThisSeason: true },
    { text: 'Tydlig seger. Var det er bästa match den här säsongen?', preferIds: ['bw_c1', 'bw_h2', 'cl01'], minRound: 6 },
    { text: 'Laget spelade bra idag. Vad är skillnaden jämfört med tidigare omgångar?', preferIds: ['bw_c2', 'bw_h5', 'cl04'], minRound: 3 },
    { text: 'Klar seger idag — är det ett mönster eller en engångsgrej?', preferIds: ['bw_c3', 'bw_h4', 'cl02'] },
    { text: 'Ert anfallsspel ser ostoppbart ut. Fruktar du inte att bli läst av motståndarna?', preferIds: ['bw_c4', 'bw_h4', 'cl02'] },
    { text: 'Motståndarna verkade chockade av er intensitet. Avsiktlig taktik?', preferIds: ['bw_c5', 'bw_h5', 'bw_d1'] },
    { text: 'Bra match. Hade ni kunnat vinna med ännu mer?', preferIds: ['bw_c6', 'bw_h6', 'bw_d2'] },
    { text: 'Publiken sjöng hela vägen. Hur mycket spelar fansen in i resultatet?', preferIds: ['bw_p7', 'bw_h7', 'cl07'] },
  ],
  win: [
    { text: 'Bandysverige skakas av rubriker just nu — ni vinner ändå. Är det ett tecken på något?', preferIds: ['w_c7', 'w_h2', 'bw_d2'], minScandalThisSeason: true },
    { text: 'Det är turbulent runt sporten den här säsongen. Hur håller ni er fokuserade?', preferIds: ['w_c4', 'bw_d1', 'cl03'], minScandalThisSeason: true },
    { text: 'Tidningarna pratar mer om ekonomi än bandy just nu. Hur landar det hos er?', preferIds: ['bw_d2', 'w_h2', 'cl07'], minScandalThisSeason: true },
    { text: 'Det är inte den lugnaste säsongen för svensk bandy. Märks det i kalendern eller bara på rubrikerna?', preferIds: ['w_c4', 'bw_d1', 'cl03'], minScandalThisSeason: true },
    { text: 'Seger! Berätta om matchen.', preferIds: ['w_h1', 'w_c1', 'w_d1'] },
    { text: 'Två viktiga poäng. Hur påverkar det stämningen i laget?', preferIds: ['w_p2', 'w_h2', 'w_p4'], requireLeaguePoints: true },
    { text: 'Vilken spelare stack ut idag?', preferIds: ['w_p3', 'w_h3', 'w_c3'] },
    { text: 'Hur håller ni den här formen uppe?', preferIds: ['w_c4', 'w_d4', 'cl03'], minRound: 3 },
    { text: 'Ni vände underläge till seger. Vad hände i pausen?', preferIds: ['w_p5', 'w_h5', 'w_d5'], requireTrailedAtHalf: true },
    { text: 'Två poäng till. Kan ni utmana toppen nu?', preferIds: ['w_c6', 'w_h6', 'cl08'], minRound: 5 },
    { text: 'Ni dominerade mittfältet idag. Är det er styrka just nu?', preferIds: ['w_c7', 'w_h7', 'bw_d2'], requireMidfieldDominance: true },
    { text: 'Hur var stämningen på {arenaName} idag?', preferIds: ['w_p3', 'bw_p7'], minRound: 3, requireHome: true },
    { text: 'Kaptenen {captainName} — hur ser han på insatsen?', preferIds: ['w_p2', 'w_h3'], minRound: 3 },
    // #5 pooldjup (DOMLOGG D039): fler ogaterade seger-frågor.
    { text: 'Det lossnar för er just nu. Vad är skillnaden?', preferIds: ['w_c4', 'w_h5', 'cl03'], minRound: 3 },
    { text: 'Ni styrde matchen. Är det så du vill se laget spela?', preferIds: ['w_c7', 'w_h1', 'cl04'] },
    { text: 'En stabil insats. Vad är du mest nöjd med?', preferIds: ['w_h1', 'w_c3', 'w_p4'] },
    { text: 'Bra kväll på isen. Vad tar laget med sig till nästa?', preferIds: ['w_d1', 'w_h1', 'cl01'] },
  ],
  loss: [
    { text: 'Skandalerna rör om i bandysverige den här säsongen. Påverkar det stämningen i omklädningsrummet?', preferIds: ['l_h9', 'l_p5', 'cl11'], minScandalThisSeason: true },
    { text: 'Förbundet har sina händer fulla just nu. Stör det fokuset på matchen?', preferIds: ['l_h1', 'l_c2', 'bw_d1'], minScandalThisSeason: true },
    { text: 'Tidningarna pratar mer om ekonomi än bandy just nu. Hur landar det hos er?', preferIds: ['l_h9', 'bw_d2', 'cl11'], minScandalThisSeason: true },
    { text: 'Det är inte den lugnaste säsongen för svensk bandy. Märks det i kalendern eller bara på rubrikerna?', preferIds: ['l_c6', 'bw_d1', 'cl15'], minScandalThisSeason: true },
    { text: 'Tung förlust. Vad gick fel?', preferIds: ['l_h1', 'l_c2', 'cl11'] },
    { text: 'Laget såg trött ut i andra halvlek. Kondition?', preferIds: ['l_h2', 'l_h1', 'l_d1'] },
    { text: 'Supportrarna är besvikna. Vad säger du till dem?', preferIds: ['l_p3', 'l_h3', 'cl14'] },
    { text: 'Det ville sig inte idag. Vad gör ni annorlunda nästa match?', preferIds: ['l_h4', 'l_d1', 'l_c4'] },
    { text: 'Vad säger du till spelarna i omklädningsrummet efter en sån här match?', preferIds: ['l_p5', 'l_h5', 'cl11'] },
    { text: 'Tappar ni tron på er spelstil nu?', preferIds: ['l_c6', 'l_h6', 'cl15'] },
    { text: 'Ni hade chanser men förvaltade dem inte. Stressar det er?', preferIds: ['l_c7', 'l_h7', 'cl16'] },
    { text: 'Motståndarna hade långa stunder av övertag. Vad säger du om ert försvarsspel?', preferIds: ['l_h8', 'l_h1', 'l_a1'] },
    { text: 'Ni har det tufft just nu. Hur håller du moralen uppe?', preferIds: ['l_p9', 'l_h9', 'cl13'], minRound: 3 },
    // #5 pooldjup (DOMLOGG D039): fler ogaterade förlust-frågor.
    { text: 'Hur ser du på lagets riktning efter det här?', preferIds: ['l_h1', 'l_c4', 'cl18'] },
    { text: 'Ni skapade inte nog framåt. Var sitter det?', preferIds: ['l_h4', 'l_c7', 'l_h7'] },
    { text: 'Vad krävs för att vända det här?', preferIds: ['l_c4', 'l_d1', 'cl18'] },
  ],
  bigLoss: [
    { text: 'Skandalerna rör om i bandysverige den här säsongen. Påverkar det stämningen i omklädningsrummet?', preferIds: ['bl_p3', 'bl_d2', 'cl13'], minScandalThisSeason: true },
    { text: 'Förbundet har sina händer fulla just nu. Stör det fokuset på matchen?', preferIds: ['bl_h1', 'bl_p1', 'cl12'], minScandalThisSeason: true },
    { text: 'En mörk kväll. Hur tar ni er vidare härifrån?', preferIds: ['bl_h1', 'bl_p1', 'cl12'] },
    { text: 'Är du orolig för lagets form?', preferIds: ['bl_h2', 'bl_c2', 'cl13'] },
    { text: 'Det här resultatet kan stå er dyrt i tabellen. Hur reagerar styrelsen?', preferIds: ['bl_p3', 'bl_d2', 'bl_a1'], minRound: 5 },
    { text: 'Motståndarna verkade veta exakt vad ni skulle göra. Läckta planer?', preferIds: ['bl_h4', 'bl_c4', 'bl_h1'] },
    { text: 'Många mål insläppta. Är det ett strukturproblem i försvaret?', preferIds: ['bl_h5', 'bl_a1', 'bl_h1'] },
    { text: 'Behöver du ta in ny spetskompetens för att vända skutan?', preferIds: ['bl_c6', 'bl_c2', 'bl_p1'] },
    // #5 pooldjup (DOMLOGG D039): fler storförlust-frågor.
    { text: 'En riktigt tung kväll. Vad säger du till laget härnäst?', preferIds: ['bl_h1', 'bl_p1', 'cl12'] },
    { text: 'Sånt här får inte hända. Hur ser upparbetningen ut?', preferIds: ['bl_h2', 'bl_h5', 'bl_c2'] },
  ],
  draw: [
    { text: 'En match i en orolig säsong — för bandyn i stort. Vad säger du om läget i bandysverige?', preferIds: ['dr_h1', 'bw_d1', 'dr_d1'], minScandalThisSeason: true },
    { text: 'Tidningarna pratar mer om ekonomi än bandy just nu. Hur landar det hos er?', preferIds: ['bw_d2', 'dr_h1', 'cl07'], minScandalThisSeason: true },
    { text: 'Det är inte den lugnaste säsongen för svensk bandy. Märks det i kalendern eller bara på rubrikerna?', preferIds: ['dr_c4', 'bw_d1', 'dr_h1'], minScandalThisSeason: true },
    { text: 'Oavgjort — nöjd eller besviken?', preferIds: ['dr_h1', 'dr_c1', 'dr_d1'] },
    { text: 'Ni kvitterade sent. Vad säger det om lagets karaktär?', preferIds: ['dr_p2', 'dr_h2', 'dr_d1'], requireLateEqualizer: true },
    { text: 'En poäng på bortaplan — räknas det som bra?', preferIds: ['dr_c3', 'dr_h3', 'dr_d1'], requireAway: true },
    { text: 'Det satt i detaljerna idag. Vilken är viktigast att förbättra?', preferIds: ['dr_h4', 'dr_c4', 'dr_h6'] },
    { text: 'Ert spel var ojämnt idag. Vad berodde det på?', preferIds: ['dr_h5', 'dr_h4', 'dr_c4'] },
    { text: 'Ni har oavgjort i tre raka. Är det en trend att oroa sig för?', preferIds: ['dr_c6', 'dr_h6', 'dr_h3'], requireDrawStreak3: true },
    // #5 pooldjup (DOMLOGG D039): fler OGATERADE oavgjort-frågor — den grundaste
    // kontexten (~3 före detta), så recency=5 har något att rotera mot.
    { text: 'Ni tog en poäng men tappade två. Hur landar det i truppen?', preferIds: ['dr_c1', 'dr_h3', 'dr_d1'] },
    { text: 'Matchen jämnade ut sig. Kändes det rättvist?', preferIds: ['dr_d1', 'dr_h1', 'dr_c4'] },
    { text: 'Vad tar ni med er från den här kvällen?', preferIds: ['dr_c4', 'dr_h4', 'cl21'] },
    { text: 'En jämn tillställning. Saknades marginalerna eller modet?', preferIds: ['dr_h4', 'dr_h6', 'dr_c1'] },
    { text: 'Poäng men inte seger. Räcker det i längden?', preferIds: ['dr_c6', 'dr_c1', 'cl21'], minRound: 4 },
  ],
  derbyWin: [
    { text: 'Derbyseger! Vad betyder det för laget?', preferIds: ['dw_p1', 'dw_c1', 'dw_p2'] },
    { text: 'Vad gör en derbyseger med truppen?', preferIds: ['dw_p2', 'dw_c2', 'dw_p4'] },
    { text: 'Hur förbereder man sig mentalt för ett derby jämfört med en vanlig match?', preferIds: ['dw_p3', 'dw_c3', 'cl07'] },
    { text: 'Fansen sjöng hela matchen. Spelade de in?', preferIds: ['dw_p4', 'dw_c4', 'bw_p7'] },
    { text: 'Rivaliteten är laddad. Hur hanterar du pressen inför den typen av match?', preferIds: ['dw_c5', 'dw_h2', 'dw_p3'] },
    { text: 'Gick ni ut för att ta kommandot direkt?', preferIds: ['dw_c6', 'dw_h6', 'dw_c3'] },
    { text: 'Det här är ett resultat att fira. Hur länge tillåter du laget att njuta av det?', preferIds: ['dw_p7', 'dw_h2', 'dw_h6'] },
    { text: 'Vad säger den här segern om var ni befinner er som lag?', preferIds: ['dw_p8', 'dw_c8', 'dw_c2'] },
  ],
  derbyLoss: [
    { text: 'Smärtsam förlust i derbyt. Kommentar?', preferIds: ['dl_h1', 'dl_p1', 'cl17'] },
    { text: 'Hur stänger man av derbyförlusten mentalt?', preferIds: ['dl_p2', 'dl_d2', 'dl_h2'] },
    { text: 'Fansen är förkrossade. Vad säger du till dem efter det här?', preferIds: ['dl_p3', 'dl_p1', 'cl17'] },
    { text: 'Rivalerna kommer att leva på det här länge. Stör det dig?', preferIds: ['dl_p4', 'dl_h2', 'dl_d2'] },
    { text: 'Er prestation höll inte måttet. Varför?', preferIds: ['dl_h5', 'dl_h1', 'dl_h7'] },
    { text: 'Det är tungt att förlora just det här derbyt. Hur lyfter du laget nu?', preferIds: ['dl_p6', 'dl_p1', 'dl_h2'] },
    { text: 'Taktiken fungerade inte idag. Vad gör du annorlunda nästa gång ni möts?', preferIds: ['dl_h7', 'dl_h5', 'dl_h2'] },
    { text: 'Att förlora mot just dem — är det ett psykologiskt problem?', preferIds: ['dl_h5', 'dl_p6', 'dl_p4'] },
  ],
}

// ── Manager responses (flat pool with context tags) ────────────────────────────

interface ManagerResponse {
  id: string
  tag: string
  label: string
  moraleEffect: number
  mediaQuote: string
  // HIGH 7 (audit 2026-08-29): valfri, EXPLICIT eligibility-override för
  // svar vars kontextkrav inte redan täcks av TAG_ELIGIBILITY (nedan,
  // tag-nivå). De flesta retrofit:ade svar behöver ALDRIG sätta detta
  // fältet direkt — deras tag räcker (se TAG_ELIGIBILITY). Fältet finns
  // för framtida svar vars text är smalare än sina syskon med samma tag.
  eligibility?: TemplateEligibility
}

// Exporterad enbart för tabelltestet (storylineArcPreferIds.table.test.ts) —
// samma undantag som ALL_PRESS_TAGS ovan, inte avsedd som allmän API-yta.
export const PLAYER_RESPONSES: ManagerResponse[] = [
  // ── Befintliga svar: bigWin ──
  { id: 'bw_c1', tag: 'win_big', label: '"Vi visade vad vi kan."', moraleEffect: 5, mediaQuote: 'Tränaren var säker: "Vi visade vad vi kan."' },
  { id: 'bw_h1', tag: 'win_any', label: '"Bra dag, men vi har mer att ge."', moraleEffect: 3, mediaQuote: 'Tränaren var ödmjuk: "Bra dag, men vi har mer att ge."' },
  { id: 'bw_d1', tag: 'any', label: '"Vi fokuserar redan på nästa match."', moraleEffect: 2, mediaQuote: 'Tränaren fokuserade framåt: "Vi tänker på nästa match."' },
  { id: 'bw_c2', tag: 'win_any', label: '"Träningen betalar sig."', moraleEffect: 5, mediaQuote: 'Tränaren: "Träningen betalar sig. Vi jobbar hårt varje dag."' },
  { id: 'bw_h2', tag: 'win_any', label: '"Laget förtjänar all cred."', moraleEffect: 4, mediaQuote: 'Tränaren hyllade truppen: "Laget förtjänar all cred."' },
  { id: 'bw_d2', tag: 'any', label: '"Det är ett kollektivt projekt."', moraleEffect: 2, mediaQuote: 'Tränaren höll låg profil: "Det är ett kollektivt projekt."' },
  { id: 'bw_c3', tag: 'win_big', label: '"Det här är vi. Kom och se oss igen."', moraleEffect: 6, mediaQuote: 'Tränaren utmanade: "Det här är vi. Kom och se oss igen."' },
  { id: 'bw_h3', tag: 'win_any', label: '"Motståndarna hjälpte till med sina misstag."', moraleEffect: 2, mediaQuote: 'Tränaren var generös: "Motståndarna hjälpte till med sina misstag."' },
  { id: 'bw_c4', tag: 'win_big', label: '"De får försöka. Vi hittar alltid ett sätt."', moraleEffect: 5, mediaQuote: 'Tränaren: "Motståndarna får försöka. Vi hittar alltid ett sätt."' },
  { id: 'bw_h4', tag: 'win_any', label: '"Vi vet att det blir tuffare. Det är bra att hålla ner förväntningarna."', moraleEffect: 3, mediaQuote: 'Tränaren: "Det blir tuffare. Bra att hålla ner förväntningarna."' },
  { id: 'bw_c5', tag: 'win_big', label: '"Absolut. Vi ville sätta press från start."', moraleEffect: 5, mediaQuote: 'Tränaren bekräftade: "Vi ville sätta press från start. Det var planerat."' },
  { id: 'bw_h5', tag: 'win_any', label: '"Vi spelade vårt spel, och idag funkade det."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi spelade vårt spel. Idag funkade det riktigt bra."' },
  { id: 'bw_c6', tag: 'win_big', label: '"Ja, men vi är inte giriga. Vi tar det vi behöver."', moraleEffect: 4, mediaQuote: 'Tränaren log: "Vi är inte giriga. Vi tar det vi behöver."' },
  { id: 'bw_h6', tag: 'win_big', label: '"Vi slutade trycka på. Det är proffsigt av laget."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi slutade trycka på. Det är ett tecken på mognad."' },
  { id: 'bw_p7', tag: 'win_any', label: '"De är vår tolfte man. Otrolig energi ikväll."', moraleEffect: 6, mediaQuote: 'Tränaren: "Fansen är vår tolfte man. Otrolig energi ikväll."' },
  { id: 'bw_h7', tag: 'win_any', label: '"Vi spelar för dem. Det är enkelt som det."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi spelar för fansen. Det är enkelt som det."' },

  // ── Befintliga svar: win ──
  { id: 'w_h1', tag: 'win_any', label: '"Stark insats av hela laget."', moraleEffect: 4, mediaQuote: 'Tränaren var nöjd: "Stark insats av hela laget."' },
  { id: 'w_c1', tag: 'win_any', label: '"Vi spelade precis som vi ville."', moraleEffect: 5, mediaQuote: 'Tränaren: "Vi spelade precis som vi ville."' },
  { id: 'w_d1', tag: 'any', label: '"Jobbet är inte klart."', moraleEffect: 2, mediaQuote: 'Tränaren höll fokus: "Jobbet är inte klart."' },
  { id: 'w_p2', tag: 'win_any', label: '"Det ger energi hela veckan!"', moraleEffect: 6, mediaQuote: 'Tränaren var entusiastisk: "Segrar ger energi hela veckan!"' },
  { id: 'w_h2', tag: 'win_any', label: '"Vi jobbar poäng för poäng."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi jobbar poäng för poäng. Inga garantier."' },
  { id: 'w_d2', tag: 'any', label: '"Fokusen är alltid på nästa match."', moraleEffect: 2, mediaQuote: 'Tränaren: "Fokusen är alltid på nästa match."' },
  { id: 'w_p3', tag: 'win_any', label: '"Alla, faktiskt. Det är kollektivet som vinner."', moraleEffect: 6, mediaQuote: 'Tränaren hyllade truppen: "Alla stack ut. Det är kollektivet som vinner."' },
  { id: 'w_h3', tag: 'any', label: '"Jag nämner inga namn — alla bidrar."', moraleEffect: 3, mediaQuote: 'Tränaren: "Jag nämner inga namn. Alla bidrar lika mycket."' },
  { id: 'w_c3', tag: 'win_any', label: '"Laget spelade upp varandra idag."', moraleEffect: 4, mediaQuote: 'Tränaren: "Laget spelade upp varandra. Det är vårt vapen."' },
  { id: 'w_c4', tag: 'win_streak', label: '"Disciplin och tro. Det är receptet."', moraleEffect: 5, mediaQuote: 'Tränaren: "Disciplin och tro på systemet. Det är receptet."' },
  { id: 'w_d4', tag: 'any', label: '"Vi tar en match i taget."', moraleEffect: 2, mediaQuote: 'Tränaren: "En match i taget. Det låter klyschigt men det funkar."' },
  { id: 'w_p4', tag: 'win_any', label: '"Vi trivs. Det märks på isen."', moraleEffect: 5, mediaQuote: 'Tränaren: "Vi trivs tillsammans. Det märks på isen."' },
  { id: 'w_p5', tag: 'win_comeback', label: '"Jag sa att en match aldrig är slut vid paus. De trodde på det."', moraleEffect: 6, mediaQuote: 'Tränaren: "Jag sa att matchen aldrig är slut vid paus. De trodde på det."' },
  { id: 'w_h5', tag: 'win_any', label: '"Laget samlade sig. Jag kan inte ta åt mig cred."', moraleEffect: 4, mediaQuote: 'Tränaren: "Laget samlade sig i pausen. Jag kan inte ta åt mig cred."' },
  { id: 'w_d5', tag: 'any', label: '"Vi justerade ett par detaljer taktiskt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi justerade taktiken och det gav utdelning."' },
  { id: 'w_c6', tag: 'win_top3', label: '"Vi är med i matchen om det. Absolut."', moraleEffect: 5, mediaQuote: 'Tränaren var frimodig: "Vi är med i matchen om toppen. Absolut."' },
  { id: 'w_h6', tag: 'win_any', label: '"Det är för tidigt att prata om toppen."', moraleEffect: 3, mediaQuote: 'Tränaren bromsade: "Det är för tidigt att prata om tabelltoppen."' },
  { id: 'w_c7', tag: 'win_any', label: '"Halvlinjen är vårt hjärta. Det stämmer."', moraleEffect: 5, mediaQuote: 'Tränaren: "Halvlinjen är vårt hjärta. Och den slog starkt ikväll."' },
  { id: 'w_h7', tag: 'win_any', label: '"Vi fick hjälp av att motståndarna tappade sin form."', moraleEffect: 3, mediaQuote: 'Tränaren var generös: "Vi fick hjälp av att motståndarna tappade."' },

  // ── Befintliga svar: loss ──
  { id: 'l_h1', tag: 'loss_any', label: '"Vi var inte tillräckligt bra idag."', moraleEffect: 2, mediaQuote: 'Tränaren var självkritisk: "Vi var inte tillräckligt bra idag."' },
  { id: 'l_a1', tag: 'loss_referee', label: '"Domsluten gick emot oss."', moraleEffect: -3, mediaQuote: 'Tränaren var bitter: "Domsluten gick emot oss."' },
  { id: 'l_d1', tag: 'any', label: '"Vi analyserar och kommer tillbaka starkare."', moraleEffect: 1, mediaQuote: 'Tränaren: "Vi analyserar och kommer tillbaka starkare."' },
  { id: 'l_h2', tag: 'loss_any', label: '"Vi tar på oss det och tränar hårdare."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi tar på oss det och tränar hårdare."' },
  { id: 'l_c2', tag: 'loss_any', label: '"Vi hade kontroll — resultatet visar inte bilden."', moraleEffect: 0, mediaQuote: 'Tränaren höll fast vid sin syn: "Resultatet visar inte hela bilden."' },
  { id: 'l_p3', tag: 'loss_any', label: '"Vi sviker er inte igen. Det lovar jag."', moraleEffect: 3, mediaQuote: 'Tränaren lovade fansen: "Vi sviker er inte igen."' },
  { id: 'l_h3', tag: 'loss_any', label: '"De har rätt att vara besvikna. Vi förtjänade inte mer."', moraleEffect: 2, mediaQuote: 'Tränaren: "Fansen har rätt att vara besvikna."' },
  { id: 'l_h4', tag: 'loss_any', label: '"De läste oss bättre. Det justerar vi."', moraleEffect: 2, mediaQuote: 'Tränaren var självkritisk: "De läste oss bättre idag. Det justerar vi."' },
  { id: 'l_c4', tag: 'loss_any', label: '"Vi var inte i vårt rätta element. Det rättar vi till."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi var inte i vårt rätta element. Det rättar vi till nästa gång."' },
  { id: 'l_p5', tag: 'loss_any', label: '"Rakt, ärligt. Utan filter."', moraleEffect: 4, mediaQuote: 'Tränaren: "Jag pratar rakt och ärligt med dem. Utan filter."' },
  { id: 'l_h5', tag: 'loss_any', label: '"Jag lyssnar mer än jag pratar just nu."', moraleEffect: 3, mediaQuote: 'Tränaren: "Just nu lyssnar jag mer än jag pratar. Det är lika viktigt."' },
  { id: 'l_c6', tag: 'loss_any', label: '"Nej. Spelstilen är rätt. Vi utförde den fel idag."', moraleEffect: 3, mediaQuote: 'Tränaren stod fast: "Spelstilen är rätt. Vi utförde den fel idag."' },
  { id: 'l_h6', tag: 'loss_any', label: '"Vi måste granska oss kritiskt. Inget är heligt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Inget är heligt. Vi måste granska oss kritiskt."' },
  { id: 'l_c7', tag: 'loss_any', label: '"Nej. Chanserna är ett bra tecken. Målen kommer."', moraleEffect: 3, mediaQuote: 'Tränaren: "Chanserna är ett gott tecken. Målen kommer att komma."' },
  { id: 'l_h7', tag: 'loss_any', label: '"Det är en klinisk fråga. Vi tränar på det."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi tränar på det kliniska avslutet. Det är en detalj."' },
  { id: 'l_h8', tag: 'loss_any', label: '"Vi var för passiva. Det måste vi rätta till."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi var för passiva. Det är konkret och vi rättar till det."' },
  { id: 'l_p9', tag: 'loss_streak', label: '"Jag tror på det här laget. Det smittar."', moraleEffect: 4, mediaQuote: 'Tränaren: "Jag tror på det här laget. Den tron smittar."' },
  { id: 'l_h9', tag: 'loss_any', label: '"Ärlig kommunikation. Vi döljer ingenting."', moraleEffect: 3, mediaQuote: 'Tränaren: "Ärlig kommunikation. Vi döljer ingenting för varandra."' },

  // ── Befintliga svar: bigLoss ──
  { id: 'bl_h1', tag: 'loss_big', label: '"Vi måste titta oss själva i spegeln."', moraleEffect: 3, mediaQuote: 'Tränaren var brutal: "Vi måste titta oss i spegeln."' },
  { id: 'bl_p1', tag: 'loss_big', label: '"Jag tar på mig ansvaret."', moraleEffect: 4, mediaQuote: 'Tränaren tog ansvar: "Det här är mitt ansvar. Jag tar det fullt ut."' },
  { id: 'bl_a1', tag: 'loss_big', label: '"Det var inte acceptabelt."', moraleEffect: -2, mediaQuote: 'Tränaren var direkt: "Det var inte acceptabelt. Punkt."' },
  { id: 'bl_c2', tag: 'loss_big', label: '"Nej. Vi reser oss. Det vet jag."', moraleEffect: 3, mediaQuote: 'Tränaren visade ledarskap: "Vi reser oss. Det vet jag."' },
  { id: 'bl_h2', tag: 'loss_big', label: '"Vi måste vara ärliga mot oss själva."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi måste vara ärliga mot oss själva."' },
  { id: 'bl_d2', tag: 'any', label: '"Form är cyklisk. Det vänder."', moraleEffect: 1, mediaQuote: 'Tränaren: "Form är cyklisk. Det vänder."' },
  { id: 'bl_p3', tag: 'loss_big', label: '"Pressen ökar — men det stärker oss."', moraleEffect: 3, mediaQuote: 'Tränaren: "Pressen ökar. Men det stärker oss."' },
  { id: 'bl_h4', tag: 'loss_big', label: '"Vi var för förutsägbara. Det är vår uppgift att lösa."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi var för förutsägbara. Det löser vi."' },
  { id: 'bl_c4', tag: 'loss_big', label: '"De hade en bra dag. Det händer."', moraleEffect: 2, mediaQuote: 'Tränaren: "De hade en riktigt bra dag. Det händer."' },
  { id: 'bl_h5', tag: 'loss_big', label: '"Det var det. Vi måste lösa det kollektivt."', moraleEffect: 2, mediaQuote: 'Tränaren var självkritisk: "Det var ett systemproblem. Vi löser det kollektivt."' },
  { id: 'bl_c6', tag: 'loss_big', label: '"Den här gruppen räcker. Det handlar om attityd."', moraleEffect: 3, mediaQuote: 'Tränaren: "Den här gruppen räcker. Det handlar om rätt attityd."' },

  // ── Befintliga svar: draw ──
  { id: 'dr_h1', tag: 'draw_any', label: '"Vi tar en poäng och jobbar vidare."', moraleEffect: 2, mediaQuote: 'Tränaren nöjde sig: "En poäng och vidare."' },
  { id: 'dr_c1', tag: 'draw_any', label: '"Vi borde ha vunnit."', moraleEffect: 1, mediaQuote: 'Tränaren var hungrig: "Vi borde ha vunnit den matchen."' },
  { id: 'dr_d1', tag: 'any', label: '"Bra kamp av båda lagen."', moraleEffect: 2, mediaQuote: 'Tränaren var generös: "Bra kamp av båda lagen."' },
  { id: 'dr_p2', tag: 'draw_any', label: '"Det säger allt om vår mentalitet."', moraleEffect: 5, mediaQuote: 'Tränaren var stolt: "Det säger allt om vår mentalitet."' },
  { id: 'dr_h2', tag: 'draw_any', label: '"Vi ger oss aldrig. Det är vår styrka."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi ger oss aldrig. Det är vår styrka."' },
  { id: 'dr_c3', tag: 'draw_away_top', label: '"Borta är alltid svårt. En poäng är acceptabelt."', moraleEffect: 3, mediaQuote: 'Tränaren: "Borta är alltid svårt. En poäng är ett okej resultat."' },
  { id: 'dr_h3', tag: 'draw_any', label: '"Vi spelade för att vinna. En poäng känns lite tomt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi spelade för att vinna. En poäng känns lite tomt."' },
  { id: 'dr_h4', tag: 'draw_any', label: '"Avsluten. Vi skapar chanser men omsätter dem inte."', moraleEffect: 3, mediaQuote: 'Tränaren pekade ut: "Vi skapar chanser men omsätter dem inte. Det jobbar vi på."' },
  { id: 'dr_c4', tag: 'draw_any', label: '"Ingenting dramatiskt. Vi är nära."', moraleEffect: 3, mediaQuote: 'Tränaren: "Ingenting dramatiskt. Vi är nära det vi vill nå."' },
  { id: 'dr_h5', tag: 'draw_any', label: '"Vi hade en tung vecka bakom oss. Det syntes."', moraleEffect: 2, mediaQuote: 'Tränaren: "Det var en tung vecka bakom oss. Det syntes på spelet."' },
  { id: 'dr_c6', tag: 'draw_any', label: '"Tre oavgjorda är inte idealt men vi är solida. Det vänder."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi är solida. Tre oavgjorda är inte idealt men vi är på rätt väg."' },
  { id: 'dr_h6', tag: 'draw_any', label: '"Vi måste bli mer kliniska. Det är tydligt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi måste bli mer kliniska. Det är den tydliga lärdomen."' },

  // ── Befintliga svar: derbyWin ──
  { id: 'dw_p1', tag: 'win_derby', label: '"Det här är för fansen. De förtjänar det."', moraleEffect: 8, mediaQuote: 'Tränaren dedikerade segern: "Det här är för fansen. De förtjänar det."' },
  { id: 'dw_c1', tag: 'win_derby', label: '"Vi visade att vi är bättre."', moraleEffect: 5, mediaQuote: 'Tränaren tog ut svängarna: "Vi visade att vi är bättre."' },
  { id: 'dw_p2', tag: 'win_derby', label: '"Det cementerar en identitet. Vi är ett lag."', moraleEffect: 8, mediaQuote: 'Tränaren: "Det cementerar vår identitet. Vi är ett lag."' },
  { id: 'dw_h2', tag: 'win_derby', label: '"Vi är glada, men fokuserar snabbt på nästa match."', moraleEffect: 4, mediaQuote: 'Tränaren höll fokus: "Vi är glada, men tänker redan på nästa match."' },
  { id: 'dw_c2', tag: 'win_derby', label: '"Det bekräftar att vi är på rätt väg."', moraleEffect: 5, mediaQuote: 'Tränaren: "Det bekräftar att vi är på rätt väg."' },
  { id: 'dw_p3', tag: 'win_derby', label: '"Det behövs ingen förberedelse. Alla vet vad det handlar om."', moraleEffect: 7, mediaQuote: 'Tränaren: "Alla vet vad ett derby är. Det behövs inga extra ord."' },
  { id: 'dw_c3', tag: 'win_derby', label: '"Vi håller det professionellt. Derbykänslan tar hand om sig själv."', moraleEffect: 5, mediaQuote: 'Tränaren: "Vi håller det professionellt. Känslan tar hand om sig själv."' },
  { id: 'dw_p4', tag: 'win_derby', label: '"De bar oss när vi behövde det som mest."', moraleEffect: 8, mediaQuote: 'Tränaren: "Fansen bar oss när det behövdes som mest. Otroligt."' },
  { id: 'dw_c4', tag: 'win_derby', label: '"Vi levererade för dem. Det är det vi är till för."', moraleEffect: 6, mediaQuote: 'Tränaren: "Vi levererade för fansen. Det är det vi är till för."' },
  { id: 'dw_c5', tag: 'win_derby', label: '"Jag trivs med pressen. Den för fram det bästa i oss."', moraleEffect: 6, mediaQuote: 'Tränaren: "Jag trivs med pressen. Den för fram det bästa i oss."' },
  { id: 'dw_c6', tag: 'win_derby', label: '"Absolut. Vi ville inte ge dem en chans att komma in i matchen."', moraleEffect: 7, mediaQuote: 'Tränaren bekräftade: "Vi ville inte ge dem en chans. Det var planerat."' },
  { id: 'dw_h6', tag: 'win_derby', label: '"Laget genomförde planen bättre än jag vågat hoppas."', moraleEffect: 5, mediaQuote: 'Tränaren: "Laget genomförde planen bättre än jag vågat hoppas på."' },
  { id: 'dw_p7', tag: 'win_derby', label: '"Ikväll firar vi. I morgon är det jobb igen."', moraleEffect: 7, mediaQuote: 'Tränaren: "Ikväll firar vi. I morgon är det jobb igen. Det är balansen."' },
  { id: 'dw_p8', tag: 'win_derby', label: '"Det säger att vi är ett riktigt lag. Inte bara ett gäng spelare."', moraleEffect: 8, mediaQuote: 'Tränaren: "Det säger att vi är ett riktigt lag. Inte bara ett gäng spelare."' },
  { id: 'dw_c8', tag: 'win_derby', label: '"Vi är på väg uppåt. Det känner alla."', moraleEffect: 6, mediaQuote: 'Tränaren: "Vi är på väg uppåt. Det känner hela laget."' },

  // ── Befintliga svar: derbyLoss ──
  { id: 'dl_p1', tag: 'loss_derby', label: '"Vi kommer tillbaka. Det här glömmer vi inte."', moraleEffect: 3, mediaQuote: 'Tränaren lovade revansch: "Vi kommer tillbaka. Det glömmer vi inte."' },
  { id: 'dl_h1', tag: 'loss_derby', label: '"De var bättre idag, vi får ge dem det."', moraleEffect: 1, mediaQuote: 'Tränaren var generös: "De var bättre idag. Det får vi erkänna."' },
  { id: 'dl_a1', tag: 'loss_derby', label: '"Jag vill inte prata om derbyt."', moraleEffect: -2, mediaQuote: 'Tränaren vägrade kommentera: "Jag vill inte prata om det idag."' },
  { id: 'dl_p2', tag: 'loss_derby', label: '"Man stänger inte av. Man använder den."', moraleEffect: 4, mediaQuote: 'Tränaren: "Man stänger inte av en derbyförlust. Man använder den som bränsle."' },
  { id: 'dl_d2', tag: 'any', label: '"Fokus på nästa match. Det är det enda."', moraleEffect: 2, mediaQuote: 'Tränaren: "Fokus på nästa match. Det är det enda som gäller."' },
  { id: 'dl_h2', tag: 'loss_derby', label: '"Det svider, men vi lär oss av det."', moraleEffect: 2, mediaQuote: 'Tränaren: "Det svider, men vi lär oss av det."' },
  { id: 'dl_p3', tag: 'loss_derby', label: '"Jag förstår besvikelsen. Vi kämpade för er — och vi gör det igen."', moraleEffect: 4, mediaQuote: 'Tränaren till fansen: "Jag förstår besvikelsen. Vi kämpade för er och vi gör det igen."' },
  { id: 'dl_p4', tag: 'loss_derby', label: '"De ska njuta. Vi behöver det som motivation."', moraleEffect: 4, mediaQuote: 'Tränaren: "De ska njuta. Vi behöver det som motivation inför nästa derby."' },
  { id: 'dl_h5', tag: 'loss_derby', label: '"Vi spelade rädda. Det är inte vi."', moraleEffect: 3, mediaQuote: 'Tränaren var självkritisk: "Vi spelade rädda. Det är inte vi. Det rättar vi."' },
  { id: 'dl_p6', tag: 'loss_derby', label: '"Jag berättar att vi fortfarande styr vår egen framtid."', moraleEffect: 5, mediaQuote: 'Tränaren: "Jag påminner dem om att vi styr vår egen framtid. Inget derby avgör säsongen."' },
  { id: 'dl_h7', tag: 'loss_derby', label: '"Vi var för statiska. Mer dynamik krävs mot det här laget."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi var för statiska. Det laget kräver mer dynamik. Noterat."' },
  { id: 'dl_p8', tag: 'loss_derby', label: '"Nästa gång är annorlunda. Det lovar jag."', moraleEffect: 4, mediaQuote: 'Tränaren lovade: "Nästa gång är annorlunda. Det kan ni skriva upp."' },

  // ── 32 klassiska tränarcitat ──
  { id: 'cl01', tag: 'win_any',      label: '"Vi tar det en match i taget. Idag var det vår dag, men nästa omgång börjar vi om från noll."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi tar det en match i taget. Idag var det vår dag, men nästa omgång börjar vi om från noll."' },
  { id: 'cl02', tag: 'win_big',      label: '"Man ska aldrig bli för stor för sin egen bandyplan. Vi vann stort, men isen är hal — det vet alla."', moraleEffect: 3, mediaQuote: 'Tränaren var ödmjuk: "Man ska aldrig bli för stor för sin bandyplan. Isen är hal — det vet alla."' },
  { id: 'cl03', tag: 'win_streak',   label: '"Serier vinns inte i november. Vi jobbar på, steg för steg. Det finns inga genvägar på bandyisen."', moraleEffect: 4, mediaQuote: 'Tränaren: "Serier vinns inte i november. Vi jobbar steg för steg — inga genvägar på bandyisen."' },
  { id: 'cl04', tag: 'win_any',      label: '"Jag sa till grabbarna innan matchen: gör det enkla rätt, så löser sig resten. Det gjorde de."', moraleEffect: 4, mediaQuote: 'Tränaren: "Jag sa innan: gör det enkla rätt, så löser sig resten. Det lyckades de med."' },
  { id: 'cl05', tag: 'win_away',     label: '"En bortaseger är alltid speciell. Kylan biter annorlunda när man vinner. Idag bet den inte alls."', moraleEffect: 5, mediaQuote: 'Tränaren log: "En bortaseger är alltid speciell. Kylan bet inte alls ikväll."' },
  { id: 'cl06', tag: 'win_big',      label: '"Vi åkte ut och körde dem av isen. Punkt slut. Det är den bandyn jag vill se."', moraleEffect: 6, mediaQuote: 'Tränaren var nöjd: "Vi körde dem av isen. Punkt slut. Det är den bandyn jag vill se."' },
  { id: 'cl07', tag: 'win_derby',    label: '"Derby vinner man med hjärtat. Idag hade vi det största hjärtat på planen."', moraleEffect: 8, mediaQuote: 'Tränaren: "Derby vinner man med hjärtat. Idag hade vi det största hjärtat på planen."' },
  { id: 'cl08', tag: 'win_top3',     label: '"Folk tvivlade på oss. Jag hör er. Fortsätt tvivla — det ger oss bränsle."', moraleEffect: 5, mediaQuote: 'Tränaren: "Folk tvivlade på oss. Fortsätt tvivla — det ger oss bränsle."' },
  { id: 'cl09', tag: 'win_any',      label: '"Om motståndarna gör tre mål så gör vi fyra. Så enkelt och så svårt är det."', moraleEffect: 5, mediaQuote: 'Tränaren: "Om de gör tre gör vi fyra. Så enkelt och så svårt är det."' },
  { id: 'cl10', tag: 'win_comeback', label: '"I pausen sa jag bara: är det någon som har tänkt ge upp? Tystnad. Bra. Då kör vi."', moraleEffect: 7, mediaQuote: 'Tränaren: "I pausen frågade jag: är det någon som tänkt ge upp? Tystnad. Bra. Då kör vi."' },
  { id: 'cl11', tag: 'loss_any',     label: '"Jag tar på mig det här. Upplägget var mitt. Spelarna gav allt — det räckte inte."', moraleEffect: 4, mediaQuote: 'Tränaren tog ansvar: "Upplägget var mitt. Spelarna gav allt — det räckte inte."' },
  { id: 'cl12', tag: 'loss_big',     label: '"Vi fick en lektion idag. Frågan är om vi lär oss något av den. Det tänker jag se till."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi fick en lektion. Frågan är om vi lär oss av den. Det tänker jag se till."' },
  { id: 'cl13', tag: 'loss_streak',  label: '"Jag sover dåligt. Men jag slutar aldrig jobba. Den dagen jag slutar jobba — då ska ni oroa er."', moraleEffect: 4, mediaQuote: 'Tränaren: "Jag sover dåligt, men jag slutar aldrig jobba. Den dagen ska ni oroa er."' },
  { id: 'cl14', tag: 'loss_home',    label: '"Att förlora hemma... det gör ont i magen. Publiken förtjänar bättre. Vi förtjänar bättre."', moraleEffect: 2, mediaQuote: 'Tränaren: "Att förlora hemma gör ont i magen. Publiken förtjänar bättre. Vi förtjänar bättre."' },
  { id: 'cl15', tag: 'loss_any',     label: '"I bandy, precis som i livet — ibland fryser isen inte som man vill. Då får man skotta och börja om."', moraleEffect: 2, mediaQuote: 'Tränaren: "Ibland fryser isen inte som man vill. Då får man skotta och börja om."' },
  { id: 'cl16', tag: 'loss_close',   label: '"Vi var det bättre laget. Resultat ljuger, det har jag alltid sagt. Men tabellen ljuger aldrig i längden."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi var det bättre laget. Resultat ljuger ibland, men tabellen ljuger aldrig i längden."' },
  { id: 'cl17', tag: 'loss_derby',   label: '"Förlora derbyt? Det svider. Men vi ses igen. Och då ska det svida för dem istället."', moraleEffect: 3, mediaQuote: 'Tränaren: "Derbyt svider. Men vi ses igen — och då ska det svida för dem istället."' },
  { id: 'cl18', tag: 'loss_any',     label: '"Jag har sett laget träna hela veckan. Jag vet vad vi kan. En dålig match ändrar inte det."', moraleEffect: 3, mediaQuote: 'Tränaren: "Jag har sett truppen träna hela veckan. En dålig match ändrar inte vad jag vet om dem."' },
  { id: 'cl19', tag: 'loss_any',     label: '"Det är bättre att slå en meter bredvid stolpen än rakt på målvakten. Idag slog vi rakt på."', moraleEffect: 1, mediaQuote: 'Tränaren: "Det är bättre att missa med en meter än att träffa rakt på målvakten. Idag träffade vi."' },
  { id: 'cl20', tag: 'loss_referee', label: '"Domsluten... jag säger inget. Ni såg matchen. Jag sover med gott samvete."', moraleEffect: 0, mediaQuote: 'Tränaren höll sig kort: "Domsluten... ni såg matchen. Jag sover med gott samvete."' },
  { id: 'cl21', tag: 'draw_any',     label: '"En poäng kan vara guld värd i slutet av säsongen. Eller så är det en förlorad poäng. Vi får se."', moraleEffect: 2, mediaQuote: 'Tränaren: "En poäng kan vara guld värd i slutet. Eller en förlorad — det får vi se."' },
  { id: 'cl22', tag: 'draw_away_top',label: '"Borta mot ett topplag och ta poäng — det köper jag. Det visar att vi hänger med."', moraleEffect: 4, mediaQuote: 'Tränaren: "Borta mot ett topplag och ta poäng — det köper jag. Vi hänger med."' },
  { id: 'cl23', tag: 'draw_boring',  label: '"Inte den vackraste matchen. Men ibland handlar bandy om att inte förlora. Det lyckades vi med."', moraleEffect: 2, mediaQuote: 'Tränaren: "Inte den vackraste matchen — men ibland handlar bandy om att inte förlora. Det lyckades vi med."' },
  { id: 'cl24', tag: 'playoff_win',  label: '"Nu börjar det på riktigt. Allt vi gjort i serien — det var bara uppvärmningen."', moraleEffect: 6, mediaQuote: 'Tränaren: "Nu börjar det på riktigt. Allt vi gjort i serien var bara uppvärmningen."' },
  // M54(g) (textaudit 2026-07-04): tag omdöpt — "bäst av fem, nästa match" ljuger
  // om det VAR finalen (en enda match, ingen nästa i serien).
  { id: 'cl25', tag: 'playoff_loss_not_final', label: '"Slutspelet är bäst av fem. En match bevisar ingenting. Vi kommer tillbaka starkare i nästa."', moraleEffect: 4, mediaQuote: 'Tränaren: "Bäst av fem. En match bevisar ingenting. Vi kommer tillbaka starkare."' },
  { id: 'cl26', tag: 'cup_win',      label: '"Cupen har sin egen magi. Allt kan hända. Idag hände det för oss."', moraleEffect: 5, mediaQuote: 'Tränaren: "Cupen har sin magi. Allt kan hända — idag hände det för oss."' },
  { id: 'cl27', tag: 'final_pre',    label: '"SM-finalen på Studenternas. Det är därför man spelar bandy. För de här dagarna."', moraleEffect: 7, mediaQuote: 'Tränaren: "SM-finalen på Studenternas. Det är därför man spelar bandy. För de här dagarna."' },
  { id: 'cl28', tag: 'any',          label: '"Det finns inga genvägar till framgång. Bara korta passningar och hårt arbete."', moraleEffect: 3, mediaQuote: 'Tränaren filosoferade: "Det finns inga genvägar till framgång. Bara korta passningar och hårt arbete."' },
  { id: 'cl29', tag: 'winter',       label: '"Minus femton och vi åker runt i shorts. Det är bandy. Det är det finaste vi har."', moraleEffect: 3, mediaQuote: 'Tränaren log: "Minus femton och vi åker i shorts. Det är bandy. Det finaste vi har."' },
  { id: 'cl30', tag: 'any',          label: '"Alla vill spela vacker bandy. Men vacker bandy utan poäng är bara konståkning."', moraleEffect: 2, mediaQuote: 'Tränaren: "Alla vill spela vacker bandy. Utan poäng är det bara konståkning."' },
  { id: 'cl31', tag: 'relegation',   label: '"Vi har balanserat på ett bananskal hela säsongen. Men vi har inte ramlat ännu."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi har balanserat på ett bananskal hela säsongen. Men vi har inte ramlat ännu."' },
  { id: 'cl32', tag: 'youngster',    label: '"När en ung grabb gör mål i elitserien... då minns man varför man blev tränare."', moraleEffect: 5, mediaQuote: 'Tränaren: "När en ung grabb gör mål i elitserien — då minns man varför man blev tränare."' },

  // ── 4.2 (SLUTTEST_KO, 2026-08-19): topikanpassade svar till de 17 storyline-
  // och arc-frågorna. Alla nås ENDAST via preferIds (TAG_DEFS: matches ()=>false,
  // generic:'none') — se docs/SVAR_STORYLINE_FRAGOR_2026-08-19.md.
  // ── topic_person: människor och arbete ──
  { id: 'tp_liv1', tag: 'topic_person', label: '"Han går till jobbet klockan sex. Sen tränar han. Det är det man ska skriva om."', moraleEffect: 5, mediaQuote: 'Tränaren: "Han går till jobbet klockan sex och tränar sen. Det är det man ska skriva om."' },
  { id: 'tp_liv2', tag: 'topic_person', label: '"Vi är en förening. Det betyder att vi bryr oss om folk även när det inte lönar sig."', moraleEffect: 6, mediaQuote: 'Tränaren: "Vi är en förening. Vi bryr oss om folk även när det inte lönar sig."' },
  { id: 'tp_liv3', tag: 'topic_person', label: '"Det är inte min sak att prata om andras privatliv."', moraleEffect: 1, mediaQuote: 'Tränaren avböjde: "Det är inte min sak att prata om andras privatliv."' },
  { id: 'tp_liv4', tag: 'topic_person', label: '"Han bad aldrig om något. Det var vi som frågade."', moraleEffect: 5, mediaQuote: 'Tränaren: "Han bad aldrig om något. Det var vi som frågade honom."' },
  { id: 'tp_liv5', tag: 'topic_person', label: '"Trygghet gör folk modigare. Det syns på isen också."', moraleEffect: 6, mediaQuote: 'Tränaren: "Trygghet gör folk modigare. Det syns på isen också."' },
  { id: 'tp_liv6', tag: 'topic_person', label: '"Ett kontrakt är papper. Det som räknas är att någon vill ha en kvar."', moraleEffect: 5, mediaQuote: 'Tränaren: "Ett kontrakt är bara papper. Det som räknas är att någon vill ha en kvar."' },
  { id: 'tp_liv7', tag: 'topic_person', label: '"Han hade kunnat gå någon annanstans. Han gjorde inte det."', moraleEffect: 6, mediaQuote: 'Tränaren: "Han hade kunnat gå någon annanstans. Han valde oss."' },
  { id: 'tp_liv8', tag: 'topic_person', label: '"Vi lovade ingenting. Vi sa bara att vi finns kvar."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi lovade honom ingenting. Vi sa bara att vi finns kvar."' },
  // ── topic_town: orten ──
  { id: 'tp_ort1', tag: 'topic_town', label: '"Folk säger hej i affären igen. Det är hela mätaren."', moraleEffect: 6, mediaQuote: 'Tränaren: "Folk säger hej i affären igen. Det är hela mätaren för mig."' },
  { id: 'tp_ort2', tag: 'topic_town', label: '"Vi spelar för dem som står ut med oss när det går dåligt."', moraleEffect: 5, mediaQuote: 'Tränaren: "Vi spelar för dem som står ut med oss när det går dåligt."' },
  { id: 'tp_ort3', tag: 'topic_town', label: '"De kommer tillbaka när vi ger dem en anledning. Inte innan."', moraleEffect: 3, mediaQuote: 'Tränaren var rak: "De kommer tillbaka när vi ger dem en anledning. Inte innan."' },
  { id: 'tp_ort4', tag: 'topic_town', label: '"Det är ingen press. Det är att någon bryr sig. Skillnaden är stor."', moraleEffect: 6, mediaQuote: 'Tränaren: "Det är ingen press. Det är att någon bryr sig. Skillnaden är stor."' },
  { id: 'tp_ort5', tag: 'topic_town', label: '"Tomma läktare är vårt fel, inte deras."', moraleEffect: 3, mediaQuote: 'Tränaren tog ansvar: "Tomma läktare är vårt fel, inte publikens."' },
  { id: 'tp_ort6', tag: 'topic_town', label: '"Pengar löser en sak i taget. Laget löser resten."', moraleEffect: 4, mediaQuote: 'Tränaren: "Pengar löser en sak i taget. Laget löser resten."' },
  { id: 'tp_ort7', tag: 'topic_town', label: '"Han gör det för att han växte upp här. Inte för att synas."', moraleEffect: 5, mediaQuote: 'Tränaren om sponsorn: "Han gör det för att han växte upp här. Inte för att synas."' },
  { id: 'tp_ort8', tag: 'topic_town', label: '"Det låter och dammar. Grabbarna klarar av lite oväsen."', moraleEffect: 3, mediaQuote: 'Tränaren log: "Det låter och dammar. Grabbarna klarar lite oväsen."' },
  { id: 'tp_ort9', tag: 'topic_town', label: '"Om två år står det där. Då är det värt varenda dag."', moraleEffect: 5, mediaQuote: 'Tränaren: "Om två år står bygget där. Då är det värt varenda dag."' },
  // ── topic_doubt: förväntan och tvivel ──
  { id: 'tp_tvi1', tag: 'topic_doubt', label: '"Jag lyssnade aldrig. Det är inte högmod, jag hann bara inte."', moraleEffect: 6, mediaQuote: 'Tränaren: "Jag lyssnade aldrig på tvivlarna. Jag hann bara inte."' },
  { id: 'tp_tvi2', tag: 'topic_doubt', label: '"De hade rätt på papperet. Papperet spelar inga matcher."', moraleEffect: 7, mediaQuote: 'Tränaren: "De hade rätt på papperet. Men papperet spelar inga matcher."' },
  { id: 'tp_tvi3', tag: 'topic_doubt', label: '"Vi har inte bevisat något än. Fråga mig i mars."', moraleEffect: 4, mediaQuote: 'Tränaren bromsade: "Vi har inte bevisat något än. Fråga mig i mars."' },
  { id: 'tp_tvi4', tag: 'topic_doubt', label: '"Det som höll oss uppe var att ingen väntade sig något."', moraleEffect: 3, mediaQuote: 'Tränaren: "Det som höll oss uppe var att ingen väntade sig något. Nu gör de det."' },
  { id: 'tp_tvi5', tag: 'topic_doubt', label: '"Vi föll ihop när vi började tro på berömmet."', moraleEffect: 2, mediaQuote: 'Tränaren var självkritisk: "Vi föll ihop när vi började tro på berömmet."' },
  { id: 'tp_tvi6', tag: 'topic_doubt', label: '"Han sa det ingen annan vågade säga. Sen sa han inget mer."', moraleEffect: 6, mediaQuote: 'Tränaren om kaptenen: "Han sa det ingen annan vågade säga. Sen sa han inget mer."' },
  { id: 'tp_tvi7', tag: 'topic_doubt', label: '"Sånt håller i tre veckor. Sen får man förtjäna det igen."', moraleEffect: 4, mediaQuote: 'Tränaren: "Ett tal håller i tre veckor. Sen får man förtjäna det igen."' },
  // ── topic_player: enskilda spelare under press ──
  { id: 'tp_spe1', tag: 'topic_player', label: '"Jag tror på honom. Det är hela svaret."', moraleEffect: 6, mediaQuote: 'Tränaren var kort: "Jag tror på honom. Det är hela svaret."' },
  { id: 'tp_spe2', tag: 'topic_player', label: '"Han får spela sig ur det. Det finns ingen annan väg."', moraleEffect: 4, mediaQuote: 'Tränaren: "Han får spela sig ur det. Det finns ingen annan väg."' },
  { id: 'tp_spe3', tag: 'topic_player', label: '"Han kostar ibland. Men han vinner matcher ingen annan vinner."', moraleEffect: 5, mediaQuote: 'Tränaren: "Han kostar ibland. Men han vinner matcher ingen annan vinner."' },
  { id: 'tp_spe4', tag: 'topic_player', label: '"Det bestämmer han, inte jag. Och inte ni."', moraleEffect: 4, mediaQuote: 'Tränaren: "Det bestämmer han själv. Inte jag, och inte pressen."' },
  { id: 'tp_spe5', tag: 'topic_player', label: '"Han har gett klubben tolv år. Han får ta den tid han behöver."', moraleEffect: 7, mediaQuote: 'Tränaren: "Han har gett klubben tolv år. Han får ta den tid han behöver."' },
  { id: 'tp_spe6', tag: 'topic_player', label: '"Rykten kommer varje vinter. Han är kvar varje vår."', moraleEffect: 5, mediaQuote: 'Tränaren avfärdade: "Rykten kommer varje vinter. Han är kvar varje vår."' },
  { id: 'tp_spe7', tag: 'topic_player', label: '"Vi pratar om det när säsongen är slut. Inte nu."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi pratar om kontraktet när säsongen är slut. Inte nu."' },
]

// ── PressContext ───────────────────────────────────────────────────────────────

// Exporterad enbart för tabelltestet (storylineArcPreferIds.table.test.ts).
export interface PressContext {
  won: boolean
  lost: boolean
  draw: boolean
  margin: number
  isDerby: boolean
  isHome: boolean
  isPlayoff: boolean
  isCup: boolean
  isFinal: boolean
  gavLigapoang: boolean
  streak: number
  lossStreak: number
  drawStreak: number
  opponentPosition: number
  position: number
  temperature?: number
  totalShots?: number
  trailedAtHalf: boolean
  lateEqualizer: boolean
  youngsterScored: boolean
  midfieldDominance: boolean
  rand: () => number
}

function buildPressContext(fixture: Fixture, game: SaveGame, rand: () => number): PressContext {
  const isHome = fixture.homeClubId === game.managedClubId
  const myScore = isHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0)
  const theirScore = isHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0)
  // U2 (SLUTTEST_KO.md, 2026-08-17): utfall via deriveUtfall (straff/förlängnings-
  // medveten), inte rå score — en straffseger har myScore===theirScore men är
  // avgjord. rawDraw (nedan, lateEqualizer) är MEDVETET kvar på råscore: den
  // frågar om ordinarie tids kvittering, inte matchens slutgiltiga utfall.
  const utfall = deriveUtfall(fixture, game.managedClubId)
  const won = utfall === 'vunnet'
  const lost = utfall === 'forlorat'
  const draw = utfall === 'oavgjort'
  const margin = Math.abs(myScore - theirScore)
  const isDerby = !!getRivalry(fixture.homeClubId, fixture.awayClubId)
  const isPlayoff = !!fixture.isKnockout && !fixture.isCup
  const isCup = !!fixture.isCup
  const isFinal = !!fixture.isNeutralVenue
    || (isCup && !!(game.cupBracket?.matches.find(m => m.round === 3 && m.fixtureId === fixture.id)))
  const gavLigapoang = !isPlayoff && !isCup && !fixture.farewellMatchForPlayerId

  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const position = standing?.position ?? 8

  const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId
  const opponentStanding = game.standings.find(s => s.clubId === opponentId)
  const opponentPosition = opponentStanding?.position ?? 8

  // Streak from recent completed league fixtures
  const completedManaged = game.fixtures
    .filter(f =>
      f.status === 'completed' && !f.isCup && f.id !== fixture.id &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    .sort((a, b) => b.roundNumber - a.roundNumber)

  let streak = 0
  let lossStreak = 0
  let drawStreak = 0
  for (const f of completedManaged) {
    const fHome = f.homeClubId === game.managedClubId
    const my = fHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const their = fHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    const result = my > their ? 'win' : my < their ? 'loss' : 'draw'
    if (streak === 0 && lossStreak === 0 && drawStreak === 0) {
      if (result === 'win') streak = 1
      else if (result === 'loss') lossStreak = 1
      else drawStreak = 1
    } else if (streak > 0) {
      if (result === 'win') streak++; else break
    } else if (lossStreak > 0) {
      if (result === 'loss') lossStreak++; else break
    } else {
      if (result === 'draw') drawStreak++; else break
    }
  }

  const evts = fixture.events ?? []

  // Trailed at half: check if opponent was winning at minute 45.
  // O9-uppföljning (DOMLOGG_2026-08-31.md): extraherad till matchTypeAxes.ts
  // (computeTrailedAtHalf) — matchHighlightService.ts behöver samma fråga
  // för comeback-kategorin, en sanning i stället för två kopior.
  const trailedAtHalf = computeTrailedAtHalf(fixture, game.managedClubId)

  // M54(b) (textaudit 2026-07-04): sen kvittering — matchen slutade oavgjord
  // OCH nivelleringen (samma antal mål båda lagen) skedde senast vid minut ≥75.
  // rawDraw (rå score, inte `draw`/utfall): en kvittering i minut 80 som sen
  // gick till straffar är fortfarande en sen kvittering narrativt, oavsett
  // vem som vann skottläggningen — se kommentaren vid `utfall` ovan.
  const rawDraw = myScore === theirScore
  let lateEqualizer = false
  if (rawDraw) {
    let runningMine = 0, runningTheirs = 0
    for (const e of evts) {
      if (e.type !== MatchEventType.Goal) continue
      if (e.clubId === game.managedClubId) runningMine++; else runningTheirs++
      if ((e.minute ?? 0) >= 75 && runningMine === runningTheirs) lateEqualizer = true
    }
  }

  // Young scorer (age ≤ 20)
  const youngsterScored = evts.some(e => {
    if (e.type !== MatchEventType.Goal || !e.playerId || e.clubId !== game.managedClubId) return false
    const player = game.players.find(p => p.id === e.playerId)
    return player ? player.age <= 20 : false
  })

  // Weather temperature
  const weather = (game.matchWeathers ?? []).find(mw => mw.fixtureId === fixture.id)
  const temperature = weather?.weather.temperature

  // Total shots from report
  const totalShots = fixture.report
    ? (fixture.report.shotsHome ?? 0) + (fixture.report.shotsAway ?? 0)
    : undefined

  // PÅSTÅENDEKARTAN (2026-08-24): samma tröskel (>4) som matchCore.ts:s
  // getMatchSituation använder för 'dominating_home'/'dominating_away' —
  // "dominans" ska betyda samma sak här som i själva matchmotorn.
  const myShots = fixture.report ? (isHome ? fixture.report.shotsHome : fixture.report.shotsAway) : undefined
  const theirShots = fixture.report ? (isHome ? fixture.report.shotsAway : fixture.report.shotsHome) : undefined
  const midfieldDominance = myShots !== undefined && theirShots !== undefined && (myShots - theirShots) > 4

  return {
    won, lost, draw, margin, isDerby, isHome, isPlayoff, isCup, isFinal, gavLigapoang,
    streak, lossStreak, drawStreak, opponentPosition, position,
    temperature, totalShots, trailedAtHalf, lateEqualizer, youngsterScored, midfieldDominance, rand,
  }
}

// ── Context matching ───────────────────────────────────────────────────────────

// M-refaktor (Jacob 2026-08-17): den gamla generic-fallbacken avgjorde
// återanvändbarhet via tag.startsWith('win_'/'loss_'/'draw_') — en tyst
// fälla där VARJE framtida tagg med rätt prefix automatiskt blev
// generic-eligible, även om den var tänkt som narrativt specifik
// (samma buggklass som playoff_loss_not_final redan en gång fick en
// handpatchad undantagsrad för). Ersatt med en explicit klassificering,
// samlokaliserad med matchningsvillkoret så det bara finns EN lista per
// tagg — inte matchesContext-listan och en separat generic-lista.
//
// generic-fältet:
//   'win'       — generic-eligible när matchen vanns
//   'loss'      — generic-eligible när matchen förlorades
//   'draw'      — generic-eligible vid oavgjort
//   'universal' — alltid generic-eligible (idag bara 'any')
//   'none'      — ALDRIG generic-eligible. Detta är default för nya taggar
//                 som inte listas explicit nedan (se `?? 'none'` i
//                 isGenericMatch) — en ny tagg måste klassificeras
//                 medvetet, den kan inte "råka" bli återanvändbar.
type GenericBucket = 'win' | 'loss' | 'draw' | 'universal' | 'none'

// Exporterad enbart för tabelltestet (storylineArcPreferIds.table.test.ts) —
// samma undantag som ALL_PRESS_TAGS/PLAYER_RESPONSES ovan.
export const TAG_DEFS: Record<string, { matches: (ctx: PressContext) => boolean; generic: GenericBucket }> = {
  win_any:      { matches: ctx => ctx.won,                                        generic: 'win' },
  win_big:      { matches: ctx => ctx.won && ctx.margin >= 3,                      generic: 'win' },
  win_streak:   { matches: ctx => ctx.won && ctx.streak >= 3,                      generic: 'win' },
  win_away:     { matches: ctx => ctx.won && !ctx.isHome,                          generic: 'win' },
  // U2 (SLUTTEST_KO.md, 2026-08-17), symptom 5: win_derby/loss_derby låg i sina
  // egna generic-buckets ('win'/'loss') — en icke-derbymatch som föll tillbaka
  // på generic-fallbacken kunde då få ett derby-svar. Samma disciplin som
  // playoff_loss_not_final (raden nedanför) redan tillämpar: generic:'none'.
  win_derby:    { matches: ctx => ctx.won && ctx.isDerby,                          generic: 'none' },
  win_top3:     { matches: ctx => ctx.won && ctx.position <= 3,                    generic: 'win' },
  win_comeback: { matches: ctx => ctx.won && ctx.trailedAtHalf,                    generic: 'win' },
  loss_any:     { matches: ctx => ctx.lost,                                        generic: 'loss' },
  loss_big:     { matches: ctx => ctx.lost && ctx.margin >= 3,                     generic: 'loss' },
  loss_streak:  { matches: ctx => ctx.lost && ctx.lossStreak >= 3,                 generic: 'loss' },
  loss_home:    { matches: ctx => ctx.lost && ctx.isHome,                          generic: 'loss' },
  loss_close:   { matches: ctx => ctx.lost && ctx.margin === 1,                    generic: 'loss' },
  loss_derby:   { matches: ctx => ctx.lost && ctx.isDerby,                         generic: 'none' },
  loss_referee: { matches: ctx => ctx.lost && ctx.rand() < 0.15,                   generic: 'loss' },
  draw_any:     { matches: ctx => ctx.draw,                                        generic: 'draw' },
  draw_away_top:{ matches: ctx => ctx.draw && !ctx.isHome && ctx.opponentPosition <= 3, generic: 'draw' },
  draw_boring:  { matches: ctx => ctx.draw && (ctx.totalShots ?? 99) < 10,          generic: 'draw' },
  playoff_win:  { matches: ctx => ctx.won && ctx.isPlayoff,                        generic: 'win' },
  // M54(g): playoff_loss_not_final medvetet UTESLUTEN från generic — cl25
  // ska inte slinka in via generic-fallbacken när matchen var finalen.
  playoff_loss_not_final: { matches: ctx => ctx.lost && ctx.isPlayoff && !ctx.isFinal, generic: 'none' },
  cup_win:      { matches: ctx => ctx.won && ctx.isCup,                            generic: 'win' },
  final_pre:    { matches: ctx => ctx.isPlayoff && ctx.isFinal,                    generic: 'win' },
  winter:       { matches: ctx => (ctx.temperature ?? 0) < -10,                    generic: 'none' },
  relegation:   { matches: ctx => ctx.position >= 10,                              generic: 'none' },
  youngster:    { matches: ctx => ctx.youngsterScored,                             generic: 'none' },
  any:          { matches: () => true,                                            generic: 'universal' },
  // 4.2 (SLUTTEST_KO, 2026-08-19): topic_*-svar hör till en specifik fråga, inte
  // ett matchutfall. matches: () => false stänger kontextmatchning; generic: 'none'
  // stänger generic-fallbacken. Enda vägen in är explicit preferIds.
  topic_person: { matches: () => false,                                           generic: 'none' },
  topic_town:   { matches: () => false,                                           generic: 'none' },
  topic_doubt:  { matches: () => false,                                           generic: 'none' },
  topic_player: { matches: () => false,                                           generic: 'none' },
}

// Exporterad enbart för tabelltestet (isGenericMatch.table.test.ts) — inte
// avsedd som allmän API-yta för resten av appen.
export const ALL_PRESS_TAGS = Object.keys(TAG_DEFS)

function matchesContext(tag: string, ctx: PressContext): boolean {
  return TAG_DEFS[tag]?.matches(ctx) ?? false
}

export function isGenericMatch(tag: string, won: boolean, lost: boolean, draw: boolean): boolean {
  const bucket = TAG_DEFS[tag]?.generic ?? 'none'
  switch (bucket) {
    case 'universal': return true
    case 'win':        return won
    case 'loss':       return lost
    case 'draw':       return draw
    case 'none':       return false
  }
}

// ── HIGH 7 (audit 2026-08-29) — strukturell eligibility för PLAYER_RESPONSES ──
//
// Rotorsaken auditen fann: TAG_DEFS/isGenericMatch (ovan) avgör bara om en
// tagg får plats i den BREDA win/loss/draw-hinken, inte om en enskild
// replik i den hinken faktiskt stämmer med den SMALARE situationen dess
// EGEN TEXT förutsätter. Två separata läckor bevisade i produktionskoden:
//
// 1. preferIds kringgick ALL kontextkontroll. cl07 ("Derby vinner man med
//    hjärtat") låg i preferIds på FYRA icke-derby-frågor (rad ~39/47/52/91,
//    "Tidningarna pratar mer om ekonomi...", "Publiken sjöng hela vägen") —
//    tag win_derby/TAG_DEFS.matches() spelade ingen roll, för preferIds-
//    slotten (buildPressResponses nedan) läste bara `preferredById`, aldrig
//    matchesContext(). Samma sak för cl14 ("Att förlora hemma...") i den
//    ogaterade 'loss'-frågan "Supportrarna är besvikna" (rad ~71) — kunde
//    alltså visas efter en BORTAförlust, exakt auditens citerade exempel.
// 2. Generic-bucketen (TAG_DEFS.generic) är grövre än sina medlemmars text.
//    cup_win/playoff_win/final_pre ligger alla i den breda 'win'-bucketen
//    (facit-låst av pressConferenceGeneric.table.test.ts — ändras INTE här)
//    men deras repliker ("Cupen har sin magi...", "SM-finalen på
//    Studenternas...") förutsätter en cupvinst/slutspelsvinst/finalvinst
//    specifikt, inte "en vinst av vilket slag som helst".
//
// TAG_ELIGIBILITY nedan är den STRUKTURELLA, ADDITIVA spärren: den ändrar
// INGET i TAG_DEFS/isGenericMatch (de är facit-testade och förblir exakt
// som de var), utan lägger till ett extra AND-villkor som körs i BÅDA
// vägarna in (preferIds OCH contextMatched/generic) innan slump/vikt sker.
// En tagg behöver bara klassificeras EN gång här — alla repliker som delar
// taggen ärver samma spärr (grupp-justering, inte per-rad-duplicering).
const TAG_ELIGIBILITY: Partial<Record<string, TemplateEligibility>> = {
  // dw_*/dl_*-sektionerna ("Befintliga svar: derbyWin/derbyLoss") plus
  // cl07/cl17 (i "32 klassiska tränarcitat") är skrivna EXKLUSIVT för ett
  // derbyresultat — flera nämner "derby"/"rivaler" explicit (dw_p3, cl07,
  // cl17), övriga hör obetingat till derbyWin/derbyLoss-frågepoolerna.
  win_derby: { derby: 'required' },
  loss_derby: { derby: 'required' },
  // cl26: "Cupen har sin egen magi. Allt kan hända. Idag hände det för
  // oss." — förutsätter uttryckligen att matchen VAR en cupmatch.
  cup_win: { competition: 'cup' },
  // cl24: "Allt vi gjort i serien — det var bara uppvärmningen." —
  // förutsätter slutspel, inte en vanlig ligaseger.
  playoff_win: { competition: 'playoff' },
  // cl25 är redan generic:'none' (kan inte läcka via bucketen) — satt ändå
  // för konsekvens och som skydd om en framtida preferIds-referens skulle
  // peka hit från en icke-slutspelsfråga.
  playoff_loss_not_final: { competition: 'playoff', result: 'loss' },
  // cl27: "SM-finalen på Studenternas..." — den mest specifika raden i
  // poolen, förutsätter bokstavligen att DEN HÄR matchen ÄR finalen, inte
  // bara "en slutspelsmatch". finalOnly stoppar läckan till kvarts-/
  // semifinalvinster som competition:'playoff' ensamt inte hade fångat.
  final_pre: { competition: 'playoff', finalOnly: true },
  // cl05 ("En bortaseger är alltid speciell...") och cl14 ("Att förlora
  // hemma...", auditens citerade exempel) är ensamma i sina taggar men
  // följer samma tabellprincip som övriga rader här.
  win_away: { homeAway: 'away' },
  loss_home: { homeAway: 'home' },
  // dr_c3/cl22 ("Borta mot ett topplag...") — redan skyddade av
  // requireAway på frågenivå, men strukturellt korrekt att även spärra på
  // svarsnivå (samma disciplin som övriga rader, inte en genväg).
  draw_away_top: { homeAway: 'away' },
}

function getResponseEligibility(r: ManagerResponse): TemplateEligibility | undefined {
  return r.eligibility ?? TAG_ELIGIBILITY[r.tag]
}

// HIGH 7 — cooldown för pressvarssvar. Återanvänder narrativeLogService.ts:s
// isOnCooldown/game.narrativeBeatLog (samma mekanism som Birger-citat/
// burnout/akademirader), ingen ny parallell logg. minSeasonsApart=1 betyder
// "inte redan visad DENNA säsong" — svaret öppnas upp igen nästa säsong.
// Exporterad så roundProcessor.ts (skrivvägen, se GameEvent.pressResponseKeys)
// och tester kan bygga samma nyckel.
export const PRESS_RESPONSE_COOLDOWN_PREFIX = 'press_response_'

function preferOffCooldown(pool: ManagerResponse[], game: SaveGame): ManagerResponse[] {
  const offCooldown = pool.filter(
    r => !isOnCooldown(game, `${PRESS_RESPONSE_COOLDOWN_PREFIX}${r.id}`, 1, game.currentSeason),
  )
  // Släpp spärren om HELA poolen redan är på cooldown denna säsong (samma
  // fallback-princip som pickPoolIndexAvoidingCooldown) — annars kunde ett
  // smalt sammanhang (t.ex. bara två derbysvar kvar) tystna helt istället
  // för att återanvända en replik.
  return offCooldown.length > 0 ? offCooldown : pool
}

/**
 * PressContext → EligibilityContext. `phase` är alltid 'in_season' här:
 * generatePressConference() körs bara direkt efter en SPELAD match, så det
 * finns aldrig en "avslutad säsong"-situation att uttrycka för den här
 * poolen specifikt — fältet är ändå en del av den delade EligibilityContext-
 * formen (templateEligibilityService.ts) så andra pooler (t.ex. framtida
 * dashboard-/portal-copy som INTE är bundna till en enskild match) kan
 * återanvända samma kontrakt utan att uppfinna ett eget.
 */
function buildEligibilityContext(ctx: PressContext): EligibilityContext {
  return {
    competition: ctx.isCup ? 'cup' : ctx.isPlayoff ? 'playoff' : 'league',
    homeAway: ctx.isHome ? 'home' : 'away',
    phase: 'in_season',
    result: ctx.won ? 'win' : ctx.lost ? 'loss' : 'draw',
    isDerby: ctx.isDerby,
    isFinal: ctx.isFinal,
  }
}

// ── Build 3 contextually-weighted responses ────────────────────────────────────

// Skutskär-auditen High 4 (2026-08-22): state-gate på svarspool-nivå — ett
// svar som förutsätter ett state spelaren inte längre är i (t.ex. 'tp_liv1',
// "Han går till jobbet klockan sex", när spelaren redan är isFullTimePro)
// filtreras bort HELT, inte bara nedprioriteras. Gäller alla tre slottar och
// fallback-poolen, inte bara preferIds — annars kan den fortfarande smyga
// in via den generiska poolen.
function buildPressResponses(ctx: PressContext, game: SaveGame, preferIds: string[] = [], excludedResponseIds: string[] = []): ManagerResponse[] {
  const excluded = new Set(excludedResponseIds)
  const eligCtx = buildEligibilityContext(ctx)
  // HIGH 7: strukturellt AND-villkor, körs FÖRE preferIds/contextMatched/
  // generic delas upp nedan — en ineligible replik kan alltså aldrig nås
  // via NÅGON av de tre vägarna, preferIds inkluderat (se motiveringen
  // ovanför TAG_ELIGIBILITY).
  const eligibleResponses = PLAYER_RESPONSES.filter(r =>
    !excluded.has(r.id) && isTemplateEligible(getResponseEligibility(r), eligCtx),
  )
  const preferredById = new Map(eligibleResponses.map(r => [r.id, r]))
  const contextMatched: ManagerResponse[] = []
  const generic: ManagerResponse[] = []

  for (const r of eligibleResponses) {
    if (matchesContext(r.tag, ctx)) {
      contextMatched.push(r)
    } else if (r.tag === 'any' || isGenericMatch(r.tag, ctx.won, ctx.lost, ctx.draw)) {
      generic.push(r)
    }
  }

  // HIGH 7 cooldown: bland de strukturellt behöriga, föredra svar som inte
  // redan visats denna säsong. Appliceras på ALLA icke-preferId-vägar in
  // (slot 1/2:s pooler OCH slot 3/fallback-poolen) — annars kunde ett svar
  // som stängdes ute ur slot 1/2 ändå smyga in via slot 3 eller fallbacken.
  // preferIds (kuraterade per fråga) lämnas MEDVETET utanför cooldownen —
  // se motiveringen ovanför TAG_ELIGIBILITY: den spärren gäller struktur
  // (matchar mallen situationen alls), cooldown gäller upprepning, och en
  // fråga som explicit valt ETT visst svar ska inte tvingas byta bara för
  // att svaret visades förra matchen.
  const contextMatchedPref = preferOffCooldown(contextMatched, game)
  const genericPref = preferOffCooldown(generic, game)
  const cooldownAwareEligible = preferOffCooldown(eligibleResponses, game)

  const result: ManagerResponse[] = []
  const used = new Set<string>()

  // Slot 1: prefer question-specific IDs, fall back to context matching
  const preferredAvail = preferIds.map(id => preferredById.get(id)).filter((r): r is ManagerResponse => !!r && !used.has(r.id))
  if (preferredAvail.length > 0) {
    const pick = preferredAvail[Math.floor(ctx.rand() * preferredAvail.length)]
    result.push(pick)
    used.add(pick.id)
  } else {
    const slot1pool = ctx.rand() < 0.80 ? contextMatchedPref : [...contextMatchedPref, ...genericPref]
    if (slot1pool.length > 0) {
      const pick = slot1pool[Math.floor(ctx.rand() * slot1pool.length)]
      result.push(pick)
      used.add(pick.id)
    }
  }

  // Slot 2: second preferred ID if available, otherwise context matching
  const preferred2 = preferIds.map(id => preferredById.get(id)).filter((r): r is ManagerResponse => !!r && !used.has(r.id))
  if (preferred2.length > 0) {
    const pick = preferred2[Math.floor(ctx.rand() * preferred2.length)]
    result.push(pick)
    used.add(pick.id)
  } else {
    const slot2pool = (ctx.rand() < 0.5 ? contextMatchedPref : genericPref).filter(r => !used.has(r.id))
    if (slot2pool.length > 0) {
      const pick = slot2pool[Math.floor(ctx.rand() * slot2pool.length)]
      result.push(pick)
      used.add(pick.id)
    }
  }

  // Slot 3: third preferred ID if available, otherwise random from loosely matching pool
  const preferred3 = preferIds.map(id => preferredById.get(id)).filter((r): r is ManagerResponse => !!r && !used.has(r.id))
  if (preferred3.length > 0) {
    const pick = preferred3[Math.floor(ctx.rand() * preferred3.length)]
    result.push(pick)
    used.add(pick.id)
  } else {
    const allPool = cooldownAwareEligible.filter(r => !used.has(r.id) && isGenericMatch(r.tag, ctx.won, ctx.lost, ctx.draw))
    if (allPool.length > 0) {
      const pick = allPool[Math.floor(ctx.rand() * allPool.length)]
      result.push(pick)
    }
  }

  // Fallback: fill from full pool if needed
  while (result.length < 3) {
    const fallback = cooldownAwareEligible.filter(r => !used.has(r.id))
    if (fallback.length === 0) break
    const pick = fallback[Math.floor(ctx.rand() * fallback.length)]
    result.push(pick)
    used.add(pick.id)
  }

  return result.slice(0, 3)
}

// Response ID convention: _a = aggressiv/bitter, _h = ödmjuk, _d = diplomatisk/neutral
// (responseEmoji removed — emojis replaced with plain text in subtitles)

// ── WEAK-008 + DEV-006: Follow-up questions based on journalist memory ─────────

function findFollowUpQuestion(journalist: import('../entities/SaveGame').Journalist, round: number, rand: () => number): PressQuestion | null {
  const recent = journalist.memory.slice(-3)
  const hasNegativeMemory = recent.some(m => m.sentiment <= -5)
  if (!hasNegativeMemory) return null

  const lastNegative = recent.filter(m => m.sentiment <= -5).slice(-1)[0]
  const roundsSince = round - lastNegative.matchday

  const followUps: PressQuestion[] = [
    {
      text: `Vi har stått här förut, du och jag. Sist var det inte muntert. Hur känns det idag?`,
      preferIds: ['cl15', 'l_h1'],
      minRound: lastNegative.matchday + 3,
    },
    {
      text: `Alla väntar på vändningen. Hur mycket längre ska vi vänta?`,
      preferIds: ['l_c6', 'bl_p1'],
      minRound: lastNegative.matchday + 5,
    },
    {
      text: `För ${roundsSince} omgångar sen var tongångarna dystra här inne. Räcker truppen?`,
      preferIds: ['l_h4', 'bl_c6'],
      minRound: lastNegative.matchday + 4,
    },
  ]

  const eligible = followUps.filter(q => (q.minRound ?? 0) <= round)
  return eligible.length > 0 ? eligible[Math.floor(rand() * eligible.length)] : null
}

// ── generatePressConference ────────────────────────────────────────────────────

/**
 * Rättad citatdeklaration (2026-08-25): den ursprungliga taggen nämnde
 * deriveUtfall/shotsHome/shotsAway direkt, men den här funktionen läser dem
 * INTE själv sedan U2-fixet (2026-08-17) — den läser `ctx` från
 * buildPressContext(), som äger won/lost/isDerby/margin/midfieldDominance.
 * roundNumber läses bara som en minRound-gate (filtrerar vilka frågor som
 * är tillåtna), aldrig för ordning — deklarerad öppet ändå.
 *
 * @cites buildPressContext, roundNumber, game.scandalHistory, game.narrativeBeatLog, game.activeArcs
 */
export function generatePressConference(
  fixture: Fixture,
  game: SaveGame,
  rand: () => number,
): GameEvent | null {
  // U2 (SLUTTEST_KO.md, 2026-08-17): ctx byggs FÖRST och äger won/lost/draw/
  // isDerby — tidigare räknade den här funktionen ut samma sak en gång till
  // ur rå homeScore/awayScore (tredje oberoende beräkningen i filen, efter
  // buildPressContext och TAG_DEFS), vilket bl.a. gav en straffseger som
  // "oavgjort" här trots att buildPressContext redan visste bättre.
  const ctx = buildPressContext(fixture, game, rand)

  let contextKey: string
  if (ctx.isDerby && ctx.won) contextKey = 'derbyWin'
  else if (ctx.isDerby && ctx.lost) contextKey = 'derbyLoss'
  else if (ctx.won && ctx.margin >= 3) contextKey = 'bigWin'
  else if (ctx.won) contextKey = 'win'
  else if (ctx.lost && ctx.margin >= 3) contextKey = 'bigLoss'
  else if (ctx.lost) contextKey = 'loss'
  else contextKey = 'draw'

  const round = fixture.roundNumber ?? 0
  const allQuestions = QUESTIONS[contextKey]
  if (!allQuestions || allQuestions.length === 0) return null
  const hasCurrentSeasonScandal = (game.scandalHistory ?? []).some(s => s.season === game.currentSeason)
  const questions = allQuestions.filter(q =>
    (!q.minRound || round >= q.minRound) &&
    (!q.minScandalThisSeason || hasCurrentSeasonScandal) &&
    (!q.requireTrailedAtHalf || ctx.trailedAtHalf) &&
    (!q.requireLateEqualizer || ctx.lateEqualizer) &&
    (!q.requireDrawStreak3 || ctx.drawStreak >= 3) &&
    (!q.requireHome || ctx.isHome) &&
    (!q.requireAway || !ctx.isHome) &&
    (!q.requireLeaguePoints || ctx.gavLigapoang) &&
    (!q.requireMidfieldDominance || ctx.midfieldDominance)
  )
  const questionPool = questions.length > 0 ? questions : allQuestions

  // Centralredaktören, punkt 2 (DOM_CENTRALREDAKTOREN_2026-08-31.md):
  // frågetextens egen recency (startvärde 5 omgångar) — auditens "samma
  // frågor snabbt"/"gamla svar följer med" är bägge denna gate. Gäller
  // bara det GRUNDLÄGGANDE slumpvalet nedan — arc-/storyline-/CS-/
  // uppföljningsöverstyrningarna längre ned har redan sin EGEN budget
  // (storylineBudgetOk, findFollowUpQuestion) och rörs inte.
  const pressRecencyWindow = RECENCY_WINDOW_BY_CHANNEL.press ?? 5
  const freshQuestionPool = questionPool.filter(
    q => !recentlySurfaced(game, `press_q_${q.text}`, pressRecencyWindow, round),
  )
  const finalQuestionPool = freshQuestionPool.length > 0 ? freshQuestionPool : questionPool

  let question = finalQuestionPool[Math.floor(rand() * finalQuestionPool.length)]
  const journalist = JOURNALISTS[Math.floor(rand() * JOURNALISTS.length)]

  // Arc-aware question override (40% chance if arc in peak phase)
  const peakArcs = (game.activeArcs ?? []).filter(a => a.phase === 'peak' && a.playerId)
  if (rand() < 0.40 && peakArcs.length > 0) {
    const arc = peakArcs[0]
    const arcPlayer = game.players.find(p => p.id === arc.playerId)
    if (arcPlayer) {
      const arcQuestions: Partial<Record<import('../entities/Narrative').ArcType, string>> = {
        hungrig_breakthrough: `${arcPlayer.firstName} ${arcPlayer.lastName} har det tungt. Tror du fortfarande på honom?`,
        joker_redemption: `${arcPlayer.firstName} ${arcPlayer.lastName} delar fansen. Kostar han mer än han ger?`,
        veteran_farewell: `Blir det här ${arcPlayer.firstName} ${arcPlayer.lastName}s sista säsong?`,
        contract_drama: `Rykten säger att ${arcPlayer.firstName} ${arcPlayer.lastName} kan lämna. Kommentar?`,
      }
      // 4.2: topikanpassade preferIds per arc-typ — se docs/SVAR_STORYLINE_FRAGOR_2026-08-19.md
      const arcPreferIds: Partial<Record<import('../entities/Narrative').ArcType, string[]>> = {
        hungrig_breakthrough: ['tp_spe1', 'tp_spe2', 'tp_liv3'],
        joker_redemption: ['tp_spe3', 'tp_spe2', 'tp_liv3'],
        veteran_farewell: ['tp_spe5', 'tp_spe4', 'tp_spe7'],
        contract_drama: ['tp_spe6', 'tp_spe7', 'tp_spe4'],
      }
      const q = arcQuestions[arc.type]
      if (q) {
        question = { text: q, preferIds: arcPreferIds[arc.type] ?? question.preferIds }
      }
    }
  }

  // High 4 (Skutskär-auditen, 2026-08-22): pressminnet. En storyline-fråga
  // fick tidigare rulla om och om igen (samma kontraktsfråga sex raka
  // matcher, kaptenfrågan ~åtta gånger) eftersom ENDA spärren var en
  // slumpchans per match — ingen räkning av hur många gånger DEN HÄR
  // storylinen redan fått sin fråga. storylineBudgetOk läser narrativeBeatLog
  // (Jacobs order: "den byggdes för detta") — max en huvudfråga plus en
  // uppföljning per storyline-INSTANS (story.id, inte bara story.type — två
  // olika spelares went_fulltime_pro-bågar samma säsong ska räknas separat).
  // Callern (matchSimProcessor.ts → roundProcessor.ts) läser event.storylinePressKey
  // och skriver den faktiska narrativeBeatLog-posten när eventet genereras, inte
  // här — den här funktionen är en ren fråga, ingen mutation.
  function storylineBudgetOk(story: { id: string }): boolean {
    const key = `press_storyline_${story.id}`
    const usedThisSeason = (game.narrativeBeatLog ?? []).filter(
      e => e.semanticKey === key && e.season === game.currentSeason,
    ).length
    return usedThisSeason < 2
  }

  let storylinePressKey: string | undefined
  // State-gate (Skutskär-auditen High 4): 'tp_liv1' ("Han går till jobbet
  // klockan sex...") beskriver ett kvarvarande dagjobb — förbjuden så fort
  // frågan handlar om en spelare som redan är isFullTimePro.
  let excludedResponseIds: string[] = []

  // Storyline-aware question override (30% chance if matching storyline exists)
  const storylines = game.storylines ?? []
  if (rand() < 0.30 && storylines.length > 0) {
    const seasonStories = storylines.filter(s => s.season === game.currentSeason && s.resolved)
    const clubStanding = game.standings.find(s => s.clubId === game.managedClubId)
    const underdogStory = seasonStories.find(s => s.type === 'underdog_season')
    const captainStory = seasonStories.find(s => s.type === 'captain_rallied_team')
    const rescueStory = seasonStories.find(s => s.type === 'rescued_from_unemployment')
    const proStory = seasonStories.find(s => s.type === 'went_fulltime_pro')
    const returnStory = seasonStories.find(s => s.type === 'returned_to_club')
    const galaStory = seasonStories.find(s => s.type === 'gala_winner')

    if (ctx.won && underdogStory && storylineBudgetOk(underdogStory)) {
      question = { text: 'Ingen trodde på er i augusti. Vad säger du till tvivlarna?', preferIds: ['tp_tvi2', 'tp_tvi1', 'tp_tvi3'] }
      storylinePressKey = `press_storyline_${underdogStory.id}`
    } else if (clubStanding && clubStanding.losses >= 3 && underdogStory && storylineBudgetOk(underdogStory)) {
      question = { text: 'Ingen trodde på er i augusti. Vad hände?', preferIds: ['tp_tvi4', 'tp_tvi5', 'tp_tvi3'] }
      storylinePressKey = `press_storyline_${underdogStory.id}`
    } else if (captainStory && storylineBudgetOk(captainStory) && rand() < 0.5) {
      question = { text: 'Kaptenen tog ton i omklädningsrummet. Har det gett effekt?', preferIds: ['tp_tvi6', 'tp_tvi7', 'w_h5'] }
      storylinePressKey = `press_storyline_${captainStory.id}`
    } else if (rescueStory && storylineBudgetOk(rescueStory) && rand() < 0.5) {
      const rescuePlayer = rescueStory.playerId ? game.players.find(p => p.id === rescueStory.playerId) : null
      const matchGoalEvents = (fixture.events ?? []).filter(e => e.type === MatchEventType.Goal && e.clubId === game.managedClubId)
      const rescueScorerMatch = rescuePlayer && matchGoalEvents.some(e => e.playerId === rescuePlayer.id)
      if (rescuePlayer && rescueScorerMatch) {
        question = { text: `Berätta om ${rescuePlayer.firstName} ${rescuePlayer.lastName}s resa tillbaka.`, preferIds: ['tp_liv1', 'tp_liv4', 'tp_liv2'] }
        if (rescuePlayer.isFullTimePro) excludedResponseIds.push('tp_liv1')
      } else {
        question = { text: 'Varslet drabbade era spelare hårt. Hur har klubben hanterat situationen?', preferIds: ['tp_liv2', 'tp_liv8', 'tp_liv3'] }
      }
      storylinePressKey = `press_storyline_${rescueStory.id}`
    } else if (proStory && storylineBudgetOk(proStory) && rand() < 0.5) {
      const proPlayer = proStory.playerId ? game.players.find(p => p.id === proStory.playerId) : null
      if (proPlayer) {
        question = { text: `${proPlayer.firstName} ${proPlayer.lastName} slutade jobbet för att satsa på bandyn. Har det betalat sig?`, preferIds: ['tp_liv5', 'tp_liv1', 'tp_liv6'] }
        // went_fulltime_pro betyder per definition isFullTimePro===true —
        // dagjobbssvaret är alltid fel här, inte bara villkorat.
        excludedResponseIds.push('tp_liv1')
        storylinePressKey = `press_storyline_${proStory.id}`
      }
    } else if (returnStory && storylineBudgetOk(returnStory) && rand() < 0.5) {
      const returnPlayer = returnStory.playerId ? game.players.find(p => p.id === returnStory.playerId) : null
      if (returnPlayer) {
        question = { text: `Berätta om ${returnPlayer.firstName} ${returnPlayer.lastName}s resa tillbaka till klubben.`, preferIds: ['tp_liv7', 'tp_liv6', 'tp_liv3'] }
        if (returnPlayer.isFullTimePro) excludedResponseIds.push('tp_liv1')
        storylinePressKey = `press_storyline_${returnStory.id}`
      }
    } else if (galaStory && storylineBudgetOk(galaStory) && rand() < 0.5) {
      const galaPlayer = galaStory.playerId ? game.players.find(p => p.id === galaStory.playerId) : null
      if (galaPlayer) {
        question = { text: `${galaPlayer.firstName} ${galaPlayer.lastName} vann galan. Hur viktigt är det för laget?`, preferIds: ['tp_spe1', 'tp_ort4', 'w_p3'] }
        storylinePressKey = `press_storyline_${galaStory.id}`
      }
    }
  }

  // Community-standing question override (25% chance if triggered)
  const cs = game.communityStanding ?? 50
  const newMecenat = (game.mecenater ?? []).find(m => m.arrivedSeason === game.currentSeason)
  if (cs > 75 && rand() < 0.25) {
    question = { text: 'Det pratas om er i hela kommunen. Är det press eller inspiration?', preferIds: ['tp_ort4', 'tp_ort1', 'tp_ort2'] }
  } else if (cs < 35 && rand() < 0.25) {
    question = { text: 'Publiken sviker. Hur påverkar det laget?', preferIds: ['tp_ort5', 'tp_ort3', 'tp_ort2'] }
  } else if (newMecenat && rand() < 0.25) {
    question = { text: `Ni har fått ${newMecenat.name}s stöd. Gör det skillnad i omklädningsrummet?`, preferIds: ['tp_ort7', 'tp_ort6', 'tp_liv3'] }
  } else if (game.facilityState?.activeProject != null && round >= 8 && rand() < 0.20) {
    question = { text: 'Det byggs vid arenan. Hur påverkar det koncentrationen?', preferIds: ['tp_ort8', 'tp_ort9', 'tp_ort6'] }
  } else if (game.players.some(p => p.clubId === game.managedClubId && p.promotedFromAcademy && p.age <= 20) && round >= 4 && rand() < 0.20) {
    const youngStar = game.players.find(p => p.clubId === game.managedClubId && p.promotedFromAcademy && p.age <= 20)
    const name = youngStar ? `${youngStar.firstName} ${youngStar.lastName}` : 'er unge spelare'
    question = { text: `${name} imponerar. Hur hanterar ni trycket på en så ung spelare?`, preferIds: ['tp_spe4', 'tp_spe2', 'cl32'] }
  }

  // WEAK-008 + DEV-006: check for follow-up question first (40% chance if journalist has negative memory)
  // M54(f) (textaudit 2026-07-04): gated på !ctx.won — följdfrågorna antar att
  // laget fortfarande kämpar ("Alla väntar på vändningen"); serverade tidigare
  // förlust-svar ("Vi var inte tillräckligt bra idag") som enda alternativ
  // efter en SEGER.
  if (game.journalist && !ctx.won) {
    const followUp = findFollowUpQuestion(game.journalist, round, rand)
    if (followUp && rand() < 0.4) {
      question = followUp
    }
  }

  // Fill template placeholders
  if (question.text.includes('{arenaName}')) {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    const arenaName = managedClub?.arenaName ?? 'arenan'
    question = { ...question, text: question.text.replace('{arenaName}', arenaName) }
  }
  if (question.text.includes('{captainName}')) {
    if (!game.captainPlayerId) {
      // Skip captain question if no captain set — fall back to generic win question
      question = { text: 'Hur ser du på lagets insats idag?', preferIds: question.preferIds }
    } else {
      const captain = game.players.find(p => p.id === game.captainPlayerId)
      const captainName = captain ? `${captain.firstName} ${captain.lastName}` : 'kaptenen'
      question = { ...question, text: question.text.replace('{captainName}', captainName) }
    }
  }

  const responses = buildPressResponses(ctx, game, question.preferIds, excludedResponseIds)

  if (responses.length === 0) return null

  // Use named journalist character if available
  const namedJournalist = game.journalist
  const displayJournalist = namedJournalist
    ? `${namedJournalist.name}, ${namedJournalist.outlet}`
    : journalist

  const choices = responses.map(r => ({
    id: r.id,
    label: r.label,
    subtitle: r.moraleEffect !== 0
      ? `${r.moraleEffect > 0 ? '+' : ''}${r.moraleEffect} moral`
      : undefined,
    effect: {
      type: 'pressResponse' as const,
      value: r.moraleEffect,
      mediaQuote: `${displayJournalist}: ${r.mediaQuote}`,
    },
  }))

  // Add refuse option — always available but has consequences
  choices.push({
    id: 'refuse_press',
    label: 'Vägra presskonferens',
    subtitle: '-3 moral · journalisten irriterad',
    effect: {
      type: 'pressResponse' as const,
      value: -3,
      mediaQuote: `${displayJournalist}: Tränaren vägrade kommentera efter matchen. Det skickar en signal.`,
    },
  })

  return {
    id: `event_press_r${fixture.roundNumber ?? 0}_${game.currentSeason}`,
    type: 'pressConference' as const,
    title: `Presskonferens — ${displayJournalist}`,
    body: `"${question.text}"`,
    choices,
    resolved: false,
    // GRANSKA DEL 4 (2026-08-11): strukturerat fält istf title-prefix-parse
    // (GranskaOversikt.tsx:413) — samma mönster som A2 gjorde för Inbox.
    // role tomt när ingen namngiven journalist-karaktär finns (fallback är
    // bara ett kanalnamn, ingen person).
    sender: namedJournalist
      ? { name: namedJournalist.name, role: namedJournalist.outlet }
      : { name: journalist, role: '' },
    storylinePressKey,
    // Centralredaktören, punkt 2: den FAKTISKA frågans recency-nyckel,
    // beräknad efter alla överstyrningar/platshållarfyllning ovan — inte
    // bara det initiala slumpvalet.
    pressQuestionKey: `press_q_${question.text}`,
    // HIGH 7 (audit 2026-08-29): cooldown-nycklarna för DE ERBJUDNA svaren
    // (inte bara det spelaren till slut klickar) — se GameEvent.pressResponseKeys.
    // Callern (roundProcessor.ts) loggar dem som narrativeBeatLog-poster NÄR
    // EVENTET GENERERAS (frågan visas), samma skrivmönster som storylinePressKey.
    pressResponseKeys: responses.map(r => `${PRESS_RESPONSE_COOLDOWN_PREFIX}${r.id}`),
    // A-L1 (SLUTTEST_KO.md): så eventResolver.ts:s 'pressResponse'-hantering kan
    // slå upp DEN HÄR matchens .matchday direkt istf att gissa fram "senaste
    // ligamatchen" ur game.fixtures i efterhand (den gissningen läste roundNumber,
    // fel fält per arkitekturregeln, och kunde falla till 0 — "omg 0" i Efterklang).
    relatedFixtureId: fixture.id,
  }
}
