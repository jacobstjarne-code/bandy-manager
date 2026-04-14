# CODE-INSTRUKTIONER — 14 april 2026 (uppdaterad kväll)

`npm run build && npm test` efter VARJE fix.

---

## STATUS

### ✅ KLART
- Kalibrering — alla 5 targets gröna
- Sprint A–K (Rik matchupplevelse) — allt implementerat:
  - A–B: `getMatchSituation`, kontextuell commentary, `commentaryType`-visuell differentiering i CommentaryFeed
  - C: `getSecondHalfMode` (chasing/controlling/cruise/even_battle), `isCommentaryMode`-pacing
  - D: tactical_shift, player_duel, atmosphere, offside_call, freekick_danger som sekvenstyper
  - E–F: `getFinalWhistleSummary` (5-lagers FinalWhistleContext), `getMatchHeadline` (VÄNDNINGEN/TUNGT/CUPSKRÄLL etc), tre matchlägen
  - G: `MatchMode` (full/commentary/quicksim), StartStep 3-knappsgrid
  - H–J: CounterInteraction, FreeKickInteraction, LastMinutePress — alla wired i MatchLiveScreen
  - K: dark interaction-card, CornerInteraction + PenaltyInteraction redesign
- Hörn-SVG buggar (1.2 + 2.3) — ersatta av Sprint K
- Coach marks, arenanamn, klacknamn, kapten, straffar, matchsummary etc

---

## ❌ KVAR ATT GÖRA

### 1️⃣ BUGGAR — speltesta och fixa

Flertalet *kan* vara fixade av en Explore-agent tidigare, men ej verifierade live.

| # | Bugg | Risk |
|---|------|------|
| 1.3 | Kontraktsförnyelse fastnar | Behöver speltesta — 4 delåtgärder |
| 1.4 | Mecenater spawnar aldrig | Logiken finns, triggers ej verifierade |
| 1.5 | cupRun board objective fail | Troligen fixat, ej verifierat |
| 1.6 | Troféer lösa på dashboard | Okänt |
| 1.14 | paddingBottom 7 skärmar | Oklart vilka som åtgärdats |
| 1.16 | Cupvy saknar progress-rad | Ej implementerat |

Detaljer: `docs/SPRINT_ALLT_KVAR.md` punkt 1.3–1.16.

Lägre prio (troligen fixade eller triviala):
- 1.7 Form-prickar, 1.8 DiamondDivider, 1.9 Styrelsemöte, 1.10 Presskonferens, 1.11 Kafferum, 1.12 ?-knapp, 1.13 Transfers flikar, 1.15 CS diminishing returns

### 2️⃣ KALIBRERING — uppdatera mot ny data

Tre kvarstående gap:

| Gap | Motor | Verklighet | Åtgärd |
|-----|-------|------------|--------|
| secondHalfShare | 52.6% | **60.7%** | TIMING_WEIGHTS steg 40–60 behöver mer boost |
| drawPct | 9.5% | **11.6%** | homeAdvantage (0.14) möjligen lite hög |
| calibrate.ts targets | 10.0 mål, 54.3% 2H | 9.12 mål, 60.7% 2H | Uppdatera till `bandygrytan_calibration_targets.json`-värden |

Kör:
```bash
node_modules/.bin/vite-node scripts/calibrate.ts
```

### 3️⃣ PARKERAT (gör INTE nu) — docs/FIXSPEC_PARKERAT.md

- P1: Presskonferens som visuell scen
- P2: Transferdödline-känsla
- P3: Klubbens rykte utanför orten

Fullspecade men ej prioriterade.

---

## SPEC-FILER

| Fil | Innehåll |
|-----|----------|
| `docs/SPRINT_ALLT_KVAR.md` | Buggar (1.3–1.16) + kalibrering |
| `docs/SPEC_RIK_MATCHUPPLEVELSE.md` | Sprint A–K spec (alla implementerade) |
| `docs/mockups/match_interactions_v3.html` | Hörna/straff redesign, kontring, frislag, sista-minuten, headlines |
| `docs/mockups/match_experience_mockups_v2.html` | StartStep 3 lägen, commentary-typer, matchens berättelse |
| `docs/FIXSPEC_PARKERAT.md` | Presskonferens-scen, transferdödline, rykte |
| `docs/data/bandygrytan_calibration_targets.json` | Verklig data (1124 matcher, 2019–2026) |
| `docs/RAPPORT_SESSION_14APR.md` | Sessionsrapport med konstanttabeller |

## KVALITETSGATES

```bash
npm run build && npm test
```

- Build+test efter VARJE steg
- ALDRIG verifiera komponenter i isolation — läs parent screen FÖRST
- Trace full renderflöde
- Mockups = sanning. Implementera det du SER.
