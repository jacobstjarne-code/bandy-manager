# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-09-18 09:23:04
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.41 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 1.2 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 22.1% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 33.4 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (22.1% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.41 | 9.39 | 9.46 | ⚠️ |
| 0-0-matcher per säsong | 1.2 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 22.1% | 20.0% | 24.6% | ⚠️ |
| Röda kort per match | 3.648 | 3.530 | 3.955 | ❌ |
| Toppskyttens mål (snitt) | 33.4 | 30 | 39 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.41 | 1 | 22.7% | 3.955 | 31 |
| 123 | 9.39 | 0 | 20.0% | 3.591 | 31 |
| 456 | 9.46 | 2 | 23.0% | 3.530 | 39 |
| 789 | 9.41 | 2 | 24.6% | 3.629 | 30 |
| 1337 | 9.39 | 1 | 20.1% | 3.538 | 36 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.0 | Västanfors | 38.6 | 18.8 | 156.2 | 85.0 |
| 2.8 | Forsbacka | 31.8 | 15.2 | 117.6 | 79.6 |
| 3.6 | Gagnef | 27.0 | 11.4 | 114.0 | 91.2 |
| 5.2 | Karlsborg | 24.8 | 11.4 | 109.8 | 104.0 |
| 5.4 | Målilla | 22.4 | 10.0 | 109.2 | 112.2 |
| 6.0 | Söderfors | 21.2 | 9.6 | 107.8 | 109.0 |
| 6.0 | Hälleforsnäs | 23.6 | 10.6 | 106.2 | 103.0 |
| 8.4 | Lesjöfors | 18.8 | 8.6 | 84.6 | 96.2 |
| 8.4 | Slottsbron | 15.8 | 7.0 | 96.2 | 114.4 |
| 9.0 | Skutskär | 15.8 | 7.4 | 96.6 | 116.4 |
| 10.4 | Heros | 13.8 | 5.8 | 68.6 | 109.8 |
| 11.8 | Rögle | 10.4 | 4.0 | 75.6 | 121.6 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Robert Berg | Söderfors | 39 |
| 2 | Niklas Lundgren | Gagnef | 39 |
| 3 | Anders Lund | Västanfors | 36 |
| 4 | Karl Petersson | Västanfors | 33 |
| 5 | Johan Lundgren | Hälleforsnäs | 30 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Anders Lund | Västanfors | 7.62 | 22 |
| 2 | William Dahlqvist | Västanfors | 7.55 | 22 |
| 3 | Karl Petersson | Västanfors | 7.43 | 22 |
| 4 | Robert Berg | Söderfors | 7.40 | 22 |
| 5 | Niklas Lundgren | Gagnef | 7.38 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.4 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (22.1%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (3.648) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
