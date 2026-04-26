# PASS_5A — Inventering av kalibreringskritiska magnituder i matchmotorn

**Datum:** 2026-04-26
**Skapad av:** Code (Claude Sonnet 4-6)
**Status:** Preliminär — väntar på Opus granskning (steg 7) innan D010+ skapas

Kriterium för urval: konstanten påverkar ett S-fact-target, eller bryter
motorbalansen om den halveras eller dubbleras. Sannolikheter, multiplikatorer
och trösklar som är "bara siffror" utan spårbarhet.

---

## INVENTERING

| Föreslagen ID | Vad | Filsökväg + rad | Aktuellt värde | S-fact koppling |
|---------------|-----|-----------------|----------------|-----------------|
| D010 | Hemmafördelsmultiplikator (homeAdvantage default) | `src/domain/services/matchCore.ts:207` | `0.14` | S004 (50.2% hemmaseger) |
| D011 | Andra halvleks målboost (SECOND_HALF_BOOST) | `src/domain/services/matchCore.ts:67` | `1.19` | S014 (54.2% mål i 2:a halvlek) |
| D012 | Straff-grundsannolikhet per steg när chanceQuality > 0.40 (penProb base) | `src/domain/services/matchCore.ts:739` | `0.13` | S009 (5.4% straffmålsandel) |
| D013 | Attacksekvens goalThreshold-multiplikator (chanceQuality × X) | `src/domain/services/matchCore.ts:759` | `1.05` | S001 (9.12 mål/match) |
| D014 | Hörn-goalThreshold basvärde (cornerBase, första halvlek) | `src/domain/services/matchCore.ts:895` | `0.105` | S008 (22.2% hörnmålsandel) |
| D015 | Utvisnings-foulThreshold multiplikator (kalibrering mot S011) | `src/domain/services/matchCore.ts:994` | `1.46` | S011 (3.77 utvisningar/match) |
| D016 | Spelreduktion vid aktiv utvisning (homePenaltyFactor / awayPenaltyFactor) | `src/domain/services/matchCore.ts:659–660` | `0.65` | S011 (indirekt — påverkar momentum vid numerärt underläge) |
| D017 | Trailing-boost per målsdifferens i 2:a halvlek (per mål, max 3 mål) | `src/domain/services/matchCore.ts:665` | `0.16` | S013 (78.1% halvtidsledning vinner — comeback-mekanik) |
| D018 | Leading-brake per målsdifferens i 2:a halvlek (per mål, max 3 mål) | `src/domain/services/matchCore.ts:666` | `0.08` | S013 (halvtidsledning, asymmetri mot D017) |
| D019 | Chasing-attackmultiplikator i 2:a halvlek (SecondHalfMode=chasing) | `src/domain/services/matchCore.ts:623` | `1.22` | S013 (comeback-frekvens) |
| D020 | Omställningsmål goalThreshold-multiplikator (transition-sekvens) | `src/domain/services/matchCore.ts:822` | `0.58` | S001 (totalmål — transition bidrar ~10-15%) |
| D021 | Halvchans goalThreshold-multiplikator (halfchance-sekvens) | `src/domain/services/matchCore.ts:964` | `0.63` | S001 (totalmål — halfchance bidrar ~5-10%) |
| D022 | Basfrekvens-vikt för hörnsekvens (wCorner i buildSequenceWeights) | `src/domain/services/matchCore.ts:452` | `40` | S007 (8.83 hörnor/match) och S008 |
| D023 | Basfrekvens-vikt för foulsekvens (wFoul i buildSequenceWeights) | `src/domain/services/matchCore.ts:454` | `24` | S011 (utvisningsfrekvens) |
| D024 | Utvisningstid i steg (duration = 3 + rand()*4, ger 3–6 steg ≈ 4.5–9 min) | `src/domain/services/matchCore.ts:1026` | `min=3, range=4` | S011 (indirekt — påverkar hur länge underläge varar) |

---

## NOTERINGAR

### Inte med i listan (men nära gränsen)

- **PROFILE_GOAL_MODS** (defensive_battle: 0.60, standard: 1.00, open_game: 1.25, chaotic: 1.55)
  och profilfördelningsvikterna (20/55/20/5) påverkar match-till-match-variation men inte
  säsongsgenomsnittet direkt. De är kalibrerade mot att det vägda medelvärdet ≈ 1.0.
  Kan bli D-facts i pass 6 om profilvariationen behöver spåras separat.

- **PHASE_CONSTANTS** (goalMod, homeAdvDelta, suspMod, cornerTrailingMod, cornerLeadingMod,
  cornerGoalMod per fas) är redan dokumenterade i matchUtils.ts med kommentarer om källdata.
  De har koppling till S017 och slutspelsdata. Kan bli ett D-fact per fas eller ett
  samlingsfact. Föreslås som kandidat för pass 6.

- **canScore-kapsgränserna** (hs + as_ >= 13 och abs(newDiff) <= 6) är hårdkodade tak
  för extremresultat. Inte kalibrerade mot S-facts men påverkar slutresultatsfördelning.
  Borderline — inkluderas inte nu.

- **cornerRecovery-kontringssannolikhet** (0.09 * (1 - cornerRecovery)) är en interaktionsterm
  snarare än en fristående kalibreringskonstant. Inkluderas inte.

### Prioriteringsordning för D010–D024

Om alla ska bli D-facts är rekommenderad ordning:

1. D010 (homeAdvantage) — direkt S004-koppling, enkelt att verifiera
2. D011 (SECOND_HALF_BOOST) — direkt S014-koppling, en konstant
3. D012 (penProb) — direkt S009-koppling, isolerad trigger
4. D014 (cornerBase) — direkt S008-koppling, mest känslig konstant
5. D015 (foulThreshold mult) — direkt S011-koppling
6. D013, D020, D021 (goalThreshold-multiplikatorerna) — påverkar S001 kollektivt
7. D017–D019 (trailing/leading/chasing) — påverkar S013, svårare att isolera
8. D016 (penaltyFactor) — indirekt koppling
9. D022–D024 (sekvens-vikter, utvisningstid) — påverkar S007/S011, men covarierande med D023/D015

---

## VALIDATOR-STATUS

Kört efter steg 5: **RENT** — 65 facts, 0 strukturfel, 0 invariantfel.
H002 och H003 valida (har predicted_value och test_method).
H001 valida med closed_with tillagd.
D008 valida.
