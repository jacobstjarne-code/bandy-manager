# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-14 11:01:15
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 5.49 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.8 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 15.6% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 25.0 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (15.6% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 5.49 | 5.11 | 5.96 | ✅ |
| 0-0-matcher per säsong | 0.8 | 0 | 1 | ✅ |
| Hörnmål (% av totalt) | 15.6% | 13.3% | 17.4% | ✅ |
| Röda kort per match | 0.941 | 0.841 | 1.053 | ⚠️ |
| Toppskyttens mål (snitt) | 25.0 | 22 | 27 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 5.96 | 0 | 15.4% | 0.856 | 24 |
| 123 | 5.58 | 1 | 16.0% | 1.015 | 22 |
| 456 | 5.28 | 1 | 13.3% | 1.053 | 27 |
| 789 | 5.53 | 1 | 17.4% | 0.841 | 25 |
| 1337 | 5.11 | 1 | 15.9% | 0.939 | 27 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.4 | Västanfors | 36.0 | 17.0 | 93.0 | 49.2 |
| 1.8 | Forsbacka | 35.4 | 16.2 | 82.6 | 39.2 |
| 4.4 | Karlsborg | 26.2 | 12.0 | 69.6 | 59.2 |
| 4.6 | Målilla | 25.4 | 10.4 | 61.0 | 53.2 |
| 4.8 | Gagnef | 26.0 | 11.4 | 70.8 | 55.0 |
| 6.4 | Hälleforsnäs | 22.4 | 9.8 | 65.0 | 62.4 |
| 7.4 | Söderfors | 20.0 | 7.8 | 57.0 | 60.0 |
| 8.0 | Skutskär | 17.2 | 6.2 | 55.0 | 69.6 |
| 8.2 | Lesjöfors | 17.0 | 7.4 | 46.6 | 59.6 |
| 8.6 | Slottsbron | 16.2 | 6.2 | 49.4 | 69.8 |
| 10.6 | Rögle | 12.8 | 4.8 | 40.4 | 69.6 |
| 11.8 | Heros | 9.4 | 3.4 | 34.6 | 78.2 |

## Toppskyttar (bästa säsong — seed 42)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Felix Åberg | Västanfors | 24 |
| 2 | Henrik Winther | Skutskär | 22 |
| 3 | Oscar Bergqvist | Forsbacka | 20 |
| 4 | Anders Molin | Västanfors | 19 |
| 5 | Patrik Sjögren | Forsbacka | 18 |

## Spelarbetyg (snitt, bästa säsong — seed 42)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Jonathan Sjögren | Forsbacka | 7.32 | 22 |
| 2 | Jonathan Ljungberg | Söderfors | 7.29 | 22 |
| 3 | Patrik Sjögren | Forsbacka | 7.17 | 22 |
| 4 | Oscar Bergqvist | Forsbacka | 7.16 | 22 |
| 5 | Timo Dahlström | Heros | 7.14 | 22 |

## Flaggor

- ⚠️ Röda kort per match (0.941) är högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
