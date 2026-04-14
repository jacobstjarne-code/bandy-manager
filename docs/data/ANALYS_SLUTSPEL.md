# Slutspelsanalys — Elitserien Herr 2019–2026
**Källa:** Grundserie 1124 + Kvartsfinaler 68 + Semis 38 + Finaler 12 matcher  
**Datum:** 14 april 2026

---

## Grundstatistik per fas

| Mått                  | Grundserie | Kvartsfinal | Semifinal | Final     |
|-----------------------|-----------|-------------|-----------|-----------|
| Mål/match             | 9.12      | 8.81        | 8.39      | **7.00**  |
| Hemmaseger            | 50.2%     | 60.3%       | 57.9%     | 50.0%     |
| Oavgjort              | 11.6%     | 1.5%        | 2.6%      | **0.0%**  |
| Bortaseger            | 38.3%     | 38.2%       | 39.5%     | 50.0%     |
| Utvisningar/match     | 3.77      | 3.18        | 3.55      | **4.08**  |
| Hörnmål%              | 22.2%     | 20.0%       | 18.8%     | **16.7%** |

**Mönster:**
- Målsnittet sjunker konsekvent: 9.12 → 8.81 → 8.39 → 7.00. Slutspelsmatcher är tätare.
- Oavgjort är nästan utraderat i slutspel (1–3%) jämfört med 11.6% i grundserien. Naturligt — slutspel avgörs via förlängning/straffar.
- Hemmafördelen i kvartsfinaler (60.3%) är klart starkare än grundserien (50.2%).
- Finalen har exakt 50/50 hemma/borta — hemmaplan spelar ingen roll i SM-final.
- Utvisningar stiger i finalen (4.08/match) trots lägre tempo. Stressrelaterade brott.
- Hörnmål% faller kraftigt från grundserie (22.2%) till final (16.7%). Defensiverna är tätare.

---

## 1. Comeback-frekvens per fas

| HT-underläge | Grundserie | Kvartsfinal | Semifinal | Final  |
|--------------|-----------|-------------|-----------|--------|
| −1 i HT      | 24.5%     | **13.6%**   | 33.3%     | 0.0%   |
| −2 i HT      | 11.0%     | **0.0%**    | 25.0%     | 25.0%  |
| −3 i HT      | 3.7%      | 0.0%        | 0.0%      | 0.0%   |

**Mönster:**
- Kvartsfinaler är brutalt slutgiltiga: 0% comeback vid −2 eller mer i HT. Lag som leder vid halvtid i KVF vinner i 97% av fallen.
- Semifinaler är överraskande öppna: 33.3% comeback vid −1, 25% vid −2. Det är lag i toppklass som aldrig ger upp.
- Finaler: n är litet (12 matcher), men −1 i HT = 100% förlust — inget comeback i SM-final vid halvtidsunderläge.
- **Motorsimplikation:** Slutspelsläge bör sänka comeback-sannolikheten i `getSecondHalfMode()` för KVF, men höja den svagt för SF (bästa lagen kämpar tillbaka).

---

## 2. Första-mål-effekten

| Fas          | Vinner  | Oavgjort | Förlorar |
|--------------|---------|----------|----------|
| Grundserie   | 61.6%   | 11.6%    | 26.9%    |
| Kvartsfinal  | **77.9%** | 1.5%   | 20.6%    |
| Semifinal    | 68.4%   | 2.6%     | 28.9%    |
| Final        | 66.7%   | 0.0%     | 33.3%    |

**Mönster:**
- Kvartsfinalen är mest "first goal wins"-betonad av alla faser (77.9%). Laget som scorer först vinner nästan fyra av fem KVF-matcher.
- Semifinal och final liknar grundserien mer (66–68%) — jämnare motstånd.
- Att finalen har 33.3% "första-mål-laget förlorar" är anmärkningsvärt. Vid n=12 matcher är det dock osäkert.
- **Motorsimplikation:** Slutspels-`homeAdvantage` kan höjas svagt för KVF-fasen. Första mål i KVF är mer avgörande.

---

## 3. Utvisningarnas minutfördelning

| Period  | Grundserie | Kvartsfinal | Semifinal | Final  |
|---------|-----------|-------------|-----------|--------|
| 0–10'   | 5%        | 4%          | 7%        | 2%     |
| 10–20'  | 7%        | 6%          | 4%        | 14%    |
| 20–30'  | 8%        | 7%          | 6%        | 6%     |
| 30–40'  | 10%       | 11%         | 6%        | 10%    |
| 40–50'  | 12%       | 11%         | 12%       | 4%     |
| 50–60'  | 10%       | 9%          | 10%       | 12%    |
| 60–70'  | 12%       | 12%         | 13%       | 18%    |
| 70–80'  | 12%       | 15%         | 9%        | 16%    |
| 80–90'  | 17%       | 18%         | **21%**   | 4%     |
| 90+'    | 8%        | 7%          | 12%       | 12%    |

**Mönster:**
- Slutfasen (80–90') dominerar konsekvent — speciellt grundserie (17%) och semifinal (21%).
- Finalen sticker ut: utvisningarna är mer jämnt spridda och relativt färre sent (4% i 80–90'). Topplagen spelar mer kontrollerat, smutsiga brott sker inte i slutskedet.
- Semifinalens topp på 21% i 80–90' förklaras av desperata lag som frispelar kontring-situationer.
- **Motorsimplikation:** Separat utvisningsvikt för slutspelsfaserna. Finalen bör ha jämnare fördelning. Semifinal: extra boost 80–90'.

---

## 4. Hörnmål vs spelläge

| Spelläge   | Grundserie | Kvartsfinal | Semifinal | Final  |
|------------|-----------|-------------|-----------|--------|
| Jämnt      | 22.6%     | 22.6%       | 20.5%     | 17.9%  |
| Ledande    | 19.9%     | **16.2%**   | 16.2%     | **22.2%** |
| Underliggande | 24.7%  | 23.9%       | 19.8%     | **10.3%** |

**Mönster:**
- Finalen inverterar det vanliga mönstret: det underliggande laget konverterar hörnor *sämre* (10.3%) — inga desperata hörnmål i final.
- I semifinal och KVF håller mönstret: underliggande lag > ledande lag.
- Hörnmål% faller generellt i tätare slutspelsmatcher — defensiverna håller tätare vid hörna.
- **Motorsimplikation:** Hörnmålssannolikheten vid `trailing` bör sänkas för `phase === 'final'`.

---

## 5. Mål-breeding

| Fas          | Lift 3 min | Lift 5 min |
|--------------|-----------|-----------|
| Grundserie   | 1.01x     | 1.04x     |
| Kvartsfinal  | 0.99x     | 1.03x     |
| Semifinal    | **1.07x** | 0.99x     |
| Final        | 1.03x     | 1.00x     |

**Mönster:**
- Ingen fas visar tydlig mål-kluster-effekt. Alla ligger kring 1.0x — slumpen dominerar.
- Seminernas svaga lift på 1.07x inom 3 min är statistiskt osäkert (n=38).
- Slutsats: ingen motorändring motiverad för kluster-effekt i slutspel.

---

## 6. Hemmafördelens kurva

| Period  | Grundserie | Kvartsfinal | Semifinal | Final  |
|---------|-----------|-------------|-----------|--------|
| 0–10'   | 56%       | 58%         | 53%       | 50%    |
| 10–20'  | 54%       | 48%         | 50%       | 64%    |
| 20–30'  | 52%       | 58%         | 60%       | 58%    |
| 30–40'  | 53%       | 47%         | 60%       | 71%    |
| 40–50'  | 54%       | 57%         | 48%       | 55%    |
| 50–60'  | 54%       | 60%         | 60%       | 38%    |
| 60–70'  | 52%       | 60%         | 56%       | 38%    |
| 70–80'  | 53%       | 52%         | **76%**   | 60%    |
| 80–90'  | 53%       | 53%         | 54%       | 50%    |
| **Tot** | **53.6%** | **55.5%**   | **57.0%** | **54.8%** |

**Mönster:**
- Hemmafördelen ökar i takt med slutspelsfas (53.6% → 55.5% → 57.0%), men finalen bryter trenden (54.8%) — final spelas på neutral plan.
- Semifinalens 76% hemma i 70–80' är extremt men n är litet (38 matcher).
- Kvartsfinalens totala 55.5% bekräftar att hemmaplan är ett reellt övertag i KVF-serier.
- **Motorsimplikation:** `homeAdvantage` bör skalas upp i KVF/SF (ca +0.03), men ned till noll för matcherna som spelas som final.

---

## 7. Blowout-dynamik

| Fas          | Desperat. mål tot | Per match |
|--------------|-------------------|-----------|
| Grundserie   | 1112              | 0.99      |
| Kvartsfinal  | 71                | 1.04      |
| Semifinal    | 33                | 0.87      |
| Final        | 6                 | 0.50      |

**Mönster:**
- Desperationsmål/match är i princip konstant (0.87–1.04) i grundserie/KVF/SF — lag kämpar alltid.
- Finalen: bara 6 desperationsmål på 12 matcher (0.5/match). Lagen är jämnare, det uppstår sällan en blowout-situation.
- I KVF slutar desperationsmålen relativt tidigt — laget som ner 3+ ger upp mentalt snabbare i en utslagsmatch.

---

## 8. Halvtidsmönster (leder i HT → vinner match)

| Spelläge i HT     | Grundserie | Kvartsfinal | Semifinal | Final  |
|-------------------|-----------|-------------|-----------|--------|
| Leder i HT → vinner | 80%     | **97%**     | **93%**   | 80%    |
| Jämnt i HT → vinner | 36%     | 67%         | 30%       | 50%    |
| Under i HT → vinner | 16%     | 12%         | **43%**   | 0%     |

**Mönster:**
- Att leda vid halvtid i KVF är nästan garanterat vinst (97%). I semi = 93%.
- "Jämnt i HT" i KVF leder faktiskt till vinst i 67% av fallen — det bättre seedade hemmalaget tar täten i andra halvlek.
- Semifinalens 43% comeback från underläge i HT är det mest extrema värdet — topplagsmentalitet, absolut inte ger upp.
- **Motorsimplikation:** Den narrativa bågen för slutspelsmatcher bör skilja sig radikalt: KVF = "leder du vid HT är det i princip klart", SF = "allt kan vändas".

---

## Sammanfattning: Motorsimplikationer för slutspel

| Finding | Aktuell motor | Rekommendation |
|---------|---------------|----------------|
| Lägre målsnitt i slutspel (7.0–8.8 vs 9.1) | Konstant matchEngine | Lägg till `phaseGoalModifier`: KVF 0.97x, SF 0.92x, Final 0.77x |
| Hemmafördel starkare i KVF/SF (55–57%) | `homeAdvantage = 0.14` | Höj till ~0.18 för KVF, ~0.22 för SF, 0 för Final |
| Comeback i KVF nära noll vid −2+ | Ej fas-specifikt | `getSecondHalfMode()` bör returnera `'desperate'` redan vid −1 i KVF |
| Comeback i SF hög vid −2 (25%) | Ej fas-specifikt | SF bör ha `'chasing'` även vid −2 |
| First goal wins 77.9% i KVF | Ej fas-specifikt | Informerar narrativ/headline snarare än motor |
| Hörnmål% faller i slutspel (22% → 17%) | Konstant | Lägg till `cornerGoalModifier` per fas |
| Finalen: 0 oavgjort, 50/50 H/B | Ej modellerat | Slutspelets matchEngine bör hantera detta korrekt (sker via playoffService) |
| Utvisningar jämnare i Final | Konstant distribution | Kan lämnas — liten effekt |
