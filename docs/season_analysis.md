# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-09-09 22:08:59
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.39 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 1.2 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 21.9% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 33.4 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (21.9% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.39 | 9.36 | 9.45 | ⚠️ |
| 0-0-matcher per säsong | 1.2 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 21.9% | 20.1% | 24.0% | ⚠️ |
| Röda kort per match | 3.608 | 3.492 | 3.879 | ❌ |
| Toppskyttens mål (snitt) | 33.4 | 30 | 39 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.36 | 1 | 22.2% | 3.879 | 30 |
| 123 | 9.36 | 0 | 20.1% | 3.598 | 31 |
| 456 | 9.41 | 2 | 23.2% | 3.515 | 39 |
| 789 | 9.45 | 2 | 24.0% | 3.492 | 31 |
| 1337 | 9.36 | 1 | 20.1% | 3.553 | 36 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.0 | Västanfors | 38.6 | 18.8 | 156.8 | 84.2 |
| 2.2 | Forsbacka | 32.0 | 15.2 | 118.2 | 78.0 |
| 3.8 | Gagnef | 27.0 | 11.4 | 113.0 | 91.4 |
| 5.0 | Karlsborg | 25.4 | 12.0 | 110.8 | 102.2 |
| 5.8 | Hälleforsnäs | 22.6 | 10.0 | 105.6 | 104.2 |
| 6.2 | Söderfors | 21.6 | 9.8 | 109.0 | 108.6 |
| 6.2 | Målilla | 22.4 | 9.8 | 107.6 | 112.4 |
| 8.4 | Lesjöfors | 19.2 | 8.6 | 84.2 | 95.4 |
| 8.6 | Slottsbron | 15.2 | 6.6 | 95.2 | 113.6 |
| 9.6 | Skutskär | 16.2 | 7.4 | 96.0 | 116.2 |
| 10.0 | Heros | 13.6 | 5.6 | 69.0 | 110.4 |
| 11.2 | Rögle | 10.2 | 4.0 | 74.2 | 123.0 |

## Toppskyttar (bästa säsong — seed 789)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Mikael Ros | Västanfors | 31 |
| 2 | Oskar Hansson | Forsbacka | 26 |
| 3 | Pontus Grahn | Söderfors | 25 |
| 4 | Nils Hård | Karlsborg | 25 |
| 5 | Sami Forsberg | Hälleforsnäs | 25 |

## Spelarbetyg (snitt, bästa säsong — seed 789)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Esa Eklund | Heros | 7.37 | 22 |
| 2 | Emil Lindström | Lesjöfors | 7.33 | 22 |
| 3 | Mikael Ros | Västanfors | 7.29 | 22 |
| 4 | Adam Eklund | Söderfors | 7.27 | 22 |
| 5 | Folke Holmberg | Forsbacka | 7.17 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.4 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (21.9%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (3.608) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
