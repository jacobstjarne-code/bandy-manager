# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-25 18:53:58
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.38 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.2 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 21.0% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 32.2 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (21.0% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.38 | 9.21 | 9.55 | ⚠️ |
| 0-0-matcher per säsong | 0.2 | 0 | 1 | ✅ |
| Hörnmål (% av totalt) | 21.0% | 18.2% | 23.6% | ⚠️ |
| Röda kort per match | 3.415 | 3.371 | 3.455 | ❌ |
| Toppskyttens mål (snitt) | 32.2 | 30 | 36 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.21 | 1 | 20.1% | 3.455 | 30 |
| 123 | 9.33 | 0 | 19.9% | 3.371 | 34 |
| 456 | 9.42 | 0 | 23.6% | 3.455 | 36 |
| 789 | 9.55 | 0 | 18.2% | 3.379 | 31 |
| 1337 | 9.41 | 0 | 23.3% | 3.417 | 30 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.2 | Västanfors | 38.0 | 18.2 | 144.6 | 88.8 |
| 2.0 | Forsbacka | 32.8 | 15.2 | 123.0 | 86.4 |
| 3.8 | Karlsborg | 28.8 | 12.4 | 116.4 | 95.8 |
| 4.4 | Gagnef | 25.2 | 10.8 | 105.8 | 96.4 |
| 5.8 | Hälleforsnäs | 22.8 | 9.8 | 104.8 | 106.0 |
| 6.0 | Målilla | 23.6 | 10.4 | 107.8 | 107.4 |
| 8.0 | Lesjöfors | 18.6 | 8.2 | 86.2 | 101.2 |
| 8.0 | Slottsbron | 17.4 | 6.6 | 98.2 | 111.0 |
| 8.6 | Skutskär | 16.8 | 6.6 | 96.6 | 107.6 |
| 9.0 | Söderfors | 15.8 | 6.2 | 97.4 | 111.6 |
| 9.8 | Rögle | 13.0 | 4.6 | 80.6 | 112.4 |
| 11.4 | Heros | 11.2 | 3.4 | 77.4 | 114.2 |

## Toppskyttar (bästa säsong — seed 789)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Jesper Wikström | Västanfors | 31 |
| 2 | Anton Carlsson | Skutskär | 28 |
| 3 | Gunnar Hallberg | Forsbacka | 27 |
| 4 | Morten Sjögren | Forsbacka | 27 |
| 5 | Magnus Granqvist | Målilla | 27 |

## Spelarbetyg (snitt, bästa säsong — seed 789)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Jesper Wikström | Västanfors | 7.45 | 22 |
| 2 | Arvid Johansson | Heros | 7.41 | 22 |
| 3 | Morten Sjögren | Forsbacka | 7.26 | 22 |
| 4 | Elias Dahlström | Hälleforsnäs | 7.21 | 22 |
| 5 | Tomas Forsberg | Karlsborg | 7.21 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.4 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (21.0%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (3.415) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
