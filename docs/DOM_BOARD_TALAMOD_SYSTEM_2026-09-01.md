# DOM — BOARD-TÅLAMODET SOM ETT SYSTEM (sammanhängande pass, ersätter punktfix)

**Datum:** 2026-09-01 · **Av:** Opus · **Beslut:** Jacob (sammanhängande pass, ej punktfix på D044) · **Ersätter:** D044:s grace-period-punktfix i DOM_BOARDEXPEKTAN_TROGHET_2026-08-31.md — den flyttar bara problemet till nästa klocka.

## Diagnosen (hela `boardService.ts` läst som ETT system)

Board-tålamodet har FEM mekanismer som alla rör samma `boardPatience`, kalibrerade var för sig vid olika tillfällen, aldrig mot varandra:

1. **Säsongsslutets positionsterm** — `computeBoardPatienceUpdate`: `slope·(anchor−pos)`, WinLeague below-slope 5, en 3:e-plats = −10/säsong.
2. **Säsongsslutets objektivterm** — `bufferEligibleObjectiveDelta`, samma funktion.
3. **Meritbufferten** — CAP 20, absorberar 1–2 säsonger av (1)+(2).
4. **Löpande omgångsterm** — `updateRunningBoardPatience`: WinLeague-förlust −2,1/omgång + `losingStreakSurcharge`.
5. **Tröghets-demoteringen** — `recalibrateExpectationLadder`, sänker anchorn efter 2 'failed'-säsonger.

**Rotorsaken, systemiskt:** (1)+(4) läser bägge WinLeague-anchorn (pos 1) och straffar allt utom guld, medan (5) — den enda som gör anchorn barmhärtig — kräver 2 fullbordade säsonger. Så (4) tömmer tålamodet UNDER den andra misslyckade säsongen, innan (5) hinner sänka anchorn. Fem klockor, och den som räddar går långsammast. Tröghet-domen fixade EXPEKTATIONEN men inte de fyra andra klockorna som läser den gamla anchorn under tiden.

Det djupare felet: **anchorn är en klippa, inte en zon.** En WinLeague-klubb som slutar 2:a–4:a är exceptionell, men varje klocka behandlar den som ett misslyckande för att pos > 1. Systemet saknar begreppet "nära anchorn men inte på den" — en nästan-lyckad säsong.

## Domen — EN förlåtelse, delad av alla klockor

I stället för att lappa varje klocka: inför ett enda begrepp — **grace** — och låt alla klockor läsa det.

### 1. Grace-tillstånd (en härledning, delad)
En klubb är i GRACE när den **slutar inom ett tier av sin anchor men inte möter den** — dvs `verdict === 'failed'` MEN `finalPos` ligger inom anchor-tierns spann (WinLeague: pos 2–4; ChallengeTop: pos 5–6; osv). Det är "nästan lyckad" — precis den överpresterande-men-slippande klubben. En genuin kollaps (pos i nedre halvan / botten-3) är INTE grace.

Härled det EN gång (ny ren funktion `boardGraceState(expectation, finalPos, totalTeams)`), läs det på alla ställen. Ingen klocka får sin egen definition — det var precis felet.

### 2. Alla klockor mjuknar i grace, ingen i kollaps
- **Löpande term (4):** i grace multipliceras `RUNNING_LOSS_EXPECTATION_MULTIPLIER` ner (WinLeague 1,4 → ~0,7) och `losingStreakSurcharge` halveras. En nästan-lyckad klubb bleder långsamt, inte mot avsked. I kollaps: fullt bled, oförändrat.
- **Säsongsslutets positionsterm (1):** i grace används en tredje, mildare slope (`nearMiss`, mellan above 0 och below 5 — säg ~2) i stället för den branta below. En 3:e-plats under WinLeague blir −4/säsong, inte −10.
- **Tröghet (5):** oförändrad — 2 säsonger, men nu HINNER klubben dit, för (1) och (4) inte längre tömmer tålamodet dessförinnan. Grace är bryggan som gör tröghetens klocka nåbar.
- **Meritbuffert (3) + objektivterm (2):** orörda. Bufferten fortsätter absorbera; grace minskar bara vad den behöver absorbera.

### 3. Konsekvensen, mätt
En WinLeague-klubb som stabilt slutar topp-4 utan att vinna: bleder långsamt (grace) genom säsong 1 och 2, ÖVERLEVER till tröghetens demotering vid slutet av säsong 2, recalibreras till ChallengeTop där topp-4 = met → tålamodet återhämtar. Sparkas INTE i säsong 2. Det var D044:s krav.

## SKYDDAT — rör inte
- **Kollaps firar fortfarande.** Grace gäller BARA inom ett tier av anchorn. Botten-3 / nedre halvan får fullt bled + `consecutiveFailures`-vägen, oförändrat. En klubb som faktiskt är dålig sparkas.
- **En sanning per fråga.** `boardGraceState` är den ENDA definitionen av "nästan lyckad", precis som `BOARD_EXPECTATION_ANCHOR_POSITION` är den enda anchorn. Ingen klocka får en egen kopia — det var systemets ursprungssjuka.
- **Survive-golvet, meritbufferten, `consecutiveFailures`, tröghetens N=2** — alla intakta.
- **Framgångskurvan bevaras:** grace tar bort success-punishes-you, inte trycket. En toppklubb känner fortfarande guldförväntan (den bleder, om än långsamt) — den sparkas bara inte för en 3:e-plats.

## GODKÄNT NÄR (mät 6-säsongs dominant karriär, H5/D044-scenariot)
1. WinLeague-klubb som slutar topp-4 varje säsong utan guld: överlever till tröghetsdemoteringen, sparkas ALDRIG i säsong 2–5 för en nästan-lyckad säsong.
2. Genuin kollaps (botten-3, eller 5 raka förluster) firar fortfarande, oförändrat.
3. En enda svacka demoterar inte (tröghet N=2 intakt).
4. Survive/Heros oförändrat (grace gäller alla tiers symmetriskt, Survive-anchorn = 12 gör grace tom där — inget att räkna, korrekt).
5. Alla fyra klockor läser SAMMA `boardGraceState`, noll egna definitioner.
Magnituder (`nearMiss`-slope ~2, grace-multiplikator ~0,5) via mätning. **D-fact innan commit.**

## Ägarskap
Code: ny `boardGraceState` (en källa), wira in i `updateRunningBoardPatience` + `computeBoardPatienceUpdate`, mät mot 6-säsongssimen, D-fact på de två magnituderna. Opus: dömer utfallet om grace-multiplikatorn hamnar i gråzon (för snäll = ingen känner guldtryck; för hård = D044 kvarstår). Jacob: mandatet givet (sammanhängande pass); nästa gång du behövs är om mätningen säger att grace-bandet (ett tier) är fel bredd.
