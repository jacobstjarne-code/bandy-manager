# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-05-05 15:35:29
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.33 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.8 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 20.4% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 33.6 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (20.4% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.33 | 8.97 | 9.70 | ⚠️ |
| 0-0-matcher per säsong | 0.8 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 20.4% | 18.2% | 23.4% | ⚠️ |
| Röda kort per match | 3.521 | 3.356 | 3.705 | ❌ |
| Toppskyttens mål (snitt) | 33.6 | 31 | 36 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.40 | 2 | 19.3% | 3.636 | 32 |
| 123 | 8.97 | 0 | 18.2% | 3.356 | 35 |
| 456 | 9.70 | 0 | 23.4% | 3.705 | 34 |
| 789 | 9.33 | 1 | 18.6% | 3.417 | 36 |
| 1337 | 9.23 | 1 | 22.8% | 3.492 | 31 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.0 | Västanfors | 38.8 | 18.4 | 146.2 | 94.4 |
| 2.2 | Forsbacka | 33.6 | 15.2 | 124.4 | 81.2 |
| 3.6 | Karlsborg | 29.0 | 11.8 | 112.4 | 91.2 |
| 5.0 | Gagnef | 25.2 | 11.0 | 109.4 | 97.4 |
| 5.8 | Målilla | 23.0 | 9.6 | 109.0 | 108.4 |
| 6.8 | Hälleforsnäs | 20.0 | 7.6 | 106.0 | 111.2 |
| 7.4 | Skutskär | 20.2 | 7.6 | 99.4 | 108.0 |
| 7.8 | Lesjöfors | 19.0 | 8.0 | 84.6 | 102.0 |
| 8.4 | Söderfors | 16.4 | 6.8 | 97.6 | 111.6 |
| 9.0 | Slottsbron | 15.4 | 6.2 | 91.8 | 110.6 |
| 9.6 | Heros | 13.6 | 5.0 | 76.0 | 106.2 |
| 11.4 | Rögle | 9.8 | 3.2 | 74.2 | 108.8 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Magnus Hellström | Forsbacka | 34 |
| 2 | Thomas Norén | Västanfors | 33 |
| 3 | Tomas Sundström | Forsbacka | 30 |
| 4 | Arne Ekgren | Västanfors | 29 |
| 5 | Noah Lundqvist | Karlsborg | 29 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Magnus Hellström | Forsbacka | 7.59 | 22 |
| 2 | Thomas Norén | Västanfors | 7.40 | 22 |
| 3 | Tobias Hedlund | Forsbacka | 7.33 | 22 |
| 4 | Tomas Sundström | Forsbacka | 7.23 | 22 |
| 5 | Claes Eriksson | Västanfors | 7.16 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.3 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (20.4%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (3.521) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
