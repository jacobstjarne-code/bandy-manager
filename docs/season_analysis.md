# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-05-28 09:16:23
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.51 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 1.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 22.6% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 35.4 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (22.6% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.51 | 9.28 | 9.88 | ⚠️ |
| 0-0-matcher per säsong | 1.0 | 0 | 3 | ✅ |
| Hörnmål (% av totalt) | 22.6% | 21.1% | 24.6% | ⚠️ |
| Röda kort per match | 3.592 | 3.371 | 3.803 | ❌ |
| Toppskyttens mål (snitt) | 35.4 | 28 | 45 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.34 | 0 | 21.1% | 3.803 | 32 |
| 123 | 9.88 | 0 | 22.8% | 3.515 | 33 |
| 456 | 9.28 | 1 | 24.6% | 3.742 | 28 |
| 789 | 9.42 | 1 | 21.3% | 3.530 | 39 |
| 1337 | 9.63 | 3 | 23.1% | 3.371 | 45 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.2 | Västanfors | 36.6 | 16.8 | 147.2 | 100.4 |
| 1.8 | Forsbacka | 34.2 | 15.4 | 124.2 | 83.4 |
| 3.6 | Karlsborg | 27.2 | 11.0 | 114.0 | 97.8 |
| 4.8 | Målilla | 25.4 | 10.0 | 116.4 | 109.2 |
| 5.6 | Gagnef | 24.2 | 9.4 | 105.8 | 97.6 |
| 6.0 | Hälleforsnäs | 23.8 | 9.4 | 106.6 | 105.4 |
| 7.4 | Lesjöfors | 20.4 | 7.8 | 91.6 | 102.2 |
| 8.2 | Skutskär | 17.2 | 6.2 | 101.6 | 110.6 |
| 8.4 | Söderfors | 17.0 | 6.6 | 98.8 | 110.6 |
| 9.4 | Slottsbron | 13.8 | 5.2 | 88.8 | 116.4 |
| 10.8 | Rögle | 11.6 | 4.8 | 81.2 | 112.4 |
| 10.8 | Heros | 12.6 | 4.6 | 79.2 | 109.4 |

## Toppskyttar (bästa säsong — seed 123)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Marcus Järvinen | Västanfors | 33 |
| 2 | Göran Söderberg | Målilla | 33 |
| 3 | Petri Norén | Forsbacka | 28 |
| 4 | Henrik Henriksson | Rögle | 28 |
| 5 | Rasmus Eld | Forsbacka | 27 |

## Spelarbetyg (snitt, bästa säsong — seed 123)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Petri Norén | Forsbacka | 7.38 | 22 |
| 2 | Göran Söderberg | Målilla | 7.26 | 22 |
| 3 | Quentin Lundqvist | Karlsborg | 7.25 | 22 |
| 4 | Marcus Järvinen | Västanfors | 7.24 | 22 |
| 5 | Anton Claesson | Västanfors | 7.17 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.5 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (22.6%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (3.592) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
