# CODE-INSTRUKTIONER — 14 april 2026 (kväll, efter dataanalys)

`npm run build && npm test` efter VARJE fix.

---

## STATUS

### ✅ KLART
- Sprint A–K (Rik matchupplevelse) — allt implementerat
- Kalibrering — 5 targets gröna
- Visuella gap — dark card på alla interaktioner, MATCHENS BERÄTTELSE-kort
- Dataanalys — 7 mönster analyserade, resultat i `docs/data/ANALYS_MATCHMONSTER.md`

---

## ❌ KVAR ATT GÖRA

### 1️⃣ KALIBRERING — Datadriven uppdatering (prio 1)

**Huvudspec:** `docs/SPEC_MATCHFLODE.md` — komplett 5-minutersblock-referens med alla sannolikheter, vikter och konstanter. Implementera det som står där.

Baserat på `ANALYS_MATCHMONSTER.md` och PP-analysen. Sex konkreta motorändringar:

#### A) TIMING_WEIGHTS uppdatering (secondHalfShare-gapet)
**Motor:** 52.6% mål i 2:a halvlek. **Verklighet:** 60.7%.

Uppdatera `TIMING_WEIGHTS` i `matchEngine.ts` baserat på verklig målltidens fördelning:

```
Period    Verklig%   Nuvarande vikt   Ny vikt (förslag)
0-14'     9.7%       0.94             0.85
15-29'    9.8%       0.97             0.86
30-44'    10.0%      1.05             0.92
45-59'    11.8%      1.08             1.12
60-74'    10.5%      1.10             1.14
75-89'    12.9%      1.15             1.28
```

Sänk 1:a halvlek, höj 2:a. Kör `calibrate.ts` tills secondHalfShare landar på ~60% (±3%).

#### B) Powerplay goalThreshold-bonus
**Motor:** Ingen direkt målchans-boost under PP. **Verklighet:** +57% målfrekvens.

I matchEngine.ts och matchStepByStep.ts, lägg till:
```typescript
// När försvarande lag har aktiv utvisning:
const ppBonus = defendingActiveSuspensions > 0 ? 1.35 : 1.0
const goalThreshold = baseThreshold * ppBonus
```

Också sänk `defDefense` med 15% under utvisning:
```typescript
const effectiveDefDefense = defDefense * (defendingActiveSuspensions > 0 ? 0.85 : 1.0)
```

**Target:** PP-laget ~0.76 mål/10 min, SH-laget ~0.38. Verifiera med `calibrate.ts` (ny sektion).

#### C) Utvisnings timing-vikter
**Motor:** Platt sannolikhet. **Verklighet:** 16.5% av utvisningar i 80-90', bara 4.5% i 0-10'.

Lägg till `SUSPENSION_TIMING_WEIGHTS` i matchEngine.ts:
```typescript
const SUSPENSION_TIMING_WEIGHTS: number[] = [
  ...Array(10).fill(0.55),  // 0-14'  (4.5%)
  ...Array(10).fill(0.75),  // 15-29' (6.6-8.5%)
  ...Array(10).fill(0.95),  // 30-44' (9.7%)
  ...Array(10).fill(1.10),  // 45-59' (11.8%)
  ...Array(10).fill(1.25),  // 60-74' (11.6%)
  ...Array(10).fill(1.55),  // 75-89' (16.5%)
]
```

Applicera: `foulProb * SUSPENSION_TIMING_WEIGHTS[step]`

**Target:** Utvisningsfördelning som matchar verkligheten (inte nödvändigt att vara exakt, men slutfasen ska ha tydligt fler).

#### D) Hörnmål trailing-bonus
**Motor:** Samma chans oavsett ställning. **Verklighet:** 24.7% vid underläge vs 19.9% vid ledning.

I corner-sekvensen, lägg till:
```typescript
const trailingBonus = isAttackingTeamTrailing ? 1.15 : (isAttackingTeamLeading ? 0.92 : 1.0)
const goalThreshold = baseCornerThreshold * trailingBonus
```

#### E) `getSecondHalfMode()` — desperate-läge
**Motor:** `chasing` vid −2+. **Verklighet:** −3 i HT vänder bara 3.7%.

```typescript
function getSecondHalfMode(managedScore: number, opponentScore: number, step: number): SecondHalfMode {
  const diff = managedScore - opponentScore
  if (diff <= -3) return 'desperate'   // NY — 3.7% comeback
  if (diff <= -2) return 'chasing'     // 11% comeback
  if (diff >= 3) return 'cruise'
  if (diff >= 1 && step > 45) return 'controlling'
  return 'even_battle'
}
```

`desperate` bör påverka commentary (resignation + desperation) men INTE sänka goalThreshold — datan visar att förloraren alltid kämpar (249 desperationsmål i 80-90').

#### F) Uppdatera calibrate.ts targets
Byt till verkliga värden från `bandygrytan_calibration_targets.json`:
- goalsPerMatch: 10.0 → **9.12** (±1.5)
- secondHalfShare: 0.543 → **0.607** (±0.03)
- drawRate: 0.090 → **0.116** (±0.03)
- Lägg till ny target: `avgSuspensionsPerMatch: 3.77` (±0.5)
- Lägg till ny target: `ppGoalRate: 0.76` per 10 min (±0.15)

### Bekräftat korrekt (INGA ändringar behövs):
- ✅ Ingen goals-breed-goals-effekt → Motorn har ingen kluster-boost, korrekt
- ✅ Hemmafördel som konstant → Förenkling OK (verklig kurva platt nog)
- ✅ Förloraren kämpar alltid → lastMinutePress-mekanik bekräftad
- ✅ First-goal-effekt 61.6% → Inga justeringar
- ✅ 0-0 förekommer aldrig → Motorns höga målantal stämmer

---

### 2️⃣ BUGGAR — speltesta och fixa

| # | Bugg | Risk |
|---|------|------|
| 1.3 | Kontraktsförnyelse fastnar | Behöver speltesta |
| 1.4 | Mecenater spawnar aldrig | Triggers ej verifierade |
| 1.5 | cupRun board objective fail | Troligen fixat |
| 1.6 | Troféer lösa på dashboard | Okänt |
| 1.14 | paddingBottom 7 skärmar | Oklart vilka åtgärdats |
| 1.16 | Cupvy saknar progress-rad | Ej implementerat |

Detaljer: `docs/SPRINT_ALLT_KVAR.md` punkt 1.3–1.16.

### 3️⃣ PARKERAT — docs/FIXSPEC_PARKERAT.md
- P1: Presskonferens som visuell scen
- P2: Transferdödline-känsla
- P3: Klubbens rykte utanför orten

---

## SPEC- OCH DATAFILER

| Fil | Innehåll |
|-----|----------|
| `docs/SPEC_MATCHFLODE.md` | 5-minutersblock-spec med sannolikheter per fas (mål, utvisningar, PP, score-state) |
| `docs/data/ANALYS_MATCHMONSTER.md` | 7 analysresultat med motorsimplikationer |
| `docs/data/bandygrytan_calibration_targets.json` | Verkliga targets (1124 matcher) |
| `docs/data/bandygrytan_detailed.json` | Per-match-data (i /tmp/, kopiera till docs/data/) |
| `docs/SPRINT_ALLT_KVAR.md` | Kvarstående buggar |
| `docs/SPEC_RIK_MATCHUPPLEVELSE.md` | Sprint A–K spec (alla implementerade) |
| `docs/FIXSPEC_PARKERAT.md` | P1–P3 (parkerat) |

## KVALITETSGATES

```bash
npm run build && npm test
node_modules/.bin/vite-node scripts/calibrate.ts
```

Alla targets ska vara ✅ efter kalibrering.
