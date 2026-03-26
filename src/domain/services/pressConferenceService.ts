import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import type { Fixture } from '../entities/Fixture'
import { getRivalry } from '../data/rivalries'

const JOURNALISTS = ['SVT Nyheter', 'Bandyplay', 'Lokaltidningen', 'Sportbladet', 'Bandypuls']

interface PressQuestion {
  question: string
  choices: PressChoiceData[]
}

interface PressChoiceData {
  id: string
  label: string
  moraleEffect: number
  mediaQuote: string
}

const QUESTIONS: Record<string, PressQuestion[]> = {
  bigWin: [
    {
      question: 'Imponerande seger. Var det ert bästa spel den här säsongen?',
      choices: [
        { id: 'confident', label: '"Vi visade vad vi kan."', moraleEffect: 5, mediaQuote: 'Tränaren var säker: "Vi visade vad vi kan."' },
        { id: 'humble', label: '"Bra dag, men vi har mer att ge."', moraleEffect: 3, mediaQuote: 'Tränaren var ödmjuk: "Bra dag, men vi har mer att ge."' },
        { id: 'deflect', label: '"Vi fokuserar redan på nästa match."', moraleEffect: 2, mediaQuote: 'Tränaren fokuserade framåt: "Vi tänker på nästa match."' },
      ],
    },
    {
      question: 'Laget spelade otroligt idag. Vad är hemligheten?',
      choices: [
        { id: 'confident', label: '"Träningen betalar sig."', moraleEffect: 5, mediaQuote: 'Tränaren: "Träningen betalar sig. Vi jobbar hårt varje dag."' },
        { id: 'humble', label: '"Laget förtjänar all cred."', moraleEffect: 4, mediaQuote: 'Tränaren hyllade truppen: "Laget förtjänar all cred."' },
        { id: 'deflect', label: '"Det är ett kollektivt projekt."', moraleEffect: 2, mediaQuote: 'Tränaren höll låg profil: "Det är ett kollektivt projekt."' },
      ],
    },
    {
      question: 'Tretalet idag — är det ett mönster eller en engångsgrej?',
      choices: [
        { id: 'confident', label: '"Det här är vi. Kom och se oss igen."', moraleEffect: 6, mediaQuote: 'Tränaren utmanade: "Det här är vi. Kom och se oss igen."' },
        { id: 'humble', label: '"Motståndarna hjälpte till med sina misstag."', moraleEffect: 2, mediaQuote: 'Tränaren var generös: "Motståndarna hjälpte till med sina misstag."' },
        { id: 'deflect', label: '"Varje match är sin egen."', moraleEffect: 2, mediaQuote: 'Tränaren: "Varje match är sin egen. Vi lever i nuet."' },
      ],
    },
    {
      question: 'Er offensiv ser ostoppbar ut. Fruktar du inte att bli läst av motståndarna?',
      choices: [
        { id: 'confident', label: '"De får försöka. Vi hittar alltid ett sätt."', moraleEffect: 5, mediaQuote: 'Tränaren: "Motståndarna får försöka. Vi hittar alltid ett sätt."' },
        { id: 'humble', label: '"Vi vet att det blir tuffare. Det är bra att hålla ner förväntningarna."', moraleEffect: 3, mediaQuote: 'Tränaren: "Det blir tuffare. Bra att hålla ner förväntningarna."' },
        { id: 'deflect', label: '"Vi fokuserar på vårt eget spel."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi fokuserar på oss själva, inte på vad motståndarna gör."' },
      ],
    },
    {
      question: 'Bortalaget verkade chockade av er intensitet. Avsiktlig taktik?',
      choices: [
        { id: 'confident', label: '"Absolut. Vi ville sätta press från start."', moraleEffect: 5, mediaQuote: 'Tränaren bekräftade: "Vi ville sätta press från start. Det var planerat."' },
        { id: 'humble', label: '"Vi spelade vårt spel, och idag funkade det."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi spelade vårt spel. Idag funkade det riktigt bra."' },
        { id: 'deflect', label: '"Spelet bestämmer sig självt när alla är med."', moraleEffect: 2, mediaQuote: 'Tränaren: "Spelet hittar sin form när alla är engagerade."' },
      ],
    },
    {
      question: 'Fem mål är ovanligt. Hade ni kunnat vinna ännu mer?',
      choices: [
        { id: 'confident', label: '"Ja, men vi är inte giriga. Vi tar det vi behöver."', moraleEffect: 4, mediaQuote: 'Tränaren log: "Vi är inte giriga. Vi tar det vi behöver."' },
        { id: 'humble', label: '"Vi slutade trycka på. Det är proffsigt av laget."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi slutade trycka på. Det är ett tecken på mognad."' },
        { id: 'deflect', label: '"Målen är sekundärt. Poängen är det som räknas."', moraleEffect: 2, mediaQuote: 'Tränaren: "Målen är sekundärt. Tre poäng är tre poäng."' },
      ],
    },
    {
      question: 'Publiken var i extas. Hur mycket spelar hemmafansen in?',
      choices: [
        { id: 'passionate', label: '"De är vår tolfte man. Otrolig energi ikväll."', moraleEffect: 6, mediaQuote: 'Tränaren: "Fansen är vår tolfte man. Otrolig energi ikväll."' },
        { id: 'humble', label: '"Vi spelar för dem. Det är enkelt som det."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi spelar för fansen. Det är enkelt som det."' },
        { id: 'deflect', label: '"Vi måste prestera lika bra borta."', moraleEffect: 2, mediaQuote: 'Tränaren: "Nu gäller det att prestera lika bra när vi reser bort."' },
      ],
    },
  ],
  win: [
    {
      question: 'Seger — berätta om matchen.',
      choices: [
        { id: 'humble', label: '"Stark insats av hela laget."', moraleEffect: 4, mediaQuote: 'Tränaren var nöjd: "Stark insats av hela laget."' },
        { id: 'confident', label: '"Vi spelade precis som vi ville."', moraleEffect: 5, mediaQuote: 'Tränaren: "Vi spelade precis som vi ville."' },
        { id: 'deflect', label: '"Jobbet är inte klart."', moraleEffect: 2, mediaQuote: 'Tränaren höll fokus: "Jobbet är inte klart."' },
      ],
    },
    {
      question: 'Tre viktiga poäng. Hur påverkar det stämningen i laget?',
      choices: [
        { id: 'passionate', label: '"Det ger energi hela veckan!"', moraleEffect: 6, mediaQuote: 'Tränaren var entusiastisk: "Segrar ger energi hela veckan!"' },
        { id: 'humble', label: '"Vi jobbar poäng för poäng."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi jobbar poäng för poäng. Inga garantier."' },
        { id: 'deflect', label: '"Fokusen är alltid på nästa match."', moraleEffect: 2, mediaQuote: 'Tränaren: "Fokusen är alltid på nästa match."' },
      ],
    },
    {
      question: 'Vilken spelare stack ut idag?',
      choices: [
        { id: 'passionate', label: '"Alla, faktiskt. Det är kollektivet som vinner."', moraleEffect: 6, mediaQuote: 'Tränaren hyllade truppen: "Alla stack ut. Det är kollektivet som vinner."' },
        { id: 'humble', label: '"Jag nämner inga namn — alla bidrar."', moraleEffect: 3, mediaQuote: 'Tränaren: "Jag nämner inga namn. Alla bidrar lika mycket."' },
        { id: 'confident', label: '"Laget spelade upp varandra idag."', moraleEffect: 4, mediaQuote: 'Tränaren: "Laget spelade upp varandra. Det är vårt vapen."' },
      ],
    },
    {
      question: 'Hur håller ni den här formen uppe?',
      choices: [
        { id: 'confident', label: '"Disciplin och tro. Det är receptet."', moraleEffect: 5, mediaQuote: 'Tränaren: "Disciplin och tro på systemet. Det är receptet."' },
        { id: 'deflect', label: '"Vi tar en match i taget."', moraleEffect: 2, mediaQuote: 'Tränaren: "En match i taget. Det låter klyschigt men det funkar."' },
        { id: 'passionate', label: '"Vi trivs. Det märks på isen."', moraleEffect: 5, mediaQuote: 'Tränaren: "Vi trivs tillsammans. Det märks på isen."' },
      ],
    },
    {
      question: 'Ni vände underläge till seger. Vad hände i pausen?',
      choices: [
        { id: 'passionate', label: '"Jag sa att en match aldrig är slut vid paus. De trodde på det."', moraleEffect: 6, mediaQuote: 'Tränaren: "Jag sa att matchen aldrig är slut vid paus. De trodde på det."' },
        { id: 'humble', label: '"Laget samlade sig. Jag kan inte ta åt mig cred."', moraleEffect: 4, mediaQuote: 'Tränaren: "Laget samlade sig i pausen. Jag kan inte ta åt mig cred."' },
        { id: 'deflect', label: '"Vi justerade ett par detaljer taktiskt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi justerade taktiken och det gav utdelning."' },
      ],
    },
    {
      question: 'En avancemang i tabellen. Kan ni utmana toppen nu?',
      choices: [
        { id: 'confident', label: '"Vi är med i matchen om det. Absolut."', moraleEffect: 5, mediaQuote: 'Tränaren var frimodig: "Vi är med i matchen om toppen. Absolut."' },
        { id: 'humble', label: '"Det är för tidigt att prata om toppen."', moraleEffect: 3, mediaQuote: 'Tränaren bromsade: "Det är för tidigt att prata om tabelltoppen."' },
        { id: 'deflect', label: '"Vi tittar inte på tabellen — ännu."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi tittar inte på tabellen. Inte än."' },
      ],
    },
    {
      question: 'Ni dominerade mittfältet idag. Är det er styrka just nu?',
      choices: [
        { id: 'confident', label: '"Mittfältet är vårt hjärta. Det stämmer."', moraleEffect: 5, mediaQuote: 'Tränaren: "Mittfältet är vårt hjärta. Och det slog starkt ikväll."' },
        { id: 'humble', label: '"Vi fick hjälp av att motståndarna tappade sin form."', moraleEffect: 3, mediaQuote: 'Tränaren var generös: "Vi fick hjälp av att motståndarna tappade."' },
        { id: 'deflect', label: '"Det handlar alltid om laget i sin helhet."', moraleEffect: 2, mediaQuote: 'Tränaren: "Det handlar alltid om laget. Inte enskilda zoner."' },
      ],
    },
  ],
  loss: [
    {
      question: 'Tung förlust. Vad gick fel?',
      choices: [
        { id: 'humble', label: '"Vi var inte tillräckligt bra idag."', moraleEffect: 2, mediaQuote: 'Tränaren var självkritisk: "Vi var inte tillräckligt bra idag."' },
        { id: 'angry', label: '"Domsluten gick emot oss."', moraleEffect: -3, mediaQuote: 'Tränaren var bitter: "Domsluten gick emot oss."' },
        { id: 'deflect', label: '"Vi analyserar och kommer tillbaka starkare."', moraleEffect: 1, mediaQuote: 'Tränaren: "Vi analyserar och kommer tillbaka starkare."' },
      ],
    },
    {
      question: 'Laget såg trötta ut i andra halvlek. Kondition?',
      choices: [
        { id: 'humble', label: '"Vi tar på oss det och tränar hårdare."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi tar på oss det och tränar hårdare."' },
        { id: 'deflect', label: '"Det handlade mer om taktik."', moraleEffect: 1, mediaQuote: 'Tränaren: "Det handlade mer om taktik än kondition."' },
        { id: 'confident', label: '"Vi hade kontroll — resultatet visar inte bilden."', moraleEffect: 0, mediaQuote: 'Tränaren höll fast vid sin syn: "Resultatet visar inte hela bilden."' },
      ],
    },
    {
      question: 'Supportrarna är besvikna. Vad säger du till dem?',
      choices: [
        { id: 'passionate', label: '"Vi sviker er inte igen. Det lovar jag."', moraleEffect: 3, mediaQuote: 'Tränaren lovade fansen: "Vi sviker er inte igen."' },
        { id: 'humble', label: '"De har rätt att vara besvikna. Vi förtjänade inte mer."', moraleEffect: 2, mediaQuote: 'Tränaren: "Fansen har rätt att vara besvikna."' },
        { id: 'deflect', label: '"Vi måste titta på filmen och lära oss."', moraleEffect: 1, mediaQuote: 'Tränaren: "Vi måste titta på filmen och lära oss."' },
      ],
    },
    {
      question: 'Ni hamnade bakom motståndarna taktiskt. Vad gör du annorlunda nästa match?',
      choices: [
        { id: 'humble', label: '"De läste oss bättre. Det justerar vi."', moraleEffect: 2, mediaQuote: 'Tränaren var självkritisk: "De läste oss bättre idag. Det justerar vi."' },
        { id: 'confident', label: '"Vi var inte i vårt rätta element. Det rättar vi till."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi var inte i vårt rätta element. Det rättar vi till nästa gång."' },
        { id: 'deflect', label: '"Fotboll handlar om detaljer. Idag förlorade vi i dem."', moraleEffect: 1, mediaQuote: 'Tränaren: "Det handlar om detaljer. Idag förlorade vi i dem."' },
      ],
    },
    {
      question: 'Hur pratar du med spelarna i omklädningsrummet efter en sådan här match?',
      choices: [
        { id: 'passionate', label: '"Rakt, ärligt. Utan filter."', moraleEffect: 4, mediaQuote: 'Tränaren: "Jag pratar rakt och ärligt med dem. Utan filter."' },
        { id: 'humble', label: '"Jag lyssnar mer än jag pratar just nu."', moraleEffect: 3, mediaQuote: 'Tränaren: "Just nu lyssnar jag mer än jag pratar. Det är lika viktigt."' },
        { id: 'deflect', label: '"Det stannar i omklädningsrummet."', moraleEffect: 1, mediaQuote: 'Tränaren: "Det som sägs i omklädningsrummet stannar där."' },
      ],
    },
    {
      question: 'Tappar ni tron på er spelstil nu?',
      choices: [
        { id: 'confident', label: '"Nej. Spelstilen är rätt. Vi utförde den fel idag."', moraleEffect: 3, mediaQuote: 'Tränaren stod fast: "Spelstilen är rätt. Vi utförde den fel idag."' },
        { id: 'humble', label: '"Vi måste granska oss kritiskt. Inget är heligt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Inget är heligt. Vi måste granska oss kritiskt."' },
        { id: 'deflect', label: '"Det är för tidigt att dra slutsatser."', moraleEffect: 1, mediaQuote: 'Tränaren: "En match ger inte hela svaret. Det är för tidigt."' },
      ],
    },
    {
      question: 'Ni hade chanser men konverterade inte. Stressar det er?',
      choices: [
        { id: 'confident', label: '"Nej. Chanserna är ett bra tecken. Målen kommer."', moraleEffect: 3, mediaQuote: 'Tränaren: "Chanserna är ett gott tecken. Målen kommer att komma."' },
        { id: 'humble', label: '"Det är en klinisk fråga. Vi tränar på det."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi tränar på det kliniska avslutet. Det är en detalj."' },
        { id: 'deflect', label: '"Processen är rätt. Resultaten följer."', moraleEffect: 1, mediaQuote: 'Tränaren: "Processen är rätt. Jag är övertygad om det."' },
      ],
    },
    {
      question: 'Bortalaget körde över er i perioderna. Vad händer med er defensiv?',
      choices: [
        { id: 'humble', label: '"Vi var för passiva. Det måste vi rätta till."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi var för passiva. Det är konkret och vi rättar till det."' },
        { id: 'confident', label: '"Vi reglerar det. Det är en kortvarig anpassning."', moraleEffect: 2, mediaQuote: 'Tränaren: "Det är en kortvarig anpassning. Vi reglerar det snabbt."' },
        { id: 'deflect', label: '"Jag kommenterar inte enskilda perioder."', moraleEffect: 0, mediaQuote: 'Tränaren: "Jag kommenterar inte enskilda perioder. Matchen som helhet."' },
      ],
    },
    {
      question: 'Säsongen är svår just nu. Hur håller du moralen uppe?',
      choices: [
        { id: 'passionate', label: '"Jag tror på det här laget. Det smittar."', moraleEffect: 4, mediaQuote: 'Tränaren: "Jag tror på det här laget. Den tron smittar."' },
        { id: 'humble', label: '"Ärlig kommunikation. Vi döljer ingenting."', moraleEffect: 3, mediaQuote: 'Tränaren: "Ärlig kommunikation. Vi döljer ingenting för varandra."' },
        { id: 'deflect', label: '"Jobbet. Det är svaret. Man jobbar sig ur dåliga perioder."', moraleEffect: 2, mediaQuote: 'Tränaren: "Jobbet. Man jobbar sig ur dåliga perioder."' },
      ],
    },
  ],
  bigLoss: [
    {
      question: 'En mörk kväll. Hur tar ni er vidare?',
      choices: [
        { id: 'humble', label: '"Vi måste titta oss själva i spegeln."', moraleEffect: 3, mediaQuote: 'Tränaren var brutal: "Vi måste titta oss i spegeln."' },
        { id: 'passionate', label: '"Jag tar på mig ansvaret."', moraleEffect: 4, mediaQuote: 'Tränaren tog ansvar: "Det här är mitt ansvar. Jag tar det fullt ut."' },
        { id: 'angry', label: '"Det var inte acceptabelt."', moraleEffect: -2, mediaQuote: 'Tränaren var direkt: "Det var inte acceptabelt. Punkt."' },
      ],
    },
    {
      question: 'Är du orolig för lagets form?',
      choices: [
        { id: 'confident', label: '"Nej. Vi reser oss. Det vet jag."', moraleEffect: 3, mediaQuote: 'Tränaren visade ledarskap: "Vi reser oss. Det vet jag."' },
        { id: 'humble', label: '"Vi måste vara ärliga mot oss själva."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi måste vara ärliga mot oss själva."' },
        { id: 'deflect', label: '"Form är cyklisk. Det vänder."', moraleEffect: 1, mediaQuote: 'Tränaren: "Form är cyklisk. Det vänder."' },
      ],
    },
    {
      question: 'Det här resultatet kan kosta er dyrt i tabellen. Hur reagerar styrelsen?',
      choices: [
        { id: 'deflect', label: '"Det är sport. Förluster händer. Vi fokuserar framåt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Det är sport. Förluster händer. Vi fokuserar framåt."' },
        { id: 'humble', label: '"Styrelsen förväntar sig resultat. Det är rättvist."', moraleEffect: 1, mediaQuote: 'Tränaren accepterade: "Styrelsen förväntar sig resultat. Det är rättvist."' },
        { id: 'passionate', label: '"Pressen ökar — men det stärker oss."', moraleEffect: 3, mediaQuote: 'Tränaren: "Pressen ökar. Men det stärker oss."' },
      ],
    },
    {
      question: 'Motståndarna verkade veta exakt vad ni skulle göra. Läckta planer?',
      choices: [
        { id: 'deflect', label: '"De scouter oss som vi scouter dem."', moraleEffect: 1, mediaQuote: 'Tränaren: "De scouter oss. Det är normalt. Vi anpassar oss."' },
        { id: 'humble', label: '"Vi var för förutsägbara. Det är vår uppgift att lösa."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi var för förutsägbara. Det löser vi."' },
        { id: 'confident', label: '"De hade en bra dag. Det händer."', moraleEffect: 2, mediaQuote: 'Tränaren: "De hade en riktigt bra dag. Det händer."' },
      ],
    },
    {
      question: 'Fem insläppta mål. Var det ett systemproblem?',
      choices: [
        { id: 'humble', label: '"Det var det. Vi måste lösa det kollektivt."', moraleEffect: 2, mediaQuote: 'Tränaren var självkritisk: "Det var ett systemproblem. Vi löser det kollektivt."' },
        { id: 'confident', label: '"Nej, men vi missade viktiga individer som täcker upp."', moraleEffect: 1, mediaQuote: 'Tränaren: "Det handlade mer om att individer inte täckte upp."' },
        { id: 'angry', label: '"Ja. Och det är inte acceptabelt."', moraleEffect: -1, mediaQuote: 'Tränaren var skarp: "Ja. Och det är inte acceptabelt."' },
      ],
    },
    {
      question: 'Behöver du ta in ny spetskompetens för att vända skutan?',
      choices: [
        { id: 'deflect', label: '"Vi löser det med det vi har."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi löser det med den trupp vi har."' },
        { id: 'humble', label: '"Vi ser på vad alternativ som finns. Det vore oärligt att säga annat."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi ser på alternativen. Det vore oärligt att säga annat."' },
        { id: 'confident', label: '"Den här gruppen räcker. Det handlar om attityd."', moraleEffect: 3, mediaQuote: 'Tränaren: "Den här gruppen räcker. Det handlar om rätt attityd."' },
      ],
    },
  ],
  draw: [
    {
      question: 'Oavgjort — nöjd eller besviken?',
      choices: [
        { id: 'humble', label: '"Vi tar en poäng och jobbar vidare."', moraleEffect: 2, mediaQuote: 'Tränaren nöjde sig: "En poäng och vidare."' },
        { id: 'confident', label: '"Vi borde ha vunnit."', moraleEffect: 1, mediaQuote: 'Tränaren var hungrig: "Vi borde ha vunnit den matchen."' },
        { id: 'deflect', label: '"Bra kamp av båda lagen."', moraleEffect: 2, mediaQuote: 'Tränaren var generös: "Bra kamp av båda lagen."' },
      ],
    },
    {
      question: 'Ni kvitterade sent. Vad säger det om lagets karaktär?',
      choices: [
        { id: 'passionate', label: '"Det säger allt om vår mentalitet."', moraleEffect: 5, mediaQuote: 'Tränaren var stolt: "Det säger allt om vår mentalitet."' },
        { id: 'humble', label: '"Vi ger oss aldrig. Det är vår styrka."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi ger oss aldrig. Det är vår styrka."' },
        { id: 'deflect', label: '"Vi borde ha gjort det enklare för oss."', moraleEffect: 1, mediaQuote: 'Tränaren: "Vi borde ha gjort det enklare för oss."' },
      ],
    },
    {
      question: 'En poäng i bortamatchen — räknas det som bra?',
      choices: [
        { id: 'confident', label: '"Borta är alltid svårt. En poäng är acceptabelt."', moraleEffect: 3, mediaQuote: 'Tränaren: "Borta är alltid svårt. En poäng är ett okej resultat."' },
        { id: 'humble', label: '"Vi spelade för att vinna. En poäng känns lite tomt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi spelade för att vinna. En poäng känns lite tomt."' },
        { id: 'deflect', label: '"Vi fortsätter jobba."', moraleEffect: 1, mediaQuote: 'Tränaren: "Vi fortsätter jobba. Det är det vi kan kontrollera."' },
      ],
    },
    {
      question: 'Matchen avgjordes av detaljer. Vilken detalj är viktigast att förbättra?',
      choices: [
        { id: 'humble', label: '"Avsluten. Vi skapar chanser men omsätter dem inte."', moraleEffect: 3, mediaQuote: 'Tränaren pekade ut: "Vi skapar chanser men omsätter dem inte. Det jobbar vi på."' },
        { id: 'confident', label: '"Ingenting dramatiskt. Vi är nära."', moraleEffect: 3, mediaQuote: 'Tränaren: "Ingenting dramatiskt. Vi är nära det vi vill nå."' },
        { id: 'deflect', label: '"Alla detaljer spelar in. Det är kollektivt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Det är ett kollektivt ansvar. Alla detaljer spelar in."' },
      ],
    },
    {
      question: 'Ert spel var ojämnt idag. Vad berodde det på?',
      choices: [
        { id: 'humble', label: '"Vi hade en tung vecka bakom oss. Det syntes."', moraleEffect: 2, mediaQuote: 'Tränaren: "Det var en tung vecka bakom oss. Det syntes på spelet."' },
        { id: 'confident', label: '"Motståndarna var bra. Det gör spelet ojämnt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Motståndarna var bra. Det påverkar vår rytm."' },
        { id: 'deflect', label: '"Alla matcher är ojämna. Det är fotboll."', moraleEffect: 1, mediaQuote: 'Tränaren: "Alla matcher har sina ebb och flod. Det är sport."' },
      ],
    },
    {
      question: 'Ni har oavgjort i tre raka. Är det en trend att oroa sig för?',
      choices: [
        { id: 'confident', label: '"Tre poäng missade, men vi är solida. Det vänder."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi är solida. Tre oavgjorda är inte idealt men vi är på rätt väg."' },
        { id: 'humble', label: '"Vi måste bli mer kliniska. Det är tydligt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi måste bli mer kliniska. Det är den tydliga lärdomen."' },
        { id: 'deflect', label: '"Vi tittar på varje match för sig."', moraleEffect: 1, mediaQuote: 'Tränaren: "Vi analyserar varje match för sig. Inga trender ännu."' },
      ],
    },
  ],
  derbyWin: [
    {
      question: 'Derbyseger! Vad betyder det för laget?',
      choices: [
        { id: 'passionate', label: '"Det här är för fansen. De förtjänar det."', moraleEffect: 8, mediaQuote: 'Tränaren dedikerade segern: "Det här är för fansen. De förtjänar det."' },
        { id: 'deflect', label: '"Tre poäng, inget mer."', moraleEffect: 3, mediaQuote: 'Tränaren höll det kort: "Tre poäng, inget mer."' },
        { id: 'confident', label: '"Vi visade att vi är bättre."', moraleEffect: 5, mediaQuote: 'Tränaren tog ut svängarna: "Vi visade att vi är bättre."' },
      ],
    },
    {
      question: 'Vad gör en derbyseger med truppen?',
      choices: [
        { id: 'passionate', label: '"Det cementerar en identitet. Vi är ett lag."', moraleEffect: 8, mediaQuote: 'Tränaren: "Det cementerar vår identitet. Vi är ett lag."' },
        { id: 'humble', label: '"Vi är glada, men fokuserar snabbt på nästa match."', moraleEffect: 4, mediaQuote: 'Tränaren höll fokus: "Vi är glada, men tänker redan på nästa match."' },
        { id: 'confident', label: '"Det bekräftar att vi är på rätt väg."', moraleEffect: 5, mediaQuote: 'Tränaren: "Det bekräftar att vi är på rätt väg."' },
      ],
    },
    {
      question: 'Hur förbereder man sig mentalt för ett derby jämfört med en vanlig match?',
      choices: [
        { id: 'passionate', label: '"Det behövs ingen förberedelse. Alla vet vad det handlar om."', moraleEffect: 7, mediaQuote: 'Tränaren: "Alla vet vad ett derby är. Det behövs ingen extra speech."' },
        { id: 'confident', label: '"Vi håller det professionellt. Derbykänslan tar hand om sig själv."', moraleEffect: 5, mediaQuote: 'Tränaren: "Vi håller det professionellt. Känslan tar hand om sig själv."' },
        { id: 'humble', label: '"Det är viktigare att hålla huvudet kallt i ett derby."', moraleEffect: 4, mediaQuote: 'Tränaren: "I ett derby gäller det att hålla huvudet kallt. Det lyckades vi med."' },
      ],
    },
    {
      question: 'Fansen sjöng hela matchen. Spelade de in?',
      choices: [
        { id: 'passionate', label: '"De bar oss när vi behövde det som mest."', moraleEffect: 8, mediaQuote: 'Tränaren: "Fansen bar oss när det behövdes som mest. Otroligt."' },
        { id: 'confident', label: '"Vi levererade för dem. Det är det vi är till för."', moraleEffect: 6, mediaQuote: 'Tränaren: "Vi levererade för fansen. Det är det vi är till för."' },
        { id: 'deflect', label: '"Det hjälper, men spelet avgör."', moraleEffect: 3, mediaQuote: 'Tränaren: "Publikens energi hjälper, men spelet avgör."' },
      ],
    },
    {
      question: 'Rivaliteten är laddad. Hur hanterar du pressen inför den typen av match?',
      choices: [
        { id: 'confident', label: '"Jag trivs med pressen. Den för fram det bästa i oss."', moraleEffect: 6, mediaQuote: 'Tränaren: "Jag trivs med pressen. Den för fram det bästa i oss."' },
        { id: 'humble', label: '"Vi pratar om det öppet i truppen. Inget hemligt."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi pratar om pressen öppet. Inga hemligheter."' },
        { id: 'deflect', label: '"Vi fokuserar på spelet, inte på stämningen runtomkring."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi fokuserar på spelet, inte på allt runtomkring."' },
      ],
    },
    {
      question: 'Ni dominerade klart. Var det planerat att ta kommandot tidigt?',
      choices: [
        { id: 'confident', label: '"Absolut. Vi ville inte ge dem en chans att komma in i matchen."', moraleEffect: 7, mediaQuote: 'Tränaren bekräftade: "Vi ville inte ge dem en chans. Det var planerat."' },
        { id: 'humble', label: '"Laget genomförde planen bättre än jag vågat hoppas."', moraleEffect: 5, mediaQuote: 'Tränaren: "Laget genomförde planen bättre än jag vågat hoppas på."' },
        { id: 'deflect', label: '"Vi spelade vårt spel. Motståndarna fick ta konsekvenserna."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi spelade vårt spel. Motståndarna fick ta konsekvenserna."' },
      ],
    },
    {
      question: 'Det här är ett resultat att fira. Hur länge tillåter du laget att njuta av det?',
      choices: [
        { id: 'passionate', label: '"Ikväll firar vi. I morgon är det jobb igen."', moraleEffect: 7, mediaQuote: 'Tränaren: "Ikväll firar vi. I morgon är det jobb igen. Det är balansen."' },
        { id: 'humble', label: '"Vi är professionella. Festande håller vi kort."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi är professionella. Festandet håller vi kort."' },
        { id: 'confident', label: '"Vi sparar energin till nästa match. Det är bättre."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi sparar energin. Det är bättre så."' },
      ],
    },
    {
      question: 'Vad säger den här segern om var ni befinner er som lag?',
      choices: [
        { id: 'passionate', label: '"Det säger att vi är ett riktigt lag. Inte bara ett gäng spelare."', moraleEffect: 8, mediaQuote: 'Tränaren: "Det säger att vi är ett riktigt lag. Inte bara ett gäng spelare."' },
        { id: 'confident', label: '"Vi är på väg uppåt. Det känner alla."', moraleEffect: 6, mediaQuote: 'Tränaren: "Vi är på väg uppåt. Det känner hela laget."' },
        { id: 'deflect', label: '"Det säger att vi kan prestera när det gäller."', moraleEffect: 4, mediaQuote: 'Tränaren: "Det säger att vi kan prestera när det verkligen gäller."' },
      ],
    },
  ],
  derbyLoss: [
    {
      question: 'Smärtsam förlust i derbyt. Kommentar?',
      choices: [
        { id: 'passionate', label: '"Vi kommer tillbaka. Det här glömmer vi inte."', moraleEffect: 3, mediaQuote: 'Tränaren lovade revansch: "Vi kommer tillbaka. Det glömmer vi inte."' },
        { id: 'humble', label: '"De var bättre idag, vi får ge dem det."', moraleEffect: 1, mediaQuote: 'Tränaren var generös: "De var bättre idag. Det får vi erkänna."' },
        { id: 'angry', label: '"Jag vill inte prata om derbyt."', moraleEffect: -2, mediaQuote: 'Tränaren vägrade kommentera: "Jag vill inte prata om det idag."' },
      ],
    },
    {
      question: 'Hur stänger man av derby-förlusten mentalt?',
      choices: [
        { id: 'passionate', label: '"Man stänger inte av. Man använder den."', moraleEffect: 4, mediaQuote: 'Tränaren: "Man stänger inte av en derbyförlust. Man använder den som bränsle."' },
        { id: 'deflect', label: '"Fokus på nästa match. Det är det enda."', moraleEffect: 2, mediaQuote: 'Tränaren: "Fokus på nästa match. Det är det enda som gäller."' },
        { id: 'humble', label: '"Det svider, men vi lär oss av det."', moraleEffect: 2, mediaQuote: 'Tränaren: "Det svider, men vi lär oss av det."' },
      ],
    },
    {
      question: 'Fansen är krossade. Vad säger du till dem efter det här?',
      choices: [
        { id: 'passionate', label: '"Jag förstår besvikelsen. Vi kämpade för er — och vi gör det igen."', moraleEffect: 4, mediaQuote: 'Tränaren till fansen: "Jag förstår besvikelsen. Vi kämpade för er och vi gör det igen."' },
        { id: 'humble', label: '"De har rätt att vara arga. Vi svarade inte upp."', moraleEffect: 2, mediaQuote: 'Tränaren: "Fansen har rätt att vara arga. Vi svarade inte upp ikväll."' },
        { id: 'deflect', label: '"Vi ber om ursäkt och arbetar för revansch."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi ber om ursäkt. Och vi jobbar för revansch."' },
      ],
    },
    {
      question: 'Rivalerna vann — de kommer att skryta länge. Stör det dig?',
      choices: [
        { id: 'passionate', label: '"Det ska de göra. Vi behöver det som motivation."', moraleEffect: 4, mediaQuote: 'Tränaren: "De ska njuta. Vi behöver det som motivation inför nästa derby."' },
        { id: 'deflect', label: '"Det är sport. Idag vann de. Det är allt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Det är sport. Idag vann de. Punkt."' },
        { id: 'confident', label: '"Vi möts igen. Det är snart dags."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi möts igen. Det är inte länge kvar."' },
      ],
    },
    {
      question: 'Er prestation föll under nivån. Vad förklarar det?',
      choices: [
        { id: 'humble', label: '"Vi spelade rädda. Det är inte vi."', moraleEffect: 3, mediaQuote: 'Tränaren var självkritisk: "Vi spelade rädda. Det är inte vi. Det rättar vi."' },
        { id: 'confident', label: '"De pressade oss och vi tappade rytmen. Det är en detalj."', moraleEffect: 2, mediaQuote: 'Tränaren: "De pressade oss och vi tappade rytmen. Det är en detalj vi fixar."' },
        { id: 'deflect', label: '"Derby-nerverna påverkar. Det är mänskligt."', moraleEffect: 2, mediaQuote: 'Tränaren: "Derby-nerverna påverkar alla. Det är mänskligt."' },
      ],
    },
    {
      question: 'Det är tungt att förlora just det här derbyt. Hur lyfter du laget nu?',
      choices: [
        { id: 'passionate', label: '"Jag berättar att vi fortfarande styr vår egen destiny."', moraleEffect: 5, mediaQuote: 'Tränaren: "Jag påminner dem om att vi styr vår egen framtid. Ingen derby avgör säsongen."' },
        { id: 'humble', label: '"Ärlig analys. Ingen pajk, men inga ursäkter heller."', moraleEffect: 3, mediaQuote: 'Tränaren: "Ärlig analys. Ingen pajk — men inga ursäkter heller."' },
        { id: 'confident', label: '"Det är en match. Vi har många kvar att vinna."', moraleEffect: 3, mediaQuote: 'Tränaren: "Det är en match. Vi har massor kvar att vinna den här säsongen."' },
      ],
    },
    {
      question: 'Taktiken fungerade inte idag. Vad gör du annorlunda nästa gång ni möts?',
      choices: [
        { id: 'humble', label: '"Vi var för statiska. Mer dynamik krävs mot det här laget."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi var för statiska. Det laget kräver mer dynamik. Noterat."' },
        { id: 'confident', label: '"Vi justerar ett par saker. Det räcker."', moraleEffect: 3, mediaQuote: 'Tränaren: "Det är ett par justeringar. Det räcker för att ändra bilden."' },
        { id: 'deflect', label: '"Taktiken var rätt. Utförandet svek oss."', moraleEffect: 2, mediaQuote: 'Tränaren: "Taktiken var rätt. Det var utförandet som svek oss ikväll."' },
      ],
    },
    {
      question: 'Ni domineras i direktduellan med rivalerna. Är det ett psykologiskt problem?',
      choices: [
        { id: 'confident', label: '"Nej. Det är resultatet av en dag, inte ett mönster."', moraleEffect: 3, mediaQuote: 'Tränaren: "Det är inte ett mönster. Det är resultatet av en dag."' },
        { id: 'humble', label: '"Det finns säkert en mental komponent. Det arbetar vi med."', moraleEffect: 3, mediaQuote: 'Tränaren: "Det finns en mental komponent. Den arbetar vi aktivt med."' },
        { id: 'passionate', label: '"Nästa gång är annorlunda. Det lovar jag."', moraleEffect: 4, mediaQuote: 'Tränaren lovade: "Nästa gång är annorlunda. Det kan ni skriva upp."' },
      ],
    },
  ],
}

export function generatePressConference(
  fixture: Fixture,
  game: SaveGame,
  rand: () => number,
): GameEvent | null {
  const isHome = fixture.homeClubId === game.managedClubId
  const myScore = isHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0)
  const theirScore = isHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0)
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)

  let context: string
  if (rivalry && myScore > theirScore) context = 'derbyWin'
  else if (rivalry && myScore < theirScore) context = 'derbyLoss'
  else if (myScore >= theirScore + 3) context = 'bigWin'
  else if (myScore > theirScore) context = 'win'
  else if (theirScore >= myScore + 3) context = 'bigLoss'
  else if (myScore < theirScore) context = 'loss'
  else context = 'draw'

  const questions = QUESTIONS[context]
  if (!questions || questions.length === 0) return null

  const question = questions[Math.floor(rand() * questions.length)]
  const journalist = JOURNALISTS[Math.floor(rand() * JOURNALISTS.length)]

  const choices = question.choices.map(c => ({
    id: c.id,
    label: c.label,
    effect: {
      type: 'pressResponse' as const,
      value: c.moraleEffect,
      mediaQuote: `📰 ${journalist}: ${c.mediaQuote}`,
    },
  }))

  return {
    id: `event_press_r${fixture.roundNumber ?? 0}_${game.currentSeason}`,
    type: 'pressConference' as const,
    title: `🎤 Presskonferens — ${journalist}`,
    body: `"${question.question}"`,
    choices,
    resolved: false,
  }
}
