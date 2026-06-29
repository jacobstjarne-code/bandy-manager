# DIAGNOS — "Dina val · Utfall" saknas i matchsammanfattningen

**Från:** Opus · **Datum:** 2026-06-23, tisdag morgon (08:55 CEST)
**Status:** Tidigare hanterat som B3 ("sektionen borttagen, återställ"). Den framingen var FEL. Code:s svar ("ingen kod behövs, felrapport") är **halvt rätt** — sektionen är inte raderad, men den under-fylls av en datalogg vars två viktigaste källor är döda. Detta är en riktig bugg, inte en felrapport.

---

## Vad som är sant (källverifierat denna session)

- Sektionen **finns** och är M15-stylad: `src/presentation/screens/granska/GranskaOversikt.tsx`, blocket `{/* M15 — Dina val: utfallsrader ... */}`, rubrik `📋 DINA VAL · UTFALL`, stripe + rubrik + spelare + utfall + siffra-fram. Den togs aldrig bort i `03622724`. Mocken ÄR implementerad. Code har rätt på den punkten.
- Konsumenten renderar redan både `captain`- och `halftime_tactic`-poster korrekt (loopen i samma block hanterar alla fyra entry-typerna). **Konsumenten behöver ingen ändring för att posterna ska SYNAS** (men kaptenraden behöver ärligöras, se D2).

## Roten — datagrinden + två döda matare

Högst upp i blocket:
```ts
const log = fixture?.report?.managerChoiceLog
if (!log || log.length === 0) return null
```
Hela sektionen renderar bara om `managerChoiceLog` har minst en post. Loggen byggs i **`src/presentation/store/actions/matchActions.ts` → `saveLiveMatchResult`** (T3-blocket) ur fyra källor. Två av dem fyller aldrig något:

**A. halftime_tactic — DÖD (bekräftad).**
Byggaren läser `game.lastHalftimeDecision`. Den enda halvtids-appliceringsvägen är `handleApplyTactic` i `MatchLiveScreen.tsx` — och den skriver **aldrig** `game.lastHalftimeDecision` (den uppdaterar lokal React-state + regenererar andra halvlek, inget store-fält). Kommentaren i matchActions ("stored by applyHalftimeDecision") refererar en åtgärd som inte finns i live-flödet. → halvtidsraden loggas aldrig, även när du gjorde ett halvtidsval.

**B. captain — FÄLTKROCK (bekräfta + fixa).**
Byggaren läser `myLineup?.captainPlayerId` (fältet på `TeamSelection`). Men live-motorn läser kaptenen från `game.captainPlayerId` (se `simulateMatchStepByStep`-anropet: `captainPlayerId: game.captainPlayerId`). `setLineup.ts` KAN stämpla `lineup.captainPlayerId` — men bara om kapten-UI:t skickar det. Det finns alltså två kaptenfält (`game.captainPlayerId` som motorn läser vs `TeamSelection.captainPlayerId` som loggbyggaren läser). Om kapten-UI:t skriver `game.captainPlayerId` (vilket motorn förutsätter) är lineup-fältet tomt → kaptenraden loggas aldrig.
**Code bekräftar med en grep:** var skriver kapten-valet? `game.captainPlayerId` eller `setLineup({captainPlayerId})`?

**C. started_tired (startande fitness < 40) + bench_fit (bänk fitness > 80) — LEVER.**
Dessa fyller loggen. `bench_fit` ("Vilad") träffar ofta (pigga avbytare > 80). `started_tired` sällan. **Var loggen tom i din genomspelning betyder:** kapten + halvtid dog (A/B), inga startande under 40, och bänken hade ingen över 80 — då blir loggen tom → `return null` → sektionen försvinner helt. Det du såg som "borttaget".

## Exakt fix (Code — spel-logik, build+test+playtest)

**Fix A — persistera halvtidsvalet.**
I `handleApplyTactic` (`MatchLiveScreen.tsx`), efter att halvtidsvalet är fastställt, härled och persistera ett `lastHalftimeDecision`-värde så `saveLiveMatchResult` kan läsa det (antingen via en store-action `setHalftimeDecision`, eller — renare, undviker stale state — tråda in det som argument till `saveLiveMatchResult` och släpp game-fältet). **Mapping (Opus-design, fast):**
- `htTempo === Low` → `'lugna'`
- `htPress === High` ELLER `htMentality === Offensive` → `'pressa'`
- annars (byten/prat utan tempo/press/mentality-ändring) → `'prata'`
Om Code bedömer att `pauseLean` är den mer trogna signalen för spelarens *avsikt*: `calm → 'lugna'`, `push → 'pressa'` — välj den om tempo/press/mentality inte ändrades. Bekräfta med Opus om mappningen känns fel mot spelkänslan; ändra inte tyst.

**Fix B — en sanning för kaptenen (OPUS-REGEL #4).**
Peka loggbyggarens captain-gren mot samma fält motorn läser. Konkret: i `saveLiveMatchResult`, byt `myLineup?.captainPlayerId` → `game.captainPlayerId` (och resolva spelaren ur `game.players`). Det eliminerar fältkrocken utan att röra setLineup. Om grepen visar att kapten-UI:t i själva verket skriver `lineup.captainPlayerId` och `game.captainPlayerId` är det döda fältet — gör tvärtom, men låt motorn och loggen läsa SAMMA fält. Två kaptenfält som driver isär är buggen; välj ett.

**Rör inte:** started_tired/bench_fit-grenarna (de funkar), konsumentens loop-struktur (renderar redan alla typer).

## Verifiering (kvitto krävs)
Spela en live-match där du (1) har en kapten satt och (2) gör ett halvtidsval. Öppna Granska → `📋 DINA VAL · UTFALL` ska visa en **Kapten**-rad + en halvtidsrad (Lugna/Pressa/Prata) utöver ev. Vilad/Startade trött. Kod-verifierad simulation duger som komplement men playtest är kvittot (perception-tung yta).

---

## DESIGN — ska sektionen alltid visas? (Jacobs fråga 2026-06-23)

Jacob vill att sektionen levandegör matchrapporten och ser den gärna som ett återkommande inslag. Beslut: **ja, alltid synlig för matcher Jacob själv leder.** Två saker krävs för att det ska bli bra (inte bara alltid):

**D1 — kaptenen är den naturliga basraden.** En kapten är i princip alltid satt → efter Fix B blir kaptenraden en garanterad rad → sektionen visas i varje match som går genom matchskärmen (full/commentary/quicksim vänder alla i `saveLiveMatchResult`). **Code bekräftar med grep:** finns en ren "snabbsimulera utan att titta"-väg från dashboard som går FÖRBI `saveLiveMatchResult`? Hittade ingen denna session, men verifiera. Om en sådan väg finns och bygger en `report` utan `managerChoiceLog` → bygg loggen där också (kapten + started_tired + bench_fit; halftime utgår när matchen inte spelades live). Då visas sektionen efter VARJE egen match, sedd eller osedd.

**D2 — kaptenraden får INTE alltid vara grön (kritiskt).** Idag hårdkodar GranskaOversikt kaptenraden till `stripe: 'good'`, `✓`, "gav effekt" — oavsett resultat. Blir kaptenen den alltid-närvarande basraden betyder det att varje rapport, även en 0–5-förlust, öppnar "Dina val" med "Kapten · gav effekt ✓". Det är en deltagartrofé. Det plattar matchrapporten istället för att levandegöra den, och bryter mot promise↔consequence (Lärdom #41): kvittot ska spegla vad som hände, inte gratulera.

**Copyn är skriven (Opus 2026-06-23).** `CAPTAIN_OUTCOMES` i `managerKvittoText.ts` — kontextspecifika pooler `final | slutspel | derby | vardag`, var och en med good/bad/neutral. Code rewirar kaptenraden i GranskaOversikt att:
- (a) **välja kontext** ur fixturen, prioordning (se doc-kommentaren i filen): `final` (isNeutralVenue/SM-final ELLER cup-final) → `slutspel` (isKnockout && ej final) → `derby` (getRivalry träffar) → `vardag` (allt annat).
- (b) **härleda riktning** ur kaptenens matchrating, exakt som started_tired: `rating >= 7 → good`, `<= 5 → bad`, annars `neutral`; saknas rating, falla på resultatet (won/lost/draw).
- (c) plocka text ur `CAPTAIN_OUTCOMES[context][dir]` (deterministiskt index på samma `seed` som de andra raderna).
- (d) sätta stripe/✓/✗/— efter dir.
- (e) ta bort den hårdkodade alltid-gröna raden + den inline-strängen.

Vunnen final → "Kaptenen bar finalnerverna åt de yngre." Förlust i derby → "Bindeln tappade humöret först av alla." Vardagskryss → "Det togs upp, men gruppen var redan där." Det är skillnaden mellan en rad som lever och en som ljuger.

Sammanfattat: alltid synlig = bra instinkt, men bara om kaptenraden är ärlig. Annars blir "alltid synlig" = "alltid samma gröna rad", vilket är värre än att den ibland saknas.

---

## KÖRORDER

- **Code:** (1) grep: var skrivs kaptenen (`game.captainPlayerId` vs `setLineup`)? + finns en snabbsim-väg förbi `saveLiveMatchResult`? Rapportera båda. (2) Fix A (persistera halvtidsval, mappning ovan). (3) Fix B (en kaptenkälla, motor + logg läser samma). (4) D1: säkerställ att loggen byggs för ALLA egna-match-vägar (lägg till i snabbsim-vägen om den finns och saknar den). (5) D2: rewira kaptenraden i GranskaOversikt — kontext + riktning enligt ovan, text ur `CAPTAIN_OUTCOMES[context][dir]` (`managerKvittoText.ts`), stripe/värde efter dir; ta bort den hårdkodade alltid-gröna raden + inline-strängen. (6) build+test, sedan playtest-verifiering. (7) Commit med rotorsak per CLAUDE.md ("rot: managerChoiceLog captain-gren läste lineup-fält, motorn game-fält; halftime-gren läste game.lastHalftimeDecision som live-flödet aldrig skrev; kaptenraden hårdkodad grön bröt promise↔consequence").
- **Opus:** kö tom efter denna diagnos. `CAPTAIN_OUTCOMES` levererad. Står redo om mappningen (Fix A), kapten-rating-tröskeln, eller kontextprioordningen (D2) behöver justeras mot spelkänslan, eller om grepen visar en tredje variant.
- **Jacob:** efter Code:s fix — playtesta enligt verifieringen ovan, och kolla särskilt att en förlustmatch ger en ärlig kaptenrad (inte "gav effekt"). Det stänger frågan om "Dina val" på riktigt.
