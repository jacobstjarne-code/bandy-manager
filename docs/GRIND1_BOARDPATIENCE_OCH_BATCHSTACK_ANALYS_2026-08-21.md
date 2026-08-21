# Grind 1 (boardPatience) och BatchStack — mekanikanalys, 2026-08-21

**Beställt av:** Jacob, efter Skutskär-auditen mot `52009671` (se `docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md`).
**Utfört av:** Code, rapport — inget byggt.

---

## Del 1 — boardPatience: varför Skutskärs säsong inte rörde nålen

### computeBoardPatienceUpdate() — full funktion

`src/domain/services/boardService.ts:245-268`:

```ts
export function computeBoardPatienceUpdate(
  finalPos: number,
  totalTeams: number,
  currentPatience: number,
  currentFailures: number,
): { newBoardPatience: number; newConsecutiveFailures: number } {
  const topThird = Math.ceil(totalTeams / 3)
  const relegationZoneStart = totalTeams - RELEGATION_ZONE_SIZE + 1
  const warningZoneStart = relegationZoneStart - RELEGATION_ZONE_SIZE

  if (finalPos <= 2) return { newBoardPatience: Math.min(100, currentPatience + 20), newConsecutiveFailures: 0 }
  if (finalPos <= topThird) return { newBoardPatience: Math.min(100, currentPatience + 15), newConsecutiveFailures: 0 }
  if (finalPos >= relegationZoneStart) return { newBoardPatience: Math.max(0, currentPatience - 20), newConsecutiveFailures: currentFailures + 1 }
  if (finalPos >= warningZoneStart) return { newBoardPatience: Math.max(0, currentPatience - 5), newConsecutiveFailures: 0 }
  return { newBoardPatience: currentPatience, newConsecutiveFailures: 0 }
}
```

Fyra indata, aldrig fler: `finalPos`, `totalTeams`, `currentPatience`, `currentFailures`. Ingen `boardExpectation`, inga poäng, ingen förlustsvit, ingen ekonomi. Anropas en gång, `seasonEndProcessor.ts:741`.

Ovanpå detta lägger `seasonEndProcessor.ts:942-944` en platt objektiv-term: `newBoardPatience - objFailures*5 + objSuccesses*3`, där `objFailures`/`objSuccesses` kommer från att `evaluateObjective()`s fyra riktiga tillstånd (`met`/`at_risk`/`active`/`failed`) kollapsas till två vid `:923` — `active` och `at_risk` blir båda `failed`. Avskedskontroll, `:947`: `if (newBoardPatience <= 15 || newConsecutiveFailures >= 3) managerFired = true`.

### U1:s ursprungliga order — första halvan byggd, andra inte

`docs/SLUTTEST_KO.md:568-588` (etapp 7). U1 ställde **två separata frågor** (rad 573): dels hur difficulty härleds ur truppstyrka, dels **"vad krävs för att en klubb i nedflyttningsstrid faktiskt tappar boardPatience?"**

Commit `4be59ff9` (18 aug) svarade fullt på den första (`computeDifficultyScore()`) och bara delvis på den andra. Ordens egen rekommendation (`:583`): *"gör AvoidBottom-tröskeln proportionell mot faktisk nedflyttningszon... och lägg till en svag negativ lutning för plats 8-10... så press känns innan klubben faktiskt är nere."* Det som byggdes (D029, `:60-62`): en varningszon med bredd `RELEGATION_ZONE_SIZE=2` direkt ovanför nedflyttningszonen — för 12 lag är det **bara position 9-10** (−5 patience), och 11-12 (−20, +1 failure). **Position 4-8 ger noll patience-effekt, oavsett resultat.** Ingen förlustsvit-term byggdes någonsin — det är den obyggda andra halvan.

### Skutskär-spårningen (8:a/12, 18p, 5 raka förluster, 2 hotade uppdrag)

`totalTeams=12`, `finalPos=8`. `topThird = ceil(12/3) = 4`. `relegationZoneStart = 12-2+1 = 11`. `warningZoneStart = 11-2 = 9`. Position 8 uppfyller ingen gren (`8<=2`? nej. `8<=4`? nej. `8>=11`? nej. `8>=9`? nej) → faller till sista raden: **`newBoardPatience` oförändrad, `newConsecutiveFailures` oförändrad.** Den fem matcher långa förlustsviten kommer aldrig in i formeln — inte direkt, inte via position (8:an ligger i dödzonen), inte via någon annan term. `lossStreak` beräknas i `arcService.ts:184`, `mediaService.ts:146`, `pressConferenceService.ts:386` — men ingen av dem skriver till `boardPatience` vid säsongsslut. Bara de två objektiven rör siffran: `70 − 5×2 + 3×0 = 60`. `getBoardPatienceZone()` (`boardPatienceZone.ts:76`) buckar `patience>=50` som `'stabilt'` — 60 stannar "Stabil", långt från avskedströskeln 15.

### Årsboksdomen — en annan formel, samma blinda fläck, sämre resultat

`computeSeasonVerdictRating()`, AvoidBottom-grenen (`boardService.ts:216-220`):
```ts
if (finalPosition <= totalTeams - 4) return 5
else if (finalPosition <= totalTeams - 2) return 4
else if (finalPosition === totalTeams - 1) return 2
else return 1
```
`totalTeams-4 = 8`, `finalPosition = 8` → **`8 <= 8` sant → betyg 5**, vilket `expectationVerdictFromRating()` (`:290`) rapporterar som `'exceeded'` — källan till "mer än nöjd". Samma mekanism styr `evaluateBoard()`s levande nöjdhet (`:86`): `relegationZoneStart-3 = 8`, så `pos<=8 → 'delighted'`. **Inte samma beräkning som boardPatience** — `computeBoardPatienceUpdate` är förväntans-agnostisk (läser bara `finalPos`/`totalTeams`), medan domen och den levande nöjdheten båda läser `expectation`. Två oberoende formler som råkar vara överens här bara för att båda behandlar "8:a av 12" som fint för en AvoidBottom-klubb.

### Fält som skulle behöva väga annorlunda

- **`finalPos`-dödzonen (position 4-8 av 12).** Idag: noll patience-effekt oavsett utfall. Behöver en icke-platt term över hela tabellen, inte bara en klippa vid nedflyttningskanten.
- **Förlust-/vinstsvit — helt frånvarande i `computeBoardPatienceUpdate` idag.** Finns beräknad på andra ställen (`arcService.ts`, `pressConferenceService.ts`) men skickas aldrig in. Detta är den naturliga **särskiljande signalen**: den är ortogonal mot både slutposition och difficulty — den straffar inte en svår klubb som grindar fram en 4:e-placering (Grind-1-fyndet, `club_heros`), men fångar en mittenklubb som kollapsar via en 5-matchers svit i slutet.
- **`boardExpectation` — inte en indata till `computeBoardPatienceUpdate` alls**, trots att domen och den levande nöjdheten båda använder den. Patience-formeln och "vad styrelsen säger"-texten kan därför divergera eftersom de inte delar indata.
- **Objektiv-flattningen (`active`/`at_risk` → `failed`) vid `seasonEndProcessor.ts:923`** — förlorar exakt den distinktion ("hotat" vs "misslyckat") Skutskärs säsong faktiskt hade.

**Filer:** `src/domain/services/boardService.ts`, `src/application/useCases/seasonEndProcessor.ts`, `src/domain/services/portal/boardPatienceZone.ts`, `src/domain/services/boardObjectiveService.ts`, `docs/SLUTTEST_KO.md:568-588`, `docs/findings/facts/design_principles/D029_difficulty_and_relegation_zone.yaml`.

---

## Del 2 — BatchStack: varför postmatch-paret mekaniskt inte kan nå stapeln

### Båda events KAN genereras ihop, men bär alltid choices: []

`src/domain/services/postMatchEventService.ts:24-38` pushar `fanLetter` när `generateInsandare(game, fixture)` returnerar sant; `:46-72` pushar `opponentQuote` när `Math.abs(margin) >= 3` OCH en motståndarklubb hittas OCH `generatePostMatchOpponentQuote(...)` returnerar sant. Paret kan alltså samexistera (avgörande marginal + en sann insändare) — men **båda konstrueras med `choices: []` hårdkodat** (rad 30 och 67). Ingen gren i funktionen ger någotdera ett icke-tomt `choices`-fält.

### Atmosfärstaket (MAX_ATMOSPHERIC_PER_ROUND = 2) är INTE boven

`generatePostMatchEvents` pushas in i `allNewEvents` vid `roundProcessor.ts:1084-1086`, före de andra low-priority-pushen samma omgång (`mecenatResult.newEvents` :1324, skadeerbjudande-events :1329). Taklogiken (:1338-1346) gör `atmosphericNew.slice(0, 2)` — eftersom fanLetter+opponentQuote står först bland `priority: 'low'`-events överlever de taket i normalfallet. Röd sill, inte den faktiska spärren.

### getBatchSiblings är korrekt byggd — men får aldrig chansen

`eventQueueService.ts:115-125` kollar bara `game.pendingEvents`, olöst, matchande `triggerGroupId`, icke-kritisk prioritet. Fungerar exakt som tänkt. Problemet är att den aldrig anropas för postmatch-paret (se nästa punkt).

### DEN FAKTISKA SPÄRREN — ambient-routing som kringgår batch-koden helt

`eventQueueService.ts:36-38`: `isAmbientEvent(event) { return event.choices.length === 0 }`. Eftersom fanLetter/opponentQuote ALLTID har `choices: []`, är `isAmbientEvent` alltid sant för dem, så `getEventRenderTarget` (`:79-82`) returnerar alltid `'ambient'` — oavsett `triggerGroupId`.

`PortalEventSlot.tsx:39,47-49`:
```
const target = getEventRenderTarget(event)
...
if (target === 'ambient') {
  return <AmbientEventRow event={event} />
}
```
Detta `return` triggas och avslutar komponenten **innan rad 61:s `getBatchSiblings(game, event)`-anrop någonsin nås.** BatchStack-vägen (`:59-68`) är strukturellt död kod för varje event med `choices: []` — vilket är 100 % av postmatch-events, alltid, deterministiskt. Inte ett sannolikhets-nästan-missa; kan inte hända under NÅGON marginal, omgångstidpunkt eller samtidig-event-kombination, eftersom spärren sitter på `choices.length`, inte på något matchresultat-beroende.

### Andra, oberoende dödsväg: granskaEventClassifier

`fanLetter`/`opponentQuote` ligger i `REACTION_TYPES` (`granskaEventClassifier.ts:51-58,75-76`), och `classifyEventNature` routar `REACTION_TYPES` med `choices.length === 0` till `'reactions'`, vilket Granska-skärmens Reaktioner-kort auto-löser vid rendering. Så även i en tänkt värld utan ambient-spärren skulle första besöket i Granska auto-lösa dessa events ur `pendingEvents` innan spelaren någonsin sett dem som beslutskort.

### Enda produktionskällan som sätter triggerGroupId: postMatchEventService.ts

Bekräftat via repo-omfattande grep, noll andra träffar utanför tester. Batch-testerna (`PortalEventSlotBatch.test.tsx:31-38`) är gröna eftersom deras `makeEvent()`-hjälpare default:ar till ett **icke-tomt** `choices`-fält (`[{ id: 'c', label: 'Ett val', ... }]`) — till skillnad från allt postmatch faktiskt producerar. Testsviten bevisar att mekanismen fungerar i abstrakt mening, med syntetisk data formad helt olikt den enda riktiga generator som sätter `triggerGroupId`.

### Verdikt

**Nej — postmatch-paret kan inte nå BatchStack under NÅGOT verkligt spelläge.** Inte smalt-men-möjligt; strukturellt omöjligt, ovillkorligt, eftersom `PortalEventSlot.tsx:47-49`s ambient-routing-check returnerar innan batch-check-koden (`:61-68`) någonsin körs, och den tar alltid den grenen för dessa två event-typer eftersom båda är hårdkodade till `choices: []` utan någon kodväg som ändrar det. Som backup auto-löser `granskaEventClassifier.ts:75-76` samma events till osynlighet på Granska-skärmen ändå. Ingen annan källa i kodbasen kan idag producera en synlig 2-korts-stapel heller — `triggerGroupId` sätts ingen annanstans, och en fungerande ersättning skulle kräva en ny generator som medvetet ger 2+ samtidigt-triggade events riktiga (icke-tomma) `choices` — inget gör det idag.

**Ärlig självkorrigering:** gårdagens taggning av `postMatchEventService.ts` (`51a058ad`) var inte fel i sig — mekanismen är fortfarande strukturellt korrekt, och det är fortfarande den enda platsen i kodbasen där en delad orsak genererar >1 event. Men verifieringen den gången bevisade att mekanismen fungerar i abstrakt mening (komponenttester med syntetisk, icke-tom `choices`), inte att DEN HÄR källan faktiskt kunde nå koden i ett riktigt render. Det är missen: grönt test ≠ nåbar kodväg för den specifika källan som taggades.

---

## Sammanfattning — vad båda fynden har gemensamt

Båda är samma felklass: kod som är korrekt byggd och grönt testad, men aldrig verifierad mot det SPECIFIKA verkliga scenario den skulle hantera. boardPatience-formeln är matematiskt konsekvent men läser fel indata för Skutskärs säsongsform. BatchStack-mekanismen är strukturellt sund men den enda källan som taggar den kan aldrig nå fram dit. Ingendera är byggd i denna rapport — båda väntar på ditt beslut om nästa steg.
