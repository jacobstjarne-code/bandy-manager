# MATCHFLÖDES-SPEC — Händelsedistribution per fas

**Baserat på:** 1 124 Elitserie-matcher (2019–2026), `ANALYS_MATCHMONSTER.md`, PP-analys.
**Syfte:** Komplett referens för matchEngine.ts och matchStepByStep.ts. Varje 5-minutersfas har egna sannolikheter. Code implementerar dessa som arrayer/tabeller, inte hårdkodade if-satser.

---

## 10. SLUTSPELSMODIFIERINGAR

**Källa:** `docs/data/ANALYS_SLUTSPEL.md` (68 KVF + 38 SF + 12 finaler)

Slutspelet är en ANNAN sport. Motorn måste hantera tre faser med separata konstanter.

### 10a. Fas-specifika grundkonstanter

| Konstant | Grundserie | Kvartsfinal | Semifinal | Final |
|----------|-----------|-------------|-----------|-------|
| `phaseGoalModifier` | 1.00 | 0.97 | 0.92 | **0.77** |
| `homeAdvantage` | 0.14 | **0.18** | **0.22** | **0.00** |
| `cornerGoalModifier` | 1.00 | 0.90 | 0.85 | **0.75** |
| `drawProbability` | normal | nära noll | nära noll | 0 (förlängning) |

Finalen spelas på neutral plan → homeAdvantage = 0. Målsnittet faller från 9.12 till 7.00 → phaseGoalModifier 0.77.

**Implementation:** I matchEngine.ts, multiplicera goalThreshold med `phaseGoalModifier` baserat på fixture.phase.

```typescript
type MatchPhase = 'regular' | 'quarterfinal' | 'semifinal' | 'final'

const PHASE_MODIFIERS: Record<MatchPhase, {
  goalMod: number
  homeAdv: number
  cornerMod: number
}> = {
  regular:      { goalMod: 1.00, homeAdv: 0.14, cornerMod: 1.00 },
  quarterfinal: { goalMod: 0.97, homeAdv: 0.18, cornerMod: 0.90 },
  semifinal:    { goalMod: 0.92, homeAdv: 0.22, cornerMod: 0.85 },
  final:        { goalMod: 0.77, homeAdv: 0.00, cornerMod: 0.75 },
}
```

### 10b. Comeback per fas — getSecondHalfMode() överride

| Halvtidsunderläge | Grundserie | KVF | SF | Final |
|-------------------|-----------|-----|-----|-------|
| −1 i HT → vinner | 24.5% | **13.6%** | **33.3%** | 0% |
| −2 i HT → vinner | 11.0% | **0%** | **25%** | 25% |
| −3 i HT → vinner | 3.7% | 0% | 0% | 0% |

**KVF:** −
1 = `desperate` (13.6% comeback, lägre än grundseriens 24.5%). −2 = `hopeless` (0%).
**SF:** −1 = `chasing` (33% comeback — högre än grundserien!). −2 = `chasing` (25%).
**Final:** −1 = `desperate` (0% comeback i materialet, n=12).

```typescript
function getSecondHalfMode(
  diff: number, step: number, phase: MatchPhase
): SecondHalfMode {
  if (phase === 'quarterfinal') {
    if (diff <= -2) return 'hopeless'  // 0% comeback
    if (diff <= -1) return 'desperate' // 13.6%
    if (diff >= 2) return 'cruise'
    if (diff >= 1) return 'controlling'
    return 'even_battle'
  }
  if (phase === 'semifinal') {
    if (diff <= -3) return 'desperate'
    if (diff <= -2) return 'chasing'   // 25% comeback!
    if (diff <= -1) return 'chasing'   // 33% comeback!
    if (diff >= 2) return 'controlling'
    return 'even_battle'
  }
  if (phase === 'final') {
    if (diff <= -1) return 'desperate'  // 0% comeback
    if (diff >= 2) return 'controlling'
    if (diff >= 1 && step > 45) return 'controlling'
    return 'even_battle'
  }
  // Grundserie (befintlig logik)
  if (diff <= -3) return 'desperate'
  if (diff <= -2) return 'chasing'
  if (diff >= 3) return 'cruise'
  if (diff >= 1 && step > 45) return 'controlling'
  return 'even_battle'
}
```

**`hopeless`** är nytt — bara i KVF vid −2+. Skiljer sig från `desperate` i att
commentary borde reflektera "det är över" snarare än "vi kämpar trots allt".

### 10c. First-goal-effekten per fas (REFERENS)

| Fas | Vinner | Förlorar |
|-----|--------|----------|
| Grundserie | 61.6% | 26.9% |
| Kvartsfinal | **77.9%** | 20.6% |
| Semifinal | 68.4% | 28.9% |
| Final | 66.7% | 33.3% |

Ingen direkt motorkonstant — men headlines/commentary borde använda denna kunskap.
I KVF: första målet är nästan avgörande. Commentary: "Det första målet i en kvartsfinal väger som två."

### 10d. Hemmafordel per fas

| Fas | Total hemma% | Starkast period |
|-----|-------------|------------------|
| Grundserie | 53.6% | 0–10' (55.9%) |
| Kvartsfinal | **55.5%** | 50–70' (60%) |
| Semifinal | **57.0%** | 70–80' (**76%**!) |
| Final | 54.8% | Ej relevant (neutral plan) |

Semifinalen har extrem hemmafördel i 70–80' (76%). Trolig förklaring:
publiktryck + hemmaplanserfarenhet i avgörande fas. Motorn kan använda
högre `homeAdvantage` i block 14–15 för SF-matcher.

### 10e. Hörnmål trailing-bonus per fas

| Spelläge | Grundserie | KVF | SF | Final |
|----------|-----------|-----|-----|-------|
| Underläge | 24.7% | 23.9% | 19.8% | **10.3%** |
| Ledning | 19.9% | 16.2% | 16.2% | 22.2% |

Finalen inverterar mönstret: det underliggande laget konverterar hörnor *sämre*.
Hörntrailing-bonusen (+15%) borde vara 0 eller negativ i final.

```typescript
const trailingCornerBonus = phase === 'final' ? 0.85 : 1.15
```

### 10f. Utvisningar i slutspel

Finalen har 4.08 utvisningar/match (högst) men *jämnare* fördelning — inga
extrema toppar i 80–90'. Semifinalen har 21% i 80–90' (högst av alla faser).

Kan lämnas som global vikt — skillnaden är liten nog att förenkla.

### 10g. Slutspels-narrativ

Commentary-pools borde ha slutspelsspecifika rader:
- KVF: "Det första målet väger tungt i en kvartsfinal. Historien säger att det räcker."
- KVF vid ledning HT: "97% av lagen som leder vid halvtid i kvartsfinal går vidare."
- SF comeback: "Semifinaler är inte över förrän de är över. 33% vänder från −1."
- Final: "SM-finalen. 7 mål i snitt. Varje hörna försvaras med livet."

---

## MATCHENS STRUKTUR

60 steg à 1.5 minuter = 90 minuter. Grupperat i 5-minutersblock:

| Block | Steg   | Minuter | Fas           |
|-------|--------|---------|---------------|
| 0     | 0–3    | 0–5'    | Öppning       |
| 1     | 3–6    | 5–10'   | Öppning       |
| 2     | 7–10   | 10–15'  | Etablering    |
| 3     | 10–13  | 15–20'  | Etablering    |
| 4     | 13–16  | 20–25'  | Mittfas       |
| 5     | 16–20  | 25–30'  | Mittfas       |
| 6     | 20–23  | 30–35'  | Halvtidsjakt  |
| 7     | 23–26  | 35–40'  | Halvtidsjakt  |
| 8     | 26–30  | 40–45'  | Halvtidsjakt  |
| —     | 30     | 45'     | **HALVTID**   |
| 9     | 30–33  | 45–50'  | Omstart       |
| 10    | 33–36  | 50–55'  | Press         |
| 11    | 36–40  | 55–60'  | Press         |
| 12    | 40–43  | 60–65'  | Tryck         |
| 13    | 43–46  | 65–70'  | Tryck         |
| 14    | 46–50  | 70–75'  | Slutfas       |
| 15    | 50–53  | 75–80'  | Slutfas       |
| 16    | 53–56  | 80–85'  | Slutryckning  |
| 17    | 56–60  | 85–90'  | Slutryckning  |

---

## 1. MÅLSANNOLIKHET PER BLOCK

Baserat på verklig minutfördelning (10 321 mål, 1 124 matcher = 9.12 mål/match).

| Block | Minuter | Verklig andel | Mål/match i blocket | goalWeight |
|-------|---------|--------------|---------------------|------------|
| 0     | 0–5'    | 4.9%         | 0.45                | 0.82       |
| 1     | 5–10'   | 4.8%         | 0.44                | 0.81       |
| 2     | 10–15'  | 4.9%         | 0.45                | 0.82       |
| 3     | 15–20'  | 4.9%         | 0.45                | 0.82       |
| 4     | 20–25'  | 4.9%         | 0.45                | 0.82       |
| 5     | 25–30'  | 4.9%         | 0.45                | 0.82       |
| 6     | 30–35'  | 5.0%         | 0.46                | 0.84       |
| 7     | 35–40'  | 5.0%         | 0.46                | 0.84       |
| 8     | 40–45'  | 5.9%         | 0.54                | **1.00**   |
| 9     | 45–50'  | 5.9%         | 0.54                | **1.00**   |
| 10    | 50–55'  | 5.5%         | 0.50                | 0.93       |
| 11    | 55–60'  | 5.5%         | 0.50                | 0.93       |
| 12    | 60–65'  | 5.3%         | 0.48                | 0.89       |
| 13    | 65–70'  | 5.3%         | 0.48                | 0.89       |
| 14    | 70–75'  | 5.4%         | 0.49                | 0.90       |
| 15    | 75–80'  | 5.4%         | 0.49                | 0.90       |
| 16    | 80–85'  | 6.5%         | 0.59                | **1.09**   |
| 17    | 85–90'  | 6.5%         | 0.59                | **1.09**   |

**Implementation:** `TIMING_WEIGHTS[step]` som 60-elements array, ett värde per steg.

```typescript
// Översatt till 60 steg (3.3 steg per 5-minutersblock):
const TIMING_WEIGHTS: number[] = [
  // 1:a halvlek: 39.3% av mål
  0.82, 0.82, 0.82, 0.81,  // 0-5'
  0.81, 0.81, 0.82, 0.82,  // 5-10', 10-15'
  0.82, 0.82, 0.82, 0.82,  // 15-20', 20-25'
  0.82, 0.82, 0.84, 0.84,  // 25-30', 30-35'
  0.84, 0.84, 0.84, 1.00,  // 35-40', 40-45' ← halvtidsjakt
  1.00, 1.00, 1.00, 1.00,  // halvtidsjakt peak
  1.00, 1.00, 1.00, 1.00,  // 40-45' → halvtid
  1.00, 1.00,               // halvtid
  // 2:a halvlek: 60.7% av mål
  1.00, 1.00, 1.00, 1.00,  // 45-50' omstart
  0.93, 0.93, 0.93, 0.93,  // 50-55'
  0.93, 0.93, 0.89, 0.89,  // 55-60', 60-65'
  0.89, 0.89, 0.90, 0.90,  // 65-70', 70-75'
  0.90, 0.90, 1.09, 1.09,  // 75-80', 80-85' ← slutryckning
  1.09, 1.09, 1.09, 1.09,  // 85-90'
  1.09, 1.09, 1.09, 1.09,  // slutryckning peak
]
```

**Notera:** Dessa vikter ska ge ~39% i 1:a halvlek, ~61% i 2:a. Kör calibrate.ts och iterera om det inte stämmer — vikterna ovan är utgångspunkt, inte facit.

---

## 2. UTVISNINGSSANNOLIKHET PER BLOCK

4 233 utvisningar = 3.77/match. Fördelningen stiger kraftigt mot slutet.

| Block | Minuter | Verklig andel | Utv/match | suspWeight |
|-------|---------|--------------|-----------|------------|
| 0     | 0–5'    | 2.3%         | 0.09      | 0.45       |
| 1     | 5–10'   | 2.3%         | 0.09      | 0.45       |
| 2     | 10–15'  | 3.3%         | 0.12      | 0.65       |
| 3     | 15–20'  | 3.3%         | 0.12      | 0.65       |
| 4     | 20–25'  | 4.3%         | 0.16      | 0.83       |
| 5     | 25–30'  | 4.3%         | 0.16      | 0.83       |
| 6     | 30–35'  | 4.9%         | 0.18      | 0.95       |
| 7     | 35–40'  | 4.9%         | 0.18      | 0.95       |
| 8     | 40–45'  | 5.9%         | 0.22      | **1.15**   |
| 9     | 45–50'  | 5.9%         | 0.22      | **1.15**   |
| 10    | 50–55'  | 5.0%         | 0.19      | 0.97       |
| 11    | 55–60'  | 5.0%         | 0.19      | 0.97       |
| 12    | 60–65'  | 5.8%         | 0.22      | 1.13       |
| 13    | 65–70'  | 5.8%         | 0.22      | 1.13       |
| 14    | 70–75'  | 6.3%         | 0.24      | 1.22       |
| 15    | 75–80'  | 6.3%         | 0.24      | 1.22       |
| 16    | 80–85'  | 8.3%         | 0.31      | **1.61**   |
| 17    | 85–90'  | 8.3%         | 0.31      | **1.61**   |

**Implementation:** `SUSPENSION_TIMING_WEIGHTS[step]` — ny 60-elements array.

Applicera i foul-sekvensen: `foulProb * SUSPENSION_TIMING_WEIGHTS[step]`

---

## 3. POWERPLAY-EFFEKT

Under aktiv utvisning (10 min ≈ 7 steg):

| Situation | Mål/10 min | vs jämnstyrka | Modifiering |
|-----------|-----------|---------------|-------------|
| PP-laget  | 0.76      | +57%          | goalThreshold × **1.35**, defDefense × **0.85** |
| SH-laget  | 0.38      | −22%          | initiative × **0.75** (redan implementerat) |
| Jämnstyrka | 0.48     | —             | baseline |

**PP-utfall per fönster:**
- 0 mål: 48.6%
- 1 mål: 39.1%
- 2 mål: 10.2%
- 3+ mål: 2.1%

**Implementation i matchEngine.ts:**
```typescript
// I varje sekvens som beräknar goalThreshold:
const ppAttackBonus = defendingTeamHasSuspension ? 1.35 : 1.0
const effectiveDefDefense = defDefense * (defendingTeamHasSuspension ? 0.85 : 1.0)
const goalThreshold = baseThreshold * ppAttackBonus
// defDefense redan sänkt → dubbel effekt (fler chanser + farligare chanser)
```

---

## 4. SCORE-STATE-MODIFIERINGAR

Hur ställningen påverkar händelser per block.

### 4a. Hörnmålskonvertering

| Spelläge | Hörnmål% | Modifiering |
|----------|----------|-------------|
| Underläge | 24.7%   | × 1.15     |
| Jämnt    | 22.6%    | × 1.00     |
| Ledning  | 19.9%    | × 0.92     |

### 4b. Halvtidsläge → andra halvlek

| HT-marginal | Comeback% | Oavgjort% | Läge |
|-------------|-----------|-----------|------|
| −1          | 24.5%     | 13.9%     | `chasing` |
| −2          | 11.0%     | 9.0%      | `chasing` |
| −3          | 3.7%      | 3.1%      | `desperate` |
| −4+         | 1.3%      | 0.0%      | `desperate` |
| +1          | —         | —         | `controlling` |
| +2          | —         | —         | `controlling` |
| +3+         | —         | —         | `cruise` |
| 0           | —         | —         | `even_battle` |

**`desperate` vs `chasing`:**
- `chasing` (−1 till −2): goalThreshold += 0.08 för underliggande lag, foulProb += 0.05
- `desperate` (−3+): goalThreshold += 0.12, foulProb += 0.10, men commentary bör reflektera att chansen är ~4%

**`cruise` (ledning +3+):**
- goalThreshold −0.05 (spelar säkert), foulProb −0.03

**`controlling` (ledning +1 till +2, efter minut 60):**
- goalThreshold −0.03, initiative + 0.03 (håller boll)

### 4c. Första-mål-effekten (REFERENS, ej motor-ändring)

Laget som gör första mål vinner 61.6%. Ingen specifik motor-konstant behövs — detta faller ut naturligt av att det ledande laget redan har en implicit fördel (bättre lag gör fler mål).

---

## 5. HEMMAFÖRDEL PER BLOCK

| Block | Minuter | Hemma% av mål | Modifiering |
|-------|---------|--------------|-------------|
| 0–1   | 0–10'   | 55.9%        | × 1.08      |
| 2–5   | 10–30'  | 52.8%        | × 1.00      |
| 6–8   | 30–45'  | 53.4%        | × 1.01      |
| 9–11  | 45–60'  | 54.3%        | × 1.03      |
| 12–15 | 60–80'  | 52.9%        | × 1.00      |
| 16–17 | 80–90'  | 52.6%        | × 0.99      |

**Slutsats:** Hemmafordelen är starkast vid avspark och jämnar sedan ut sig. Konstant `homeAdvantage = 0.14` är en rimlig förenkling. Om man vill finslipa kan man använda `HOME_TIMING[step]` men det är låg prio.

---

## 6. INTERAKTIONSFREKVENS PER FAS

I "Full match"-läge: 3-5 interaktioner per match.

| Interaktion | Trigger | Max/match | Fas-bias |
|-------------|---------|-----------|----------|
| Hörna       | Corner-sekvens + managed club + rand < 0.35 | 3 | Jämnt fördelat |
| Straff      | Foul-sekvens + i straffområde + rand < 0.08 | 1 | Sällsynt |
| Kontring    | Transition-sekvens + rand < 0.15 | 2 | Oftare i 2:a halvlek |
| Frislag     | Foul-sekvens + farligt läge + rand < 0.12 | 1 | Mitten av matchen |
| Sista-minuten | Managed underläge + minute ≥ 82 | 1 | Block 16-17 |

**Kommentar-läge:** Alla interaktioner auto-resolvas.
**Snabb-läge:** Inga interaktioner, direkt till resultat.

---

## 7. COMMENTARY-TRIGGERS PER BLOCK

Situationskommentarer (`getMatchSituation()`) triggras var 8-12:e steg:

| Typ | Trigger-villkor | Block-bias |
|-----|----------------|------------|
| `dominating_home/away` | shotDiff > 4 efter steg 10 | Block 4+ |
| `tight` | goalTotal ≤ 1 efter steg 25 | Block 8+ |
| `opened_up` | goalTotal ≥ 6 efter steg 20 | Block 7+ |
| `atmosphere` | Var 10-15:e steg, slumpmässigt | Hela matchen |
| `player_duel` | Samma spelarpars events 2+ gånger | Block 4+ |
| `referee` | RefStyle-beroende, efter 3+ utvisningar | Block 8+ |
| `momentum_swing` | 3+ raka chanser för ett lag | Block 6+ |

Atmosfär-rader och situation-rader har **ingen minut** — de hör till matchen, inte klockan.

---

## 8. SAMMANFATTNING — Arrayer Code ska implementera

```typescript
// matchEngine.ts — ersätt befintlig TIMING_WEIGHTS
const GOAL_TIMING_WEIGHTS: number[]        // 60 element, baserat på §1
const SUSPENSION_TIMING_WEIGHTS: number[]  // 60 element, baserat på §2
const PP_ATTACK_BONUS = 1.35               // §3
const PP_DEFENSE_PENALTY = 0.85            // §3
const CORNER_TRAILING_BONUS = 1.15         // §4a
const CORNER_LEADING_PENALTY = 0.92        // §4a

// matchStepByStep.ts — uppdatera getSecondHalfMode()
type SecondHalfMode = 'chasing' | 'desperate' | 'controlling' | 'cruise' | 'even_battle'
// desperate vid diff <= -3 (3.7% comeback)
// chasing vid diff -1 till -2 (11-24% comeback)

// calibrate.ts — nya targets
calibrationTargets.goalsPerMatch = 9.12       // (var 10.0)
calibrationTargets.secondHalfShare = 0.607    // (var 0.543)
calibrationTargets.drawRate = 0.116           // (var 0.090)
calibrationTargets.avgSuspensionsPerMatch = 3.77  // NY
calibrationTargets.ppGoalsPer10Min = 0.76         // NY
```

---

## 9. VERIFIERING

Kör `calibrate.ts` efter implementation. Alla targets ska vara ✅:

| Target | Värde | Tolerans |
|--------|-------|----------|
| goalsPerMatch | 9.12 | ±1.5 |
| secondHalfShare | 60.7% | ±3% |
| homeWinRate | 50.2% | ±5% |
| drawRate | 11.6% | ±3% |
| cornerGoalShare | 22.2% | ±3% |
| avgSuspensionsPerMatch | 3.77 | ±0.5 |
| ppGoalsPer10Min | 0.76 | ±0.15 |

Om secondHalfShare fortfarande är för låg efter GOAL_TIMING_WEIGHTS: höj vikterna för block 9-17 ytterligare. Om drawRate fortfarande för låg: sänk homeAdvantage från 0.14 till 0.12.
