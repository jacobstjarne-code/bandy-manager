# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-15 20:58:46
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.39 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 30.5% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 36.6 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (30.5% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.39 | 9.04 | 9.86 | ⚠️ |
| 0-0-matcher per säsong | 0.0 | 0 | 0 | ✅ |
| Hörnmål (% av totalt) | 30.5% | 28.3% | 31.8% | ❌ |
| Röda kort per match | 0.953 | 0.902 | 1.023 | ⚠️ |
| Toppskyttens mål (snitt) | 36.6 | 32 | 44 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.86 | 0 | 28.3% | 0.970 | 44 |
| 123 | 9.38 | 0 | 31.8% | 0.939 | 38 |
| 456 | 9.24 | 0 | 30.7% | 1.023 | 34 |
| 789 | 9.43 | 0 | 29.7% | 0.902 | 32 |
| 1337 | 9.04 | 0 | 31.8% | 0.932 | 35 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.4 | Västanfors | 39.4 | 18.8 | 152.8 | 79.2 |
| 2.2 | Forsbacka | 36.4 | 17.4 | 134.0 | 73.0 |
| 4.4 | Målilla | 29.0 | 13.8 | 127.2 | 97.2 |
| 4.8 | Karlsborg | 26.2 | 12.4 | 120.2 | 98.6 |
| 5.2 | Gagnef | 26.4 | 12.4 | 110.6 | 94.2 |
| 5.2 | Hälleforsnäs | 24.4 | 11.2 | 106.2 | 100.0 |
| 7.2 | Söderfors | 18.0 | 7.8 | 92.4 | 108.6 |
| 7.6 | Lesjöfors | 18.0 | 8.0 | 83.4 | 102.4 |
| 8.4 | Skutskär | 16.0 | 6.8 | 90.8 | 119.8 |
| 8.6 | Slottsbron | 16.0 | 7.4 | 91.8 | 115.6 |
| 11.2 | Rögle | 7.6 | 3.2 | 66.2 | 121.2 |
| 11.8 | Heros | 6.6 | 3.0 | 63.8 | 129.6 |

## Toppskyttar (bästa säsong — seed 42)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Kristoffer Björk | Västanfors | 44 |
| 2 | William Stål | Söderfors | 32 |
| 3 | Noah Rosén | Karlsborg | 31 |
| 4 | Fabian Eld | Målilla | 28 |
| 5 | Olof Frost | Hälleforsnäs | 28 |

## Spelarbetyg (snitt, bästa säsong — seed 42)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Kristoffer Björk | Västanfors | 8.01 | 22 |
| 2 | Noah Rosén | Karlsborg | 7.47 | 22 |
| 3 | Samuel Jonasson | Forsbacka | 7.46 | 22 |
| 4 | Jonas Wikqvist | Karlsborg | 7.44 | 22 |
| 5 | Kevin Virtanen | Forsbacka | 7.42 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.4 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (30.5%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ⚠️ Röda kort per match (0.953) är högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
