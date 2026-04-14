# Säsongsanalys — Bandy Manager v0.1

Genererad: 2026-04-14 14:23:31
Simulerade säsonger: 5 (seeds: 42, 123, 456, 789, 1337)

## Före/efter-jämförelse (kalibreringsjusteringar 2026-03-22)

| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Mål per match (snitt) | 3.46 | 10.13 | ~5.5 |
| 0-0-matcher per säsong (snitt) | 4.4 | 0.0 | <8 |
| Hörnmål (% av totalt) | 32.3% (heuristik) | 27.7% (flagga) | 8–18% |
| Toppskyttens mål (snitt) | 15.2 | 46.6 | 20–70 |

Ändringar som genomfördes:
- **Fix 1 (mål):** `goalThreshold` i attack-sekvensen höjdes från `× 0.28 × (1 - GK×0.4)` till `× 0.45 × (1 - GK×0.35)`. Skottröskeln sänktes från >0.25 till >0.15. Transition multiplied by 1.15 (var 1.1). Halfchance-tröskel höjdes från ×0.20 till ×0.30. Bas-chanceQuality fick +0.15 extra.
- **Fix 2 (betyg):** Bas-betyg sänkt från 6.5 → 6.0. Assist +0.5 (var +0.3). Gult kort −0.4 (var −0.3). Rött kort −1.2 (var −1.0). Save +0.3 (var +0.2). Förlust −0.2 (var −0.3). Slumpmässig varians ±0.5 per spelare tillagd. Clamp ändrat till 3.0–10.0 (var 4.0–9.5). Målvaktsbonus +1.0 vid nollmatch.
- **Fix 3 (hörnmål):** `isCornerGoal: true`-flagga tillagd på MatchEvent. Hörnmålsräkning i testet använder nu flaggan direkt istället för tidsnärhetsheuristik. Resulterade i mer precis och lägre hörnmålsprocent (27.7% vs 32.3%).

## Sammanfattning

| Mått | Snitt | Min | Max | Status |
|------|-------|-----|-----|--------|
| Mål per match | 10.13 | 9.86 | 10.34 | ❌ |
| 0-0-matcher per säsong | 0.0 | 0 | 0 | ✅ |
| Hörnmål (% av totalt) | 27.7% | 25.4% | 30.0% | ❌ |
| Röda kort per match | 0.947 | 0.826 | 1.121 | ⚠️ |
| Toppskyttens mål (snitt) | 46.6 | 39 | 54 | ⚠️ |

## Per säsong

| Seed | Mål/match | 0-0-matcher | Hörnmål% | Röda kort/match | Toppskyttens mål |
|------|-----------|-------------|-----------|-----------------|-----------------|
| 42 | 9.88 | 0 | 25.4% | 0.985 | 39 |
| 123 | 10.32 | 0 | 30.0% | 0.886 | 54 |
| 456 | 10.25 | 0 | 29.0% | 1.121 | 40 |
| 789 | 9.86 | 0 | 25.4% | 0.826 | 47 |
| 1337 | 10.34 | 0 | 28.6% | 0.917 | 53 |

## Sluttabeller (genomsnitt av 5 säsonger)

| Snittpos | Lag | Snittpoäng | Snittvinster | Snitt GF | Snitt GA |
|----------|-----|------------|--------------|----------|----------|
| 1.6 | Forsbacka | 35.0 | 16.4 | 147.6 | 79.8 |
| 1.8 | Västanfors | 37.8 | 18.2 | 174.8 | 89.2 |
| 4.0 | Gagnef | 28.8 | 13.2 | 126.0 | 100.6 |
| 4.4 | Karlsborg | 26.8 | 12.6 | 125.8 | 105.2 |
| 4.4 | Målilla | 27.6 | 12.8 | 128.0 | 99.0 |
| 6.4 | Söderfors | 21.2 | 9.6 | 104.8 | 115.0 |
| 6.8 | Hälleforsnäs | 22.8 | 10.2 | 114.2 | 113.8 |
| 7.6 | Lesjöfors | 19.0 | 7.6 | 88.8 | 105.8 |
| 9.2 | Skutskär | 15.8 | 7.0 | 96.0 | 130.4 |
| 9.4 | Slottsbron | 13.4 | 5.6 | 91.6 | 127.6 |
| 10.6 | Rögle | 10.8 | 4.4 | 74.4 | 122.6 |
| 11.8 | Heros | 5.0 | 1.2 | 65.2 | 148.2 |

## Toppskyttar (bästa säsong — seed 1337)

| # | Spelare | Lag | Mål |
|---|---------|-----|-----|
| 1 | Mikko Persson | Forsbacka | 53 |
| 2 | Oskar Rydberg | Västanfors | 45 |
| 3 | Mats Ros | Målilla | 42 |
| 4 | Anders Kjellberg | Forsbacka | 35 |
| 5 | Rune Berg | Västanfors | 35 |

## Spelarbetyg (snitt, bästa säsong — seed 1337)

| # | Spelare | Lag | Snittbetyg | Matcher |
|---|---------|-----|------------|---------|
| 1 | Mikko Persson | Forsbacka | 8.22 | 22 |
| 2 | Oskar Rydberg | Västanfors | 8.16 | 22 |
| 3 | Anders Kjellberg | Forsbacka | 7.87 | 22 |
| 4 | Oscar Berglund | Västanfors | 7.80 | 22 |
| 5 | Mats Ros | Målilla | 7.72 | 22 |

## Flaggor

- ❌ Målsnittet 10.1 är utanför acceptabelt intervall (3-10)
- ⚠️ Hörnmålsprocenten (27.7%) är utanför idealet 8-18% — troligen pga att hörndetektionen räknar korrelerade händelser snarare än kausalitet
- ⚠️ Röda kort per match (0.947) är högt
- ⚠️ Toppskyttens snittmål (46.6) utanför idealet 15-45

---

*Ideala intervall:*
- Mål/match: ✅ 4–8, ⚠️ 3–4 eller 8–10, ❌ utanför
- 0-0-matcher/säsong: ✅ 0–5, ⚠️ 6–10, ❌ >10
- Hörnmål%: ✅ 8–18%, ⚠️ 5–8% eller 18–25%, ❌ utanför
- Röda kort/match: ✅ 0,1–0,5, ⚠️ 0,5–1,0, ❌ >1,0
- Toppskyttens mål: ✅ 15–45, ⚠️ 10–15 eller 45–60, ❌ utanför
