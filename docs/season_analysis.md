# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-03-26 12:07:01
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 5.97 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.6 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 21.9% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 23.4 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (21.9% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 5.97 | 5.81 | 6.19 | ✅ |
| 0-0-matcher per säsong | 0.6 | 0 | 1 | ✅ |
| Hörnmål (% av totalt) | 21.9% | 20.7% | 23.6% | ⚠️ |
| Röda kort per match | 0.273 | 0.174 | 0.348 | ✅ |
| Toppskyttens mål (snitt) | 23.4 | 22 | 25 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 5.89 | 0 | 20.8% | 0.348 | 22 |
| 123 | 5.89 | 1 | 20.7% | 0.311 | 25 |
| 456 | 6.04 | 1 | 23.0% | 0.174 | 23 |
| 789 | 5.81 | 0 | 23.6% | 0.288 | 22 |
| 1337 | 6.19 | 1 | 21.4% | 0.242 | 25 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.8 | Hallstahammar | 35.2 | 16.2 | 97.2 | 49.0 |
| 2.4 | Storvik | 32.2 | 14.4 | 89.2 | 49.8 |
| 2.8 | Tierp | 30.4 | 13.6 | 84.0 | 48.6 |
| 5.6 | Norrala | 24.0 | 10.2 | 69.0 | 66.2 |
| 5.8 | Gagnef | 24.2 | 10.6 | 64.8 | 61.4 |
| 6.4 | Lödöse | 22.6 | 10.2 | 66.0 | 67.6 |
| 6.4 | Bergsjö | 21.6 | 8.4 | 68.0 | 66.2 |
| 7.2 | Bohus | 21.6 | 9.0 | 66.0 | 75.8 |
| 8.2 | Skutskär | 17.6 | 7.6 | 58.8 | 72.0 |
| 8.8 | Alfta | 15.4 | 6.0 | 44.4 | 66.6 |
| 11.0 | Kolbäck | 10.8 | 4.2 | 43.6 | 76.4 |
| 11.6 | Iggesund | 8.4 | 2.8 | 36.4 | 87.8 |

## Toppskyttar (bästa säsong — seed 1337)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Linus Eriksson | Storvik | 25 |
| 2 | Hampus Wikström | Hallstahammar | 21 |
| 3 | Per Berg | Norrala | 19 |
| 4 | Tobias Jansson | Tierp | 18 |
| 5 | Stefan Karlsson | Bohus | 16 |

## Spelarbetyg (snitt, bästa säsong — seed 1337)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Lars Pettersson | Iggesund | 7.66 | 22 |
| 2 | Marcus Bengtsson | Hallstahammar | 7.51 | 22 |
| 3 | Filip Hedlund | Kolbäck | 7.44 | 22 |
| 4 | Linus Lundqvist | Gagnef | 7.35 | 22 |
| 5 | Daniel Johansson | Tierp | 7.30 | 22 |

## Flaggor

- ⚠️ Hörnmålsprocenten (21.9%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
