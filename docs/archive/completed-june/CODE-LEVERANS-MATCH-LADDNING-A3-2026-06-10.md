# CODE-LEVERANS — A3 Match-laddning (pre-match-beat)

**Datum:** 2026-06-10
**Källa:** `design-system/briefs/DESIGN-BRIEF-MATCH-LADDNING-2026-06-07.md` (läs HELA först, särskilt §9 — besluten ovanpå mocken). Mock: `docs/mockups/2026-06-07_design_match_laddning.html`.
**Status i dag:** textpoolen `src/domain/data/matchLaddningText.ts` finns (Opus). Mock + §9-beslut låsta. **Beaten är inte byggd och inte wirad** — förmatch-flödet i `MatchScreen.tsx` går rakt `lineup → tactic → start` utan laddning. Det här bygger den.

## Vad
En pre-match-beat — ögonblicket mellan "Spela omgång X" och uppställningen — för de FÅ matcher som förtjänar laddning. Princip: **ladda → handla → kvittera.** Reserv-princip: en laddning på *varje* match är ceremoni-inflation. Vanlig ligamatch går rakt in i uppställningen som i dag.

## Var
Före uppställningen, så tillfället ramar lagvalet. I `MatchScreen.tsx`: lägg en beat FÖRE `'lineup'`-steget — antingen ett nytt `'laddning'`-steg först i `matchStep`-kedjan, eller en gate som visar beaten och sen går till `'lineup'`. **Bara när matchen är grindad** (se nedan). Icke-grindad match → starta direkt på `'lineup'`, dagens beteende, ingen beat. Skippbar.

## Grind — vilka matcher får beat (§2 + §9)
Bygg INGEN ny "stor match"-klassificering. Använd befintliga signaler: `getRoundCharacter(game)` (`src/domain/data/roundCharacter.ts`, 7 värden), fixtur-flaggor `isCup`/`isAnnandagen`, `round === 'Final'`/playoff, kalender-nyårsflagga. **Verifiera först** att `getRoundCharacter` returnerar de värden briefen antar — spåra den, visa koden.

Axeln (låst i §9): **scen = tillfälle · band = tillstånd · bild = rikedomslager.**

| Tillfälle | Tier | Beat? |
|---|---|---|
| Annandagen, derby, cup-dag, premiär, final, nyår | **full scen** | Ja |
| Förlustsvit / vinstsvit (≥3) | **slimmat band** | Ja (lättare) |
| `post_loss` | — | **Nej** (för frekvent — hör till portal-tonen) |
| `standard` ligamatch | — | **Nej** — rakt till uppställning |

`seasonContextService` (relegationFight/topRace/midTable/firstSeason) styr INTE om beat blir, bara TEXTEN. **Mittfältsläge manufakturerar aldrig insats** (C-SD2 står) — derby utan tabellbetydelse är fortfarande derby, men texten lovar ingen avgörande kväll som inte finns.

## Tiers
- **Full scen:** `<IllustrationScene>` (inbyggd scrim, DB-8-sanktionerad) när bild finns → fullbleed; saknas → placeholder-scen (mocken visar placeholder-läget i derby-spalten). Bild-status: `annandagen.jpg`/`final.jpg` filade; `derby.jpg`/`nyarsbandy.jpg` beställda (= placeholder tills de landar); premiär/cup = ingen bild → placeholder-scen, MEN fortfarande full scen, inte band. **Verifiera vilka assets som faktiskt ligger i repot** och fall tillbaka på placeholder för de som saknas.
- **Slimmat band:** sviter, ingen bild. Den lätta nivån.

## Slots (§4) — disciplinerat, ladda inte informera (Granska är för siffror)
- **Eyebrow** (tillfälle): DERBY · ANNANDAGEN · CUPEN · PREMIÄR · FINAL · TRE RAKA
- **Motståndare** + relation (grannfejd / fjolårets finalmotståndare / nykomling)
- **En laddningsrad** ur `matchLaddningText.ts` (tillfällets ton, inte analys)
- **Insats** BARA om `seasonContext` har den — annars utelämnas, ingen falsk spänning
- **Illustration** (full scen)

## §9 — KRITISKA bygg-korrigeringar (inte i mocken, i bygget)
1. **Eyebrow-färg ≠ guld.** `.eyebrow` default är `var(--gold)` — men guld är reserverat (DB-2: fullbordad seger + landslagsmerit + SM-final-portal). Default eyebrow → `--accent` (eller `--warm` för derby/band). **Guld ENDAST på final-laddningen** (`round === 'Final'`). Annars guld-creep.
2. **Scen-CTA ≠ `.btn--hero`.** Match-ingång sker för ofta för hjälte-knappen (R2-2 reserverar `.btn--hero` för säsongsslut/seger/cup-klimax). Använd **standard-primary-token + on-scale-radie (14 eller 8)**, inte mockens 12, inte hero.
3. **Svit-bandet = tillstånds-FÖRÄNDRINGS-markör**, inte engångs-beat, inte permanent kort. Inom samma rond: sitter kvar (backa+återvänd → finns kvar, det är rondens sanning). Över ronder: tänds på FÖRÄNDRING (sviten når ≥3 / fördjupas till milstolpe / bryts), tyst de ronder den bara fortsätter oförändrad. Återanvänd portalens anti-upprepning (`staleBias`/`lastShown`). Brottet är eget litet beat — laddningsraden "någonstans vänder det" får sin kvittering.

## INTE i scope / rör inte
- Textpoolen → Opus skriver `matchLaddningText.ts` direkt om slots kräver fler varianter efter wiring. **Spec:a aldrig text till Code.** Konsumera den befintliga poolen.
- Bygg ingen beat för icke-grindade matcher (utöver att de går rakt till uppställning).
- `post_loss` som beat → nej, avgjort.
- `currentMatchday`, `scheduleGenerator.ts`, matchmotorn — orörda.

## Acceptans
- Grindad match (annandagen/derby/cup/premiär/final/nyår) → full scen FÖRE uppställningen; svit → slimmat band; `standard`/`post_loss` → ingen beat, rakt till `'lineup'` (dagens beteende, verifiera oförändrat).
- Eyebrow `--accent`/`--warm`, guld bara på final. CTA standard-primary, ej hero.
- Bild finns → fullbleed scen; saknas → placeholder-scen (premiär/cup/derby tills assets landar).
- Svit-bandet följer förändrings-logiken, inte tapet.
- Laddningsrad hämtas ur `matchLaddningText.ts`. Insats-raden utelämnas när seasonContext saknar den.
- `npx tsc --noEmit` + alla tester gröna. Lägg test som låser grinden (standard → ingen beat; final → scen + guld-eyebrow; svit → band).

**Metod (granskningsregeln):** spåra hela förmatch-flödet i `MatchScreen.tsx` innan du lägger in steget. Visa var beaten sitter i render-ordningen och hur grinden kombinerar signalerna. Verifiera `getRoundCharacter` + `<IllustrationScene>` + asset-närvaro innan du bygger ovanpå dem — säg "renderar korrekt i kontext", inte "finns".

---

**Till Code (Sonnet, VS Code):**

Läs `docs/CODE-LEVERANS-MATCH-LADDNING-A3-2026-06-10.md` + `design-system/briefs/DESIGN-BRIEF-MATCH-LADDNING-2026-06-07.md` (HELA, särskilt §9) + mocken `docs/mockups/2026-06-07_design_match_laddning.html`.

Bygg A3-laddnings-beaten — pre-match-scenen mellan "Spela omgång X" och uppställningen, för de få matcher som förtjänar den.

1. **Verifiera först (visa kod):** `getRoundCharacter` (`roundCharacter.ts`) returvärden · `<IllustrationScene>` finns med scrim · vilka illustrations-assets som faktiskt ligger i repot.
2. **Wira in i `MatchScreen.tsx`** FÖRE `'lineup'`-steget. Grindad → beat; icke-grindad (`standard`/`post_loss`) → rakt till uppställning (dagens beteende, verifiera oförändrat).
3. **Grind:** scen = tillfälle (annandagen/derby/cup/premiär/final/nyår) · band = tillstånd (sviter ≥3) · bild = rikedomslager (finns → fullbleed, saknas → placeholder-scen). Bygg ingen ny "stor match"-klass — använd befintliga signaler.
4. **§9-korrigeringar (viktigast):** eyebrow `--accent`/`--warm`, **guld endast på final**. CTA **standard-primary + radie 14/8, inte `.btn--hero`**. Svit-band = förändrings-markör (≥3 / fördjupas / bryts), tyst när oförändrad, återanvänd `staleBias`/`lastShown`.
5. **Text:** konsumera `matchLaddningText.ts`. Skriv ingen text själv.

**Rör INTE:** textpoolen (Opus äger), `currentMatchday`, `scheduleGenerator.ts`, matchmotorn, `post_loss`-som-beat.

**Klart =** grindad scen/band före uppställning · icke-grindad orörd · §9-färg/CTA/svit korrekta · text ur poolen · tsc + alla tester gröna + grind-test.

**Rapportera: var beaten sitter i render-flödet, hur grinden kombinerar signalerna, vilka assets som fanns vs placeholder, och svit-logikens trösklar.**

---

## FÖRTYDLIGANDE (efter Opus-verifiering av roundCharacter.ts, 2026-06-10)

`getRoundCharacter` returnerar EN precedensordnad RoundCharacter (cup_day > pre_derby > premiere/streak/post_loss/standard) och **känner INTE till annandagen, nyår eller final** — de signalerna finns på fixturen/ronden, inte i funktionen.

**Precedens-fälla (löser §9-guldregeln):** en final som också är ett derby ger `getRoundCharacter === 'pre_derby'`. Routar du scen-tier eller guld-eyebrow enbart via `getRoundCharacter` får finalen aldrig sitt guld och renderar som derby-scen; annandagen försvinner likadant. Därför: **kolla `round === 'Final'`/playoff + `isAnnandagen` + nyårsflaggan FÖRST (final vinner allt — störst), fall sen tillbaka på `getRoundCharacter`** för cup/derby/premiär/svit. Guld-eyebrow gatas på `round === 'Final'`, aldrig på getRoundCharacter-värdet.

**Svit-bandet:** `getRoundCharacter` returnerar `'losing_streak'`/`'winning_streak'` VARJE rond streaken är ≥3 — inte bara vid förändring. Och cup/derby-precedensen döljer streaken (en cup-match under en förlustsvit ger `'cup_day'`). Så bandets "tänds på förändring, tyst när oförändrad" kan inte komma från getRoundCharacter. Läs streaken oberoende via `getStreakLength(game)` (finns i samma fil, returnerar exakt längd — bra för "fördjupas till milstolpe"-fallet) + staleBias/lastShown för förändringsdetektionen.
