# GRANSKA DEL 4, steg 2 — Sektionsregistret — audit

## Punkter i ordern
- [x] Sektionsregister — `visasFor(section, tavlingstyp, skede)` i `src/domain/services/granskaSectionRegistry.ts`, matrisen i `docs/incoming/DESIGN_UPPDRAG_GRANSKA_DEL4-2026-08-11.md` i kod.
- [x] ✕ = renderas inte, aldrig ett tomt/gråtonat kort — verifierat i browser (skärmdumpar nedan), varje ✕-sektion är helt frånvarande från DOM, inte en placeholder.
- [x] Tabell och Form i cupkolumnen — icke förhandlingsbara, live-verifierade — implementerade exakt: Tabell ✕ hela cupen, Form ✕ hela cupen.
- [x] "Andra matcher"-cellen avgjord mot cupträdet innan den rördes (se nedan) — INTE en filterbugg.
- [x] Kaptenens kontextgren (steg 1-rapportens bugg) fixad i samma commit.
- [x] Emoji-parsningen på `GranskaOversikt.tsx:413` ersatt med strukturerat fält i samma commit.

## "Andra matcher"-cellen — avgörandet

Cupmatchdagar (1-4, `cupService.ts:CUP_MATCHDAYS`) och ligamatchdagar (5-26, `scheduleGenerator.ts`: "Liga rounds 1-22 (matchday 5-26)") delar aldrig värde, i någon säsong — samma `generateCupFixtures`/`buildSeasonCalendar` körs varje säsong (`seasonEndProcessor.ts`). `otherResults`-filtret (`GranskaScreen.tsx`) matchar bara på `f.matchday === currentMatchday`, vilket för en cupmatch alltså **strukturellt aldrig** kan råka fånga en ligamatch.

Cuprond 3 (semifinal) har exakt två fixtures, båda på matchday 3 (fyra kvartsfinalvinnare → två semifinaler). En spelad cupsemifinal som visar den andra semifinalen i "Andra matcher" är alltså **korrekt** — inte en bugg. Karlsborg–Målilla (den live-verifierade auditträffen) var den andra semifinalen.

**Slutsats: ✓, ingen fix.** `visasFor('andraMatcher', ...)` gates bara bort ✕-fallen (final, avsked) — cellen i sig ändrades inte, den var redan rätt.

## Kaptenens kontextgren — fixen (steg 1-rapportens bugg)

`GranskaOversikt.tsx` (tidigare rad 590-596): `fixture?.isNeutralVenue ? 'final' : fixture?.isKnockout ? 'slutspel' : ...`. `cupService.ts:160` sätter `isNeutralVenue: true` på BÅDE cupsemifinalen och cupfinalen (`isCupFinalWeekend = nextRound >= 3`), så en spelad cupsemifinal klassificerades felaktigt som `'final'`-kontext i kaptenens outcome-pool.

Fixat till `axes.skede === 'final' ? 'final' : (axes.tavlingstyp === 'cup' || axes.tavlingstyp === 'slutspel') ? 'slutspel' : ...` — `skede` kommer ur `roundNumber`/bracket-medlemskap, inte `isNeutralVenue`.

## Emoji-413 — fixen

`pc.title.replace(/^🎤\s*Presskonferens\s*[—–-]\s*/i, '')` var en no-op — `pressConferenceService.ts` sätter titeln till `Presskonferens — ${displayJournalist}` (aldrig med 🎤-prefix), så `pcTitle` visade hela strängen "Presskonferens — Namn, Kanal" oklippt, redundant med sektionsrubriken "🎤 PRESSKONFERENSEN" ovanför.

Fix: `pressConferenceService.ts` sätter nu `sender: EventSender` (samma befintliga, redan använda fält som critical events i samma fil läser — `event.sender ? "${name}, ${role}" : ...`) — `{name, role}` för namngiven journalist-karaktär, `{name: kanalnamn, role: ''}` för fallback (bara ett kanalnamn, ingen person). `GranskaOversikt.tsx` läser `pc.sender` direkt, ingen parsning.

## Matrisens "SM-final"-kolumn — tolkningen (rapporterad, inte tyst gissad)

Ordern (steg 1-notisen): "SM-final är ingen egen kolumn-axel — den identifieras av skede: final på slutspels-/cup-tävlingstypen." Detta betyder att matrisens "SM-final"-kolumn gäller `skede==='final'` **oavsett** tävlingstyp cup eller slutspel — men INTE enhetligt för alla sektioner. Två familjer, olika skäl:

- **Fyra sektioner** (Tabell, Form, Omgångssammanfattning, Andra matcher) döljs för att MATCHEN är ceremoniell just nu — gäller lika en cupfinal som en SM-final ("det ÄR matchen", "inte '+2 tkr/omg' under guldet"). `isAnyFinal` (`skede==='final'`, oavsett tävlingstyp) styr.
- **Två sektioner** (Scouting, Nästa match-pekare) döljs för att SÄSONGEN är slut — en cupfinal spelas i augusti (`cupService.ts`: matchday 1-4, "before liga starts at matchday 5") och ligasäsongen fortsätter direkt efteråt. De blir bara ✕ på den verkliga säsongsavslutande finalen (`tävlingstyp:'slutspel' + skede:'final'`), inte på cupfinalen. `isSeasonEndingFinal` styr.

Detta är en tolkning jag gjort och motiverat, inte en rad ur ordern ordagrant — flaggas härmed explicit för granskning, inte tyst antagen.

## Täckningslucka — flaggad, inte tyst

De fem baseline-scenerna (steg 6, redan byggda) täcker: liga, cup-kvartsfinal, cup-final, slutspel-kvartsfinal, avsked. **Ingen av dem är en riktig SM-final** (`tävlingstyp:'slutspel' + skede:'final'`) — `isSeasonEndingFinal`-grenen (Scouting, Nästa match-pekare) har alltså noll scen-täckning i de fem obligatoriska baselinescenerna. Ordern räknar upp exakt fem scener och Jacob sa idag att ordern inte ska skrivas om — jag har därför INTE lagt till en sjätte scen på eget initiativ. `matchTypeAxes.test.ts`/`granskaSectionRegistry.test.ts` täcker fallet i enhetstest (SM_FINAL-konstanten), så logiken är bevisad — bara inte i en levande Playwright-baseline.

## Fixture-fidelitet i dev-scenerna — tre fynd, alla fixade

Vid wiring av axlarna in i de befintliga fem baseline-scenerna (byggda i ett tidigare sessionssteg, före axelhärledningen fanns) upptäcktes att scenerna inte matchade produktionens datakontrakt:

1. `granska-cup` hade `roundNumber: 16` — cupens verkliga rondnummer är 1-4 (`cupService.ts`). 16 låg utanför intervallet, så `deriveSkede` gav `undefined` — sektionsregistret råkade se rätt ut ändå (undefined uppför sig som "inte final") men testade inte den verkliga mappningen. Fixat till `roundNumber: 2` (kvartsfinal).
2. `granska-cup-final` hade `roundNumber: 19` — samma fel, och här dolde det en verklig bugg: Omgångssammanfattning visades felaktigt (skulle varit ✕) tills roundNumber fixades till `4`. Fångat genom browser-verifiering, inte genom testerna (som bara testar registret isolerat, inte fixture-wiringen).
3. `granska-cup-final` saknade `arenaName`/`venueCity` — visade "Spelades på Edsbyns IP arena" (hemmaklubbens egen arena) istf den neutrala finalhelgsarenan. Fixat med `CUP_FINAL_VENUE` (samma konstant `cupService.ts`/`playoffService.ts` använder).
4. `granska-slutspel` hade ingen `playoffBracket` wired — `deriveSkede`s slutspelsgren söker fixturens id i bracketens tre grenar; utan bracket blev `skede` `undefined` av datalucka, inte av att det verkligen var en kvartsfinal. Fixat med en minimal `quarterFinals`-post.

Ingen av dessa fyra var synliga i tsc/vitest — bara browser-verifiering (jämförde renderad text mot matrisen, cell för cell) fångade dem. Skärmdumpar: sessionens scratchpad (`granska-cup-del4.png`, `granska-cup-final-del4.png`, `granska-slutspel-del4.png`, `granska-avsked-del4.png`).

## Observerat i UI (browser, headless, `/dev/scenes`)

- **granska** (liga): Tabell✓ Form✓ Statistik✓ Nyckelmoment✓ Omgångssammanfattning✓ — ingenting gated bort, matchar matrisens helgröna ligakolumn.
- **granska-cup** (kvartsfinal): Tabell✕ Form✕ (döljer samtidigt den falska "Inga matcher ännu"-texten live-fyndet beskrev) Statistik✓ Nyckelmoment✓ Omgångssammanfattning✓.
- **granska-cup-final**: Tabell✕ Form✕ Statistik✓ Nyckelmoment✓ Omgångssammanfattning✕ Andra matcher✕ — arenaraden visar nu korrekt "Spelades på Sävstaås IP i Bollnäs".
- **granska-slutspel** (kvartsfinal via wired bracket): Tabell✕ Form✓ (ensam i enkolumns-layout, inte en tom andra kolumn) Statistik✓ Nyckelmoment✓ Omgångssammanfattning✓.
- **granska-avsked**: Tabell✕ Form✕ Statistik✕ Dina val✕ Omgångssammanfattning✕ — bara Resultat-hero och Nyckelmoment kvar, matchar matrisens nästan-helröda avskedskolumn. "NY SKADA"-kortet (orört, utanför scope) syns fortfarande under Klubben-dividern.

## Kod-verifiering
- `npx tsc --noEmit`: rent.
- `npm test -- --run`: 1497/1497 gröna (153 filer, +9 nya i `granskaSectionRegistry.test.ts`).
- `npm run build`: rent, `ds-guard: på baslinje ✓`.
- `npm run lint:design` / `lint:text-guard`: gröna.
- Lokal Playwright (`scenes.visual.ts`): 4 förväntade pixel-diffar (`granska-cup`, `granska-cup-final`, `granska-slutspel`, `granska-avsked` mot Mac-lokala `-darwin.png`, gitignorade, aldrig committade) — innehållet ÄNDRADES avsiktligt, det ÄR poängen med registret. `granska` (liga) oförändrad, grön. Ingen kollateral regression i övriga 37 scener.

## Väntar på Jacob (inte löst av att stå i en commit)

Nästa `app-ci`-körning på `main` kommer visa röd `visual-regression` för de fyra granska-scenerna mot de EXISTERANDE Linux-baselinerna (seedade innan detta steg, alltså före sektionerna försvann). Det är den avsedda, friska failure-moden — grinden gör exakt sitt jobb: flaggar att skärmen ändrats. **Efter granskning av diffen**, trigga `visual-baselines.yml` igen för att godkänna det nya utseendet som ny baseline. Jag triggar den inte själv.

## Nya lärdomar till LESSONS.md
Inget nytt mönster — "fixture-data som inte matchar produktionens datakontrakt" är samma klass som redan täcks av MOCK-DRIVEN DESIGN-principen (pixel-jämför mot källan, inte mot vad som "ser rimligt ut"), fast för testdata istf CSS. Ingen ny LESSON, existerande disciplin (browser-verifiering) fångade det.
