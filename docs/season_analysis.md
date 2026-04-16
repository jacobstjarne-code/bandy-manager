# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-16 16:15:14
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 10.43 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.2 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 24.4% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 40.2 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (24.4% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 10.43 | 9.84 | 10.77 | ❌ |
| 0-0-matcher per säsong | 0.2 | 0 | 1 | ✅ |
| Hörnmål (% av totalt) | 24.4% | 22.2% | 26.9% | ⚠️ |
| Röda kort per match | 0.364 | 0.303 | 0.424 | ✅ |
| Toppskyttens mål (snitt) | 40.2 | 37 | 47 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 10.35 | 1 | 22.4% | 0.371 | 47 |
| 123 | 10.67 | 0 | 24.5% | 0.326 | 41 |
| 456 | 10.77 | 0 | 26.2% | 0.303 | 37 |
| 789 | 9.84 | 0 | 22.2% | 0.394 | 39 |
| 1337 | 10.53 | 0 | 26.9% | 0.424 | 37 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.0 | Västanfors | 38.6 | 19.2 | 157.2 | 84.0 |
| 2.2 | Forsbacka | 34.4 | 16.6 | 142.6 | 87.8 |
| 4.0 | Karlsborg | 29.2 | 13.6 | 129.8 | 101.0 |
| 4.0 | Gagnef | 28.0 | 13.2 | 127.6 | 104.6 |
| 5.8 | Målilla | 23.8 | 11.4 | 126.0 | 120.0 |
| 6.6 | Lesjöfors | 19.8 | 8.8 | 100.6 | 114.4 |
| 7.0 | Söderfors | 20.2 | 9.2 | 107.2 | 120.8 |
| 7.4 | Hälleforsnäs | 19.8 | 9.2 | 110.6 | 123.0 |
| 8.8 | Skutskär | 15.4 | 7.0 | 105.4 | 129.2 |
| 9.2 | Slottsbron | 13.8 | 6.8 | 104.4 | 128.2 |
| 10.8 | Heros | 11.6 | 5.2 | 84.2 | 133.6 |
| 11.2 | Rögle | 9.4 | 4.0 | 81.6 | 130.6 |

## Toppskyttar (bästa säsong — seed 456)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Quentin Jonsson | Målilla | 37 |
| 2 | Thomas Norén | Västanfors | 30 |
| 3 | Tomas Sundström | Forsbacka | 29 |
| 4 | Hannu Kronberg | Slottsbron | 29 |
| 5 | Isak Engström | Gagnef | 29 |

## Spelarbetyg (snitt, bästa säsong — seed 456)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Jesper Alm | Västanfors | 7.71 | 22 |
| 2 | Isak Engström | Gagnef | 7.60 | 22 |
| 3 | Quentin Jonsson | Målilla | 7.58 | 22 |
| 4 | Thomas Norén | Västanfors | 7.53 | 22 |
| 5 | Magnus Rydén | Gagnef | 7.49 | 22 |

## Flaggor

- ❌ Målsnittet 10.4 är utanför acceptabelt intervall (3-10)
- ⚠️ Hörnmålsprocenten (24.4%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
