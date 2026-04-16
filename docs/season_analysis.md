# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-16 13:05:28
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 10.21 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.2 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 25.0% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 38.6 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (25.0% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 10.21 | 9.62 | 10.64 | ❌ |
| 0-0-matcher per säsong | 0.2 | 0 | 1 | ✅ |
| Hörnmål (% av totalt) | 25.0% | 22.6% | 27.5% | ⚠️ |
| Röda kort per match | 0.359 | 0.273 | 0.417 | ✅ |
| Toppskyttens mål (snitt) | 38.6 | 36 | 42 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 10.04 | 1 | 23.1% | 0.364 | 42 |
| 123 | 10.45 | 0 | 25.1% | 0.333 | 39 |
| 456 | 10.64 | 0 | 26.6% | 0.273 | 37 |
| 789 | 9.62 | 0 | 22.6% | 0.409 | 39 |
| 1337 | 10.31 | 0 | 27.5% | 0.417 | 36 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.4 | Västanfors | 37.6 | 18.6 | 155.2 | 83.2 |
| 2.0 | Forsbacka | 33.6 | 16.4 | 139.2 | 87.2 |
| 3.8 | Karlsborg | 30.2 | 14.2 | 128.4 | 99.0 |
| 4.0 | Gagnef | 28.2 | 13.4 | 122.6 | 102.2 |
| 5.8 | Målilla | 24.2 | 11.4 | 123.2 | 116.8 |
| 7.0 | Söderfors | 20.4 | 9.2 | 105.4 | 118.6 |
| 7.2 | Lesjöfors | 18.4 | 8.0 | 98.4 | 113.2 |
| 7.4 | Hälleforsnäs | 19.2 | 8.4 | 107.0 | 119.2 |
| 8.4 | Skutskär | 16.8 | 7.8 | 105.2 | 123.4 |
| 9.0 | Slottsbron | 14.6 | 7.0 | 103.4 | 126.2 |
| 11.0 | Rögle | 9.6 | 4.0 | 78.0 | 128.0 |
| 11.0 | Heros | 11.2 | 5.0 | 82.0 | 131.0 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Quentin Jonsson | Målilla | 37 |
| 2 | Hannu Kronberg | Slottsbron | 30 |
| 3 | Thomas Norén | Västanfors | 29 |
| 4 | Tomas Sundström | Forsbacka | 28 |
| 5 | Isak Engström | Gagnef | 28 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Jesper Alm | Västanfors | 7.72 | 22 |
| 2 | Isak Engström | Gagnef | 7.59 | 22 |
| 3 | Quentin Jonsson | Målilla | 7.57 | 22 |
| 4 | Magnus Rydén | Gagnef | 7.52 | 22 |
| 5 | Thomas Norén | Västanfors | 7.48 | 22 |

## Flaggor

- ❌ Målsnittet 10.2 är utanför acceptabelt intervall (3-10)
- ⚠️ Hörnmålsprocenten (25.0%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
