# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-03-31 00:02:04
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 4.49 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.8 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 22.0% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 21.0 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (22.0% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 4.49 | 4.13 | 4.90 | ✅ |
| 0-0-matcher per säsong | 0.8 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 22.0% | 19.5% | 24.2% | ⚠️ |
| Röda kort per match | 0.865 | 0.750 | 0.947 | ⚠️ |
| Toppskyttens mål (snitt) | 21.0 | 20 | 23 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 4.90 | 0 | 21.9% | 0.818 | 20 |
| 123 | 4.37 | 2 | 20.6% | 0.932 | 22 |
| 456 | 4.43 | 0 | 19.5% | 0.947 | 20 |
| 789 | 4.64 | 0 | 23.5% | 0.750 | 20 |
| 1337 | 4.13 | 2 | 24.2% | 0.879 | 23 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.4 | Västanfors | 34.6 | 15.6 | 76.2 | 37.6 |
| 1.8 | Forsbacka | 34.6 | 15.8 | 69.2 | 34.0 |
| 4.0 | Gagnef | 26.6 | 11.2 | 54.8 | 46.4 |
| 5.2 | Karlsborg | 24.8 | 10.4 | 56.8 | 48.4 |
| 5.6 | Hälleforsnäs | 22.8 | 8.4 | 53.6 | 47.6 |
| 5.8 | Målilla | 23.8 | 10.4 | 50.0 | 45.0 |
| 7.4 | Lesjöfors | 20.4 | 8.6 | 38.6 | 46.8 |
| 8.0 | Slottsbron | 18.0 | 6.8 | 44.8 | 56.0 |
| 8.2 | Söderfors | 17.4 | 6.4 | 41.4 | 51.8 |
| 8.6 | Skutskär | 18.4 | 7.4 | 46.4 | 54.8 |
| 10.4 | Rögle | 13.8 | 4.8 | 34.0 | 57.6 |
| 11.6 | Heros | 8.8 | 3.0 | 27.4 | 67.2 |

## Toppskyttar (bästa säsong — seed 42)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Oscar Bergqvist | Forsbacka | 20 |
| 2 | Malte Bengtsson | Forsbacka | 19 |
| 3 | Felix Åberg | Västanfors | 19 |
| 4 | Henrik Winther | Skutskär | 15 |
| 5 | Arvid Kjellberg | Slottsbron | 14 |

## Spelarbetyg (snitt, bästa säsong — seed 42)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Jonathan Sjögren | Forsbacka | 7.31 | 22 |
| 2 | Malte Bengtsson | Forsbacka | 7.19 | 22 |
| 3 | Oscar Bergqvist | Forsbacka | 7.18 | 22 |
| 4 | Sondre Westberg | Rögle | 7.14 | 22 |
| 5 | Jonathan Ljungberg | Söderfors | 7.13 | 22 |

## Flaggor

- ⚠️ Hörnmålsprocenten (22.0%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ⚠️ Röda kort per match (0.865) är högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
