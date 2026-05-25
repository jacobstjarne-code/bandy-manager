# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-05-25 20:17:47
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.34 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.8 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 21.1% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 33.6 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (21.1% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.34 | 9.02 | 9.61 | ⚠️ |
| 0-0-matcher per säsong | 0.8 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 21.1% | 18.9% | 24.0% | ⚠️ |
| Röda kort per match | 3.482 | 3.242 | 3.576 | ❌ |
| Toppskyttens mål (snitt) | 33.6 | 29 | 38 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.17 | 1 | 18.9% | 3.515 | 29 |
| 123 | 9.49 | 0 | 20.0% | 3.242 | 35 |
| 456 | 9.61 | 0 | 24.0% | 3.576 | 38 |
| 789 | 9.02 | 2 | 19.3% | 3.538 | 31 |
| 1337 | 9.43 | 1 | 23.1% | 3.538 | 35 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.4 | Västanfors | 37.8 | 17.4 | 149.6 | 94.2 |
| 1.8 | Forsbacka | 36.0 | 16.6 | 121.4 | 75.8 |
| 3.8 | Karlsborg | 27.0 | 10.8 | 110.2 | 94.4 |
| 5.0 | Gagnef | 25.2 | 10.4 | 106.2 | 97.0 |
| 5.2 | Målilla | 23.2 | 9.4 | 110.4 | 107.0 |
| 6.4 | Hälleforsnäs | 21.6 | 8.6 | 104.8 | 109.8 |
| 7.6 | Skutskär | 19.2 | 7.6 | 100.4 | 109.8 |
| 8.0 | Söderfors | 19.0 | 7.6 | 99.8 | 108.0 |
| 8.0 | Lesjöfors | 17.4 | 6.8 | 83.2 | 102.4 |
| 9.4 | Slottsbron | 14.0 | 5.0 | 92.6 | 114.2 |
| 10.2 | Heros | 13.4 | 5.2 | 77.0 | 104.8 |
| 11.2 | Rögle | 10.2 | 3.4 | 77.8 | 116.0 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Thomas Norén | Västanfors | 38 |
| 2 | Magnus Hellström | Forsbacka | 33 |
| 3 | Tomas Sundström | Forsbacka | 30 |
| 4 | Arne Ekgren | Västanfors | 29 |
| 5 | Ingemar Bergqvist | Skutskär | 29 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Thomas Norén | Västanfors | 7.81 | 22 |
| 2 | Magnus Hellström | Forsbacka | 7.40 | 22 |
| 3 | Jesper Alm | Västanfors | 7.37 | 22 |
| 4 | Jesper Winther | Västanfors | 7.31 | 22 |
| 5 | Arne Ekgren | Västanfors | 7.30 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.3 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (21.1%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (3.482) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
