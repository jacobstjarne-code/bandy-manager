# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-09-06 11:50:02
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.47 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 1.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 22.7% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 37.6 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (22.7% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.47 | 9.29 | 9.69 | ⚠️ |
| 0-0-matcher per säsong | 1.0 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 22.7% | 21.1% | 24.7% | ⚠️ |
| Röda kort per match | 2.455 | 2.250 | 2.629 | ❌ |
| Toppskyttens mål (snitt) | 37.6 | 30 | 51 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.29 | 0 | 21.1% | 2.629 | 34 |
| 123 | 9.69 | 0 | 23.4% | 2.470 | 35 |
| 456 | 9.34 | 1 | 24.7% | 2.333 | 30 |
| 789 | 9.36 | 2 | 21.6% | 2.591 | 38 |
| 1337 | 9.67 | 2 | 22.7% | 2.250 | 51 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.0 | Västanfors | 37.6 | 18.0 | 155.0 | 89.8 |
| 2.2 | Forsbacka | 33.4 | 16.0 | 127.0 | 77.2 |
| 3.4 | Karlsborg | 27.4 | 12.2 | 119.4 | 92.2 |
| 4.6 | Målilla | 26.6 | 12.0 | 122.0 | 106.6 |
| 5.4 | Gagnef | 23.4 | 10.2 | 107.4 | 95.6 |
| 6.6 | Hälleforsnäs | 20.6 | 8.6 | 103.6 | 111.6 |
| 7.0 | Lesjöfors | 20.8 | 9.4 | 89.0 | 102.6 |
| 7.8 | Söderfors | 17.4 | 8.0 | 94.4 | 114.0 |
| 8.2 | Skutskär | 17.0 | 7.2 | 97.6 | 113.8 |
| 10.4 | Slottsbron | 12.8 | 5.4 | 85.4 | 119.0 |
| 10.4 | Heros | 14.2 | 5.6 | 73.8 | 109.6 |
| 11.0 | Rögle | 12.8 | 5.6 | 75.2 | 117.8 |

## Toppskyttar (bästa säsong — seed 123)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Göran Söderberg | Målilla | 35 |
| 2 | Rasmus Eld | Forsbacka | 31 |
| 3 | Anton Claesson | Västanfors | 31 |
| 4 | Quentin Lundqvist | Karlsborg | 30 |
| 5 | Marcus Järvinen | Västanfors | 29 |

## Spelarbetyg (snitt, bästa säsong — seed 123)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Anton Claesson | Västanfors | 7.59 | 22 |
| 2 | Rasmus Eld | Forsbacka | 7.52 | 22 |
| 3 | Göran Söderberg | Målilla | 7.40 | 22 |
| 4 | Petri Norén | Forsbacka | 7.38 | 22 |
| 5 | Quentin Lundqvist | Karlsborg | 7.38 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.5 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (22.7%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (2.455) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
