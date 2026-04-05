# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-05 20:50:57
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 4.63 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.8 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 23.5% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 19.8 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (23.5% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 4.63 | 4.26 | 4.99 | ✅ |
| 0-0-matcher per säsong | 0.8 | 0 | 2 | ✅ |
| Hörnmål (% av totalt) | 23.5% | 20.8% | 25.6% | ⚠️ |
| Röda kort per match | 0.892 | 0.795 | 1.015 | ⚠️ |
| Toppskyttens mål (snitt) | 19.8 | 18 | 23 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 4.99 | 1 | 23.1% | 0.879 | 19 |
| 123 | 4.52 | 1 | 24.3% | 1.015 | 19 |
| 456 | 4.55 | 0 | 20.8% | 0.902 | 18 |
| 789 | 4.83 | 0 | 25.6% | 0.795 | 20 |
| 1337 | 4.26 | 2 | 23.5% | 0.871 | 23 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.2 | Forsbacka | 36.2 | 16.6 | 72.0 | 33.0 |
| 1.8 | Västanfors | 34.0 | 15.4 | 76.2 | 40.0 |
| 4.0 | Målilla | 26.8 | 11.0 | 53.4 | 44.6 |
| 5.0 | Gagnef | 26.2 | 11.4 | 56.8 | 47.2 |
| 5.2 | Karlsborg | 25.2 | 10.4 | 61.6 | 50.0 |
| 6.4 | Hälleforsnäs | 21.8 | 9.2 | 50.8 | 51.4 |
| 7.4 | Söderfors | 20.2 | 7.8 | 46.8 | 52.2 |
| 8.2 | Lesjöfors | 18.8 | 7.8 | 38.0 | 46.8 |
| 8.4 | Slottsbron | 16.4 | 6.2 | 45.8 | 58.8 |
| 8.6 | Skutskär | 16.2 | 6.2 | 46.0 | 59.0 |
| 10.4 | Rögle | 13.6 | 4.8 | 34.2 | 58.8 |
| 11.4 | Heros | 8.6 | 2.0 | 29.4 | 69.2 |

## Toppskyttar (bästa säsong — seed 42)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Felix Åberg | Västanfors | 19 |
| 2 | Oscar Bergqvist | Forsbacka | 18 |
| 3 | Malte Bengtsson | Forsbacka | 15 |
| 4 | Henrik Winther | Skutskär | 13 |
| 5 | Patrik Sjögren | Forsbacka | 13 |

## Spelarbetyg (snitt, bästa säsong — seed 42)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Jonathan Sjögren | Forsbacka | 7.59 | 22 |
| 2 | Aleksi Nyström | Skutskär | 7.22 | 22 |
| 3 | Oscar Bergqvist | Forsbacka | 7.12 | 22 |
| 4 | Sondre Westberg | Rögle | 7.11 | 22 |
| 5 | Malte Bengtsson | Forsbacka | 7.09 | 22 |

## Flaggor

- ⚠️ Hörnmålsprocenten (23.5%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ⚠️ Röda kort per match (0.892) är högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
