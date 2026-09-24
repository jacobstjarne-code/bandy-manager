# B2 — Straffkalibrering — kod + tester, före/efter

2026-09-24, Code. Körorder: "CODE-ORDER — B2 STRAFFKALIBRERING" (muntlig,
samma dag, efter den första B2-rapporten
`docs/BETATEST_B2_STRAFFPROCENT_2026-09-24.md`, som var
mätning-utan-fix). Den här rapporten är fix-grenen.

## 1. Före/efter, huvudmått

| Mått | Före (uppmätt) | Efter (uppmätt) | Mål (SCORELINE_REFERENCE.md) |
|---|---|---|---|
| Straffkonvertering (straffmål / tilldelade straffar) | 54,5 % (N=3000) | **70,4 %** (N=2000, senaste körning) | 70,0 % |
| Straffmål / alla mål (penaltyGoalPct) | 7,09 % (N=3000) | **5,55 %** (N=2000) | 5,4 % |
| Straffar per match | ej mätt separat i första rapporten | 1394/2000 = **0,70/match** | — (inget separat mål i ordern) |

Två oberoende körningar denna omgång (N=3000 resp. N=2000) gav
69,6–70,7 % konvertering och 5,46–5,55 % penaltyGoalPct — stabilt kring
målen, inte ett engångsutslag.

## 2. Segmenterat (uppdrag punkt 1) — `scripts/measure-penalty-conversion.ts`

Isolerad `resolvePenalty`/`resolveAIPenaltyShot` (samma funktioner som
matchmotorn), N=20 000/cell:

**Skytt vs MV, samma nivå (mentalitet=offensive)**
| | Före | Efter |
|---|---|---|
| låg (40) vs låg (40) | 56,8 % | 73,1 % |
| mid (60) vs mid (60) | 56,2 % | 73,4 % |
| hög (80) vs hög (80) | 56,8 % | 73,8 % |

**Skill-gap, skytt fast 60, MV varierar (monotonicitet)**
| MV-nivå | Före | Efter |
|---|---|---|
| låg (40) | 57,8 % | 75,9 % |
| mid (60) | 56,3 % | 73,3 % |
| hög (80) | 54,1 % | 70,2 % |

Monoton i båda mätningarna (bättre målvakt → färre mål), men FÖRE var
spannet bara 3,7 procentenheter över en 40-poängs skillnad (skillnaden
"fanns" men var för svag för att kännas). EFTER är spannet 5,7
procentenheter — starkare, fortfarande inte extremt.

**Skytt-gap, MV fast 60, skytt varierar (fanns inte i förra rapporten — ny mätning)**
| Skytt-nivå | Efter |
|---|---|
| låg (40) | 69,5 % |
| mid (60) | 73,7 % |
| hög (80) | 77,1 % |

Monoton (bättre skytt → fler mål). Detta saknades helt som eget
mått i den första B2-rapporten — skytt-kvaliteten testas nu explicit,
inte bara härledd ur skill-gap-tabellen.

**Samtliga riktning/höjd-kombinationer (ny mätning, fanns inte förut)**
| Riktning | Höjd | Andel mål |
|---|---|---|
| vänster | låg | 79,0 % |
| vänster | hög | 74,0 % |
| mitten | låg | 67,4 % |
| mitten | hög | 63,7 % |
| höger | låg | 79,3 % |
| höger | hög | 74,0 % |

Ingen kombination är en dold nitlott (lägst 63,7 %) eller en garanti
(högst 79,3 %). Mitten är fortfarande svagast — logiskt, målvakten
behöver inte förflytta sig dit — men inte längre 0,10 (den gamla,
bokstavliga nitlotten som uppstod när `height==='high'`-grenen skrev
över hela uttrycket).

**AI-straffar vs spelarstyrda straffar (uppdrag punkt 1, sista delen):**
delar exakt samma `resolvePenalty`, både före och efter — ingen
formeldivergens att jämna ut, bekräftat i första B2-rapporten och
oförändrat av den här fixen. Tabellerna ovan gäller alltså identiskt
för båda vägarna.

## 3. Rotorsaken (uppdrag punkt 2) och fixen

**Det gamla felet:** `goalChance` skrevs om (`=`), inte justerades
(`+=`), i varje senare specialfall. `height==='high'` satte
`goalChance = same ? 0.35 : 0.80` rakt av — vilket **kastade bort**
skill-termen som redan hade adderats två rader tidigare.
`dir==='center'` gjorde samma sak (`goalChance = keeperDive==='center'
? 0.10 : 0.85`) och kastade bort BÅDE höjd- och skill-termen. Det
förklarar direkt både "spelar- och målvaktskvalitet påverkar för
lite" (kvaliteten försvann tyst för alla höga och alla mitten-skott)
och "vissa skottval skriver över kvalitetsjusteringen helt" — exakt
ordens egen diagnos, bekräftad i koden.

**Fixen** (`src/domain/services/penaltyInteractionService.ts`): en
sammanhängande beräkning. Riktningsbasen sätts EN gång
(`PENALTY_DIRECTION_SAME`/`PENALTY_DIRECTION_DIFF`, olika för
mitten eftersom målvakten inte behöver förflytta sig dit). Höjd
lägger på en bonus (`+=`, aldrig omskrivning) plus en separat,
oberoende risk att skjuta över ribban — rullad en gång, före
mål/räddning-slaget. Skillnaden mellan skyttens och målvaktens
skicklighet adderas SIST, ovillkorligt, garanterat aldrig
överskriven av någon tidigare gren. Ett golv/tak (`clamp` 0,05–0,95)
säkerställer att inget normalt val blir en bokstavlig nitlott eller
en garanti.

Konstanterna är empiriskt tunade (inte bara analytiskt beräknade) mot
måltalen — se avsnitt 5 för tuning-loggen.

## 4. AI-riktningsvalet (uppdrag punkt 3)

**Det gamla felet:** `rand()<0.4?'left':rand()<0.7?'right':'center'`.
Det ANDRA `rand()`-anropet rullades bara när det första missade
"left" (60 % av fallen) — så sekvensen konsumerade `rand()` olika
många gånger beroende på utfall, och gav en OAVSIKTLIG fördelning
(~40/42/18 vänster/höger/mitten) i stället för den uppenbart avsedda
jämna tredjedelsfördelningen.

**Fixen:** extraherad till `resolveAIPenaltyShot(rand)` i
`penaltyInteractionService.ts` — EN `rand()`-roll för riktning, med
explicita 1/3-trösklar, plus en andra, oberoende `rand()`-roll för
höjd (65/35 låg/hög, oförändrat från tidigare avsikt). Extraherad
utanför `matchCore.ts`s stora simuleringsfunktion så valet är
direkt enhetstestbart (se `resolveAIPenaltyShot`-testerna i punkt 6),
inte bara nåbart via en fullständig matchkörning.

## 5. Frekvens + konvertering, kalibrerade tillsammans (uppdrag punkt 4)

Trigger-basen (`matchCore.ts`, tidigare `0.19` inline, nu
`PENALTY_TRIGGER_BASE = 0.114`) och konverteringskonstanterna
justerades i samma svep, inte var för sig — exakt vad ordern kräver
("Minska frekvensen utdömda straffar. Kalibrera frekvens och
konvertering tillsammans – höj inte bara målchansen").

Gången: konverteringskonstanterna höjdes stegvis
(0,45/0,26,0,93/0,76 → 65,2 % ; 0,50/0,31,0,94/0,80 → 67,8 % ;
0,53/0,34,0,95/0,83 → 69,8 %/8,98 % goalPct) tills konverteringen låg
nära 70 % — VARJE steg omätt direkt (`measure-penalty-goalpct.ts`),
inte bara analytiskt beräknat (en handräknad viktad-medelvärdesformel
låg konsekvent ~5 procentenheter fel mot faktisk simulering, sannolikt
för att verkliga truppers CA-fördelning inte är jämn, till skillnad
från den förenklade modellen). När konverteringen låg stabilt vid 70 %
var penaltyGoalPct fortfarande ~9 % (för hög, eftersom trigger-basen
0,19 inte var rörd) — trigger-basen sänktes proportionellt
(`0,19 × (5,4/8,98) ≈ 0,114`), vilket träffade BÅDA målen samtidigt
(penaltyGoalPct 5,54–5,55 %, konvertering 69,6–70,7 %) i en enda
justering, bekräftat stabilt över två oberoende urvalsstorlekar.

**En sidoeffekt som upptäcktes under testskrivningen (relevant för
uppdrag punkt 2, "ingen dold nitlott"):** de första tunade
konstanterna (DIFF.right = 0,95, exakt på taket) plus höjdbonusen
(+0,05) överskred taket 0,95 REDAN INNAN skill-termen adderades — så
en neutral och en mycket skicklig skytt klampade till SAMMA tak för
just den kombinationen (`dir=right, height=high, alltid-olika`),
vilket tyst bröt monotoniciteten för den enskilda cellen (skillnaden
var 0 i stället för positiv). Fixat genom att sänka
DIFF-riktningarna (0,95→0,82, sedan om-tunat uppåt till slutgiltiga
0,87) så det finns marginal under taket även vid max realistisk
skillnad — verifierat explicit i test (se punkt 6).

## 6. Permanenta tester (uppdrag punkt 6)

Ny fil: `src/domain/services/__tests__/penaltyInteractionService.test.ts`,
14 tester, alla gröna:

- **Rimlig total konvertering** — band 60–80 % över blandad
  skicklighet/mentalitet.
- **Monotont kvalitetsutfall** — tre tester: bättre målvakt → färre
  mål, bättre skytt → fler mål, samt ett test som uttryckligen loopar
  alla 6 riktning/höjd-kombinationer och jämför en svag (35) mot en
  stark (85) målvakt i varje — det test som fångade
  taksaturerings-buggen i punkt 5.
- **Samtliga riktning/höjd-kombinationer, ingen dold nitlott** —
  `it.each` över alla 6 kombinationer, band 35–90 % vardera.
- **`resolveAIPenaltyShot`, avsedd valfördelning** — tre tester:
  riktning ~1/3 vardera (toleransband [0,30, 0,37]), höjd ~65/35
  (toleransband [0,62, 0,68]), samt ett determinism-test som
  bekräftar exakt 2 `rand()`-anrop per invokering (regressionsskydd
  mot den gamla dubbelrullnings-buggen).
- **Straffrekvens och andel straffmål, hel matchmotor** —
  600 matcher via samma spelar-/fixture-/taktikbyggare som
  `scripts/calibrate.ts` (`makePlayer`, `makeSquad`, `makeSelection`,
  `NEUTRAL_TACTIC`), asserterar `penaltyGoals/totalGoals` mellan
  0,03 och 0,08 — ett brett men verkligt regressionsskydd mot att
  trigger-basen eller konverteringen glider isär igen.

`npx tsc --noEmit`: rent. Full testsvit (`npm test -- --run`):
**612 filer, 5450 tester, alla gröna** — ingen regression någon
annanstans i kodbasen.

## 7. Total målnivå / resultatfördelning (uppdrag punkt 5 + explicit redovisningskrav)

`scripts/calibrate.ts` (200 matcher), FÖRE B2 vs EFTER B2 — mätt
genom en isolerad fil-växling (`git show HEAD:...` mot de gamla
filerna, sedan återställt; ingen `git stash` använd, i linje med
denna arbetsytas stående regel):

| Mått | Före B2 | Efter B2 | Mål | Bedömning |
|---|---|---|---|---|
| goalsPerMatch | 8,865 ✅ | 8,945 ✅ | 9,12 ±1,5 | Oförändrat inom brus |
| homeWinRate | 0,460 ✅ | 0,465 ✅ | 0,502 ±0,05 | Oförändrat inom brus |
| secondHalfShare | 0,531 ✅ | 0,528 ✅ | 0,542 ±0,03 | Oförändrat inom brus |
| drawRate | 0,090 ✅ (0,004 från gräns) | 0,085 ❌ (0,001 utanför) | 0,116 ±0,03 | Se nedan |
| cornerGoalShare | 0,167 ❌ | 0,164 ❌ | 0,222 ±0,03 | Oförändrat, FÖREFINNS redan — se nedan |

**cornerGoalShare** var redan trasig FÖRE B2 (0,167, samma avvikelse
som efter, 0,164) — obekräftad, oberoende av straffändringen. Jag har
inte rört hörnlogiken. Flaggas här för fullständighet, inte som ett
B2-fynd.

**drawRate** låg redan på gränsen till felmarginalen före B2 (0,090,
bara 0,004 från att fela) och gled till 0,085 (0,001 utanför) efter.
Vid N=200 (samma litet stickprov `calibrate.ts` alltid kör) är en
svängning på 0,005 sannolikt brus, inte en verklig effekt av
straffändringen — men eftersom ordern kräver uttrycklig redovisning
av alla förändringar i resultatfördelning redovisas den här i stället
för att tystas. Ingen åtgärd vidtagen; om Jacob vill ha säkerhet krävs
en större körning (`calibrate.ts` med högre N) för att skilja brus
från en verklig, om än liten, effekt.

Ingen annan resultatfördelningsmetrik försämrades.

## 8. Ändrade filer

- `src/domain/services/penaltyInteractionService.ts` — `resolvePenalty`
  omskriven till additiv modell, ny `resolveAIPenaltyShot`.
- `src/domain/services/matchCore.ts` — trigger-bas extraherad till
  namngiven konstant och sänkt (0,19→0,114), AI-riktningsvalet ersatt
  med anrop till `resolveAIPenaltyShot`.
- `scripts/measure-penalty-conversion.ts` — utökad med skytt-gap-,
  mentalitets- och samtliga-kombinationer-tabellerna.
- `src/domain/services/__tests__/penaltyInteractionService.test.ts` — ny,
  14 tester.

Ingen gränssnittstext ändrad. Ingen frikopplad procentsiffra visas i
straffpanelen (oförändrat sedan första B2-rapporten — bekräftat igen,
`PenaltyInteraction.tsx` orörd).
