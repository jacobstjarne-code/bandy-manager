# SPRINT 24.2 — Utvisnings-, straff- och fasdata per spelläge

**Datum:** 2026-04-20 (sent)
**Trigger:** Sprint 24-mätningen gav fem gap. Gap 3 (utvisningar 0.45 vs 3.77) och gap 5 (straff 0.3% vs 5.4%) är kopplade men oberoende fenomen. Klubbrapporter visar skev fördelning per spelläge men datan är inte normaliserad mot tid. Utan normalisering kan vi inte veta om det är domarfenomen, frustrations-/trötthets-fouls, eller vinstprocent-bias. Slutspelsdynamik är dokumenterad i `ANALYS_SLUTSPEL.md` men ej verifierat mot motorn.

**Scope:** Två nya sektioner i `scripts/analyze-stress.ts` + motsvarande extraktion från `bandygrytan_detailed.json` som referens i `scripts/calibrate_v2.ts`. INGA motorändringar.

**Syfte:** Ge Sprint 25b + 25c + eventuell 25d (slutspelsfas) **empiriskt underlag** istället för gissningar.

---

## BAKGRUND — tre hypoteser att testa

**Hypotes 1 — Vinstprocent-bias (Erik):** Topplag är sällan i underläge → fördelning verkar scoreline-känslig men är egentligen bara tid-i-läge-artefakt.

**Hypotes 2 — Domare-fas (Christoffer):** Domare bedömer annorlunda från ~minut 60. Utvisningsfrekvensen hoppar vid den brytpunkten.

**Hypotes 3 — Slutspels-dynamik:** Målsnitt faller (9.12 → 7.00), hörnmål faller (22% → 17%), utvisningar stiger i final. Motorn har `PHASE_CONSTANTS` men vet inte om värdena matchar.

Alla tre ska besvaras av samma datapass.

---

## DEL 1 — Extraktion i calibrate_v2.ts

**Fil:** `scripts/calibrate_v2.ts` (utöka)

**Indata:** `docs/data/bandygrytan_detailed.json` (1124 grundserie + 68 KVF + 38 SF + 12 final = 1242 matcher med per-minut-events)

### 1.1 Utvisningar per spelläge — normaliserat mot tid

För varje utvisning i `matches[].fouls[]`:
1. Beräkna spelläge vid utvisningsögonblicket (iterera genom `matches[].goals[]` fram till `foul.minute`, räkna fram aktuellt score)
2. Klassificera utvisande lag som **leder** / **jämnt** / **ligger under**

Parallellt, för varje match:
1. Beräkna minuter tillbringade i varje spelläge per lag genom hela matchen
2. Iterera minut för minut (1-90). Klassificera varje lag. Ackumulera.

**Rapport:**

```
UTVISNINGAR × SPELLÄGE (normaliserat mot tid)
──────────────────────────────────────────────
                    Minuter    Utvisningar   Per min    Relation
Vid ledning         X          Y             Z/min      1.0x
Vid jämnt           X          Y             Z/min      0.Xx
Vid underläge       X          Y             Z/min      0.Xx
```

**Tolkning:**
- Alla ~1.0x → jämnt fördelat, fördelningsdatan är bara vinstprocent-bias (hypotes 1 bekräftas)
- Ledning och underläge >1.3x + jämnt <0.8x → genuin spelägeskänslighet
- Asymmetri ledning vs underläge → en av "skydda ledning" eller "frustration" dominerar

### 1.2 Utvisningar × spelläge × period

10-min-buckets (0-9, 10-19, ..., 80-89). Per bucket × spelläge → utvisningar/min.

**Rapport:**

```
UTVISNINGAR × PERIOD × SPELLÄGE (per minut)
─────────────────────────────────────────────────
            0-29    30-59   60-89   90+
Ledning     0.X     0.X     0.X     0.X
Jämnt       0.X     0.X     0.X     0.X
Underläge   0.X     0.X     0.X     0.X
```

**Tolkning (Christoffers hypotes):**
- Om minut 60+ visar 1.5-2x högre frekvens än 0-29 → fas-förändring vid ~60 bekräftad
- Om jämnt stigande → ackumulativ trötthets-effekt, ingen skarp brytpunkt
- Om topp kring 40-50 (halvtid) + topp vid 80-89 → två olika fenomen (intensitet + trötthet)

### 1.3 Straff som separat fenomen

`bandygrytan_detailed.json` har `goals[]` med `type: 'penalty'` (straff som gick in). Original-datan har event-typ `"4": "Straff"` (tilldömning) men den är inte exponerad i `matches[].goals[]` eller `fouls[]`.

**Workaround:** Räkna straffmål, anta ~70% konvertering → estimera straffvolym.

För varje straffmål: spelläge + period.

**Rapport:**

```
STRAFF — FÖRDELNING (baserat på straffmål + 70% konverteringsantagande)
────────────────────────────────────────────────────
Totalt straffmål: X (Y% av mål)
Estimerat antal straffar: Z

Per spelläge (normaliserat mot tid):
  Ledning:    X/min
  Jämnt:      X/min
  Underläge:  X/min

Per period (15-min buckets):
  0-14:   X%
  15-29:  X%
  30-44:  X%
  45-59:  X%
  60-74:  X%
  75-89:  X%
```

**Tolkning:**
- Jämnt högre än ledning/underläge → straff är chans-drivna (stämmer med teorin)
- Underläge högst → desperat press genererar försvars-fouls
- Olika fördelning än utvisningar → bekräftar att det är två fenomen

### 1.4 Fas-uppdelning (slutspel vs grundserie)

Alla tre sektionerna 1.1-1.3 körs **per fas:**

```
UTVISNINGAR × FAS × SPELLÄGE (per minut)
─────────────────────────────────────────────
              Grundserie  KVF     SF      Final
Ledning       X/min       Y/min   Z/min   W/min
Jämnt         X/min       Y/min   Z/min   W/min
Underläge     X/min       Y/min   Z/min   W/min
(n matcher)   1124        68      38      12
```

Och motsvarande för straff.

**OBS:** För KVF (n=68), SF (n=38), Final (n=12) är vissa celler kraftigt begränsade. Rapportera n per cell. Cell med n<10 markeras med asterisk "(indikativt, litet urval)". Cell med n=0 visas som "—".

### 1.5 Målsnitt och hörnmål per fas (verifieringspass)

För att säkerställa att fas-uppdelningen läses korrekt, kör även:

```
MÅLSNITT × FAS (verifiering mot ANALYS_SLUTSPEL.md)
───────────────────────────────────────────────────
Grundserie:   X.XX mål/match  (target 9.12)
KVF:          X.XX             (target 8.81)
SF:           X.XX             (target 8.39)
Final:        X.XX             (target 7.00)

HÖRNMÅL% × FAS
───────────────
Grundserie:   XX.X%            (target 22.2%)
KVF:          XX.X%            (target 20.0%)
SF:           XX.X%            (target 18.8%)
Final:        XX.X%            (target 16.7%)
```

Om extrakten matchar ANALYS_SLUTSPEL.md → validering OK.
Om de inte matchar → logga och rapportera, fas-klassifikationen har en bugg.

### 1.6 Hemmafördel i slutspel — separera ranking från plansfaktor

**Problem:** Bandygrytans "KVF hemmavinst 60.3%" är en blandning av:
- Högre rankat lag har hemmaplan i spel 1, 2, 5, 7 av serien (bäst-av-7)
- Serier avslutas ofta innan alla matcher spelats → spel 1-3 överrepresenterade
- Det "bättre" laget möts därför mekaniskt oftare på hemmaplan

**Mål:** Separera plansfaktor från ranking-effekt innan vi släpper en höjd `homeAdvDelta` för slutspel.

**Metod:** För slutspelsmatcher i `bandygrytan_detailed.json`, identifiera serie-position via datum-sortering inom samma par (homeTeam/awayTeam). Spel 1 i en KVF-serie är per definition högre rankat lag på hemmaplan. Behövs ingen extern rankingdata.

**Output:**

```
HEMMAFÖRDEL I SLUTSPEL — DEKOMPONERAD
───────────────────────────────────────────
                      Spel 1   Spel 2   Spel 3   Spel 4+
KVF hemmavinst%       X%       X%       X%       X%
SF hemmavinst%        X%       X%       X%       X%
(n matcher)           Y        Y        Y        Y
```

**Tolkning:**
- Om spel 1 ≈ 60% i KVF → "hemmavinst 60.3%" är primärt rankingsbias, inte plansfaktor.
  Motorn behöver INTE en högre `homeAdvDelta` för KVF — vi behöver bara säkerställa
  att seedning är korrekt (högre rankat är alltid hemma i spel 1).
- Om spel 1 ≈ 50% men spel 2 (där lägre rankat är hemma) är låg för bortalaget →
  plansfaktor finns och är lika stor överallt.
- Om spel 1 är signifikant högre än spel 2's "lägre-rankat-hemma" siffra →
  båda finns: ranking driver det mesta, men hemmaplan har en reell effekt utöver.

Nödvändigt för Sprint 25d (fas-konstanter). Utan detta riskerar vi att kalibrera `homeAdvDelta` mot en siffra som delvis är andra variabler.

**Spel-nummer-extraktion:** För varje matchpar (A vs B eller B vs A) inom en fas och säsong, sortera på datum. Första matchen = spel 1, andra = spel 2, osv. Om sekvens hoppar (spel 1 och 5 spelades men inte 2/3/4 p.g.a. att serien avgjordes) får vi bara 2 matcher — det är OK, vi räknar dem som 1 och 2 i rapporten men flaggar att n inte är jämnt fördelat.

---

## DEL 2 — Motsvarande sektioner i analyze-stress.ts

Samma beräkningslogik som del 1, kör på `season_stats.json`.

### 2.1 Sektion F — Utvisningar × spelläge × fas (stress-data)

Output format identiskt med del 1.4 (utvisningar). Bandygrytan-referens hårdkodad från `SCORELINE_REFERENCE.md` (skriven i del 3).

### 2.2 Sektion G — Straff × spelläge × fas (stress-data)

Output format identiskt med del 1.4 (straff).

Om `isPenaltyGoal` i `season_stats.json` är ~0% (troligt — gap 5) → sektion G visar det, bekräftar 25c-jobbet.

---

## DEL 3 — Referensfil

**Fil:** `docs/data/SCORELINE_REFERENCE.md`

Innehåll: alla tabeller från del 1, i ren text + kort tolkning per sektion. Används som referens i Sprint 25b/c/d-specar. Uppdateras vid behov om bandygrytan-datan utökas framöver.

---

## DEL 4 — Gemensam utils (om praktiskt)

Om scoreline-klassificeringen blir >30 rader, bryt ut till `scripts/stress/scoreline-utils.ts`:

```ts
export function classifyAtMinute(
  goals: Array<{minute: number; team: 'home'|'away'}>,
  minute: number,
  perspective: 'home' | 'away',
): 'leading' | 'tied' | 'trailing'

export function accumulateScorelineMinutes(
  goals: Array<{minute: number; team: 'home'|'away'}>,
  totalMinutes: number = 90,
): {
  home: {leading: number; tied: number; trailing: number}
  away: {leading: number; tied: number; trailing: number}
}
```

Importeras av både `calibrate_v2.ts` och `analyze-stress.ts`. Duplicering är OK om det blir enklare.

---

## LEVERANSORDNING

1. **Del 1.5** först (verifieringspass — målsnitt + hörnmål per fas). Om värden inte matchar ANALYS_SLUTSPEL.md — STOPP, fas-klassifikationen är bugg.
2. **Del 1.1** (utvisningar × spelläge normaliserat)
3. **Del 1.2** (utvisningar × period × spelläge)
4. **Del 1.3** (straff)
5. **Del 1.4** (allt ovan × fas)
6. **Del 1.6** (hemmafördel i slutspel per spel-nummer)
7. **Del 3** — skriv SCORELINE_REFERENCE.md med alla tabeller
8. **Del 2** — motsvarande F och G i analyze-stress.ts
9. Audit enligt CLAUDE.md-mall

**Validering:**
- Vid minut 75 i 5-3-match, utvisning för hemmalaget → score var 5-3 vid minut 75 → hemmalaget leder. Verifiera på 3-5 kända matcher innan rapport.
- Tie-break: om utvisning och mål båda sker minut X, anta utvisning = efter målet.
- Minut-granularitet räcker.

---

## VIKTIGT

- Rör inga motorkonstanter. Det är Sprint 25b/c/d.
- Dokumentera tie-break-valet i koden.
- Rapportera n per cell. Små urval markeras explicit.
- Om fas-extrakt inte matchar ANALYS_SLUTSPEL (del 1.5) — rapportera, fortsätt inte till del 1.4.

---

## EFTER 24.2

Med referensfilen på plats kan vi spec:a:

- **Sprint 25b** (utvisningsfrekvens): `scorelineFoulMultiplier` med verkliga siffror, inte gissningar
- **Sprint 25c** (straff): separera från foul-sekvens till egen trigger, frekvens kalibrerad
- **Sprint 25d** (fas-konstanter): verifiera att `PHASE_CONSTANTS` matchar slutspelsdata, justera om de inte gör det
