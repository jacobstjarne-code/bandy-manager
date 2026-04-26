# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-26 14:42:45
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.35 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.6 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 20.7% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 33.4 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (20.7% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.35 | 9.19 | 9.58 | ⚠️ |
| 0-0-matcher per säsong | 0.6 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 20.7% | 18.2% | 23.9% | ⚠️ |
| Röda kort per match | 3.503 | 3.311 | 3.629 | ❌ |
| Toppskyttens mål (snitt) | 33.4 | 31 | 35 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.19 | 1 | 19.4% | 3.629 | 35 |
| 123 | 9.33 | 0 | 19.1% | 3.311 | 35 |
| 456 | 9.58 | 0 | 23.9% | 3.621 | 33 |
| 789 | 9.38 | 0 | 18.2% | 3.492 | 33 |
| 1337 | 9.30 | 2 | 22.8% | 3.462 | 31 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.0 | Västanfors | 40.2 | 19.8 | 143.8 | 90.0 |
| 2.2 | Forsbacka | 33.0 | 16.0 | 123.0 | 83.2 |
| 4.0 | Karlsborg | 27.2 | 11.6 | 111.6 | 92.8 |
| 4.0 | Gagnef | 26.6 | 11.4 | 109.4 | 97.2 |
| 6.2 | Målilla | 21.4 | 9.4 | 105.0 | 107.0 |
| 6.2 | Hälleforsnäs | 21.6 | 9.2 | 102.6 | 107.0 |
| 7.2 | Skutskär | 18.6 | 8.0 | 102.0 | 112.2 |
| 7.8 | Lesjöfors | 19.4 | 8.2 | 87.2 | 100.4 |
| 8.2 | Slottsbron | 16.4 | 6.8 | 94.0 | 108.6 |
| 9.2 | Söderfors | 16.4 | 6.2 | 98.8 | 110.4 |
| 10.6 | Heros | 11.8 | 4.4 | 77.8 | 113.8 |
| 11.4 | Rögle | 11.4 | 4.4 | 79.6 | 112.2 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Magnus Hellström | Forsbacka | 33 |
| 2 | Arne Ekgren | Västanfors | 31 |
| 3 | Thomas Norén | Västanfors | 30 |
| 4 | Tomas Sundström | Forsbacka | 29 |
| 5 | Quentin Jonsson | Målilla | 28 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Tobias Hedlund | Forsbacka | 7.52 | 22 |
| 2 | Magnus Hellström | Forsbacka | 7.51 | 22 |
| 3 | Thomas Norén | Västanfors | 7.37 | 22 |
| 4 | Tomas Sundström | Forsbacka | 7.24 | 22 |
| 5 | Ingemar Bergqvist | Skutskär | 7.20 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.4 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (20.7%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (3.503) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
