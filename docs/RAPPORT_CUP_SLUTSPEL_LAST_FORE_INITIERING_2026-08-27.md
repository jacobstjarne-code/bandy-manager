# Rapport: har cup/slutspel samma sorts osanning som tabellen? — rapport, inget byggt

2026-08-27. Tre frågor, ingen kod ändrad.

## 1. Fält som fylls av spelade matcher men kan läsas innan de spelats

| Fält | Typ | Fylls av |
|---|---|---|
| `PlayoffSeries.homeWins`/`awayWins` | `number` | matcher spelade i serien |
| `PlayoffSeries.winnerId`/`loserId` | `string \| null` | seriens avgörande |
| `PlayoffBracket.champion` | `string \| null` | SM-finalen |
| `PlayoffBracket` (hela objektet) | `null` förutom under slutspelet | säsongens gång till matchday 27+ |
| `CupMatch.winnerId` | `string \| undefined` | cupmatchen |
| `CupBracket.winnerId`/`completed` | `string \| undefined` / `boolean` | cupfinalen |

Alla dessa KAN läsas innan de fyllts — precis som `standing.position` kunde.

## 2. Vad returnerar de innan något spelats — och är det farligt?

**Skillnaden mot tabellen, verifierad kodläst, inte antagen:** `calculateStandings()`s tie-break producerar ALLTID ett heltal 1-12 för varje klubb, oavsett om datan bakom det betyder något — sorteringsalgoritmen vet inte "meningslöst", den ger bara ett självsäkert utseende tal. Cup/slutspel-strukturerna gör INTE detta:

- **`PlayoffBracket`** är `null` vid spelskapande (`createNewGame.ts:348`) — inte ett tomt-men-giltigt-utseende objekt. Kod som kollar `if (bracket)` före vidare läsning ser en ärlig frånvaro, inte en gissning.
- **`winnerId`/`loserId`** initieras till `null` explicit (`playoffService.ts:21-23` m.fl.) — aldrig ett gissat klubb-id.
- **`homeWins`/`awayWins`** initieras till `0`/`0`. Till skillnad från tabellplacering är 0-0 ENTYDIGT: en slutspelsserie kan inte ha oavgjorda matcher (varje match har en vinnare), så 0-0 betyder bara en sak — "ingen match i serien avgjord än". Ingen tvetydighet med ett "riktigt" 0-0-läge att förväxlas med.
- **`CupMatch.winnerId`** är explicit `optional` (`string | undefined`) — genuint frånvarande innan matchen spelats, inte defaultat till något.
- **`getPlayoffSeriesContext()`** (portal-kortens viktnings-/kritikalitetslogik) räknar dessutom om `wins`/`losses` FRÄSCHT från `fixtures.filter(f => f.status==='completed')` varje gång — litar INTE på de lagrade räknarna. En helt ny, 0-0 serie ger `criticality:'open'`, det korrekta, ärliga läget — inte en gissning.

**Slutsats: strukturellt är cup/slutspel SÄKRARE än tabellen var.** Mekanismen som gjorde tabellen farlig (en sortering som alltid producerar en säkert-utseende rang, oavsett om den betyder något) finns inte här — det finns ingen "sortera klubbar efter cup-framgång och ge dem en placering 1-12"-operation någonstans i cupkoden.

**Ett fynd, lägre allvarlighetsgrad — en TONFRÅGA, inte ett FABRICERAT VÄRDE:** `situationService.ts`s "Slutspel pågår"-gren (rad ~108-127) genererar text för en serie som INTE spelat en enda match än: vid `ourWins===theirWins` (vilket är sant vid 0-0, dvs. före första matchen) blir texten `"0–0. Allt kan hända härifrån."` — grammatiskt sant, men "härifrån" antyder att något redan hänt. Ingen påhittad siffra, bara en ton som passar bättre efter en delad serie än före en obörjad. Lägre prioritet, en textjustering om den ska åtgärdas, inte en mekanisk bugg.

**Redan känt, inte del av detta fynd:** `cupProcessor.ts:49` (cupbye-textens "Baserat på er ranking") är INTE ett cup-strukturfel — det är standings-läst-före-initiering-buggen (redan dokumenterad, medvetet kvarlämnad) som råkar triggas INIFRÅN cup-kod. Skild orsak, redan spårad.

## 3. Behöver detta en egen grind, eller täcker standingPositionReadGate det?

**Varken eller — ingen ny grind motiverad just nu.** `standingPositionReadGate` är byggd specifikt mot mönstret "en sortering ger alltid ett självsäkert-utseende tal" — cup/slutspel har inte den mekanismen, så att UTÖKA den grinden till cupBracket/playoffBracket-fält skulle inte skydda mot något verkligt (inget fabricerat värde att fånga). En NY, egen grind hade varit motiverad om jag hittat ett upprepat mönster av farliga läsningar (som de sex+en instanserna för standings) — jag hittade EN tonfråga, inte ett mönster.

**Rekommendation:** ingen grind. Om `situationService.ts`s "0–0. Allt kan hända härifrån."-text ska skärpas, är det en Opus-textfråga (samma disciplin som fallbackkortet), inte en Code-mekanik. Inte prioriterat av mig — din bedömning om det är värt en rad.
