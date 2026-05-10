# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-05-10 13:50:48
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 9.30 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.8 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 20.3% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 33.2 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (20.3% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 9.30 | 8.95 | 9.65 | ⚠️ |
| 0-0-matcher per säsong | 0.8 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 20.3% | 17.8% | 23.5% | ⚠️ |
| Röda kort per match | 3.576 | 3.371 | 3.765 | ❌ |
| Toppskyttens mål (snitt) | 33.2 | 29 | 37 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.40 | 2 | 19.3% | 3.659 | 31 |
| 123 | 8.95 | 0 | 17.8% | 3.371 | 37 |
| 456 | 9.65 | 0 | 23.5% | 3.765 | 34 |
| 789 | 9.30 | 1 | 18.5% | 3.485 | 35 |
| 1337 | 9.22 | 1 | 22.5% | 3.598 | 29 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.0 | Västanfors | 39.0 | 18.4 | 145.2 | 95.8 |
| 2.2 | Forsbacka | 33.8 | 15.4 | 124.6 | 80.6 |
| 3.6 | Karlsborg | 29.2 | 12.2 | 111.8 | 90.8 |
| 5.2 | Gagnef | 24.8 | 10.8 | 108.2 | 97.2 |
| 5.4 | Målilla | 23.4 | 9.8 | 108.8 | 107.2 |
| 7.0 | Hälleforsnäs | 20.2 | 7.8 | 106.4 | 110.8 |
| 7.2 | Skutskär | 20.0 | 7.8 | 99.8 | 107.4 |
| 7.4 | Lesjöfors | 19.0 | 8.4 | 84.4 | 100.4 |
| 8.8 | Söderfors | 16.6 | 6.6 | 98.0 | 111.2 |
| 9.2 | Slottsbron | 15.0 | 5.8 | 92.0 | 110.4 |
| 9.8 | Heros | 12.8 | 4.6 | 75.0 | 107.2 |
| 11.2 | Rögle | 10.2 | 3.4 | 74.0 | 109.2 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Thomas Norén | Västanfors | 34 |
| 2 | Magnus Hellström | Forsbacka | 33 |
| 3 | Tomas Sundström | Forsbacka | 30 |
| 4 | Noah Lundqvist | Karlsborg | 29 |
| 5 | Arne Ekgren | Västanfors | 28 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Magnus Hellström | Forsbacka | 7.52 | 22 |
| 2 | Thomas Norén | Västanfors | 7.44 | 22 |
| 3 | Tobias Hedlund | Forsbacka | 7.35 | 22 |
| 4 | Tomas Sundström | Forsbacka | 7.26 | 22 |
| 5 | Claes Eriksson | Västanfors | 7.22 | 22 |

## Flaggor

- ⚠️ Målsnittet 9.3 är i övre kant av målet 4-8
- ⚠️ Hörnmålsprocenten (20.3%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ❌ Röda kort per match (3.576) är orealistiskt högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
