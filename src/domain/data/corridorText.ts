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

/**
 * D2 — Finaldagens kommentar (TEXTLEVERANS §D5, 2026-09-20 — ersätter hela den
 * tidigare poolen). `{Vinnare}`, `{Förlorare}`. INGEN `{Resultat}`: poolen
 * skrevs ursprungligen för slutspelsrundor i gång ("vidare", "ute"), men visas
 * numera bara på Finaldagen, om FINALEN — och finalens målsiffror finns inte i
 * en utslagen klubbs save. SM-finalen spelas dessutom som EN match, så
 * seriesiffran (1–0) hade lästs som ett riktigt matchresultat i stället för
 * matcher vunna.
 *
 * `CORRIDOR_OTHERS_FINAL` är borttagen — dess enda rad ("Vi såg det från
 * soffan...") lever vidare som den första neutrala raden nedan.
 */
export const CORRIDOR_OTHERS_NEUTRAL = [
  'Vi såg det från soffan, som alla andra. {Vinnare} såg ut som ett lag som visste att det skulle vinna redan i uppvärmningen.',
  '{Förlorare} hade chanserna. {Vinnare} hade målvakten. Så är det oftast i finaler.',
  'Halva kafferummet höll på {Förlorare}, för att de inte är {Vinnare}. Det hjälpte inte.',
  'Studenternas var fullt. Ingen därifrån var här. Det är så det ska vara ett år som det här.',
] as const

/** Rivalen eller Nemesis-klubben vann guldet. */
export const CORRIDOR_OTHERS_RIVAL_ALIVE = [
  '{Vinnare} är svenska mästare. Vi slog dem i höstas. Ingen nämner det, för det gör saken värre.',
  'Sture sa ingenting på Konsum. Han log bara, och det var värre än om han hade sagt något.',
  'Klacken har bestämt sig för att det var domarens fel. Det var det inte. {Vinnare} var bäst i mars, och vi var inte där.',
] as const

/** Rivalen eller Nemesis-klubben förlorade finalen. */
export const CORRIDOR_OTHERS_RIVAL_OUT = [
  '{Förlorare} tog silver. Det var första gången på länge som någon här hejade på {Vinnare}, och det kändes fel hela vägen.',
  'Silver till {Förlorare}. I kafferummet var man överens om att det var rätt, på ett sätt ingen ville förklara.',
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
