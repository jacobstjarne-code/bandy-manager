# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-03-27 20:21:30
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 4.70 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.4 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 13.8% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 20.8 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (13.8% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 4.70 | 4.49 | 4.89 | ✅ |
| 0-0-matcher per säsong | 0.4 | 0 | 1 | ✅ |
| Hörnmål (% av totalt) | 13.8% | 13.2% | 14.7% | ✅ |
| Röda kort per match | 0.262 | 0.205 | 0.333 | ✅ |
| Toppskyttens mål (snitt) | 20.8 | 19 | 23 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 4.79 | 0 | 13.6% | 0.273 | 20 |
| 123 | 4.89 | 0 | 13.6% | 0.250 | 23 |
| 456 | 4.49 | 1 | 13.8% | 0.333 | 19 |
| 789 | 4.65 | 0 | 14.7% | 0.205 | 20 |
| 1337 | 4.69 | 1 | 13.2% | 0.250 | 22 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.6 | Storvik | 32.6 | 14.2 | 69.0 | 38.4 |
| 1.6 | Hallstahammar | 36.0 | 16.6 | 85.4 | 38.4 |
| 4.4 | Lödöse | 25.4 | 10.8 | 54.2 | 49.0 |
| 4.8 | Norrala | 25.2 | 10.4 | 59.6 | 48.4 |
| 5.6 | Gagnef | 23.2 | 9.6 | 53.2 | 51.0 |
| 6.6 | Bohus | 21.0 | 7.8 | 50.6 | 57.4 |
| 6.8 | Tierp | 21.2 | 7.8 | 45.8 | 50.6 |
| 7.0 | Bergsjö | 21.2 | 8.6 | 55.8 | 55.6 |
| 8.0 | Alfta | 19.0 | 7.2 | 39.6 | 47.4 |
| 8.6 | Skutskär | 17.2 | 6.2 | 46.4 | 58.2 |
| 11.2 | Kolbäck | 12.2 | 4.0 | 35.0 | 61.4 |
| 11.8 | Iggesund | 9.8 | 3.4 | 26.0 | 64.8 |

## Toppskyttar (bästa säsong — seed 123)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Filip Holm | Norrala | 23 |
| 2 | Hampus Nyström | Storvik | 19 |
| 3 | Viktor Wikström | Norrala | 15 |
| 4 | Mattias Lindström | Hallstahammar | 14 |
| 5 | Samuel Hansson | Hallstahammar | 13 |

## Spelarbetyg (snitt, bästa säsong — seed 123)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Olof Eriksson | Gagnef | 7.32 | 22 |
| 2 | Tobias Eriksson | Storvik | 7.22 | 22 |
| 3 | Patrik Eriksson | Tierp | 7.11 | 22 |
| 4 | Oliver Magnusson | Bergsjö | 7.05 | 22 |
| 5 | Karl Berg | Kolbäck | 7.03 | 22 |

## Flaggor

- ✅ Inga avvikelser hittades — kalibreringen ser bra ut

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
