# Sessionsrapport — 14 april 2026

**Modell:** claude-sonnet-4-6 via Claude Code  
**Commits:** `5cc6be0` → `2d89b52` (2 commits)

---

## Vad gjordes

### 1. Matchmotorkalibrering (calibrate.ts)

Alla 5 targets gröna efter justeringar i `matchEngine.ts`:

| Target | Före | Efter | Mål (±tol) | Status |
|--------|------|-------|------------|--------|
| goalsPerMatch | 5.28 | 10.3 | 10.0 ±1.5 | ✅ |
| cornerGoalShare | 0.111 | 0.226 | 0.232 ±0.03 | ✅ |
| homeWinRate | 0.370 | 0.465 | 0.507 ±0.05 | ✅ |
| drawRate | 0.145 | 0.095 | 0.090 ±0.03 | ✅ |
| secondHalfShare | 0.529 | 0.526 | 0.543 ±0.03 | ✅ |

**Konstanterna som ändrades** (`matchEngine.ts`):

| Konstant | Från | Till | Faktor |
|----------|------|------|--------|
| homeAdvantage | 0.035 | 0.14 | 4.0× |
| goalThreshold attack | `× 0.72` | `× 1.20` | 1.65× |
| goalThreshold transition | `× 0.35` | `× 0.58` | 1.65× |
| goalThreshold halfchance | `× 0.38` | `× 0.63` | 1.65× |
| corner base | `+ 0.03, clamp(0.03, 0.09)` | `+ 0.14, clamp(0.10, 0.30)` | 4.7× |
| corner multiplier | `× 0.14` | `× 0.30` | 2.1× |

**Buggens natur — hörnmålen:**  
Den ursprungliga cornerformeln: `clamp((cornerChance - defenseResist) * 0.14 + 0.03, 0.03, 0.09)`  
`cornerChance ≈ defenseResist ≈ 0.5` för medelstarka lag → differensen ≈ 0 → formeln dominerades alltid av golvvärdet `+0.03`. Multiplikatorn `0.14` hade noll effekt. Fix: höja basen från `+0.03` till `+0.14`.

**Testtrösklar uppdaterade:**
- `seasonSimulation.test.ts`: goalsPerMatch 4–8 → 7–13, highScoring < 46 → < 120
- `matchSimulator.test.ts`: sane range `t >= 2 && t <= 10` → `t >= 4 && t <= 20`

---

### 2. Sprint K — Dark interaction-card redesign

`CornerInteraction.tsx` och `PenaltyInteraction.tsx` redesignade enligt mockup `docs/mockups/match_interactions_v3.html`.

**Förändringarna:**

| Element | Före | Efter |
|---------|------|-------|
| Card background | `card-sharp` (ljus) | `interaction-card` mörk (`--bg-dark`) |
| Card border | `var(--border)` | accent-glow `rgba(196,122,58,0.3)` / danger-glow |
| Delivery-knappar (hörna) | Textknappar | Emoji choice-btns: 💨🎯🤫 |
| Höjd-knappar (straff) | Textknappar | Emoji choice-btns: 🧊⬆️ |
| Straff: direktion | 3 textknappar | Klickbara V/M/H-zoner direkt i SVG-målet |
| Straff: SVG | Saknade | Målbur med outline-målvakt |
| Confirm-knapp hörna | `btn-copper` klass | Gradient `linear-gradient(accent → accent-dark)` + boxShadow |
| Confirm-knapp straff | Flat röd | Gradient `linear-gradient(danger → #8B3E30)` + boxShadow |
| Info-rad bakgrund | `--bg-elevated` | `--bg-dark-surface` |

---

### 3. Bandygrytan-skrapare (bakgrundsprocess)

Körde `bandygrytan_scraper.py` parallellt. Hämtade **1 124 herrmatcher** + **376 dammatcher** (Elitserien 2019–2026).

**Herr Elitserien — verkliga nyckeltal (regular season, 1124 matcher):**

| Mått | Verkligt | Vårt kalibringsmål (gammalt) | Diff |
|------|----------|-------------------------------|------|
| mål/match | **9.12** | 10.0 | −0.88 |
| hemmavinst% | **50.2%** | 50.7% | −0.5pp |
| oavgjort% | **11.6%** | 9.0% | **+2.6pp** ⚠️ |
| hörnmål% | **22.2%** | 23.2% | −1.0pp |
| straffmål% | **5.4%** | 5.1% | +0.3pp |
| andra halvlek mål% | **60.7%** | 54.3% | **+6.4pp** ⚠️ |
| hörn/match | **17.72** | — | |
| utvisningar/match | **3.77** | — | |
| skott/match | **10.5** | — | |

**Per säsong:**

| Säsong | Matcher | Mål/m | Hemma% | Oavgjort% | HörnMål% |
|--------|---------|-------|--------|-----------|----------|
| 2019-20 | 182 | 8.20 | 51.1% | 11.0% | 19.9% |
| 2020-21 | 182 | 9.12 | 48.4% | 13.2% | 21.6% |
| 2021-22 | 240 | 8.99 | 48.3% | 11.7% | 21.1% |
| 2022-23 | 156 | 8.25 | 55.8% | 12.8% | 23.5% |
| 2024-25 | 182 | 10.34 | 51.6% | 8.2% | 22.5% |
| 2025-26 | 182 | 9.74 | 47.3% | 12.6% | 24.9% |

**Målltidens fördelning (Herr):**

| Minut | Andel |
|-------|-------|
| 0–10  | 9.7%  |
| 10–20 | 9.8%  |
| 20–30 | 9.8%  |
| 30–40 | 10.0% |
| 40–50 | **11.8%** ↑ halvtidsjakt |
| 50–60 | 10.9% |
| 60–70 | 10.5% |
| 70–80 | 10.7% |
| 80–90 | **12.9%** ↑ slutryckning |
| 90+   | 3.9%  |

Snittminut: **48.2**, median: **49.0**  
Andel mål i 2:a halvlek: **60.7%** (ej 54.3% som tidigare mål angav)

**Datafiler:**
- `/tmp/bandygrytan_scrape/bandygrytan_detailed.json` (3.1 MB) — per-match detail inkl. spelarhändelser
- `/tmp/bandygrytan_scrape/bandygrytan_stats_full.json` (15.8 MB) — komplett JSON med spelarstatistik
- `docs/data/bandygrytan_calibration_targets.json` — kompakt version av kalibringsmål (incheckad)

---

## Kvarstående gap mot verklighet

| Gap | Motor nu | Verklighet | Prioritet |
|-----|----------|------------|-----------|
| secondHalfShare | 52.6% | 60.7% | Medium — TIMING_WEIGHTS steg 40–60 behöver mer boost |
| drawPct | 9.5% | 11.6% | Låg — homeAdvantage möjligen lite hög (0.14) |
| avgSuspensionsPerMatch | ej mätt | 3.77 | Låg — lägg till i calibrate.ts |

Notera: `calibrate.ts` kör mot `docs/data/bandygrytan_stats.json` som fortfarande har de gamla målen (10.0 mål, 54.3% 2H). Uppdatera den till `bandygrytan_calibration_targets.json`-värdena (9.12 mål, 60.7% 2H) vid nästa kalibreringssprint.

---

## Filer ändrade denna session

| Fil | Förändring |
|-----|------------|
| `src/domain/services/matchEngine.ts` | 5 konstantändringar (homeAdvantage + 4 goalThreshold) |
| `src/presentation/components/match/CornerInteraction.tsx` | Sprint K redesign — dark card, emoji btns |
| `src/presentation/components/match/PenaltyInteraction.tsx` | Sprint K redesign — dark card, SVG-mål, emoji btns |
| `src/domain/services/__tests__/seasonSimulation.test.ts` | Uppdaterade testtrösklar |
| `src/domain/services/__tests__/matchSimulator.test.ts` | Uppdaterat sane range |
| `docs/data/bandygrytan_calibration_targets.json` | NY — komplett kalibringsdata från skraparen |
| `docs/RAPPORT_SESSION_14APR.md` | NY — denna fil |

---

## Status kvarstående arbete (docs/SPRINT_ALLT_KVAR.md)

Alla Sprint A–K implementerade. Kvarstår från listan:
- Kalibrering: targets bör uppdateras mot ny scraper-data
- Parkerat (docs/FIXSPEC_PARKERAT.md): presskonferens-scen, transferdödline, rykte
