# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-03-27 14:18:18
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 4.55 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.6 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 30.1% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 20.6 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (30.1% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 4.55 | 4.37 | 4.67 | ✅ |
| 0-0-matcher per säsong | 0.6 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 30.1% | 28.3% | 31.2% | ❌ |
| Röda kort per match | 0.264 | 0.197 | 0.326 | ✅ |
| Toppskyttens mål (snitt) | 20.6 | 17 | 24 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 4.56 | 2 | 31.1% | 0.303 | 23 |
| 123 | 4.67 | 0 | 31.0% | 0.280 | 24 |
| 456 | 4.50 | 0 | 29.1% | 0.326 | 17 |
| 789 | 4.65 | 0 | 28.3% | 0.212 | 18 |
| 1337 | 4.37 | 1 | 31.2% | 0.197 | 21 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.0 | Hallstahammar | 37.4 | 17.8 | 85.0 | 35.2 |
| 2.8 | Storvik | 30.0 | 12.6 | 65.8 | 37.8 |
| 4.0 | Norrala | 27.0 | 11.4 | 60.4 | 45.8 |
| 4.4 | Lödöse | 26.0 | 10.8 | 57.2 | 48.4 |
| 5.0 | Gagnef | 25.0 | 10.2 | 49.4 | 44.8 |
| 5.4 | Bergsjö | 24.8 | 10.6 | 57.6 | 51.0 |
| 7.2 | Tierp | 20.2 | 7.6 | 45.0 | 48.0 |
| 8.0 | Bohus | 18.2 | 7.6 | 47.6 | 57.2 |
| 8.8 | Alfta | 18.2 | 6.4 | 33.8 | 48.8 |
| 9.2 | Skutskär | 16.0 | 5.8 | 40.8 | 57.2 |
| 10.4 | Kolbäck | 11.6 | 4.2 | 35.4 | 61.4 |
| 11.8 | Iggesund | 9.6 | 3.4 | 22.6 | 65.0 |

## Toppskyttar (bästa säsong — seed 123)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Filip Holm | Norrala | 24 |
| 2 | Hampus Nyström | Storvik | 21 |
| 3 | Mattias Lindström | Hallstahammar | 18 |
| 4 | Hampus Svensson | Hallstahammar | 17 |
| 5 | Samuel Hansson | Hallstahammar | 16 |

## Spelarbetyg (snitt, bästa säsong — seed 123)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Patrik Eriksson | Tierp | 7.19 | 22 |
| 2 | Filip Holm | Norrala | 7.16 | 22 |
| 3 | Tobias Eriksson | Storvik | 7.13 | 22 |
| 4 | Hampus Nyström | Storvik | 7.12 | 22 |
| 5 | Hampus Svensson | Hallstahammar | 7.11 | 22 |

## Flaggor

- ⚠️ Hörnmålsprocenten (30.1%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
