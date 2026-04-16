# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-16 11:38:30
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 10.35 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 25.8% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 38.8 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (25.8% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 10.35 | 10.05 | 10.72 | ❌ |
| 0-0-matcher per säsong | 0.0 | 0 | 0 | ✅ |
| Hörnmål (% av totalt) | 25.8% | 24.0% | 27.8% | ❌ |
| Röda kort per match | 0.326 | 0.227 | 0.402 | ✅ |
| Toppskyttens mål (snitt) | 38.8 | 35 | 44 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 10.05 | 0 | 24.0% | 0.318 | 35 |
| 123 | 10.33 | 0 | 26.3% | 0.318 | 36 |
| 456 | 10.72 | 0 | 27.8% | 0.227 | 44 |
| 789 | 10.05 | 0 | 24.3% | 0.364 | 37 |
| 1337 | 10.58 | 0 | 26.7% | 0.402 | 42 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.4 | Västanfors | 38.0 | 18.8 | 159.8 | 84.8 |
| 1.8 | Forsbacka | 36.6 | 17.8 | 142.4 | 83.6 |
| 3.8 | Karlsborg | 29.4 | 14.2 | 129.2 | 101.8 |
| 4.8 | Gagnef | 26.2 | 12.2 | 124.4 | 104.2 |
| 5.2 | Målilla | 25.0 | 11.8 | 128.2 | 114.0 |
| 6.6 | Hälleforsnäs | 18.2 | 8.6 | 111.4 | 119.4 |
| 7.8 | Söderfors | 18.0 | 8.0 | 101.4 | 118.4 |
| 7.8 | Lesjöfors | 18.6 | 8.6 | 98.6 | 116.8 |
| 8.4 | Skutskär | 17.4 | 7.8 | 102.0 | 128.0 |
| 8.6 | Slottsbron | 16.0 | 7.6 | 107.4 | 127.8 |
| 10.6 | Rögle | 11.2 | 4.6 | 81.4 | 131.6 |
| 11.2 | Heros | 9.4 | 4.2 | 79.4 | 135.2 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Matti Berg | Gagnef | 44 |
| 2 | Arvid Nordström | Västanfors | 35 |
| 3 | Felix Hedberg | Hälleforsnäs | 32 |
| 4 | Kari Kjellström | Västanfors | 31 |
| 5 | Quentin Jonsson | Målilla | 31 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Arvid Nordström | Västanfors | 7.81 | 22 |
| 2 | Matti Berg | Gagnef | 7.78 | 22 |
| 3 | Mikael Laitinen | Forsbacka | 7.60 | 22 |
| 4 | Ulf Alm | Forsbacka | 7.53 | 22 |
| 5 | Quentin Jonsson | Målilla | 7.52 | 22 |

## Flaggor

- ❌ Målsnittet 10.3 är utanför acceptabelt intervall (3-10)
- ⚠️ Hörnmålsprocenten (25.8%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
