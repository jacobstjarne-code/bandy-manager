# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-07-03 07:37:08
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.52 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 1.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 22.7% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 35.8 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (22.7% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.52 | 9.30 | 9.83 | ⚠️ |
| 0-0-matcher per säsong | 1.0 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 22.7% | 20.9% | 24.6% | ⚠️ |
| Röda kort per match | 2.512 | 2.311 | 2.742 | ❌ |
| Toppskyttens mål (snitt) | 35.8 | 28 | 43 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.30 | 0 | 20.9% | 2.742 | 33 |
| 123 | 9.83 | 0 | 23.3% | 2.447 | 36 |
| 456 | 9.33 | 1 | 24.6% | 2.402 | 28 |
| 789 | 9.47 | 2 | 21.8% | 2.659 | 39 |
| 1337 | 9.65 | 2 | 23.0% | 2.311 | 43 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.4 | Västanfors | 35.6 | 16.6 | 145.6 | 100.4 |
| 2.0 | Forsbacka | 32.6 | 14.4 | 124.6 | 84.0 |
| 3.2 | Karlsborg | 28.0 | 11.6 | 115.4 | 96.2 |
| 4.8 | Målilla | 24.6 | 9.8 | 120.2 | 113.2 |
| 6.2 | Hälleforsnäs | 21.8 | 8.2 | 105.0 | 109.4 |
| 6.4 | Gagnef | 22.4 | 9.4 | 105.2 | 96.6 |
| 7.6 | Skutskär | 18.6 | 7.2 | 101.2 | 111.6 |
| 7.8 | Söderfors | 18.4 | 8.0 | 98.8 | 111.2 |
| 8.0 | Lesjöfors | 20.2 | 8.0 | 90.8 | 100.2 |
| 9.6 | Slottsbron | 13.6 | 5.0 | 86.6 | 116.4 |
| 10.2 | Heros | 14.8 | 5.8 | 83.8 | 107.4 |
| 10.8 | Rögle | 13.4 | 5.2 | 79.0 | 109.6 |

## Toppskyttar (bästa säsong — seed 123)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Göran Söderberg | Målilla | 36 |
| 2 | Petri Norén | Forsbacka | 29 |
| 3 | Rasmus Eld | Forsbacka | 29 |
| 4 | Marcus Järvinen | Västanfors | 29 |
| 5 | Quentin Lundqvist | Karlsborg | 27 |

## Spelarbetyg (snitt, bästa säsong — seed 123)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Petri Norén | Forsbacka | 7.43 | 22 |
| 2 | Göran Söderberg | Målilla | 7.39 | 22 |
| 3 | Rasmus Eld | Forsbacka | 7.35 | 22 |
| 4 | Quentin Lundqvist | Karlsborg | 7.30 | 22 |
| 5 | Marcus Järvinen | Västanfors | 7.29 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.5 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (22.7%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (2.512) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
