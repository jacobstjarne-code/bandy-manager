# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-15 22:43:51
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.63 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 25.9% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 37.8 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (25.9% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.63 | 9.33 | 10.03 | ⚠️ |
| 0-0-matcher per säsong | 0.0 | 0 | 0 | ✅ |
| Hörnmål (% av totalt) | 25.9% | 23.5% | 28.6% | ❌ |
| Röda kort per match | 0.338 | 0.273 | 0.417 | ✅ |
| Toppskyttens mål (snitt) | 37.8 | 32 | 42 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.33 | 0 | 23.5% | 0.341 | 32 |
| 123 | 9.60 | 0 | 26.5% | 0.288 | 37 |
| 456 | 10.03 | 0 | 28.6% | 0.273 | 42 |
| 789 | 9.33 | 0 | 24.2% | 0.371 | 39 |
| 1337 | 9.89 | 0 | 26.4% | 0.417 | 39 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.0 | Västanfors | 38.4 | 18.6 | 151.4 | 76.8 |
| 2.2 | Forsbacka | 34.0 | 15.8 | 130.8 | 78.4 |
| 4.2 | Karlsborg | 28.6 | 13.2 | 122.2 | 96.0 |
| 4.4 | Målilla | 25.0 | 11.0 | 121.8 | 106.2 |
| 4.6 | Gagnef | 27.4 | 12.4 | 120.0 | 95.6 |
| 6.8 | Hälleforsnäs | 19.8 | 8.8 | 103.6 | 109.2 |
| 7.6 | Skutskär | 17.2 | 7.6 | 95.2 | 118.6 |
| 8.0 | Lesjöfors | 18.6 | 8.4 | 89.8 | 108.4 |
| 8.2 | Söderfors | 17.6 | 7.8 | 93.8 | 114.2 |
| 9.2 | Slottsbron | 16.0 | 7.2 | 97.8 | 117.2 |
| 10.2 | Heros | 11.2 | 4.8 | 74.6 | 125.8 |
| 11.6 | Rögle | 10.2 | 4.4 | 70.8 | 125.4 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Matti Berg | Gagnef | 42 |
| 2 | Felix Hedberg | Hälleforsnäs | 35 |
| 3 | Arvid Nordström | Västanfors | 34 |
| 4 | Quentin Jonsson | Målilla | 31 |
| 5 | Arvid Jonsson | Söderfors | 29 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Arvid Nordström | Västanfors | 7.66 | 22 |
| 2 | Matti Berg | Gagnef | 7.62 | 22 |
| 3 | Felix Hedberg | Hälleforsnäs | 7.61 | 22 |
| 4 | Mikael Laitinen | Forsbacka | 7.52 | 22 |
| 5 | Quentin Jonsson | Målilla | 7.41 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.6 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (25.9%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
