# DOM — BOARD-FÖRVÄNTAN: TRÖG PRESTATIONS-SPÅRANDE DEMOTERING

**Datum:** 2026-08-31 · **Av:** Opus · **Beslut:** Jacob (tröghet) · **Utlöst av:** H5-renommétak-passet (Code cab2a5d8-efter): en dominant klubb sparkas i säsong 5, inte av renommétaket utan av board-förväntans asymmetriska ratchet.

## Diagnosen (kodläst, `boardService.ts`)

`generatePreSeasonMessage`/`deriveBoardAssessment` ratchetar förväntan UPP vid topp-2 (`lastSeasonPosition <= 2` → +1 steg i `EXPECTATION_LADDER`) men NER bara vid botten-3 (`>= 10` → −1). En klubb som överpresterar en säsong klättrar till WinLeague och fastnar: 3:a–9:a sänker inte förväntan, men WinLeague är BINÄRT (`expectationVerdictFromRating`: bara 1:a = "met", allt annat "failed"), så varje icke-guld blöder tålamod (anchor 1, `BOARD_PATIENCE_SLOPE.below` 5 → ~−10/säsong via `computeBoardPatienceUpdate`). Klubben är fångad — för bra för att degraderas (behöver botten-3), inte bra nog för WinLeague (behöver 1:a) — och sparkas i gapet innan den hinner kollapsa till den botten-3 som HADE sänkt förväntan. Meritbufferten (CAP 20) var byggd mot exakt detta (O5:s tre-guld-klubb) men dräneras av below-slope 5 + binär failure.

**Det är success-punishes-you — framgångskurvans motsats.** Kurvan vill att framgång skapar konkurrerande fordringar, inte att den får dig sparkad för en 3:e-plats. Rotorsaken: förväntan spårar en TOPP klubben nådde en gång, inte vad den HÅLLER.

## Domen — trög, prestations-spårande demotering

Förväntan ska EASE NER när klubben inte håller sin anchor över tid, inte bara vid kollaps. Trög (Jacobs val): två säsonger stabilt under förväntan → ett steg ner. En verklig styrelse: tålmodig men inte oändligt.

### Mekanik (Code)
- **Ny stateräknare `consecutiveExpectationMisses` på Club** (migration: default 0). Vid säsongsslut: `verdict === 'failed'` (via befintliga `expectationVerdictFromRating`) → +1; `met`/`exceeded` → nollställ. Detta är EN egen räknare, skild från `consecutiveFailures` (som räknar botten-2, den separata avskedsvägen) — "under förväntan" är inte samma som "i nedflyttningszon".
- **`TROGHET_THRESHOLD = 2`** (Jacobs tal, tunbart). När räknaren når 2 → demotera ETT steg i `EXPECTATION_LADDER` + nollställ räknaren.
- **Enda källan.** `generatePreSeasonMessage` OCH `deriveBoardAssessment` bär i dag IDENTISK ladder-logik (currentIdx, +1 om ≤2, −1 om ≥10) — dubblett. Lägg tröghets-demoteringen i en DELAD recalibreringsfunktion som båda anropar; låt dem inte driva isär (en ny bugklass annars). Den befintliga upp-ratchet (topp-2) och omedelbar-ner (botten-3) står kvar i samma delade funktion.

### Varför det inte öppnar en ny fälla (below-slope + buffert)
Demoteringen sänker anchor, och `computeBoardPatienceUpdate` läser `gap = anchor − position`. En WinLeague-klubb (anchor 1) som slutar 3:a har gap −2 → −10/säsong. Efter demotering till ChallengeTop (anchor 4) har samma 3:e-plats gap +1 → POSITIV delta, tålamodet ÅTERHÄMTAR. Demoteringen är alltså självkorrigerande via den delade anchorn — ingen separat patience-reset behövs, och den ger vägen ut innan tålamodet dör. Meritbufferten rörs inte; den fortsätter banka/förbruka som förut, ortogonal mot demoteringen.

## SKYDDAT — rör inte
- **Ett steg per trigger**, ingen kaskad. Tröskel 2 (inte 1) — en enda svacka degraderar aldrig; det krävs uthållig underprestation.
- **Upp-ratchet intakt:** en demoterad klubb som sen slutar topp-2 re-promoveras (och `consecutiveExpectationMisses` nollställs av `met`/`exceeded`, så en bra säsong bryter räkningen).
- **Survive-golvet:** kan aldrig demoteras under Survive (redan `EXPECTATION_LADDER`[0], `currentIdx > 0`-gaten).
- **Omedelbar botten-3-demotering, meritbufferten, below/above-slope, `consecutiveFailures`-avskedsvägen** — allt orört. Detta ADDERAR en väg ner, ändrar ingen befintlig.

## GODKÄNT NÄR (mät en 6-säsongs dominant karriär, H5-scenariot)
1. En klubb som stabilt slutar topp-4 men inte vinner recalibreras från WinLeague till ChallengeTop efter 2 säsonger, och sparkas INTE i säsong 5 för en 3:e-plats.
2. En enda svacka (1 säsong under anchor) demoterar inte.
3. En genuint kollapsande klubb degraderas fortfarande (via botten-3 omedelbart ELLER tröghet).
4. En demoterad klubb som återhämtar sig re-promoveras vid topp-2.
5. Survive-golvet intakt; ingen ny fälla i patiens-riktningen (below-slope återhämtar efter demotering).
Magnitud (`TROGHET_THRESHOLD`) = 2, tunbart. **D-fact.**

## Ägarskap
Code: ny `consecutiveExpectationMisses` + migration, delad recalibreringsfunktion (unifiera de två ladder-kopiorna) med tröghets-demoteringen, uppdatera anroparna (seasonEndProcessor/preseason) → mät 1–5 → D-fact → commit. Opus: dömer utfallet om det landar i gråzon (särskilt att tröskeln 2 inte gör styrelsen för flåshurtig eller för seg). Jacob: mandatet givet (trög, N=2); nästa gång du behövs är om mätningen säger att 2 känns fel.

## D044 — BYGGD MEN OTILLRÄCKLIG: TRÖGHET ÄR EN KLOCKA FÖR LÅNGSAM (2026-08-31)

Code byggde domen exakt (alla 5 GODKÄNT unit-gröna) men H5-simen firar fortfarande, nu säsong 2, via en ANNAN mekanism. Kodläst rotorsak:

**Två klockor, inte en.** Tröghets-demoteringen sitter i `recalibrateExpectationLadder` — körs vid SÄSONGSSLUT, kräver 2 fullbordade 'failed'-säsonger. Men TÅLAMODET bleder på en snabbare klocka: `updateRunningBoardPatience` per omgång (WinLeague-förlust = `-1,5 × 1,4` = −2,1 + `losingStreakSurcharge`) OCH säsongsslutets `computeBoardPatienceUpdate` (WinLeague below-slope 5, en 3:e-plats = gap −2 = −10). En klubb som överpresterat till WinLeague och slipptar till 3:a bleder tålamod till 0 UNDER sin andra misslyckade säsong — sparkas där, innan säsongsslutets demotering (som kräver just den andra säsongen fullbordad) hinner fyra. **Tröghet behöver 2 misslyckade säsonger; den andra är precis när tålamodet tar slut. Demoteringen kommer för sent — recalibrerar en förväntan för en redan sparkad manager.**

**Meta (viktigt):** detta är TREDJE lagret av board-tålamodssystemet (ratchet → fixad av denna dom; per-omgångs-decay → nu exponerad). Systemet har flera samverkande decay-mekanismer på olika klockor (per-omgångs running, säsongsslut-position, säsongsslut-objektiv, meritbuffert, tröghet-demotering, consecutiveFailures). Punkt-fixa en → nästa exponeras.

**Fix-riktning (Opus rek, Jacobs designkall):** tröghetens grace-period måste faktiskt SKYDDA klubben. Medan `consecutiveExpectationMisses >= 1` men demotering inte utlösts, och klubben slutar NÄRA sitt ankare (inom ~1 tier, ej kollaps), ska tålamodsbledet (running-loss-multiplikatorn + below-slope) MJUKAS — styrelsen ger dig en chans, firar inte. Kollaps (nedre halvan) behåller fullt bled, consecutiveFailures firar fortfarande en genuin botten-3-kollaps. Då överlever en överpresterande-men-slippande klubb till demoteringen (recalibrerar till ChallengeTop, där 3:a = met → tålamodet återhämtar). Bevarar N=2. **Alternativ:** N=1 eller flytta demoteringen till säsongsstart — enklare men ändrar Jacobs N=2. **Opus lutar mot mjuka-grace-perioden.** Men eftersom det är 3:e lagret: värt att fråga om Jacob vill ha punktfixen eller ett sammanhängande board-tålamodspass.
