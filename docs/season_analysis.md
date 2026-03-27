# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-03-27 11:02:16
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 5.95 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.4 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 22.2% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 25.6 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (22.2% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 5.95 | 5.85 | 6.08 | ✅ |
| 0-0-matcher per säsong | 0.4 | 0 | 1 | ✅ |
| Hörnmål (% av totalt) | 22.2% | 21.0% | 24.9% | ⚠️ |
| Röda kort per match | 0.274 | 0.220 | 0.356 | ✅ |
| Toppskyttens mål (snitt) | 25.6 | 21 | 31 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 6.08 | 0 | 21.4% | 0.356 | 31 |
| 123 | 6.03 | 0 | 21.4% | 0.288 | 25 |
| 456 | 5.85 | 1 | 21.0% | 0.220 | 21 |
| 789 | 5.88 | 0 | 24.9% | 0.288 | 24 |
| 1337 | 5.91 | 1 | 22.2% | 0.220 | 27 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.4 | Hallstahammar | 36.2 | 16.6 | 101.2 | 48.2 |
| 2.8 | Storvik | 30.2 | 13.0 | 83.4 | 48.6 |
| 3.4 | Norrala | 29.0 | 13.2 | 76.6 | 61.2 |
| 4.0 | Lödöse | 27.2 | 12.4 | 76.2 | 63.6 |
| 5.6 | Gagnef | 24.2 | 10.6 | 66.2 | 60.0 |
| 6.2 | Tierp | 21.6 | 8.2 | 62.0 | 63.0 |
| 6.4 | Bergsjö | 24.2 | 10.4 | 70.2 | 63.0 |
| 7.8 | Skutskär | 17.6 | 7.2 | 58.0 | 68.4 |
| 8.8 | Bohus | 18.2 | 7.8 | 63.4 | 77.2 |
| 9.0 | Alfta | 15.8 | 5.6 | 47.6 | 64.6 |
| 10.6 | Kolbäck | 11.8 | 4.4 | 47.2 | 78.6 |
| 12.0 | Iggesund | 8.0 | 2.4 | 33.4 | 89.0 |

## Toppskyttar (bästa säsong — seed 42)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Tobias Bengtsson | Norrala | 31 |
| 2 | Mattias Lindqvist | Storvik | 26 |
| 3 | Marcus Larsson | Norrala | 23 |
| 4 | Jonas Persson | Lödöse | 18 |
| 5 | Daniel Magnusson | Bergsjö | 16 |

## Spelarbetyg (snitt, bästa säsong — seed 42)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Tobias Bengtsson | Norrala | 7.44 | 22 |
| 2 | Axel Berg | Storvik | 7.44 | 22 |
| 3 | Mattias Lindqvist | Storvik | 7.36 | 22 |
| 4 | Anton Berglund | Skutskär | 7.34 | 22 |
| 5 | Mikael Söderberg | Norrala | 7.22 | 22 |

## Flaggor

- ⚠️ Hörnmålsprocenten (22.2%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
