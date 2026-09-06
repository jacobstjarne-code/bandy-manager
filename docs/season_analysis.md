# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-09-06 20:25:20
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.31 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 1.4 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 22.1% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 33.6 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (22.1% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.31 | 9.22 | 9.46 | ⚠️ |
| 0-0-matcher per säsong | 1.4 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 22.1% | 19.9% | 25.1% | ⚠️ |
| Röda kort per match | 2.423 | 2.364 | 2.553 | ❌ |
| Toppskyttens mål (snitt) | 33.6 | 30 | 39 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.36 | 1 | 22.5% | 2.371 | 31 |
| 123 | 9.22 | 0 | 20.6% | 2.455 | 30 |
| 456 | 9.46 | 2 | 22.4% | 2.371 | 39 |
| 789 | 9.30 | 2 | 25.1% | 2.553 | 31 |
| 1337 | 9.23 | 2 | 19.9% | 2.364 | 37 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.2 | Västanfors | 37.6 | 18.2 | 156.2 | 86.6 |
| 2.4 | Forsbacka | 32.6 | 15.6 | 119.8 | 75.0 |
| 3.8 | Gagnef | 26.8 | 11.4 | 111.2 | 89.4 |
| 5.4 | Karlsborg | 24.6 | 11.0 | 110.0 | 101.6 |
| 6.0 | Målilla | 23.2 | 10.2 | 107.4 | 111.8 |
| 6.0 | Hälleforsnäs | 21.6 | 9.4 | 102.8 | 103.8 |
| 6.8 | Söderfors | 21.0 | 9.8 | 108.2 | 108.4 |
| 7.8 | Lesjöfors | 20.2 | 9.2 | 84.2 | 95.2 |
| 8.2 | Slottsbron | 16.6 | 7.4 | 94.4 | 111.4 |
| 9.0 | Skutskär | 16.0 | 6.8 | 94.8 | 115.2 |
| 10.6 | Heros | 13.2 | 5.6 | 70.6 | 111.6 |
| 10.8 | Rögle | 10.6 | 4.4 | 69.8 | 119.4 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Niklas Lundgren | Gagnef | 39 |
| 2 | Anders Lund | Västanfors | 37 |
| 3 | Robert Berg | Söderfors | 34 |
| 4 | Edvin Molin | Forsbacka | 32 |
| 5 | Matti Söderström | Karlsborg | 31 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Anders Lund | Västanfors | 7.71 | 22 |
| 2 | Niklas Lundgren | Gagnef | 7.52 | 22 |
| 3 | William Dahlqvist | Västanfors | 7.50 | 22 |
| 4 | Arvid Engberg | Västanfors | 7.36 | 22 |
| 5 | Edvin Molin | Forsbacka | 7.34 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.3 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (22.1%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (2.423) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
