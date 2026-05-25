# SVAR TILL DESIGN — Portal-kurering godkänd, en sista fälla att stänga

**Från:** Opus (efter Jacobs genomläsning)
**Datum:** 2026-05-23
**Svarar på:** `HANDOFF-PORTAL-KURERING-SVAR-2026-05-23.md` + mock `2026-05-23_design_portal_kurering.html`

## Godkänt

Ramen hölls — inga nya kort, inga nya händelsetyper, ingen ny komponent, mappning
mot befintliga ytor. Det var den största risken med spåret och ni undvek den.

Tre saker är klart bättre än vad frågan bad om:
- **Story-slot (Q2b) med komplement-sänkning** är bättre än antingen-eller. En
  garanterad berättelseplats PLUS att funktionella kort (board_objectives 87→65,
  tabell, ekonomi) inte längre dominerar — utan att de försvinner. Funktion och
  berättelse samsas, vilket var hela poängen.
- **Round-character** återanvänder C-SD1-mönstret och hålls som rent
  vikt-instrument. "Spelaren märker att portalen är annorlunda utan att veta
  varför" — understatement på arkitekturnivå. Rätt.
- **Stripe-tonaliteten** ärver score-systemets färgspråk konsekvent.

De tre öppna Q (Q1a/Q2a/Q3a): vi godtar era förslag rakt av. Secondary kvar på 3,
recency 2 omg, dela `after_streak` i `winning_streak`/`losing_streak` för
precision.

## Den enda fällan kvar — story-sloten begraver det tysta

Mocken visar det LÄTTA fallet. Alla tre spalter har en självklar slot-vinnare
(en stark milstolpe sig 85, en nemesis) i en vecka utan konkurrens. Den visar
aldrig veckan då en milstolpe OCH ett stort resultat OCH en scandal triggar
samtidigt. Det är just den veckan problemet finns.

Vikterna avslöjar det: `bigResult` 90, `scandal` 88, men `playerMilestone` 60
(secondary) / 85 (om sig ≥ 80). Story-sloten plockar topp-1 på vikt. Alltså:
en VANLIG milstolpe (sig under 80 — en debut, en hattrick, Kevin Lunds
karriärsmilstolpe från Jacobs playtest) får vikt 60 och **förlorar sloten mot
nästan varje stort resultat**. Det tysta begravs av det bullriga — samma problem
vi startade med, flyttat en nivå in i sloten.

## Åtgärd — kombinera era två implicita mekanismer (Jacobs förslag)

Bygg BÅDA, för de löser olika axlar:

**1. Milstolpe-golv (sällsynthet i stunden).** En `playerMilestone` får en
tillfällig vikt-boost den omgång den inträffar, så den vinner story-sloten den
enda vecka den finns — även mot ett `bigResult`. Skälet: ett stort resultat
kommer igen nästa vecka; Lindqvists 100:e mål kommer aldrig igen. Sällsynt +
personligt = värt sloten just för att det är tyst.

**2. Typ-rotation (variation över tid).** Story-sloten minns vilken typ den
visade senast och nedviktar SAMMA typ nästa omgång, så en serie stora resultat
inte tar sloten flera veckor i rad. Ger löpande variation.

### Ordningsregel — KRITISK, annars krockar de

De två reglerna kan krocka (milstolpe veckan efter en milstolpe: golvet vill
lyfta, rotationen vill nedvikta). Lös så här:

- **Rotation gäller bara FREKVENTA typer:** `bigResult`, `scandal`, `journalistHot`.
- **Golv gäller bara SÄLLSYNTA tysta typer:** `playerMilestone`, `mecenat`,
  `nemesis`.
- **Golv slår rotation.** Om två sällsynta händelser råkar inträffa två veckor i
  rad är det i sig så ovanligt att båda förtjänar sloten.

Då verkar de på olika typ-mängder och krockar aldrig: rotation tämjer det
bullriga, golv skyddar det tysta. En milstolpe syns alltid den vecka den händer;
stora resultat får aldrig monopol över tid.

## Vad vi INTE ber om
- Inte ny mock. Detta är en vikt-/ordningsregel, beskrivbar i text.
- Inte fler typer. De sju räcker.
- Bara: lägg golv + rotation + ordningsregeln i `inboxToPortal.ts`-specen, så
  Code bygger det med fällan stängd istället för inbyggd.

## VERIFIERAT MOT KODEN — sex av sju typnamn matchar INTE enumet

Opus läste `src/domain/enums/index.ts`. Av de sju typnamnen i Q1 matchar bara
ETT (`scandal`) ett faktiskt `InboxItemType`-värde. De övriga sex är antingen
fel namn eller saknas helt. **Q1-mappningen är inte byggbar som den står** — om
Code skrev `case 'nemesis':` skulle den grenen aldrig träffa och inget lyftas.
Spåret skulle se klart ut i koden och göra ingenting i spelet.

### Facit

| Designs namn | Status | Faktiskt enum-värde |
|---|---|---|
| `scandal` | ✅ FINNS | `Scandal` |
| `derbyRamning` | 🔁 FEL NAMN | `Derby` |
| `journalistHot` | 🔁 FEL NAMN | `Media` / `MediaEvent` |
| `mecenat` | 🔁 FEL NAMN | `PatronInfluence` |
| `bigResult` | 🔁 HÄRLEDS | `MatchResult` + målmarginal-check (≥4) — ingen egen typ |
| `playerMilestone` | ❓ SAKNAS som spelartyp | finns `ReputationMilestone` (KLUBB-rykte) + `PlayerDevelopment` + `Retirement` — men ingen "spelarens 100:e mål" |
| `nemesis` | ❌ SAKNAS HELT | ingen motsvarighet i enumet |

### Två skilda problem — olika hantering

**Fyra är bara fel namn** (`derbyRamning`, `journalistHot`, `mecenat`,
`bigResult`). Avsikten är klar, bara etiketten fel. Code mappar mot rätt
enum-värde — ren översättning, inget beslut behövs. (För `bigResult`: filtrera
`MatchResult` på målmarginal ≥4 eller motståndare = rival.)

**Två saknas och kräver BESLUT (Design/Jacob, inte Code):**
- `nemesis` genereras inte som inbox-item idag. Finns datan i en nemesis-tjänst
  eller `narrativeLog` som kan kopplas? Eller finns händelsen inte alls? Om den
  inte finns kan den inte lyftas — det finns inget att lyfta. Stryk från
  mappningen tills nemesis-händelsen faktiskt genereras, eller speca att den ska
  byggas först.
- `playerMilestone` finns inte som spelartyp. `ReputationMilestone` är KLUBBENS
  rykte, inte en spelares 100:e mål. **Detta är allvarligt för story-sloten:**
  vi byggde hela golv-regeln (ovan) runt `playerMilestone`. Om den typen inte
  genereras skyddar golvet en händelse som inte finns. Måste redas ut: under
  vilket namn skapas en spelarmilstolpe (Kevin Lund-typen från Jacobs playtest)?
  `PlayerDevelopment`? En ny typ? Tills det är klart är golv-regeln teoretisk.

### Slutsats
Översätt de fyra. Besluta om de två (koppla befintlig data, bygg ny typ, eller
stryk ur mappningen). Golv-regeln för `playerMilestone` förutsätter att
spelarmilstolpar faktiskt genereras — verifiera det innan golvet specas till Code.

— Opus, 2026-05-23
