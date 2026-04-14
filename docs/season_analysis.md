# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-14 13:12:55
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 10.44 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 28.8% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 41.8 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (28.8% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 10.44 | 9.56 | 11.25 | ❌ |
| 0-0-matcher per säsong | 0.0 | 0 | 0 | ✅ |
| Hörnmål (% av totalt) | 28.8% | 27.1% | 32.4% | ❌ |
| Röda kort per match | 0.955 | 0.856 | 1.091 | ⚠️ |
| Toppskyttens mål (snitt) | 41.8 | 36 | 46 | ✅ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 11.25 | 0 | 27.1% | 0.955 | 36 |
| 123 | 10.65 | 0 | 32.4% | 0.970 | 42 |
| 456 | 10.52 | 0 | 29.2% | 1.091 | 44 |
| 789 | 10.23 | 0 | 28.0% | 0.902 | 41 |
| 1337 | 9.56 | 0 | 27.5% | 0.856 | 46 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.4 | Västanfors | 37.2 | 18.0 | 168.0 | 95.8 |
| 1.8 | Forsbacka | 37.2 | 17.6 | 152.6 | 80.6 |
| 2.8 | Karlsborg | 30.8 | 14.6 | 143.8 | 102.6 |
| 4.8 | Gagnef | 26.6 | 12.2 | 127.0 | 105.4 |
| 5.8 | Målilla | 25.8 | 11.8 | 131.8 | 112.0 |
| 5.8 | Hälleforsnäs | 23.2 | 10.6 | 121.4 | 114.4 |
| 6.8 | Lesjöfors | 20.6 | 9.0 | 96.2 | 108.0 |
| 7.8 | Söderfors | 18.8 | 7.4 | 99.6 | 117.8 |
| 9.4 | Slottsbron | 12.8 | 5.6 | 94.8 | 133.0 |
| 9.4 | Skutskär | 14.6 | 5.6 | 101.6 | 130.6 |
| 10.4 | Rögle | 10.0 | 4.4 | 74.8 | 128.6 |
| 11.8 | Heros | 6.4 | 2.4 | 66.8 | 149.6 |

## Toppskyttar (bästa säsong — seed 42)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Felix Åberg | Västanfors | 36 |
| 2 | Mikael Martinsson | Karlsborg | 34 |
| 3 | Patrik Sjögren | Forsbacka | 32 |
| 4 | Malte Bengtsson | Forsbacka | 30 |
| 5 | Oscar Bergqvist | Forsbacka | 30 |

## Spelarbetyg (snitt, bästa säsong — seed 42)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Oscar Bergqvist | Forsbacka | 7.75 | 22 |
| 2 | Patrik Sjögren | Forsbacka | 7.70 | 22 |
| 3 | Felix Åberg | Västanfors | 7.67 | 22 |
| 4 | Mikael Martinsson | Karlsborg | 7.67 | 22 |
| 5 | Malte Bengtsson | Forsbacka | 7.66 | 22 |

## Flaggor

- ❌ Målsnittet 10.4 är utanför acceptabelt intervall (3-10)
- ⚠️ Hörnmålsprocenten (28.8%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ⚠️ Röda kort per match (0.955) är högt

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
