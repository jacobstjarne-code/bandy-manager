import type { AssistantCoach, CoachPersonality, CoachBackground } from '../entities/AssistantCoach'

// Svenska förnamn + efternamn — speglar aiCoachService
const FIRST_NAMES = ['Leif', 'Björn', 'Håkan', 'Stefan', 'Per', 'Johan', 'Anders', 'Mikael', 'Lars', 'Gunnar', 'Ulf', 'Rolf', 'Kent', 'Peter', 'Sven']
const LAST_NAMES  = ['Berglund', 'Lindqvist', 'Eriksson', 'Holm', 'Persson', 'Karlsson', 'Nilsson', 'Johansson', 'Pettersson', 'Svensson', 'Larsson', 'Andersson', 'Gustafsson', 'Magnusson', 'Sandberg']

const PERSONALITIES: CoachPersonality[] = ['calm', 'sharp', 'jovial', 'grumpy', 'philosophical']
const BACKGROUNDS: CoachBackground[] = ['former-player', 'academy-coach', 'tactician', 'veteran']

function simpleHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

/**
 * Slumpar fram en assistenttränare vid NewGame.
 * Deterministisk baserat på saveId — samma seed ger alltid samma tränare.
 */
export function generateAssistantCoach(seed: string): AssistantCoach {
  const hash = simpleHash(seed)
  const firstName = FIRST_NAMES[hash % FIRST_NAMES.length]
  const lastName = LAST_NAMES[(hash >> 8) % LAST_NAMES.length]
  const name = `${firstName} ${lastName}`
  const initials = `${firstName[0]}${lastName[0]}`
  const age = 40 + (hash % 26)
  const personality = PERSONALITIES[(hash >> 16) % PERSONALITIES.length]
  const background = BACKGROUNDS[(hash >> 20) % BACKGROUNDS.length]
  return { name, age, personality, background, initials }
}

// ── Quote generator ──────────────────────────────────────────

export type QuoteContext =
  | { type: 'match-result'; result: 'win' | 'draw' | 'loss'; score: string }
  | { type: 'halftime'; leading: boolean; margin: number }
  | { type: 'tactic-change'; bold: boolean }
  | { type: 'weekly-decision'; topic: string }
  | { type: 'season-summary'; finalPosition: number; expectation: number }
  | { type: 'press-conference'; result: 'win' | 'draw' | 'loss' }

const WIN_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    'Bra jobbat. Det är sådana prestationer vi ska bygga på.',
    'Tre poäng. Vi fortsätter på samma linje.',
    'Bra match. Laget gör det vi tränar på.',
  ],
  sharp: [
    'Det där var vad vi förväntade oss. Bra genomförande.',
    'Exakt som vi planerat. Nu håller vi nivån.',
    'Klart godkänt. Men det finns saker att skärpa till nästa match.',
  ],
  jovial: [
    'Fantastiskt! Laget spelade med hjärtat idag — det syns!',
    'Det är nu det händer! Bra kämpat, allihopa.',
    'Tre poäng och bra stämning — vad mer kan man be om?',
  ],
  grumpy: [
    'Bra. Men vi hade vunnit mer komfortabelt med bättre disciplin.',
    'Vinst. Hade sett bättre ut om vi höll formen hela matchen.',
    'Vi vann. Men vi måste prata om andra halvlek.',
  ],
  philosophical: [
    'En vinst är aldrig en slump. Det finns alltid orsaker.',
    'Laget presterade. Det är allt som räknas idag.',
    'Seger och förlust är ögonblick. Det är vägen dit som formar laget.',
  ],
}

const DRAW_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    'En poäng. Det är vad det var idag.',
    'Vi tog ett poäng, men vi visste att det fanns mer där.',
    'Oavgjort. Inte idealt, men inte katastrof heller.',
  ],
  sharp: [
    'Det räckte inte. Vi lämnade poäng på isen igen.',
    'En delad pott. Vi vet vad vi behöver förbättra.',
    'Inte tillräckligt. Vi tränar på avslutet imorgon.',
  ],
  jovial: [
    'En poäng är en poäng! Vi tar det och kämpar vidare.',
    'Inte hela vägen, men vi är fortfarande i spelet!',
    'Oavgjort. Huvudet upp — nästa match är vår.',
  ],
  grumpy: [
    'En poäng när vi behövde tre. Det är problematiskt.',
    'Det här är inte bra nog. Vi behöver prata.',
    'Oavgjort hemma. Det duger inte i längden.',
  ],
  philosophical: [
    'Ibland delar man rättvist på poängen. Det är bandyns natur.',
    'En poäng. Inte mer, inte mindre. Frågan är vad vi gör nästa omgång.',
    'Oavgjort berättar något om laget. Vad det berättar — det diskuterar vi imorgon.',
  ],
}

const LOSS_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    'Det där var ingen bra dag. Vi tittar på det.',
    'Ingen idé att hänga läpp. Nästa match kommer.',
    'Vi ska förstå vad som gick fel. Sen går vi vidare.',
  ],
  sharp: [
    'Vi gjorde fel saker i fel stunder. Genomgång imorgon. Hela laget.',
    'Det räcker inte. Alla vet vad som ska ändras.',
    'Jag har sett det här förut. Vi fixar det på träningen.',
  ],
  jovial: [
    'Huvudet upp. Vi reser oss. Nästa omgång är vår — det lovar jag dig.',
    'Det händer. Vi tar dom nästa gång.',
    'Laget är bättre än resultatet. Hoppas de tror på det själva också.',
  ],
  grumpy: [
    'Jag sa ju det. Ska man lyssna får man svar. Nu är det som det är.',
    'Samma fel igen. Varför lär vi oss inte?',
    'Det här var väntat. Tyvärr.',
  ],
  philosophical: [
    'Alla gör förluster. Frågan är vad man gör dan efter.',
    'En match är en match. En säsong är något helt annat.',
    'Det där var inte oss. Vi hittar tillbaka.',
  ],
}

const HALFTIME_LEADING_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    'Vi leder. Håll linjerna och fortsätt jobba.',
    'Bra läge. Vi tar inga risker i onödan.',
    'En halvlek kvar. Fokus och disciplin.',
  ],
  sharp: [
    'Vi leder men det är inte vunnet än. Skärpning.',
    'Marginalen är inte stor nog för att slappna av. Fortsätt pressa.',
    'Bra halvlek. Håll tempot — de kommer att reagera.',
  ],
  jovial: [
    'Vi leder! Det är sådana lägen vi lever för!',
    'Bra jobbat så här långt — nu tar vi hela matchen!',
    'Fortsätt spela på det här sättet så tar det sig!',
  ],
  grumpy: [
    'Vi leder, men jag är inte nöjd med insatsen. Vi kan bättre.',
    'Ledning är bra. Slarvet i försvaret är inte bra.',
    'En halvlek är inte en match. Håll dig på tårna.',
  ],
  philosophical: [
    'Ledning i halvtid är ett löfte, inte ett resultat.',
    'Vi är på rätt väg. Fortsätt vara det.',
    'Halvtid är bara ett ögonblick i en längre berättelse.',
  ],
}

const HALFTIME_TRAILING_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    'Vi har en halvlek på oss. Låt oss använda den.',
    'Det går att vända. Vi vet vad vi behöver göra.',
    'Behåll lugnet. En halvlek bandyspel kan ändra allt.',
  ],
  sharp: [
    'Det är inte OK. Vad händer på vänsterkanten? Vi löser det nu.',
    'Ni har 45 minuter på er att bevisa vad ni kan.',
    'Vi pressar annorlunda i andra halvlek. Alla vet vad som gäller.',
  ],
  jovial: [
    'Det är bandyn — ingenting är avgjort förrän det är avgjort!',
    'Vi har vänt sämre lägen. Laget tror på det — det märks.',
    'En halvlek kvar. Allt är möjligt. Nu kör vi!',
  ],
  grumpy: [
    'Det är skamligt. Jag förväntar mig mer.',
    'Vi diskuterade det här i veckan. Det borde inte hända.',
    'Ni är bättre än det här. Bevis det i andra halvlek.',
  ],
  philosophical: [
    'Underläge är inte slutet — det är en inbjudan att höja sig.',
    'Motgång är en lärare. Låt oss lyssna.',
    'Vi är bakom. Det är ett faktum. Vad vi gör med det — det är frågan.',
  ],
}

const TACTIC_BOLD_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    'En tydlig förändring. Laget behöver anpassa sig snabbt.',
    'Stor förflyttning. Vi ser om det ger utdelning.',
    'Modigt val. Det kräver fokus av alla.',
  ],
  sharp: [
    'Det är ett risktagande. Men ibland är det nödvändigt.',
    'Drastisk förändring. Laget vet vad som gäller.',
    'Det är ett grepp. Nu gäller det att genomföra det.',
  ],
  jovial: [
    'Djärvt! Det är precis vad matchen behöver!',
    'Nu händer det något! Det är det här det handlar om!',
    'Jag gillar att vi vågar! Laget litar på varandra.',
  ],
  grumpy: [
    'Chansen att det går fel är stor. Men vi saknar alternativ.',
    'En stor omställning mitt i match. Det borde inte behövas.',
    'Det är ett risktagande jag helst sluppit.',
  ],
  philosophical: [
    'I bandyn, som i livet, ibland måste man bryta mönstret.',
    'En stor förändring. Det kräver mod — av spelarna och av oss.',
    'Taktik är en hypotes. Nu testar vi den.',
  ],
}

const TACTIC_MINOR_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    'En liten justering. Det borde räcka.',
    'Vi finjusterar. Håller strukturen.',
    'Liten förändring — stor effekt, förhoppningsvis.',
  ],
  sharp: [
    'Rätt justering vid rätt tillfälle.',
    'Detaljarbete. Det är i detaljerna det avgörs.',
    'Exakt det vi behövde förändra.',
  ],
  jovial: [
    'Liten tweak, stor skillnad — det är min förhoppning!',
    'Finjusteringar. Vi håller formen och pressar på.',
    'Smarta justeringar. Laget är varm på det här.',
  ],
  grumpy: [
    'Det borde ha gjorts tidigare. Men bättre sent än aldrig.',
    'En justering som borde ha kommit i halvtid.',
    'Rätt drag. Tråkigt att vi behövde vänta så länge.',
  ],
  philosophical: [
    'Ibland är det de små förändringarna som avgör.',
    'En subtil förändring. Det handlar om att läsa spelet rätt.',
    'Det lilla steget kan leda till det stora.',
  ],
}

const WEEKLY_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    'Jag tycker vi ska prata om det här.',
    'En fråga att ta ställning till. Vad tänker du?',
    'Det finns ett beslut att fatta. Du bör veta om det.',
  ],
  sharp: [
    'Det här kräver ett svar. Snabbt.',
    'Vi måste ta ett beslut om det här. Det påverkar laget.',
    'Jag vill ha ett klart svar på det här.',
  ],
  jovial: [
    'Hej hej! En sak vi borde diskutera.',
    'Du! Jag behöver din input på något.',
    'Liten sak, men viktigt. Vad tycker du?',
  ],
  grumpy: [
    'Det finns ett problem vi ignorerat för länge.',
    'Jag säger detta bara en gång till: det här behöver åtgärdas.',
    'Det var väntat. Nu behöver vi ta tag i det.',
  ],
  philosophical: [
    'Ibland är det de vardagliga besluten som formar en säsong.',
    'En fråga utan enkelt svar. Men den måste ställas.',
    'Det finns ett val att göra. Alla val har konsekvenser.',
  ],
}

const SEASON_SUMMARY_OVER_EXPECTATION: Record<CoachPersonality, string[]> = {
  calm: [
    'Vi överträffade målen. Det är ett bevis på lagets arbete.',
    'Bättre än förväntat. Vi tar med oss det till nästa säsong.',
    'Ett bra år. Laget levde upp till och förbi förväntningarna.',
  ],
  sharp: [
    'Vi levererade mer än vad som krävdes. Nu höjer vi ribban.',
    'Bra säsong. Men framgång är inget vi vilar på.',
    'Bättre än målet. Det är bra, men inte skäl att slappna av.',
  ],
  jovial: [
    'Vi slog alla förväntningar! Det är ett underbart lag!',
    'Fantastisk säsong! Laget visade vad det går för!',
    'Bättre än förväntat — och vi förväntar oss ännu mer nästa år!',
  ],
  grumpy: [
    'Vi klarade mer än vad jag hoppats på. Det är mer än jag vågade tro.',
    'Bättre än förväntat. Det händer. Men nu sätter vi upp högre mål.',
    'Det gick bra. Jag håller inte på att fira för tidigt.',
  ],
  philosophical: [
    'Att överstiga förväntningar säger mer om ambition än om tur.',
    'Vi höjde oss. Det är vad en säsong bör ge.',
    'Resultatet är ett bevis. Nu vet vi vad det är möjligt.',
  ],
}

const SEASON_SUMMARY_UNDER_EXPECTATION: Record<CoachPersonality, string[]> = {
  calm: [
    'Vi nådde inte målet. Vi tittar på vad vi kan förbättra.',
    'En tuff säsong. Men vi drar lärdom av den.',
    'Under förväntan. Det är inte nöjsamt, men vi vet vad vi behöver göra.',
  ],
  sharp: [
    'Vi underpresterarde. Det är oacceptabelt och vi vet det alla.',
    'Under målet. Det är oroande. Vi behöver göra förändringar.',
    'Inte bra nog. Det måste vi ta med oss in i nästa förberedelse.',
  ],
  jovial: [
    'Det blev inte som vi hoppades. Men vi reser oss — det vet jag!',
    'En besvikelse, men vi är ett lag och vi går igenom det tillsammans.',
    'Under förväntningar den här gången. Nästa säsong tar vi igen det!',
  ],
  grumpy: [
    'Det var väl ungefär som väntat. Men det gör det inte bättre.',
    'Under målet. Det är inte ett misstag — det är ett systemfel.',
    'Jag är inte nöjd. Det vet alla. Nu jobbar vi.',
  ],
  philosophical: [
    'Misslyckanden är en del av resan. Frågan är vad vi gör av dem.',
    'Under förväntan. Det är ett faktum vi måste förhålla oss till ärligt.',
    'En säsong som inte gick som planerat lär oss mer än en framgångssäsong.',
  ],
}

const PRESS_WIN_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    'Vi är nöjda med insatsen. Nu fokuserar vi på nästa match.',
    'Tre poäng. Det är vad vi kom hit för.',
    'Bra prestations av laget. Vi fortsätter arbeta.',
  ],
  sharp: [
    'Vi levererade det vi förberett oss för. Bra genomfört.',
    'Seger. Nu förbereder vi nästa uppgift.',
    'Jobbet gjort. Det är allt som behöver sägas.',
  ],
  jovial: [
    'Fantastisk insats! Laget spelade med hjärtat idag!',
    'Vi är jättenöjda! Det här är vad vi tränar för!',
    'Tre poäng och god stämning — det är bandyn vi älskar!',
  ],
  grumpy: [
    'Vi vann. Det är vad vi ska göra. Inga stora ord om det.',
    'Seger. Men pressen kan vänta på ett mer imponerande resultat.',
    'Tre poäng. Vi tar dom och går vidare.',
  ],
  philosophical: [
    'Segern är ett bevis på något djupare — lagets tillit till varandra.',
    'Resultatet speglar arbetet bakom scen. Det är glädjande.',
    'En seger välförtjänt av ett lag som förstår sitt syfte.',
  ],
}

const PRESS_LOSS_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    'Vi är besvikna. Vi tittar på vad vi kan göra bättre.',
    'Förlust. Vi lär oss av den och går vidare.',
    'Det var inte vår bästa dag. Det accepterar vi och jobbar på.',
  ],
  sharp: [
    'Otillräckligt. Vi vet det. Vi åtgärdar det.',
    'Vi förlorade för att vi inte genomförde planen. Det är allt.',
    'Det finns inga ursäkter. Vi arbetar hårdare.',
  ],
  jovial: [
    'Det gick inte vår väg idag, men laget kämpade.',
    'Vi tappar inte hoppet. Det är bandyn — det vänder!',
    'En tuff dag, men vi ger oss inte.',
  ],
  grumpy: [
    'Det är ett misslyckande. Jag gillar inte att förlora.',
    'Ingenting gick som planerat. Det är dystert.',
    'Förlust. Det är oacceptabelt på lång sikt.',
  ],
  philosophical: [
    'Förluster är en del av resan. Frågan är vad vi gör härnäst.',
    'En förlust berättar något om oss. Vi lyssnar.',
    'Ibland förlorar man. Det viktigaste är att förstå varför.',
  ],
}

// Background tillägg (30–40% chans)
const BACKGROUND_ADDONS: Record<CoachBackground, string[]> = {
  'former-player': [
    ' Jag spelade såna matcher själv.',
    ' Som spelare kände man det i kroppen.',
    ' Det här påminner mig om min aktiva tid.',
  ],
  'academy-coach': [
    ' Spelarna utvecklas genom sånt här.',
    ' Det är i motgång man bygger karaktär.',
    ' Ungdomscoachen i mig ser potential här.',
  ],
  'tactician': [
    ' Statistiskt hade vi övertaget.',
    ' Taktiskt finns det saker att analysera.',
    ' Siffrorna berättar en historia.',
  ],
  'veteran': [
    ' Tillbaka på 80-talet...',
    ' Jag har sett det här förut, på gott och ont.',
    ' Erfarenheten säger att det ordnar sig.',
  ],
}

function pickQuote(quotes: string[], seed: number): string {
  return quotes[Math.abs(seed) % quotes.length]
}

function maybeAddBackground(coach: AssistantCoach, base: string, seed: number): string {
  // 35% chans
  if (Math.abs(seed * 7) % 100 > 35) return base
  const addons = BACKGROUND_ADDONS[coach.background]
  return base + addons[Math.abs(seed * 13) % addons.length]
}

/**
 * Returnerar ett citat från assistenttränaren baserat på kontext och personlighet.
 */
export function generateCoachQuote(coach: AssistantCoach, context: QuoteContext, seed = Date.now()): string {
  const p = coach.personality
  let quotes: string[]

  switch (context.type) {
    case 'match-result':
      quotes = context.result === 'win' ? WIN_QUOTES[p]
        : context.result === 'draw' ? DRAW_QUOTES[p]
        : LOSS_QUOTES[p]
      break
    case 'halftime':
      quotes = context.leading ? HALFTIME_LEADING_QUOTES[p] : HALFTIME_TRAILING_QUOTES[p]
      break
    case 'tactic-change':
      quotes = context.bold ? TACTIC_BOLD_QUOTES[p] : TACTIC_MINOR_QUOTES[p]
      break
    case 'weekly-decision':
      quotes = WEEKLY_QUOTES[p]
      break
    case 'season-summary':
      quotes = context.finalPosition <= context.expectation
        ? SEASON_SUMMARY_OVER_EXPECTATION[p]
        : SEASON_SUMMARY_UNDER_EXPECTATION[p]
      break
    case 'press-conference':
      quotes = context.result === 'win' ? PRESS_WIN_QUOTES[p] : PRESS_LOSS_QUOTES[p]
      break
  }

  const base = pickQuote(quotes, seed)
  return maybeAddBackground(coach, base, seed)
}

// ── Use case helpers (2–6) — ej wired i UI än ─────────────────

/** Use case 2: Halvtidskommentar */
export function getHalftimeCoachComment(
  coach: AssistantCoach,
  homeScore: number,
  awayScore: number,
  isHome: boolean,
): string {
  const leading = isHome ? homeScore > awayScore : awayScore > homeScore
  const margin = Math.abs(homeScore - awayScore)
  return generateCoachQuote(coach, { type: 'halftime', leading, margin })
}

/** Use case 3: Taktikval-feedback mid-match */
export function getTacticChangeFeedback(
  coach: AssistantCoach,
  wasBoldChange: boolean,
): string {
  return generateCoachQuote(coach, { type: 'tactic-change', bold: wasBoldChange })
}

/** Use case 4: 30% chans att assistenten formulerar veckans beslut */
export function framesWeeklyDecision(coach: AssistantCoach): boolean {
  const h = simpleHash(coach.name)
  return (h % 10) < 3
}

/** Use case 5: Säsongssammanfattning-reflektion */
export function getSeasonSummaryReflection(
  coach: AssistantCoach,
  finalPosition: number,
  expectation: number,
): string {
  return generateCoachQuote(coach, { type: 'season-summary', finalPosition, expectation })
}

/** Use case 6: 40% chans att assistenten tar presskonferensen vid förlust */
export function canSubstituteAtPressConference(coach: AssistantCoach): boolean {
  const h = simpleHash(coach.name + coach.personality)
  return (h % 10) < 4
}
