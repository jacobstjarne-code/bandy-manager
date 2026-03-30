import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import type { Fixture } from '../entities/Fixture'
import { getRivalry } from '../data/rivalries'
import { MatchEventType } from '../enums'

export const JOURNALISTS = ['SVT Nyheter', 'Bandyplay', 'Lokaltidningen', 'Sportbladet', 'Bandypuls', 'Expressen', 'DN', 'Radiosporten']

// ── Journalist questions (per context, no choices) ────────────────────────────

const QUESTIONS: Record<string, string[]> = {
  bigWin: [
    'Imponerande seger. Var det ert bästa spel den här säsongen?',
    'Laget spelade otroligt idag. Vad är hemligheten?',
    'Tvåsiffrigt idag — är det ett mönster eller en engångsgrej?',
    'Ert anfallsspel ser ostoppbart ut. Fruktar du inte att bli läst av motståndarna?',
    'Bortalaget verkade chockade av er intensitet. Avsiktlig taktik?',
    'Bra match. Hade ni kunnat vinna med ännu mer?',
    'Publiken var i extas. Hur mycket spelar hemmafansen in?',
  ],
  win: [
    'Seger — berätta om matchen.',
    'Två viktiga poäng. Hur påverkar det stämningen i laget?',
    'Vilken spelare stack ut idag?',
    'Hur håller ni den här formen uppe?',
    'Ni vände underläge till seger. Vad hände i pausen?',
    'Ni avancerar i tabellen. Kan ni utmana toppen nu?',
    'Ni dominerade mitten idag. Är det er styrka just nu?',
  ],
  loss: [
    'Tung förlust. Vad gick fel?',
    'Laget såg trötta ut i andra halvlek. Kondition?',
    'Supportrarna är besvikna. Vad säger du till dem?',
    'Ni hamnade efter motståndarna tidigt. Vad gör du annorlunda nästa match?',
    'Hur pratar du med spelarna i omklädningsrummet efter en sådan här match?',
    'Tappar ni tron på er spelstil nu?',
    'Ni hade chanser men konverterade inte. Stressar det er?',
    'Bortalaget körde över er i perioderna. Vad händer med er defensiv?',
    'Ni har det tufft just nu. Hur håller du moralen uppe?',
  ],
  bigLoss: [
    'En mörk kväll. Hur tar ni er vidare härifrån?',
    'Är du orolig för lagets form?',
    'Det här resultatet kan kosta er dyrt i tabellen. Hur reagerar styrelsen?',
    'Motståndarna verkade veta exakt vad ni skulle göra. Läckta planer?',
    'En jävla massa mål i röven. Var det ett systemproblem?',
    'Behöver du ta in ny spetskompetens för att vända skutan?',
  ],
  draw: [
    'Oavgjort — nöjd eller besviken?',
    'Ni kvitterade sent. Vad säger det om lagets karaktär?',
    'En poäng på bortaplan — räknas det som bra?',
    'Matchen avgjordes av detaljer. Vilken detalj är viktigast att förbättra?',
    'Ert spel var ojämnt idag. Vad berodde det på?',
    'Ni har oavgjort i tre raka. Är det en trend att oroa sig för?',
  ],
  derbyWin: [
    'Derbyseger! Vad betyder det för laget?',
    'Vad gör en derbyseger med truppen?',
    'Hur förbereder man sig mentalt för ett derby jämfört med en vanlig match?',
    'Fansen sjöng hela matchen. Spelade de in?',
    'Rivaliteten är laddad. Hur hanterar du pressen inför den typen av match?',
    'Ni dominerade klart. Var det planerat att ta kommandot tidigt?',
    'Det här är ett resultat att fira. Hur länge tillåter du laget att njuta av det?',
    'Vad säger den här segern om var ni befinner er som lag?',
  ],
  derbyLoss: [
    'Smärtsam förlust i derbyt. Kommentar?',
    'Hur stänger man av derby-förlusten mentalt?',
    'Fansen är krossade. Vad säger du till dem efter det här?',
    'Rivalerna vann — de kommer att skryta länge. Stör det dig?',
    'Er prestation föll under nivån. Vad förklarar det?',
    'Det är tungt att förlora just det här derbyt. Hur lyfter du laget nu?',
    'Taktiken fungerade inte idag. Vad gör du annorlunda nästa gång ni möts?',
    'Ni domineras i direktduellan med rivalerna. Är det ett psykologiskt problem?',
  ],
}

// ── Manager responses (flat pool with context tags) ────────────────────────────

interface ManagerResponse {
  id: string
  tag: string
  label: string
  moraleEffect: number
  mediaQuote: string
}

const PLAYER_RESPONSES: ManagerResponse[] = [
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
  { id: 'dw_p3', tag: 'win_derby', label: '"Det behövs ingen förberedelse. Alla vet vad det handlar om."', moraleEffect: 7, mediaQuote: 'Tränaren: "Alla vet vad ett derby är. Det behövs ingen extra speech."' },
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
  { id: 'dl_p4', tag: 'loss_derby', label: '"De ska göra. Vi behöver det som motivation."', moraleEffect: 4, mediaQuote: 'Tränaren: "De ska njuta. Vi behöver det som motivation inför nästa derby."' },
  { id: 'dl_h5', tag: 'loss_derby', label: '"Vi spelade rädda. Det är inte vi."', moraleEffect: 3, mediaQuote: 'Tränaren var självkritisk: "Vi spelade rädda. Det är inte vi. Det rättar vi."' },
  { id: 'dl_p6', tag: 'loss_derby', label: '"Jag berättar att vi fortfarande styr vår egen destiny."', moraleEffect: 5, mediaQuote: 'Tränaren: "Jag påminner dem om att vi styr vår egen framtid. Ingen derby avgör säsongen."' },
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
  { id: 'cl25', tag: 'playoff_loss', label: '"Slutspelet är bäst av fem. En match bevisar ingenting. Vi kommer tillbaka starkare i nästa."', moraleEffect: 4, mediaQuote: 'Tränaren: "Bäst av fem. En match bevisar ingenting. Vi kommer tillbaka starkare."' },
  { id: 'cl26', tag: 'cup_win',      label: '"Cupen har sin egen magi. Allt kan hända. Idag hände det för oss."', moraleEffect: 5, mediaQuote: 'Tränaren: "Cupen har sin magi. Allt kan hända — idag hände det för oss."' },
  { id: 'cl27', tag: 'final_pre',    label: '"SM-finalen på Studenternas. Det är därför man spelar bandy. För de här dagarna."', moraleEffect: 7, mediaQuote: 'Tränaren: "SM-finalen på Studenternas. Det är därför man spelar bandy. För de här dagarna."' },
  { id: 'cl28', tag: 'any',          label: '"Det finns inga genvägar till framgång. Bara korta passningar och hårt arbete."', moraleEffect: 3, mediaQuote: 'Tränaren filosoferade: "Det finns inga genvägar till framgång. Bara korta passningar och hårt arbete."' },
  { id: 'cl29', tag: 'winter',       label: '"Minus femton och vi springer runt i shorts. Det är bandy. Det är det finaste vi har."', moraleEffect: 3, mediaQuote: 'Tränaren log: "Minus femton och vi springer i shorts. Det är bandy. Det finaste vi har."' },
  { id: 'cl30', tag: 'any',          label: '"Alla vill spela vacker bandy. Men vacker bandy utan poäng är bara konståkning."', moraleEffect: 2, mediaQuote: 'Tränaren: "Alla vill spela vacker bandy. Utan poäng är det bara konståkning."' },
  { id: 'cl31', tag: 'relegation',   label: '"Vi har balanserat på ett bananskal hela säsongen. Men vi har inte ramlat ännu."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi har balanserat på ett bananskal hela säsongen. Men vi har inte ramlat ännu."' },
  { id: 'cl32', tag: 'youngster',    label: '"När en 18-åring gör mål i elitserien... då minns man varför man blev tränare."', moraleEffect: 5, mediaQuote: 'Tränaren: "När en 18-åring gör mål i elitserien — då minns man varför man blev tränare."' },
]

// ── PressContext ───────────────────────────────────────────────────────────────

interface PressContext {
  won: boolean
  lost: boolean
  draw: boolean
  margin: number
  isDerby: boolean
  isHome: boolean
  isPlayoff: boolean
  isCup: boolean
  isFinal: boolean
  streak: number
  lossStreak: number
  opponentPosition: number
  position: number
  temperature?: number
  totalShots?: number
  trailedAtHalf: boolean
  youngsterScored: boolean
  rand: () => number
}

function buildPressContext(fixture: Fixture, game: SaveGame, rand: () => number): PressContext {
  const isHome = fixture.homeClubId === game.managedClubId
  const myScore = isHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0)
  const theirScore = isHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0)
  const won = myScore > theirScore
  const lost = myScore < theirScore
  const draw = myScore === theirScore
  const margin = Math.abs(myScore - theirScore)
  const isDerby = !!getRivalry(fixture.homeClubId, fixture.awayClubId)
  const isPlayoff = !!fixture.isKnockout && !fixture.isCup
  const isCup = !!fixture.isCup
  const isFinal = !!fixture.isNeutralVenue
    || (isCup && !!(game.cupBracket?.matches.find(m => m.round === 3 && m.fixtureId === fixture.id)))

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
  for (const f of completedManaged) {
    const fHome = f.homeClubId === game.managedClubId
    const my = fHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const their = fHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    if (streak === 0 && lossStreak === 0) {
      if (my > their) streak = 1
      else if (my < their) lossStreak = 1
      else break
    } else if (streak > 0) {
      if (my > their) streak++; else break
    } else {
      if (my < their) lossStreak++; else break
    }
  }

  // Trailed at half: check if opponent was winning at minute 45
  const evts = fixture.events ?? []
  let htManaged = 0, htOpp = 0
  for (const e of evts) {
    if (e.type !== MatchEventType.Goal) continue
    if ((e.minute ?? 100) > 45) continue
    if (e.clubId === game.managedClubId) htManaged++; else htOpp++
  }
  const trailedAtHalf = htOpp > htManaged

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

  return {
    won, lost, draw, margin, isDerby, isHome, isPlayoff, isCup, isFinal,
    streak, lossStreak, opponentPosition, position,
    temperature, totalShots, trailedAtHalf, youngsterScored, rand,
  }
}

// ── Context matching ───────────────────────────────────────────────────────────

function matchesContext(tag: string, ctx: PressContext): boolean {
  switch (tag) {
    case 'win_any':       return ctx.won
    case 'win_big':       return ctx.won && ctx.margin >= 3
    case 'win_streak':    return ctx.won && ctx.streak >= 3
    case 'win_away':      return ctx.won && !ctx.isHome
    case 'win_derby':     return ctx.won && ctx.isDerby
    case 'win_top3':      return ctx.won && ctx.position <= 3
    case 'win_comeback':  return ctx.won && ctx.trailedAtHalf
    case 'loss_any':      return ctx.lost
    case 'loss_big':      return ctx.lost && ctx.margin >= 3
    case 'loss_streak':   return ctx.lost && ctx.lossStreak >= 3
    case 'loss_home':     return ctx.lost && ctx.isHome
    case 'loss_close':    return ctx.lost && ctx.margin === 1
    case 'loss_derby':    return ctx.lost && ctx.isDerby
    case 'loss_referee':  return ctx.lost && ctx.rand() < 0.15
    case 'draw_any':      return ctx.draw
    case 'draw_away_top': return ctx.draw && !ctx.isHome && ctx.opponentPosition <= 3
    case 'draw_boring':   return ctx.draw && (ctx.totalShots ?? 99) < 10
    case 'playoff_win':   return ctx.won && ctx.isPlayoff
    case 'playoff_loss':  return ctx.lost && ctx.isPlayoff
    case 'cup_win':       return ctx.won && ctx.isCup
    case 'final_pre':     return ctx.isPlayoff && ctx.isFinal
    case 'winter':        return (ctx.temperature ?? 0) < -10
    case 'relegation':    return ctx.position >= 10
    case 'youngster':     return ctx.youngsterScored
    case 'any':           return true
    default:              return false
  }
}

function isGenericMatch(tag: string, won: boolean, lost: boolean, draw: boolean): boolean {
  if (tag === 'any') return true
  if (won && (tag.startsWith('win_') || tag === 'playoff_win' || tag === 'cup_win' || tag === 'final_pre')) return true
  if (lost && (tag.startsWith('loss_') || tag === 'playoff_loss')) return true
  if (draw && tag.startsWith('draw_')) return true
  return false
}

// ── Build 3 contextually-weighted responses ────────────────────────────────────

function buildPressResponses(ctx: PressContext): ManagerResponse[] {
  const contextMatched: ManagerResponse[] = []
  const generic: ManagerResponse[] = []

  for (const r of PLAYER_RESPONSES) {
    if (matchesContext(r.tag, ctx)) {
      contextMatched.push(r)
    } else if (r.tag === 'any' || isGenericMatch(r.tag, ctx.won, ctx.lost, ctx.draw)) {
      generic.push(r)
    }
  }

  const result: ManagerResponse[] = []
  const used = new Set<string>()

  // Slot 1: 80% contextMatched, 20% anything
  const slot1pool = ctx.rand() < 0.80
    ? contextMatched
    : [...contextMatched, ...generic]
  if (slot1pool.length > 0) {
    const pick = slot1pool[Math.floor(ctx.rand() * slot1pool.length)]
    result.push(pick)
    used.add(pick.id)
  }

  // Slot 2: 50% context, 50% generic
  const slot2pool = (ctx.rand() < 0.5 ? contextMatched : generic).filter(r => !used.has(r.id))
  if (slot2pool.length > 0) {
    const pick = slot2pool[Math.floor(ctx.rand() * slot2pool.length)]
    result.push(pick)
    used.add(pick.id)
  }

  // Slot 3: random from anything that loosely matches result type
  const allPool = PLAYER_RESPONSES.filter(r => !used.has(r.id) && isGenericMatch(r.tag, ctx.won, ctx.lost, ctx.draw))
  if (allPool.length > 0) {
    const pick = allPool[Math.floor(ctx.rand() * allPool.length)]
    result.push(pick)
  }

  // Fallback: fill from full pool if needed
  while (result.length < 3) {
    const fallback = PLAYER_RESPONSES.filter(r => !used.has(r.id))
    if (fallback.length === 0) break
    const pick = fallback[Math.floor(ctx.rand() * fallback.length)]
    result.push(pick)
    used.add(pick.id)
  }

  return result.slice(0, 3)
}

// ── generatePressConference ────────────────────────────────────────────────────

export function generatePressConference(
  fixture: Fixture,
  game: SaveGame,
  rand: () => number,
): GameEvent | null {
  const isHome = fixture.homeClubId === game.managedClubId
  const myScore = isHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0)
  const theirScore = isHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0)
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)

  let contextKey: string
  if (rivalry && myScore > theirScore) contextKey = 'derbyWin'
  else if (rivalry && myScore < theirScore) contextKey = 'derbyLoss'
  else if (myScore >= theirScore + 3) contextKey = 'bigWin'
  else if (myScore > theirScore) contextKey = 'win'
  else if (theirScore >= myScore + 3) contextKey = 'bigLoss'
  else if (myScore < theirScore) contextKey = 'loss'
  else contextKey = 'draw'

  const questions = QUESTIONS[contextKey]
  if (!questions || questions.length === 0) return null

  const question = questions[Math.floor(rand() * questions.length)]
  const journalist = JOURNALISTS[Math.floor(rand() * JOURNALISTS.length)]

  const ctx = buildPressContext(fixture, game, rand)
  const responses = buildPressResponses(ctx)

  if (responses.length === 0) return null

  const choices = responses.map(r => ({
    id: r.id,
    label: r.label,
    effect: {
      type: 'pressResponse' as const,
      value: r.moraleEffect,
      mediaQuote: `${journalist}: ${r.mediaQuote}`,
    },
  }))

  return {
    id: `event_press_r${fixture.roundNumber ?? 0}_${game.currentSeason}`,
    type: 'pressConference' as const,
    title: `🎤 Presskonferens — ${journalist}`,
    body: `"${question}"`,
    choices,
    resolved: false,
  }
}
