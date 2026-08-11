# GRANSKA DEL 4, steg 1 — Axelhärledningen — audit + rapport innan steg 2

## Punkter i spec
- [x] Domän-util, rena funktioner, enhetstestbara — `src/domain/services/matchTypeAxes.ts`, `deriveMatchTypeAxes(fixture, managedClubId, playoffBracket)`, tre interna hjälpfunktioner, inga sidoeffekter.
- [x] `tävlingstyp: liga | cup | slutspel | avsked` — implementerat.
- [x] `skede` per tävlingstyp, härlett ur koden — cup ur `fixture.roundNumber` (samma numrering som `cupService.ts`s `CUP_MATCHDAYS`/`getCupRoundName`: 1=förstarunda, 2=kvartsfinal, 3=semifinal, 4=final — tolv lag, topp fyra bye, botten åtta spelar förstarunda, inget gruppspel, ingen åttondel). Slutspel ur `playoffBracket`s tre grenar (`quarterFinals`/`semiFinals`/`final`), matchat mot vilken grens `fixtures: string[]` som innehåller matchens id.
- [x] `plats: hemma | borta | neutral` — egen axel, inte bakad in i tävlingstyp. `fixture.isNeutralVenue` (redan den mekaniska sanningen matchCore.ts nollar hemmafördel på) → `'neutral'`, annars `homeClubId === managedClubId ? 'hemma' : 'borta'`.
- [x] SM-final = `slutspel` + `final`, cupfinal = `cup` + `final`, final är inget eget tävlingstyp-värde — verifierat i test.

## Rapport: vilka spridda kollar ersätts, och vad de nya axlarna INTE täcker

Fyra namngivna kollar i ordern (`isNeutralVenue`, `isKnockout`, `penResult`, kaptenens kontextgren):

**1. `isNeutralVenue` → direkt ersatt av `plats === 'neutral'`.** Samma booleana källa, ingen förlust — axeln lägger bara till en tredje ledig position (hemma/borta) där den gamla flaggan bara hade sant/falskt.

**2. `isKnockout` → direkt ersatt av `tävlingstyp !== 'liga' && tävlingstyp !== 'avsked'`.** Verifierat mot alla skrivställen: `cupService.ts:67,177` sätter alltid `isCup` + `isKnockout` tillsammans för cup, `playoffService.ts:66,96` sätter bara `isKnockout` (aldrig `isCup`) för slutspel. Ingen tredje kombination finns i kodbasen — ekvivalensen är exakt, ingen gissning.

**3. `penResult` (`fixture.penaltyResult`, `GranskaOversikt.tsx:41,144,198-274`) → INTE ersatt, och ska inte ersättas.** Det är matchutfallsdata (avgjordes matchen på straffar) — ortogonalt mot matchtyp. En straffavgörelse kan förekomma i både cup och slutspel, aldrig i liga (bara knockout kräver en vinnare). Axlarna svarar på "vilken sorts match är det", inte "hur slutade den" — de två frågorna ska inte slås ihop. `penResult` fortsätter läsas direkt ur `fixture.penaltyResult`.

**4. Kaptenens kontextgren (`GranskaOversikt.tsx:590-596`) → ersätts, och fixar samtidigt en verifierad bugg som INTE stod i uppdragets kända-fall-lista:**

```ts
const captainContext: CaptainContext =
  fixture?.isNeutralVenue ? 'final'
  : fixture?.isKnockout ? 'slutspel'
  : getRivalry(...) ? 'derby'
  : 'vardag'
```

`isNeutralVenue` är INTE ett pålitligt "är det en riktig final"-tecken. `cupService.ts:160`: `isCupFinalWeekend = nextRound >= 3` — cupens SEMIFINAL sätter samma `isNeutralVenue: true` som finalen (kommentaren på `cupService.ts:182-188` säger det uttryckligen: "Cupens semi och final presenterades som neutral plan"). En spelad cupsemifinal klassificeras alltså idag felaktigt som `'final'`-kontext i kaptenens outcome-pool, inte `'slutspel'`.

De nya axlarna gör inte samma misstag eftersom `skede` härleds ur `roundNumber`, inte ur `isNeutralVenue`: `skede === 'final' ? 'final' : (tävlingstyp==='cup'||tävlingstyp==='slutspel') ? 'slutspel' : ...` klassificerar cupsemifinalen rätt. Testat explicit — se `matchTypeAxes.test.ts`: "cupsemifinal på neutral plan (finalhelgen) — plats:neutral, INTE tavlingstyp:slutspel".

**Detta är en bugg, inte en förbättring — flaggas nu, fixas i steg 2** när `GranskaOversikt.tsx` faktiskt skrivs om (steg 1 är rent domän-util, rör inte `granska/`-innehåll, per DEL3-ordern "Rör inte innehållet i GranskaScreen" och DEL4-ordern "Vad som inte ingår").

## Ett femte fall, utanför de fyra namngivna

`farewellMatchForPlayerId` (`gameFlowActions.ts:635-648`) sätts på "nästa ospelade hemmamatch" i fixture-array-ordning, oavsett typ — funktionen filtrerar bara på `status !== 'completed' && homeClubId === managedClubId`, inte på `!isCup && !isKnockout`. En avskedsmatch kan alltså i teorin träffa en cup- eller slutspelsfixture, inte bara en ligamatch. `deriveTavlingstyp()` låter `avsked` gå FÖRE cup/slutspel-kollen av det skälet — testat explicit ("avsked går före cup/slutspel — farewellMatchForPlayerId kan i teorin träffa en cupmatch"). Ingen kod ändrad i `gameFlowActions.ts` — bara noterat som en förutsättning axelhärledningen måste hålla för.

## Kod-verifiering
- `npx tsc --noEmit`: rent.
- `npm test -- --run`: 1488/1488 gröna (152 filer, +15 nya i `matchTypeAxes.test.ts`).
- `npm run build`: rent, `ds-guard: på baslinje ✓`.
- `npm run lint:design` / `lint:text-guard`: gröna.
- Ingen browser-verifiering — ren domän-util, ingen yta konsumerar den ännu (samma logik som DEL3 steg 4).

## Status på de två blockerande förutsättningarna (för steg 2)

1. **`visual-baselines.yml` otriggad.** Fortfarande sant — ingen Linux-baseline-PNG finns på `origin/main` (senast verifierat denna session innan DEL3 startade; inget har ändrat det sedan dess, jag kan inte trigga workflowen själv). Detta blockerar steg 2 (Sektionsregistret) enligt ordern: "Ett borttaget kort syns inte i något test som inte redan vet hur skärmen såg ut innan."
2. **DEL3 obyggd.** LÖST — alla fyra steg i `CODE_INSTRUKTION_AUDIT_DEL3_2026-08-10.md` är nu committade och pushade (`63d04741`, `80c7a8b3`, plus tidigare `7d97d3e2`, `4e8ae71c`).
3. **Steg 6 (baseline per matchtyp)** — de fem scenerna (`granska`/liga, `granska-cup`, `granska-cup-final`, `granska-slutspel`, `granska-avsked`) är redan byggda och registrerade i `tests/visual/scenes.visual.ts` (tidigare session-steg). Kod-sidan av steg 6 är alltså klar — det som saknas är att blockerare 1 löses, så att dessa fem faktiskt får en Linux-baseline att jämföras mot i CI.

**Nästa steg (Sektionsregistret) väntar på blockerare 1 — Jacobs handling, löser sig inte av att stå i ett dokument.**
