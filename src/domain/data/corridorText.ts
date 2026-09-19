/**
 * corridorText.ts — TEXTLEVERANS §D, korridoren omgång 28–36.
 *
 * VARFÖR: mätt över 28 säsonger ger omgång 28–36 bara 9–43 ord per omgång, och
 * 16 % av alla omgångar har noll nya texter — nästan alla ligger här. En klubb
 * som åkt ut ur både slutspel och cup får ingenting alls utom de mekaniska
 * posterna som §5.1 och §5.2 just tagit bort. Korridoren blev alltså TYSTARE av
 * det passet, inte mindre tyst.
 *
 * Jacobs beslut (TILLÄGG 4): alternativ 2 — fyll med det spelet redan vet.
 * Inte korta bort omgångarna, fast det vore minst bygge: de nio omgångarna är
 * den enda tiden på säsongen då spelet kan prata om NÄSTA säsong innan sommaren
 * tvingar besluten, och de elva andra klubbarnas slutspel är den enda gången
 * spelaren ser ligan som en värld och inte som en tabell.
 *
 * Alla rader är Fables (TEXTLEVERANS §D), kopierade ordagrant. Code skriver
 * ingen svensk speltext.
 */

/** D1 — kontraktsprat, omgång 28–30. `{Namn}`, `{Antal}`. */
export const CORRIDOR_CONTRACT_LINES = [
  '{Namn} har frågat om sommaren två gånger nu. Han frågar inte en tredje.',
  '{Antal} kontrakt går ut i vår. Jag har inte sagt något till dem. Du får bestämma vad jag ska säga.',
  '{Namn} har börjat träna som en som vill visa något. Det brukar betyda en av två saker.',
  'Det ringde från en annan klubb och frågade om {Namn}. Jag sa att jag inte visste. Det var sant.',
  '{Namn} sitter kvar längst i omklädningsrummet nu för tiden. Han väntar på att någon ska säga något om nästa år.',
] as const

/** D2 — andras slutspel. `{Vinnare}`, `{Förlorare}`, `{Resultat}`. */
export const CORRIDOR_OTHERS_NEUTRAL = [
  '{Vinnare} slog {Förlorare} med {Resultat}. Halva bygden såg det på telefonen i kafferummet.',
  '{Vinnare} vidare. {Förlorare} åker hem samma buss som vi gjorde för tre veckor sedan.',
  '{Resultat} till {Vinnare}. Det var en match vi hade velat vara med i.',
  '{Förlorare} ute. Deras tränare sa i tidningen att säsongen var bra ändå. Man känner igen tonen.',
] as const

export const CORRIDOR_OTHERS_RIVAL_ALIVE = [
  '{Vinnare} vidare igen. De vi slog i höstas spelar i mars. Det svider mer än det borde.',
  '{Vinnare} vann. Klacken har bestämt sig för att hålla på {Förlorare} nästa gång.',
] as const

export const CORRIDOR_OTHERS_RIVAL_OUT = [
  '{Förlorare} åkte ut. Sture sa ingenting på Konsum. Han log bara.',
  '{Resultat}. {Förlorare} är ute. Det var första gången på länge som någon här hejade på {Vinnare}.',
] as const

export const CORRIDOR_OTHERS_FINAL = [
  '{Vinnare} är svenska mästare. På Studenternas. Vi såg det från soffan, som alla andra.',
] as const

/** D3 — sommaren skymtar, omgång 31–34. Ett ämne per omgång i den här ordningen. */
export const CORRIDOR_SUMMER_ACADEMY = [
  'P19 slutade {V} vinster och {F} förluster. {Namn} har frågat när han får träna med oss. Snart, sa jag.',
  'Ungdomstränaren vill prata om {Namn}. Han säger att pojken är klar. Det säger han varje vår, men den här gången tittade han inte bort när han sa det.',
] as const

export const CORRIDOR_SUMMER_RETIREMENT = [
  '{Namn} ({Ålder}) tog av sig skridskorna långsammare än vanligt efter träningen. Ingen sa något. Han sa inget heller.',
  '{Namn} har börjat prata om isen som något som varit. Det brukar komma ett samtal efter sådana vårar.',
] as const

export const CORRIDOR_SUMMER_SPONSOR = [
  '{Sponsor} har inte hört av sig om nästa år. Det betyder oftast att de tänker, inte att de tänker sluta.',
  'Avtalet med {Sponsor} går ut i sommar. De var med när det var tunnare. Någon borde ringa dem innan de ringer oss.',
] as const

export const CORRIDOR_SUMMER_ECONOMY = [
  'Kassören lämnade en lapp på skrivbordet. Inga siffror på den, bara "vi behöver prata före sommaren".',
] as const

/** D4 — bygden, omgång 35–36. Varianter efter mood respektive communityStanding. */
export const CORRIDOR_KLACK_HIGH = [
  '{Klackledare} hade samlat gänget på klubbhuset. Inte för att fira något. Bara för att säsongen skulle ha ett slut som inte var en förlust.',
] as const
export const CORRIDOR_KLACK_MID = [
  '{Klackledare} säger att de kommer tillbaka i höst. Han säger det som om det var en fråga.',
] as const
export const CORRIDOR_KLACK_LOW = [
  'Klacken har inte sjungit sedan {Månad}. {Klackledare} säger att sångerna finns kvar. Det är laget de saknar.',
] as const

export const CORRIDOR_PAPER_HIGH = [
  '{Tidning} skrev en helsida om säsongen. Ingen av rubrikerna handlade om tabellen. Det var meningen.',
] as const
export const CORRIDOR_PAPER_MID = [
  '{Tidning} sammanfattade säsongen på en kvartssida. Rättvist, ungefär.',
] as const
export const CORRIDOR_PAPER_LOW = [
  '{Tidning} skrev om säsongen under sporten, längst ned. Kommunalrådet citerades inte. Det säger sitt.',
] as const

/**
 * D4:s femte nivå (TILLÄGG 4): volontärvardagen. Raderna är återhämtade ur
 * DOM_DÖDA_TEXTPOOLER pool 8 i stället för att arkiveras — de är rätt register
 * för just den här omgången, och villkoret finns redan i
 * `communityActivitiesSince` (en aktiv kiosk eller ett loppis).
 *
 * `{name}`/`{name2}` är volontärnamn, samma variabler som originalpoolen bar.
 */
export const CORRIDOR_VOLUNTEER_KIOSK = [
  '{name} tackas för insatsen i kiosken.',
  '{name} fick slut på senap redan i halvtid.',
  '{name} sålde rekordmånga varmkorvar trots kylan.',
  'Kaffet tog slut i pausen. {name} sprang till Ica.',
  '{name} rapporterar att bullar var mer populärt än korv idag.',
  '{name} hade glömt nycklarna — men {name2} räddade situationen.',
] as const
