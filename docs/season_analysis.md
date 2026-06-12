# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-06-12 00:31:33
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.52 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 1.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 22.6% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 35.2 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (22.6% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.52 | 9.23 | 9.94 | ⚠️ |
| 0-0-matcher per säsong | 1.0 | 0 | 3 | ✅ |
| Hörnmål (% av totalt) | 22.6% | 20.9% | 25.0% | ⚠️ |
| Röda kort per match | 3.609 | 3.356 | 3.932 | ❌ |
| Toppskyttens mål (snitt) | 35.2 | 27 | 44 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.36 | 0 | 20.9% | 3.932 | 31 |
| 123 | 9.94 | 0 | 23.0% | 3.432 | 34 |
| 456 | 9.23 | 1 | 25.0% | 3.780 | 27 |
| 789 | 9.39 | 1 | 21.2% | 3.545 | 40 |
| 1337 | 9.67 | 3 | 22.9% | 3.356 | 44 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.0 | Västanfors | 36.6 | 16.8 | 147.2 | 99.0 |
| 2.0 | Forsbacka | 34.2 | 15.6 | 124.0 | 84.4 |
| 3.8 | Karlsborg | 27.2 | 11.4 | 113.2 | 97.8 |
| 5.0 | Målilla | 24.2 | 9.8 | 117.4 | 110.2 |
| 5.6 | Gagnef | 24.4 | 10.4 | 106.6 | 98.0 |
| 5.6 | Hälleforsnäs | 23.4 | 9.8 | 104.6 | 106.8 |
| 7.6 | Lesjöfors | 19.6 | 7.8 | 92.8 | 102.0 |
| 8.0 | Skutskär | 18.0 | 6.6 | 102.8 | 109.8 |
| 8.8 | Söderfors | 17.0 | 6.8 | 98.6 | 111.8 |
| 9.6 | Slottsbron | 13.0 | 5.2 | 87.4 | 117.4 |
| 10.4 | Rögle | 12.8 | 5.2 | 81.6 | 111.4 |
| 10.6 | Heros | 13.6 | 5.6 | 80.2 | 107.8 |

## Toppskyttar (bästa säsong — seed 123)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Marcus Järvinen | Västanfors | 34 |
| 2 | Göran Söderberg | Målilla | 32 |
| 3 | Petri Norén | Forsbacka | 29 |
| 4 | Rasmus Eld | Forsbacka | 28 |
| 5 | Henrik Henriksson | Rögle | 28 |

## Spelarbetyg (snitt, bästa säsong — seed 123)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Petri Norén | Forsbacka | 7.35 | 22 |
| 2 | Marcus Järvinen | Västanfors | 7.29 | 22 |
| 3 | Göran Söderberg | Målilla | 7.24 | 22 |
| 4 | Quentin Lundqvist | Karlsborg | 7.18 | 22 |
| 5 | Benjamin Kjellberg | Lesjöfors | 7.17 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.5 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (22.6%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (3.609) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
