# CODE-INSTRUKTIONER — 14 april 2026 (sent kväll)

`npm run build && npm test` efter VARJE fix.

---

## STATUS

### ✅ KLART IDAG (14 april)

**Matchmotor — datadriven kalibrering:**
- `GOAL_TIMING_BY_PERIOD` — empiriska vikter per 10-minutersperiod (halvtidsjakt 1.160×, slutryckning 1.269×)
- `SUSP_TIMING_BY_PERIOD` — utvisningsvikter (slutfas 1.639×, öppning 0.447×)
- `PHASE_CONSTANTS` — fas-specifika konstanter (KVF/SF/Final) med goalMod, homeAdvDelta, suspMod, cornerTrailingMod
- Powerplay goalThreshold-bonus + defDefense-reduktion under utvisning
- `getSecondHalfMode()` med fas-medvetenhet (KVF: chasing vid −1)
- Alla konstanter i `matchUtils.ts` — delade av båda motorerna

**Sprint A–K (Rik matchupplevelse):**
- A–B: kontextuell commentary med `commentaryType`-visuell differentiering
- C: narrativ båge, `getSecondHalfMode`, pacing
- D: tactical_shift, player_duel, atmosphere, offside_call, freekick_danger
- E–F: `getFinalWhistleSummary` (5 lager), `getMatchHeadline`, MATCHENS BERÄTTELSE-kort
- G: MatchMode (full/commentary/quicksim), StartStep 3-knappar
- H–J: CounterInteraction, FreeKickInteraction, LastMinutePress — dark card, SVG, wired
- K: CornerInteraction + PenaltyInteraction redesign (dark card, emoji-btns, SVG-målbur)
- Commentary med slutspelsmedvetenhet (fas-specifika kommentarer)

**Playtest-buggar (15 st, alla fixade):**
- PT-1: Halvvägsöversikt — fortsätt-knapp tillagd
- PT-2/3: Scouting + värvning — fungerar nu
- PT-4: Juniorer stannar i akademin tills 20 (inte auto-bort)
- PT-5: Serietabellen låses efter grundserien
- PT-6: Annandagsbandy = 26 december, rätt namn
- PT-7: SM-final tredje helgen i mars (var redan korrekt)
- PT-8: Synliga effekter borttagna från presskonferens/kommun-val
- PT-9: Truppsammansättning balanserad (2 MV, 4 B, 3 YH, 4 MF, 3 FW)
- PT-10: Positionsförkortningar → MV/B/YH/MF/A
- PT-11: All hall-text borttagen
- PT-12: Lönebudget satt korrekt vid start
- PT-13: Lägsta lön ger −12 morale
- PT-14: Patron-bugg fixad (events raderades/återskapades varje omgång)
- PT-15: Vila: +1 morale/omg (ned från +3), +8 fitness (ned från +15)

**Data:**
- 1 124 matcher skrapade från Bandygrytan (herr + 376 dam)
- 7 grundserieanalyser + slutspelsanalys (KVF/SF/Final)
- Matchflödesspec med 5-minutersblock

---

## ❌ KVAR ATT GÖRA

### 1️⃣ KALIBRERING — Kör och verifiera (prio 1)

```bash
node_modules/.bin/vite-node scripts/calibrate.ts
```

Alla targets ska vara ✅:

| Target | Värde | Tolerans |
|--------|-------|----------|
| goalsPerMatch | 9.12 | ±1.5 |
| secondHalfShare | 60.7% | ±3% |
| homeWinRate | 50.2% | ±5% |
| drawRate | 11.6% | ±3% |
| cornerGoalShare | 22.2% | ±3% |
| avgSuspensionsPerMatch | 3.77 | ±0.5 |
| ppGoalsPer10Min | 0.76 | ±0.15 |

Calibrate.ts-targets behöver uppdateras från gamla värden (10.0 mål, 54.3% 2H) till nya (`bandygrytan_calibration_targets.json`).

### 2️⃣ BUGGAR FRÅN SPRINT_ALLT_KVAR (ej verifierade)

| # | Bugg | Risk |
|---|------|------|
| 1.3 | Kontraktsförnyelse fastnar | Behöver speltesta |
| 1.4 | Mecenater spawnar aldrig | Triggers ej verifierade |
| 1.5 | cupRun board objective fail | Troligen fixat |
| 1.6 | Troféer lösa på dashboard | Okänt |
| 1.14 | paddingBottom 7 skärmar | Oklart vilka åtgärdats |
| 1.16 | Cupvy saknar progress-rad | Ej implementerat |

Detaljer: `docs/SPRINT_ALLT_KVAR.md`

### 3️⃣ PARKERAT — docs/FIXSPEC_PARKERAT.md

- P1: Presskonferens som visuell scen
- P2: Transferdödline-känsla
- P3: Klubbens rykte utanför orten

---

## SPEC- OCH DATAFILER

| Fil | Innehåll |
|-----|----------|
| `docs/SPEC_MATCHFLODE.md` | 5-minutersblock-spec med sannolikheter + §10 slutspelsmodifieringar |
| `docs/data/ANALYS_MATCHMONSTER.md` | 7 grundserieanalyser |
| `docs/data/ANALYS_SLUTSPEL.md` | Slutspelsanalys: KVF/SF/Final |
| `docs/data/bandygrytan_calibration_targets.json` | Verkliga targets (1124 matcher) |
| `docs/PLAYTEST_BUGGAR_KVÄLL.md` | 15 playtest-buggar (alla fixade) |
| `docs/SPRINT_ALLT_KVAR.md` | Kvarstående äldre buggar |
| `docs/SPEC_RIK_MATCHUPPLEVELSE.md` | Sprint A–K spec (alla implementerade) |
| `docs/FIXSPEC_PARKERAT.md` | P1–P3 (parkerat) |
| `docs/RAPPORT_SESSION_14APR.md` | Sessionsrapport med konstanttabeller |

## KVALITETSGATES

```bash
npm run build && npm test
node_modules/.bin/vite-node scripts/calibrate.ts
```
