# O5 acceptanstest — åtta säsonger, Västanfors, 20 seeds (2026-08-23)

Kört på Jacobs order, före O1: verifiera att O5:s tre krafter tillsammans (inte var för sig) uppfyller domens kriterium — "år åtta ska det finnas minst ett ekonomiskt val där båda alternativen svider" — och att ekonomin håller för varsel-mallens tredje punkt ("ett tal som betyder något"). Script: `scripts/o5-acceptance-8sasonger.ts`, 20 seeds × 8 säsonger, Västanfors (`club_vastanfors`, rykte 78, ChallengeTop — samma referensklubb som ursprungsauditens "420 tkr → 11,0 mkr").

**Huvudfynd, viktigast först: detta är inte en ekonomirapport, det är ett avskedsfynd.** 7/20 körningar (35 %) sparkas inom åtta säsonger — Västanfors, ligans lättaste klubb, inklusive säsonger med tre raka SM-guld precis innan. Se punkt 0 nedan innan resten läses — resten av rapporten (kassakurva, drift, investSurplus) besvarar de fyra beställda punkterna, men avskedsfyndet är det som faktiskt avgör om ekonomin "håller".

---

## 0. Sidofynd som överskuggar beställningen: 35 % avskedsfrekvens för ligans LÄTTASTE klubb

| Seed | Sparkad säsong | Placeringar år 1→ | Orsak |
|---|---|---|---|
| 70004 | 4 | 5, 1, 4, 9 | boardPatience≤15 |
| 70006 | 7 | 5, 2, 4, 5, 3, 3, 10 | boardPatience≤15 |
| 70007 | 8 | 3, 2, 2, 2, 5, 6, 3, 10 | boardPatience≤15 |
| 70009 | 6 | 3, 1, 2, 2, 8, 8 | boardPatience≤15 |
| 70010 | 6 | 2, 2, 2, 7, 2, 7 | boardPatience≤15 |
| 70013 | 4 | 1, 3, 6, 6 | boardPatience≤15 |
| **70014** | **6** | **1, 1, 1**, 5, 3, 8 | boardPatience≤15 |

Seed 70014 vann ligan TRE SÄSONGER I RAD (placering 1, 1, 1) — sparkades ändå två säsonger senare efter en 5:a, en 3:a och en 8:a. Samtliga sju sparkningar är `boardPatience<=15`, ingen konkurs, ingen `consecutiveFailures`.

**Rotorsak, inte verifierad men den mest sannolika mekaniska förklaringen (för Jacobs bedömning, inte min slutsats):** Västanfors förväntan är `ChallengeTop` (ankare 4). Kraft 1 (löneinflation) höjer lönegolvet med klubbens EGET rykte — och rykte växer med sportslig framgång (`seasonReputationDelta`, D028). En klubb som vinner mycket får alltså både en HÖGRE lönekostnad OCH en förväntan som redan låg på topp 4 — det finns inget "kredit"-konto som sparar tålamod från tre guld i rad; säsongsslutstermen straffar varje avvikelse från ankaret lika hårt oavsett vad som hänt innan (gap = ankare(4) − plats(8) = −4, delta = slope.below(4)×−4 = −16, samma straff en klubb utan historik hade fått). Det är precis det mönster Skutskär-auditen ville UNDVIKA i botten av tabellen (misslyckande utan sabotage) men här verkar det uppstå i TOPPEN — en framgångsrik klubb straffas för att inte vara EXAKT lika framgångsrik som förra säsongen, inte för att prestera dåligt i absoluta tal.

**Detta hade inte synts i Grind 1-passet** — det testet verifierade specifikt att en SVÅR klubb (Skutskär, AvoidBottom) kunde misslyckas rimligt. Ingen tidigare körning har testat om en LÄTT klubb kan överleva en normal svacka efter framgång. Byggs inte om, bara rapporterat — koefficientändringar är Jacobs bord, samma disciplin som Grind 1-passet.

---

## 1. Kassans kurva år 1–8

| Säsong | Median | Min | Max |
|---|---|---|---|
| 1 | 452 096 kr | −189 581 kr | 846 720 kr |
| 2 | 522 082 kr | −234 752 kr | 1 394 889 kr |
| 3 | 805 269 kr | −184 010 kr | 2 254 977 kr |
| 4 | 1 540 218 kr | −479 284 kr | 3 119 229 kr |
| 5 | 2 535 656 kr | 617 840 kr | 4 117 150 kr |
| 6 | 3 129 305 kr | 1 369 826 kr | 5 304 802 kr |
| 7 | 3 538 435 kr | 1 460 829 kr | 6 054 476 kr |
| 8 | 4 604 994 kr | 2 338 913 kr | 6 582 651 kr |

Medianen är monoton uppåt. Men **9/20 seeds (45 %) har minst en säsong där kassan faktiskt minskade** mot föregående säsong — långt ifrån den gamla "10 av 10 säsonger positiv kassaförändring" auditen beskrev. O5 gör alltså kurvan krokigare, precis som domen ville ("Inte att göra intäkterna mindre... Frågan är vad framgången kostar").

## 2. Går kassan någonsin under det billigaste tillgängliga åtagandets kostnad?

Ja, tidigt: 21 av 145 säsongssampel (alla i säsong 1–4, ingen i säsong 5+) hade minst en omgång där kassan understeg 80 000 kr (billigaste noden). Ett par seeds (t.ex. 70004) gick tydligt negativt (−193 481 kr) under en tidig svacka. **Från säsong 5 och framåt fanns aldrig ett sådant ögonblick** i något seed som nådde dit — konsekvent med att en framgångsrik klubbs ekonomi stabiliserar sig efter de första åren, precis som ursprungsauditen visade.

## 3. Anläggningsdrift som andel av intäkt, år 3 vs år 8 — metodfynd, inte ett rent svar

**Ingen körning byggde en enda anläggningsnod under åtta säsonger.** Det är inte ett fel i kraft 2 — det är en lucka i verktyget: hela `scripts/stress/`-infrastrukturen (både detta script och `npm run stress` sedan tidigare) saknar helt en byggpolicy. `builtNodeIds` var tomt i alla 20×8 sampel, trädet aldrig fullt, uppmätt drift alltid 0 kr. Kraft 2 har alltså ALDRIG körts empiriskt av någon headless simulering i det här projektet, bara verifierad via enhetstester (`economyService.test.ts`).

**Analytiskt svar i stället** (kod-verifierad konstant mot simulerad verklig intäkt, inte simulerad tillsammans): ett fullt utbyggt ordinarie träd kostar 143 400 kr/säsong (`facilityNodes.ts`, verifierat i O5-passet). Mot den FAKTISKT observerade bruttosäsongsintäkten i den här körningen (snitt 592 359 kr år 8, beräknat via `calcRoundIncome` på klubbens verkliga rykte/trupp/tabellplacering — inte financeLog, som är kapad vid 50 poster och redan tappat tidiga säsonger vid år 8): **143 400 / 592 359 ≈ 24,2 %** — under domens mål "en tredjedel" (33 %), men i samma storleksordning.

**Flaggat, inte byggt:** ska en enkel byggpolicy (bygg billigaste tillgängliga nod när kassan tillåter, utan urvalslogik) läggas till stress-infrastrukturen, så att kraft 2 kan verifieras empiriskt i framtida körningar? Det är en verktygsfråga, inte en O5-kalibreringsfråga — Jacobs bord.

## 4. investSurplus — hur ofta, och vad händer när den ignoreras?

Erbjuden i 59/145 säsongssampel (41 %) — rimligt givet Västanfors kassa passerar 2 mkr-taket runt säsong 5–6 i de flesta körningar.

**När den ignoreras (harnesset bygger inget, spenderar inget — samma "spelaren gör ingenting särskilt"): 40/59 (68 %) resolverar `failed`, 0/59 `met`, resten (19/59) saknar data (en instrumenteringslucka i scriptet — objectivet fanns i `game.boardObjectives` men motsvarande post i `boardObjectiveHistory` hittades inte för alla sampel, troligen kopplat till fall där avsked/körningens slut avbröt säsongen innan historikposten skrevs).**

Mekaniskt konsekvent: eftersom finances bara växer för en framgångsrik klubb utan utgifter att spendera på, kan `investSurplus` aldrig nå `met` (kräver `finances <= 2 mkr`) och aldrig `active` (kräver att kassan MINSKAT sen säsongsstart) — den kan bara landa på `at_risk`, som kollapsar till `failed` i den binära historiken. **Det är precis den avsedda designen** ("en full kassa ska inte längre vara konsekvenslös") — men det betyder också att en spelare som verkligen ignorerar kravet upprepade gånger ackumulerar `failed`-poster i `boardObjectiveHistory`, vilket i sin tur kostar boardPatience (`OBJECTIVE_PATIENCE_COST.failed = -5` per säsong den misslyckas) — ytterligare en bidragande faktor till punkt 0:s avskedsfynd för en klubb som byggt upp en stor kassa och sedan inte gör något åt den.

---

## Sammanfattning för Jacobs dom

Punkt 1–2 (kassakurva, tidig sårbarhet) ser ut som avsett — krokigare, verklig tidig sårbarhet, ingen konsekvenslös uppgång. Punkt 3 kunde inte verifieras empiriskt (verktygslucka, analytiskt svar ≈24 %, under målet 33 % men i rätt härad). Punkt 4 fungerar mekaniskt som designat, men bidrar troligen till punkt 0.

**Punkt 0 är den som avgör om O5 håller för O1.** En 35-procentig avskedsfrekvens för ligans lättaste klubb, inklusive efter tre raka mästerskap, är inte "ett ekonomiskt val där båda alternativen svider år åtta" — det är att klubben aldrig NÅR ett sådant val eftersom managern redan är sparkad. Om O1:s varsel-mall ska bygga på att "1,5× lön betyder något" krävs en ekonomi som håller en framgångsrik klubb vid liv länge nog för att kännas — och just nu gör den kanske inte det.
