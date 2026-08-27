# CODE-INSTRUKTION — SLUTTEST, RUNDA 3

**Datum:** 2026-08-08 · **Av:** Opus (chat) · **Föregående:** `CODE_INSTRUKTION_SLUTTEST_2026-08-08.md` (punkt 1–7, alla stängda eller rapporterade)

**Verifierat före denna order:** produktionsbygget `5a955a8` genomspelat skarpt i browser med avregistrerad service worker och tömd localStorage — ny karriär, Forsbacka, ankomst, tillträde, cupkvartsfinal, granska, semifinal. Hashen, styrelsemålens enheter och etikett, direktkval-gaten och neutral plan på finalhelgen håller alla i produktion.

**Opus har gjort i working tree — committa separat innan du bygger vidare:**
- `src/domain/services/cupService.ts` — `isNeutralVenue: true` på finalhelgens fixtures (punkt 1 nedan, KLAR)
- `src/presentation/components/portal/secondary/BoardObjectivesList.tsx` — `computeProgressPct` (punkt 3 nedan, INTERIMSFIX — läs villkoret)

Kör `tsc` och testsviten på dessa två innan du går vidare. Jag kan inte köra dem härifrån.

---

## 1. Hemmafördel på neutral plan — KLAR, verifiera bara

**Rotorsak (din spårning, bekräftad):** `matchCore.ts` läser bara `isNeutralVenue`. Den flaggan sattes fram till nu bara av `playoffService.ts` för SM-finalen. `cupService.generateNextCupRound` stämplade finalhelgen med `arenaName`, `venueCity` och `isCupFinalhelgen` — men inte med den flagga motorn faktiskt läser. Cupens semi och final visades som neutral plan och spelades i Bollnäs, men simulerades med full hemmafördel för det lag som råkade stå som `homeClubId`.

**Gjort:** `isNeutralVenue: true` i `isCupFinalWeekend`-spreaden. `matchCore.ts` och `playoffService.ts` orörda — en flagga per fråga: `isCupFinalhelgen` är presentation, `isNeutralVenue` är mekanik, och motorn behöver inte veta vad en cup är.

**Verifiera:** ett test som simulerar en cupsemifinal och bekräftar att hemmafördelen är noll, samt att SM-finalens befintliga neutral-beteende är oförändrat.

---

## 2. Två följdfrågor på samma tema — RAPPORTERA, BYGG INTE

Neutral plan är fler saker än hemmafördel. Svara på båda innan något ändras:

**2a. Publik och klack.** Läser publiksiffran (`Fixture.attendance`) och klackeffekten hemmaklubbens supportrar? I Bollnäs sitter bägge lagens publik i samma hall. Rapportera vilken kod som räknar fram åskådarantalet för en cupsemifinal och vad den utgår från. Om den utgår från hemmaklubbens `fanMood`/`supporterGroup` utan hänsyn till neutral plan är det samma bugg en nivå upp — men jag vill se koden innan jag bestämmer om det ska ändras eller om det är rimligt att arrangörens publik dominerar.

**2b. Arenanamnet i Granska.** Efter kvartsfinalen skrev resultatskärmen "Spelades på Slagghögen arena", alltså hemmaklubbens arena. `Fixture.arenaName` är satt för finalhelgen. Läser Granska det fältet när det finns, eller slår den alltid upp hemmaklubbens arena? Om det senare säger resultatskärmen fel arena för cupens semi och final.

---

## 3. Progressbaren för lägre-är-bättre-mål — INTERIMSFIX LAGD, RIKTIG FIX ÅT DIG

**Rotorsak (ditt fynd):** `progressPct` räknade `currentValue / targetValue` för alla måltyper. För `topHalf` och `reduceInjuries` är lägre bättre — ett lag på plats 9 mot målet topp 6 gav 9/6 = 150 %, klampat till 100. Full stapel för ett mål man missar, på en yta som syns i ankomstscenen och på portalen.

**Gjort (interim):** `computeProgressPct` i samma fil. Lägre-är-bättre-mål visar 100 % när målet är uppfyllt och 0 % annars. Binärt, men sant.

**Din uppgift — den riktiga formeln:** avståndsbaserad progress, `(start − nuvärde) / (start − mål)`, klampad 0–1. Plats 9 mot topp 6 med start på plats 9 ger tom stapel; plats 7 ger cirka halv.

Det kräver ett `startValue` på `BoardObjective`:
- fältet i `entities/Community.ts`, valfritt (`startValue?: number`) så äldre saves typar
- satt i `makeObjective` från samma `evaluateObjective`-anrop som redan initierar `currentValue`
- `saveGameMigration.ts`: befintliga saves saknar fältet. Migrera med `currentValue` som fallback-start — inte perfekt historiskt, men det ger en stapel som rör sig åt rätt håll i stället för en som ljuger
- ersätt interimsgrenen i `computeProgressPct` när fältet finns; behåll den som fallback när `startValue` är `undefined`

Test som konstruerar plats 9 mot topp 6 och verifierar tom stapel, plus ett som verifierar att ett uppfyllt mål ger full.

---

## 4. Vädersampel — SIFFROR TILL MIG, INGEN KALIBRERING

Knotter-grenen är byggd och stresstestet visar ingen kalibreringsförskjutning. Det säger att den inte förstör något, inte att den märks.

Forsbacka är en naturisklubb och fick `❄️ +1° · Bra is` i cupsemifinalen. Det kan vara korrekt — töväder är sannolikhetsstyrt — men jag vill se fördelningen:

- över en full säsong med en naturisklubb: hur många matcher har temperatur över noll, och hur många av dem ger `iceQuality` Poor eller Moderate
- samma sak för en konstfrusen klubb
- hur många av matcherna med aktiv töväders- eller regneffekt får en textrad som faktiskt nämner isen i matchreferatet

Rapportera de tre talen. Om svaret är "sällan och tyst" är mekaniken byggd men osynlig, och då är det ett textjobb hos mig, inte en konstantjustering hos dig.

---

## 5. Dubblett på cupkortet

`NEUTRAL PLAN` renderas två gånger på samma kort — en gång som rubriktagg, en gång i infoslingan. Verifierat i produktion på semifinalen. Behåll en. Rubriktaggen om de inte skiljer sig visuellt.

---

## Kvar efter detta

Tomma lineup-slots efter etikettfixen och en riktig 390 px-viewport. Ingen av oss kan verifiera dem — jag fick aldrig upp ett tomt slot och fönsterresizen slog inte igenom, du har ingen browser. Det är Jacobs genomspelning på telefon, och den är sista grinden före begränsad release.
