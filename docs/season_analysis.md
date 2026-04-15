# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-14 22:46:58
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 10.24 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 27.0% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 50.6 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (27.0% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 10.24 | 9.85 | 10.59 | ❌ |
| 0-0-matcher per säsong | 0.0 | 0 | 0 | ✅ |
| Hörnmål (% av totalt) | 27.0% | 23.9% | 30.6% | ❌ |
| Röda kort per match | 0.942 | 0.826 | 1.038 | ⚠️ |
| Toppskyttens mål (snitt) | 50.6 | 47 | 56 | ⚠️ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 10.59 | 0 | 23.9% | 1.008 | 52 |
| 123 | 10.39 | 0 | 30.6% | 0.894 | 47 |
| 456 | 10.36 | 0 | 25.5% | 1.038 | 48 |
| 789 | 10.04 | 0 | 26.3% | 0.947 | 56 |
| 1337 | 9.85 | 0 | 28.5% | 0.826 | 50 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.6 | Forsbacka | 36.8 | 17.2 | 152.8 | 77.2 |
| 1.6 | Västanfors | 36.8 | 17.8 | 175.2 | 87.8 |
| 4.2 | Hälleforsnäs | 28.2 | 13.0 | 123.2 | 104.0 |
| 5.0 | Målilla | 26.8 | 12.6 | 128.2 | 113.0 |
| 5.4 | Karlsborg | 26.6 | 11.6 | 121.8 | 106.4 |
| 5.6 | Gagnef | 24.6 | 11.0 | 119.8 | 111.0 |
| 7.2 | Söderfors | 20.4 | 8.8 | 105.2 | 113.6 |
| 7.2 | Lesjöfors | 20.2 | 8.6 | 95.2 | 109.4 |
| 8.4 | Skutskär | 15.6 | 6.4 | 96.8 | 126.8 |
| 9.2 | Slottsbron | 13.4 | 5.2 | 97.0 | 131.6 |
| 10.8 | Rögle | 8.8 | 3.6 | 68.6 | 127.8 |
| 11.8 | Heros | 5.8 | 2.0 | 68.4 | 143.6 |

## Toppskyttar (bästa säsong — seed 42)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Malte Rydén | Västanfors | 52 |
| 2 | Håvard Gunnarsson | Karlsborg | 40 |
| 3 | Filip Saarinen | Målilla | 37 |
| 4 | Oscar Persson | Gagnef | 36 |
| 5 | Adam Norén | Forsbacka | 35 |

## Spelarbetyg (snitt, bästa säsong — seed 42)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Malte Rydén | Västanfors | 8.16 | 22 |
| 2 | Håvard Gunnarsson | Karlsborg | 7.80 | 22 |
| 3 | Alexander Strand | Hälleforsnäs | 7.70 | 22 |
| 4 | Sami Koskinen | Västanfors | 7.66 | 22 |
| 5 | Jesper Winther | Forsbacka | 7.52 | 22 |

## Flaggor

- ❌ Målsnittet 10.2 är utanför acceptabelt intervall (3-10)
- ⚠️ Hörnmålsprocenten (27.0%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ⚠️ Röda kort per match (0.942) är högt
- ⚠️ Toppskyttens snittmål (50.6) utanför idealet 15-45

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
