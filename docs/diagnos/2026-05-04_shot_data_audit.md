# Shot Data Audit — 2026-05-04

Syfte: kartlägga om matchmotorn och bandygrytan-scrapern räknar skottstatistik på samma sätt, och om kalibreringen är gjord mot matchande tal.

---

## Steg 1 — matchCore-utredning

### A. Hur räknas `shotsHome/Away`?

`shotsHome/Away` inkrementeras i fyra separata kodgrenar i `simulateMatchCore` (`matchCore.ts`):

| Rad | Sekvenstyp | Villkor |
|-----|-----------|---------|
| 847 | `attack` | Straff som träffar mål eller räddas (`result.onTarget === true`) — straff räknas som shot + onTarget samtidigt |
| 856 | `attack` | Vanlig attack-chance där `chanceQuality > 0.10` och inget straff triggades |
| 921 | `transition` | Kontringssekvens, `chanceQuality > 0.05` |
| 1018 | `corner` | **Hörnmål** (non-interactive) — räknas som shots++ + onTarget++ i samma sats |
| 1066 | `halfchance` | Halvchans-sekvens |

**Hörnslag utan mål** (varken goal, save, eller corner+0.3-bandet): inget `shots++`. Hörn genererar bara ett `shots++` om det leder till mål (rad 1018).

**Sammanfattning:** `shotsHome/Away` räknar attack- och transitions-chanser + hörn**mål** + straff (om on target). Det är inte ett enkelt "antal avslut" utan snarare "antal offensiva sekvenser med chans > tröskel".

Relevant: `initialShotsHome/Away` förs över från första halvlek till andra via `secondHalfInput` (matchEngine.ts rad 79–80). `onTargetHome/Away` förs **inte** över — de initialiseras till 0 i varje anrop till `simulateMatchCore` (rad 431–432). Det innebär att `onTargetHome/Away` i `finalStep` enbart reflekterar andra halvleken.

**Konsekvens av onTarget-initiering:** `report.onTargetHome` = andra halvlekens onTarget-siffra, inte matchens totala. Detta är en bugg som existerade vid skrivtillfället. `shotsHome` är korrekt summerat (förs över), men `onTargetHome` är underskattad med ungefär hälften.

### B. Hur räknas `onTargetHome/Away`?

`onTargetHome/Away` inkrementeras vid:

| Rad | Situation |
|-----|-----------|
| 847 | Straff on target (mål eller räddning) |
| 863 | Attack-goal |
| 881 | Attack-save |
| 927 | Transition-goal |
| 945 | Transition-save |
| 1018 | **Hörnmål (non-interactive)** — räknas explicit |
| 1074 | Halfchance-goal |
| 1086 | Halfchance-save |

Kommentaren på rad 1017 i matchCore.ts är tydlig: `"Hörnmål räknas som skott och skott på mål (P2)"`. Hörnmål inkluderas alltså i onTarget.

**GranskaShotmap-kommentarens påstående är felaktigt.** Kommentaren på rad 23–24 i `GranskaShotmap.tsx` lyder:

> `onTargetHome/Away in matchCore only counts non-corner shots on target — corner goals are excluded, which causes conversion% > 100% in corner-heavy matches. Use scoredCount+savedCount instead.`

Det stämmer inte med koden. Hörnmål inkluderas i onTarget sedan P2. Buggen som fick GranskaShotmap att workarounda med `scoredCount + savedCount` kan ha funnits tidigare men existerar inte längre i motorns nuvarande kod.

**Den verkliga buggen** är istället att `onTargetHome/Away` inte förs över mellan halvlekarna — se A ovan. Så `report.onTargetHome` är underskattad (andra halvleken bara), men inte p.g.a. hörnexkludering.

**Exkludering av interaktiva hörnor:** När en hörna är interaktiv (`cornerInteractionData` sätts) och resulterar i mål via `INTERACTIVE_GOAL`-actionen i matchReducer — inkrementeras varken `shotsHome` eller `onTargetHome` i matchReducer (rad 107–116 i matchReducer.ts visar att INTERACTIVE_GOAL bara ändrar score + playerGoals). Det är en faktisk exkludering: interaktiva hörn-mål saknar shots-räkning. Frekvensen är låg (max ~1–2 per match i full mode), och sker enbart i spelarens live-matcher, inte i fast-mode AI-simuleringar som ligger till grund för kalibreringen.

### C. Hur räknas `savesHome/Away`?

`savesHome/Away` beräknas i `matchEngine.ts` (rad 175–176), **inte** i matchCore:

```typescript
const savesHome = allEvents.filter(e => e.type === MatchEventType.Save && e.clubId === fixture.homeClubId).length
const savesAway = allEvents.filter(e => e.type === MatchEventType.Save && e.clubId === fixture.awayClubId).length
```

`clubId` på Save-event är `defendingClubId` — den räddande målvaktens klubb. Alltså: `savesHome` = räddningar gjorda av hemmalaget. Det är korrekt semantik.

Save-events skapas vid attack-saves (rad 887), transition-saves (rad 950), och halfchance-saves (rad 1091). Straff-saves ingår via onTarget-flaggan (sätts i `resolvePenaltyTrigger` rad 663). Corner-saves från non-interactive hörn producerar inga Save-events (det finns inget "hörnsläddning" event — hörnan som inte ger mål loggas bara som `MatchEventType.Corner`).

**Konsekvens:** `savesHome/Away` räknar öppet-spel + transitions + straff + halvchans-räddningar. Inte hörn-räddningar.

### D. Hur räknas `cornersHome/Away`?

`cornersHome/Away` inkrementeras i tre lägen:

| Rad | Situation |
|-----|-----------|
| 892 | Attack-sekvens → corner-banded (shotResult inom goalThreshold+0.45) |
| 957 | Corner-sekvens triggas (alltid, oavsett utfall) |

**Alla beviljade hörn räknas** — oavsett om de leder till mål, räddning, eller ingenting. Det är korrekta hörn-per-match-statistik.

### E. Pipeline-verifiering

`MatchStep`-fälten (`shotsHome/Away`, `onTargetHome/Away`, `cornersHome/Away`) förs från generatorn via `lastStep`/`finalStep` till `MatchReport` i matchEngine.ts (rad 100–105 och 188–191). Ingen post-process-omräkning finns för shots/corners/onTarget.

`savesHome/Away` beräknas separat i matchEngine.ts via event-filtrering (rad 175–176) — **inte** från MatchStep-ackumulatorn. Värdet kan därmed skilja sig om allEvents och MatchStep-ackumulatorerna divergerar (de gör det inte i nuläget, men det är en arkitektonisk sårbarhet).

---

## Steg 2 — scraper-utredning

### A. Event-typer i bandygrytan-API:et

Från `scrape-allsvenskan.mjs`:

```javascript
const T_GOAL       = 2
const T_CORNER     = 1
const T_SUSPENSION = 3
const T_PENALTY    = 4
const T_HALFEND    = 13
const T_SHOT       = 11
const T_SAVE       = 23
const T_FREESTROKE = 10
const T_OFFSIDE    = 107
```

`T_SHOT` (11) och `T_SAVE` (23) är separata, manuellt loggade events i matchrapporteringen-appen. De ingår **inte** automatiskt — en matcharrangör eller domare måste aktivt trycka "Skott" respektive "Räddning" under matchen.

### B. Räknas hörnmål i bandygrytans `shotsOnGoalHome/Away`?

Troligen inte systematiskt. Hörnmål i bandygrytan detekteras via proximity (ett `T_CORNER` event inom 2 minuter före ett `T_GOAL`). Dessa hörnmål loggas som `type: 'corner'` i goals-arrayen, men de ingår **inte** i `shotsOnGoalHome/Away` (som enbart räknar `T_SHOT`-events). En match som slutar 7–0 med tre hörn-mål och inga explicit loggade T_SHOT kan ha `shotsOnGoalHome = 0`.

Konkret exempel från samplade matcher:
- `matchId: 27434` (Vänerborg 2–5 Sandviken): `shotsHome: 0`, men hemmalaget scorade 2 mål inkl 1 hörnmål. T_SHOT = 0 = hörnmål loggas inte som T_SHOT.
- `matchId: 27433` (Edsbyn 10–1): `shotsHome: 2`, trots 10 mål och 3 hörnmål. T_SHOT är drastiskt lägre än mål.

### C. Täckning per match

Av 1 124 regular season-matcher har alla `shotsHome/Away`-fält (100% coverage) — men det reflekterar att fältet sätts till null → 0 om inga T_SHOT loggas. Faktisk täckning av meningsfull shot-data är lägre:

- 42,7% av matcherna: `shotsHome + shotsAway < homeScore + awayScore` (fler mål än T_SHOT-events)
- 6,4%: shots == goals (inga räddningar loggade)
- 50,9%: shots > goals (partiell räddnings-logging finns)

`avgShotsPerMatch = 10,5` är genomsnittet av T_SHOT-events per match. Det är ett svagt mått p.g.a. inkonsistent logging.

### D. Vilka metriker är faktiska kalibreringsmål i calibrate.ts?

`calibrate.ts` definierar fem TARGETS (rad 12–18):

```typescript
const TARGETS = {
  goalsPerMatch:   { target: 9.12,  tolerance: 1.5  },
  cornerGoalShare: { target: 0.222, tolerance: 0.03 },
  homeWinRate:     { target: 0.502, tolerance: 0.05 },
  drawRate:        { target: 0.116, tolerance: 0.03 },
  secondHalfShare: { target: 0.542, tolerance: 0.03 },
}
```

**Ingen skott-metrik finns i calibrate.ts TARGETS.** Skott per match, skott på mål, räddningsprocent, och konverteringsprocent är alla frånvarande som formella kalibreringsmål.

`analyze-stress.ts` rapporterar `avgOnTargetPerMatch` och `avgSavesPerMatch` i sektion A, men utan formell target-jämförelse — de visas som informativ output med kommentaren `"bandygrytan full-matcher: 15.8, Bandypuls: ~28"`. Värdet 15,8 finns inte i `bandygrytan_detailed.json` och är troligen en äldre annotation. Aktuellt beräknat värde från rådata: T_SAVE/match = 9,49, goals+saves/match = 18,61.

---

## Steg 3 — Diff-analys

### Skott-tabell

| Metrik | Motor räknar | Bandygrytan räknar | Skillnad? |
|---|---|---|---|
| `shotsHome/Away` (report) | Offensive sequences (attack/transition/halfchance) + hörn**mål** + straff-on-target. Stresstest: **23,75/match** | T_SHOT events (manuellt loggade). **10,50/match** | Dramatisk skillnad. Motor räknar ~2,3× fler "skott". Inte samma enhet. |
| `onTargetHome/Away` (report) | Goals + saves (alla typer inkl hörn**mål**, straff). **OBS: enbart 2:a halvlek** p.g.a. initialiseringsbug. Stresstest: **7,85/match** (halva matchen) | Ej definierat som separat fält — kan approximeras som goals + T_SAVE = 9,12 + 9,49 = **18,61/match** | Jämförs inte i kalibreringen, och om det vore det: skilda definitioner + halvleksbug |
| `savesHome/Away` (report) | Save-events från attack/transition/halfchance/straff. Stresstest: **6,12/match** | T_SAVE events (manuellt loggade). **9,49/match** | Motorns saves underskattar p.g.a. (a) ingen corner-save, (b) T_SAVE inkluderar corner-räddningar i bandygrytan |
| Hörn**mål** inkl. i totala skott | JA (rad 1018) | NEJ (T_SHOT exkluderar hörnmål) | Skillnad, men irrelevant för kalibreringen (shots ej kalibrerat) |
| Hörn**mål** inkl. i onTarget | JA (rad 1018) | — | Kommentaren i GranskaShotmap är **fel** |

### Klassning av kalibreringsmetriker

**OBEROENDE (skotträkning påverkar ej):**
- `goalsPerMatch` — räknas från Score-events, oberoende
- `cornerGoalShare` — räknas från `isCornerGoal`-flaggan på Goal-events, oberoende
- `penaltyGoalPct` — räknas från `isPenaltyGoal`-flaggan, oberoende
- `homeWinRate` — oberoende
- `drawRate` — oberoende
- `secondHalfShare` — oberoende
- `avgCornersPerMatch` — räknas från Corner-events, oberoende

**DIREKT BEROENDE på skotträkning:**
- `avgShotsPerMatch` — bandygrytan-värdet 10,5 är T_SHOT; motorn ger 23,75. **Används dock EJ som kalibreringsmål i calibrate.ts.**
- `avgOnTargetPerMatch` — rapporteras i analyze-stress.ts, men utan target-jämförelse. Dessutom halvleksbug.
- Konverteringsprocent (goals/shots) — implicit felaktig p.g.a. ovanstående, men ej kalibrerat.
- Räddningsprocent — inte kalibrerat.

**INDIREKT BEROENDE:**
- Inga av de fem formella kalibreringsmålen är indirekt beroende av skott-definitionen. `goalsPerMatch` påverkas inte av hur shots räknas; `cornerGoalShare` baseras på flaggor, inte shot-ratio.

### Risknivå per metrik

| Metrik | Används som kalibringsmål? | Risk för felkalibrering? |
|---|---|---|
| avgShotsPerMatch | NEJ | Ingen risk (ej mål) |
| avgOnTargetPerMatch | NEJ (informativt) | Ingen risk för kalibrering. Halvleksbug ger missvisande tal i analyze-stress output. |
| savesPerMatch | NEJ | Ingen risk (ej mål) |
| Konverteringsprocent | NEJ | Ingen risk (ej mål) |
| goalsPerMatch | JA | Ingen risk — oberoende av shots-definition |
| cornerGoalShare | JA | Ingen risk — oberoende av shots-definition |

---

## Slutsats

### Utfall: B — Motor skev, men kalibrering oberörd

Motorns skott-räkning är semantiskt olik bandygrytans T_SHOT-events. De är inte samma enhet och kan inte jämföras direkt:

- Motor `shotsHome/Away`: ~23,75/match (alla offensiva sekvenser)
- Bandygrytan T_SHOT: ~10,50/match (manuellt loggade shot-on-goal)

Motorns `onTargetHome/Away` har dessutom en initialiseringsbug som gör att siffran enbart reflekterar andra halvleken (~7,85/match uppskattning mot ~15–18 om korrekt ackumulerat).

Men ingen av dessa skillnader påverkar kalibreringen, eftersom `calibrate.ts` inte inkluderar shot-metriker som formella mål. De fem kalibrerade metrikerna (goalsPerMatch, cornerGoalShare, homeWinRate, drawRate, secondHalfShare) är alla oberoende av hur shots räknas.

**Kommentaren i GranskaShotmap.tsx (rad 23–24) är felaktig** — den påstår att hörnmål exkluderas från `onTargetHome/Away`, men koden på rad 1018 i matchCore.ts visar tydligt att hörnmål inkluderas (`"Hörnmål räknas som skott och skott på mål (P2)"`). Workaroundsn (`scoredCount + savedCount`) ger en logiskt rimlig siffra för visualisering men av fel anledning. Den verkliga avvikelsen är halvleksinitieringsbugg, inte hörnexkludering.

### Rekommenderade åtgärder (inga är kalibreringsbrytande)

1. **Fixa halvleks-initialiseringsbugg:** `onTargetHome/Away` ska initialiseras till `fhs?.onTargetHome ?? 0` och `fhs?.onTargetAway ?? 0` i `secondHalfInput` i matchEngine.ts, precis som `shotsHome/Away` redan gör. (matchEngine.ts rad 79–82)

2. **Rätta GranskaShotmap-kommentaren:** Kommentaren är missvisande och kan leda till framtida feldiagnos. `onTargetCount = scoredCount + savedCount` är inte fel som värde (det är ett korrekt mått på shots-on-target i visualiseringen), men motiveringen är fel.

3. **Överväg att kasta ut `avgShotsPerMatch` som kalibreringsmål:** `bandygrytan_detailed.json calibrationTargets.avgShotsPerMatch = 10.5` är T_SHOT-events med svag coverage, inte jämförbart med motorns shots. Om skott ska kalibreras behövs en tydlig semantisk definition av vad "skott" ska vara i motorn — och ett bandygrytan-värde som är kompatibelt.

4. **Interaktiva hörn-mål saknar shots-räkning i matchReducer:** Konsekvensen är negligibel (sker bara i live-matcher, max 1–2 gånger per match, inte i kalibreringsdata) men bör dokumenteras i LESSONS.md.

---

*Inga kodändringar gjordes. Diagnosen är baserad enbart på kodläsning och datajämförelse.*
