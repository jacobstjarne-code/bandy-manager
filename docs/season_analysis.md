# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-13 14:38:39
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 4.63 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 1.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 23.7% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 19.8 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (23.7% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 4.63 | 4.24 | 5.00 | ✅ |
| 0-0-matcher per säsong | 1.0 | 0 | 3 | ✅ |
| Hörnmål (% av totalt) | 23.7% | 20.9% | 26.4% | ⚠️ |
| Röda kort per match | 0.886 | 0.795 | 0.985 | ⚠️ |
| Toppskyttens mål (snitt) | 19.8 | 18 | 23 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 5.00 | 1 | 22.9% | 0.886 | 19 |
| 123 | 4.55 | 1 | 24.0% | 0.985 | 18 |
| 456 | 4.57 | 0 | 20.9% | 0.902 | 18 |
| 789 | 4.82 | 0 | 26.4% | 0.795 | 21 |
| 1337 | 4.24 | 3 | 24.1% | 0.864 | 23 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.2 | Forsbacka | 36.2 | 16.6 | 72.2 | 32.4 |
| 1.8 | Västanfors | 33.8 | 15.2 | 76.2 | 39.8 |
| 4.2 | Målilla | 26.2 | 10.4 | 53.6 | 45.2 |
| 4.6 | Gagnef | 26.8 | 11.6 | 57.0 | 46.4 |
| 5.4 | Karlsborg | 24.8 | 10.2 | 61.4 | 51.4 |
| 6.0 | Hälleforsnäs | 22.4 | 9.6 | 51.8 | 51.2 |
| 7.4 | Söderfors | 20.0 | 7.6 | 46.2 | 52.6 |
| 8.2 | Lesjöfors | 18.8 | 8.0 | 37.4 | 46.4 |
| 8.8 | Skutskär | 16.0 | 6.0 | 46.4 | 59.8 |
| 9.0 | Slottsbron | 16.4 | 6.4 | 45.0 | 59.2 |
| 10.4 | Rögle | 13.8 | 4.8 | 34.6 | 58.4 |
| 11.0 | Heros | 8.8 | 2.2 | 30.0 | 69.0 |

## Toppskyttar (bästa säsong — seed 42)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Felix Åberg | Västanfors | 19 |
| 2 | Oscar Bergqvist | Forsbacka | 18 |
| 3 | Malte Bengtsson | Forsbacka | 16 |
| 4 | Henrik Winther | Skutskär | 14 |
| 5 | Robert Lundqvist | Karlsborg | 14 |

## Spelarbetyg (snitt, bästa säsong — seed 42)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Jonathan Sjögren | Forsbacka | 7.59 | 22 |
| 2 | Aleksi Nyström | Skutskär | 7.24 | 22 |
| 3 | Sondre Westberg | Rögle | 7.14 | 22 |
| 4 | Malte Bengtsson | Forsbacka | 7.12 | 22 |
| 5 | Oscar Bergqvist | Forsbacka | 7.12 | 22 |

## Flaggor

- ⚠️ Hörnmålsprocenten (23.7%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ⚠️ Röda kort per match (0.886) är högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
