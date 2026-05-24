# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-05-24 21:38:32
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.35 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.8 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 21.1% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 34.0 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (21.1% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.35 | 8.98 | 9.65 | ⚠️ |
| 0-0-matcher per säsong | 0.8 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 21.1% | 18.8% | 23.6% | ⚠️ |
| Röda kort per match | 3.489 | 3.242 | 3.568 | ❌ |
| Toppskyttens mål (snitt) | 34.0 | 30 | 38 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.15 | 1 | 18.8% | 3.523 | 31 |
| 123 | 9.52 | 0 | 20.0% | 3.242 | 36 |
| 456 | 9.65 | 0 | 23.6% | 3.568 | 38 |
| 789 | 8.98 | 2 | 19.7% | 3.545 | 30 |
| 1337 | 9.42 | 1 | 23.6% | 3.568 | 35 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.2 | Västanfors | 37.4 | 17.0 | 150.6 | 95.4 |
| 2.0 | Forsbacka | 35.8 | 16.6 | 122.2 | 76.6 |
| 3.8 | Karlsborg | 28.2 | 11.8 | 111.2 | 95.2 |
| 5.0 | Gagnef | 25.6 | 10.8 | 106.4 | 97.0 |
| 5.4 | Målilla | 22.8 | 9.2 | 110.0 | 106.8 |
| 6.4 | Hälleforsnäs | 21.8 | 8.6 | 104.6 | 108.4 |
| 7.6 | Skutskär | 18.4 | 7.6 | 100.0 | 110.6 |
| 8.0 | Söderfors | 18.6 | 7.4 | 100.2 | 109.0 |
| 8.0 | Lesjöfors | 18.0 | 7.4 | 83.2 | 101.6 |
| 9.4 | Slottsbron | 14.0 | 5.2 | 92.6 | 114.4 |
| 9.8 | Heros | 13.6 | 5.4 | 76.4 | 104.2 |
| 11.4 | Rögle | 9.8 | 3.6 | 76.2 | 114.4 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Thomas Norén | Västanfors | 38 |
| 2 | Magnus Hellström | Forsbacka | 34 |
| 3 | Tomas Sundström | Forsbacka | 30 |
| 4 | Arne Ekgren | Västanfors | 28 |
| 5 | Ingemar Bergqvist | Skutskär | 27 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Thomas Norén | Västanfors | 7.78 | 22 |
| 2 | Magnus Hellström | Forsbacka | 7.43 | 22 |
| 3 | Jesper Alm | Västanfors | 7.39 | 22 |
| 4 | Arne Ekgren | Västanfors | 7.32 | 22 |
| 5 | Jesper Winther | Västanfors | 7.30 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.3 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (21.1%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (3.489) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
