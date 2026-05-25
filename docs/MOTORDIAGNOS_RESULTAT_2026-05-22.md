# Motordiagnos — Resultat 2026-05-22

Svar på A–D i `BRIEF_MOTORDIAGNOS_2026-05-22.md`.
Ingen motorändring gjord. Datakällor: `matchCore.ts`, `season_stats.json`
(7 666 matcher, seeds 0–9, 5 säsonger/seed), `bandygrytan_detailed.json`
(calibrationTargets.herr, 1 124 matcher, 2019–26).

---

## A — Vad är MatchEventType.RedCard?

**Tidsbaserad utvisning (bandy-utvisning). Inte permanent uteslutning.**

Evidens från `matchCore.ts`:

```ts
// rad 1147
const duration = 3 + Math.floor(rand() * 4)   // 3, 4, 5 eller 6 steg
// rad 1149–1153
awayActiveSuspensions++
awaySuspensionTimers.push(duration)
// rad 749–761 — tick varje step, splice ut när ≤ 0
```

Step-till-minut: `minute = Math.round(step * 1.5)` (rad 673).  
Duration i realtid: **4.5–9.0 min, medel 6.75 min.**

Spelaren är INTE ute resten av matchen. Laget är understyrkt under duration,
sedan fulltaligt igen. `activeSuspensions` håller räkning; timern avkortar den.

Eventen heter `MatchEventType.RedCard` men description-fältet lyder:
`"Utvisning av [namn]"` — motorn vet vad det är. Namnvalet är ett arv.

**Ingen grad-distinktion finns.** Alla utvisningar dras från samma 3–6-steg-range.
Det täcker både 5-min och 10-min-sfären utan diskret gräns.

**Konsekvens för rapporten:** "3.489 röda kort/match ❌" mäter bandy-utvisningar
mot fotbollsmåttstock (0.1–0.5). Fel enhet på fel mätstock. Frågeställningen avgörs
under B.

---

## B — Utvisningar: grad, volym, simultana

### Volym mot rätt måttstock

Bandygrytan-data: `calibrationTargets.herr.avgSuspensionsPerMatch = 3.77`
(1 124 regularserimatcher herr, 2019–26).

| Källa | Utvisningar/match |
|-------|-------------------|
| Elitserien herr-target | **3.77** |
| Motor grundserie (6 064 matcher) | **3.80** |
| Motor totalt (7 666 matcher) | 3.74 |
| `season_analysis.md` 5 säsonger | 3.49 |

Grundseriesiffran (3.80 vs 3.77): avvikelse +0.03, +0.8 %.  
`season_analysis.md`:s 3.49 är ett litet urval (110 regularmatchar) — inte representativt.

**C-M1 är ett rapportartefakt, inte ett motorfel.**  
Volym är kalibrerad. Målstocken (0.1–0.5) är felaktig för bandy.

### Grad

Inga separata "5-min" och "10-min"-buckets i motorn. En kontinuerlig
3–6-steg-range täcker dem båda. Matchstraff (permanent) existerar inte som
motormekanik — det finns kod i `playerStateProcessor.ts` (rad 130) som nämner
att matchstraff är extremt sällsynt (~2% av utvisningar) men det är ett
post-match-bearbetningssteg, inte en motor-event-typ.

### Simultana

Approximation med 7-min aktivt fönster:
- Matcher där hemmalaget hade ≥2 aktiva samtidigt: **19.9 %**
- Matcher där bortalaget hade ≥2 aktiva samtidigt: **23.2 %**

`homePowerplayBoost` är binär (0 × eller 1.20×). Ingen extra förstärkning
om 2 spelare är ute samtidigt — det är ett designval, inte ett fel.

### Distributionsöversikt (7 666 matcher)

| Utvisningar | Matcher | Andel |
|-------------|---------|-------|
| 0 | 466 | 6.1 % |
| 1–2 | 2 040 | 26.6 % |
| 3–4 | 2 640 | 34.5 % |
| 5–6 | 1 572 | 20.5 % |
| 7+ | 948 | 12.4 % |
| Medel | — | **3.74** |
| Median | — | 3.0 |

---

## C — Mål mot rätt calibration_target

`calibrationTargets.herr.avgGoalsPerMatch = 9.12` (inte ~5.5).

| Källa | Mål/match | Diff mot 9.12 |
|-------|-----------|---------------|
| Elitserien herr-target | **9.12** | — |
| Motor grundserie (6 064) | **9.15** | +0.03 (+0.3 %) |
| Motor alla faser (7 666) | 8.99 | −0.13 (−1.4 %) |
| `season_analysis.md` 5 säsonger | 9.35 | +0.25 (litet urval) |

**C-M2 är ett rapportartefakt.** Grundserien producerar 9.15 mot target 9.12.
`season_analysis.md`:s target (~5.5) är en pre-kalibrerings-relikt. Skriptets
ideala intervall ("4–8 ✅, 8–10 ⚠️") stämmer inte mot bandygrytan-referensen.

### Halvtidsmål (sidofynd)

Motor: 47.6 % HT1 / 52.4 % HT2.  
Bandygrytan-target: `goalsSecondHalfPct = 54.2 %` → 45.8 % HT1 / 54.2 % HT2.  
Gap: motor underskattar HT2-dominans med 1.8 pp. Ej flaggat i rapport.

### Cap-effekt (sidofynd)

`MATCH_TOTAL_GOAL_CAP = 17` skapar en distribution-spike: 282 av 7 666 matcher
(3.7 %) slutade på exakt 17 mål; 0 matcher gav >17 mål. Känt designval
(`finding:049`), men skapar en icke-organisk svans. Ej ett fel — noterat.

---

## D — Hörnmål via isCornerGoal

`isCornerGoal: true` sätts kausalt på rad 1037 när ett hörnmål faktiskt inträffar.
Ingen heuristik.

| Källa | Hörnmål % av mål | Target |
|-------|-----------------|--------|
| Bandygrytan herr-target | — | **22.2 %** |
| Motor alla faser (7 666) | **22.0 %** | 22.2 % |
| Motor grundserie (6 064) | 21.9 % | 22.2 % |
| `season_analysis.md` flaggar | ⚠️ "8–18 %" | **felaktigt target** |

**C-M3 är ett rapportartefakt.** 22.0 % vs target 22.2 % — 0.2 pp avvikelse.
Kalibrerat. `season_analysis.md`:s target "8–18 %" är obsolet och fel för bandy
(hörnan är ett centralt offensivt vapen, 22 % är rätt sfär).

### Hörnor per match (sidofynd)

Motor: 16.8 hörnor/match.  
Bandygrytan-target: `avgCornersPerMatch = 17.72`.  
Gap: −0.92, **−5.2 %**. Ej flaggat i rapporten. Underproduktion i
hörnfrekvens, inte i hörnkonvertering.

---

## Sammanfattning: vad är verkligt fel?

| Rapport-flagg | Bedömning | Motivering |
|---------------|-----------|------------|
| ❌ "Röda kort 3.489 — orealistiskt högt" | **Rapportartefakt** | Motor 3.74 ≈ target 3.77. Fel måttstock i rapporten (fotboll). |
| ⚠️ "Mål/match 9.35 vs ~5.5" | **Rapportartefakt** | Grundserie 9.15 ≈ target 9.12. Pre-kalibrerings-target i rapporten. |
| ⚠️ "Hörnmål% 21.1 — utanför 8–18 %" | **Rapportartefakt** | 22.0 % ≈ target 22.2 %. Obsolet target i rapporten. |

**Inga av de tre flaggade felen i `season_analysis.md` är motorfel.**

Verkliga gap mot bandygrytan-targets (ej flaggade i rapporten):

| Mätvärde | Motor | Target | Gap |
|----------|-------|--------|-----|
| Hörnor/match | 16.8 | 17.72 | −5.2 % |
| Andel mål HT2 | 52.4 % | 54.2 % | −1.8 pp |

Båda dessa är inom "acceptabelt" men borde följa med i nästa kalibreringsrunda.

**Nästa steg (om Jacob vill agera):** Uppdatera `season_analysis.md` (eller
analysskriptet) så att det använder `calibrationTargets` från
`bandygrytan_detailed.json` som måttstock — inte de pre-kalibrerings-värden
som sitter kvar sedan mars 2026.
