# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-03-25 11:13:32
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 5.75 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.6 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 15.8% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 25.0 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (15.8% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 5.75 | 5.48 | 6.02 | ✅ |
| 0-0-matcher per säsong | 0.6 | 0 | 1 | ✅ |
| Hörnmål (% av totalt) | 15.8% | 14.2% | 16.8% | ✅ |
| Röda kort per match | 0.268 | 0.227 | 0.356 | ✅ |
| Toppskyttens mål (snitt) | 25.0 | 22 | 32 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 5.84 | 1 | 14.5% | 0.356 | 23 |
| 123 | 5.87 | 1 | 16.8% | 0.227 | 25 |
| 456 | 5.48 | 1 | 14.2% | 0.250 | 32 |
| 789 | 6.02 | 0 | 16.6% | 0.235 | 23 |
| 1337 | 5.56 | 0 | 16.8% | 0.273 | 22 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.8 | Hallstahammar | 34.6 | 16.6 | 96.8 | 44.8 |
| 2.0 | Storvik | 34.6 | 15.8 | 90.8 | 45.0 |
| 2.2 | Tierp | 34.0 | 15.2 | 83.6 | 41.4 |
| 5.0 | Lödöse | 23.4 | 10.4 | 65.6 | 62.0 |
| 6.0 | Norrala | 23.0 | 9.2 | 66.6 | 62.8 |
| 7.0 | Gagnef | 21.6 | 9.2 | 61.2 | 66.0 |
| 7.0 | Bergsjö | 20.8 | 8.4 | 66.6 | 66.6 |
| 7.2 | Skutskär | 19.4 | 7.6 | 55.8 | 64.2 |
| 8.6 | Alfta | 16.0 | 6.2 | 39.8 | 63.6 |
| 8.6 | Bohus | 15.4 | 6.0 | 57.4 | 80.6 |
| 10.8 | Kolbäck | 11.8 | 3.8 | 41.0 | 75.0 |
| 11.8 | Iggesund | 9.4 | 2.8 | 34.2 | 87.4 |

## Toppskyttar (bästa säsong — seed 789)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Mattias Larsson | Hallstahammar | 23 |
| 2 | Niklas Lund | Storvik | 22 |
| 3 | Oscar Wikström | Norrala | 19 |
| 4 | Mikael Lindgren | Storvik | 16 |
| 5 | Linus Jansson | Hallstahammar | 16 |

## Spelarbetyg (snitt, bästa säsong — seed 789)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Ludvig Jonsson | Skutskär | 7.39 | 22 |
| 2 | Jonas Magnusson | Kolbäck | 7.35 | 22 |
| 3 | Robert Holm | Tierp | 7.32 | 22 |
| 4 | Linus Berg | Bergsjö | 7.27 | 22 |
| 5 | Marcus Jansson | Storvik | 7.22 | 22 |

## Flaggor

- ✅ Inga avvikelser hittades — kalibreringen ser bra ut

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
