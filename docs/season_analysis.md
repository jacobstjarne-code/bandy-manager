# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-03-26 07:54:54
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 5.93 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.4 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 21.9% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 24.2 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (21.9% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 5.93 | 5.70 | 6.05 | ✅ |
| 0-0-matcher per säsong | 0.4 | 0 | 1 | ✅ |
| Hörnmål (% av totalt) | 21.9% | 21.0% | 23.6% | ⚠️ |
| Röda kort per match | 0.273 | 0.212 | 0.379 | ✅ |
| Toppskyttens mål (snitt) | 24.2 | 23 | 26 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 5.70 | 0 | 21.0% | 0.379 | 24 |
| 123 | 5.96 | 1 | 21.9% | 0.288 | 23 |
| 456 | 6.05 | 1 | 23.6% | 0.212 | 24 |
| 789 | 6.05 | 0 | 21.9% | 0.265 | 26 |
| 1337 | 5.89 | 0 | 21.0% | 0.220 | 24 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.8 | Hallstahammar | 33.2 | 15.2 | 94.2 | 48.4 |
| 2.6 | Tierp | 31.8 | 14.4 | 86.6 | 47.2 |
| 2.8 | Storvik | 30.4 | 14.0 | 86.2 | 50.6 |
| 5.6 | Lödöse | 24.4 | 10.4 | 69.6 | 66.2 |
| 5.6 | Gagnef | 24.6 | 10.8 | 65.4 | 59.6 |
| 5.6 | Bergsjö | 23.6 | 10.0 | 70.0 | 64.0 |
| 6.0 | Norrala | 22.8 | 10.0 | 67.4 | 68.6 |
| 7.8 | Bohus | 18.4 | 7.4 | 58.2 | 78.0 |
| 8.4 | Skutskär | 18.0 | 7.4 | 58.6 | 69.6 |
| 9.6 | Alfta | 15.0 | 5.4 | 44.4 | 65.6 |
| 10.4 | Kolbäck | 13.4 | 4.8 | 46.0 | 76.0 |
| 11.8 | Iggesund | 8.4 | 3.0 | 36.2 | 89.0 |

## Toppskyttar (bästa säsong — seed 789)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Mattias Svensson | Gagnef | 26 |
| 2 | Erik Ström | Hallstahammar | 21 |
| 3 | Daniel Lindgren | Hallstahammar | 20 |
| 4 | Emil Lundqvist | Storvik | 17 |
| 5 | Ludvig Söderberg | Tierp | 17 |

## Spelarbetyg (snitt, bästa säsong — seed 789)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Niklas Berglund | Skutskär | 7.38 | 22 |
| 2 | Robert Olsson | Kolbäck | 7.34 | 22 |
| 3 | Olof Magnusson | Bergsjö | 7.30 | 22 |
| 4 | Daniel Lindgren | Hallstahammar | 7.28 | 22 |
| 5 | Robert Eriksson | Gagnef | 7.25 | 22 |

## Flaggor

- ⚠️ Hörnmålsprocenten (21.9%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
