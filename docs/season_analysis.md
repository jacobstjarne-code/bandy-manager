# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-14 11:19:10
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 10.46 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 29.0% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 43.2 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (29.0% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 10.46 | 9.70 | 11.26 | ❌ |
| 0-0-matcher per säsong | 0.0 | 0 | 0 | ✅ |
| Hörnmål (% av totalt) | 29.0% | 26.9% | 32.9% | ❌ |
| Röda kort per match | 0.958 | 0.879 | 1.098 | ⚠️ |
| Toppskyttens mål (snitt) | 43.2 | 38 | 48 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 11.26 | 0 | 27.7% | 0.917 | 38 |
| 123 | 10.64 | 0 | 32.9% | 0.970 | 48 |
| 456 | 10.48 | 0 | 29.3% | 1.098 | 42 |
| 789 | 10.23 | 0 | 28.2% | 0.879 | 40 |
| 1337 | 9.70 | 0 | 26.9% | 0.924 | 48 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.6 | Forsbacka | 38.2 | 18.2 | 156.6 | 78.2 |
| 1.6 | Västanfors | 37.2 | 18.4 | 168.6 | 95.6 |
| 3.6 | Karlsborg | 29.6 | 14.0 | 141.0 | 105.2 |
| 3.6 | Gagnef | 29.2 | 13.6 | 126.8 | 102.2 |
| 5.6 | Målilla | 26.0 | 12.0 | 132.4 | 111.6 |
| 6.4 | Hälleforsnäs | 21.4 | 9.6 | 120.2 | 117.2 |
| 7.2 | Söderfors | 19.6 | 8.6 | 102.6 | 117.0 |
| 7.6 | Lesjöfors | 20.2 | 9.0 | 96.4 | 107.4 |
| 9.0 | Skutskär | 15.2 | 6.2 | 101.8 | 131.6 |
| 9.8 | Slottsbron | 12.8 | 5.8 | 93.8 | 134.2 |
| 10.2 | Rögle | 9.2 | 4.2 | 73.8 | 131.0 |
| 11.8 | Heros | 5.4 | 2.2 | 67.2 | 150.0 |

## Toppskyttar (bästa säsong — seed 42)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Felix Åberg | Västanfors | 38 |
| 2 | Malte Bengtsson | Forsbacka | 33 |
| 3 | Oscar Bergqvist | Forsbacka | 31 |
| 4 | Patrik Sjögren | Forsbacka | 29 |
| 5 | Henrik Winther | Skutskär | 29 |

## Spelarbetyg (snitt, bästa säsong — seed 42)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Oscar Bergqvist | Forsbacka | 7.86 | 22 |
| 2 | Malte Bengtsson | Forsbacka | 7.81 | 22 |
| 3 | Patrik Westerberg | Forsbacka | 7.70 | 22 |
| 4 | Patrik Sjögren | Forsbacka | 7.67 | 22 |
| 5 | Felix Åberg | Västanfors | 7.63 | 22 |

## Flaggor

- ❌ Målsnittet 10.5 är utanför acceptabelt intervall (3-10)
- ⚠️ Hörnmålsprocenten (29.0%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ⚠️ Röda kort per match (0.958) är högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
