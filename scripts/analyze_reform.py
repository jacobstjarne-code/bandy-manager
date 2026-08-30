"""
analyze_reform.py
P0-B: "Våga visa rött"-effektens kompletta utvärdering — 6 dimensioner.

Körkommando:
  PATH="/opt/homebrew/bin:$PATH" python3 scripts/analyze_reform.py

Output:
  docs/data/INTERNAL_reform_effect_complete.md   (intern, inkl. domarnamn)
  docs/data/reform_effect_data.json              (publik, inga domarnamn)
  Finding 052-sidan skrivs inte av analysen; den är redaktionellt underhållen.
  + appendix i INTERNAL_REFEREE_DEEP_DIVE.md
"""

import json
import math
import sys
from collections import defaultdict
from pathlib import Path

# ── Helpers ───────────────────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent / "pipeline"))
from analysis_helpers import bootstrap_ci, wilson_ci, cohens_d, binom_p, bonferroni_p

ROOT = Path(__file__).parent.parent

# ── Load data ─────────────────────────────────────────────────────────────────
with open(ROOT / "docs/data/bandygrytan_detailed.json") as f:
    data = json.load(f)

HERR = data["herr"]["matches"]
DAM = data["dam"]["matches"]

ALL_SEASONS = ["2019-20", "2020-21", "2021-22", "2022-23", "2024-25", "2025-26"]
PRE_SEASONS = ["2019-20", "2020-21", "2021-22", "2022-23", "2024-25"]
TARGET_SEASON = "2025-26"

PLAYOFF_PHASES = {"quarterfinal", "semifinal", "final", "round_of_16", "playoff"}
REGULAR_PHASES = {"regular", "qualification"}

# Bonferroni: 6 dimensioner × 2 serier = 12 huvudtester
N_BONF = 12


# ── Utility functions ─────────────────────────────────────────────────────────

def fouls(match):
    return match.get("fouls") or []

def foul_count(match):
    return len(fouls(match))

def mean(vals):
    return sum(vals) / len(vals) if vals else float("nan")

def variance(vals):
    if len(vals) < 2:
        return 0.0
    m = mean(vals)
    return sum((x - m) ** 2 for x in vals) / (len(vals) - 1)

def welch_t(a, b):
    """Returns (t, p_approx, df) using Welch t-test. Falls back to scipy if available."""
    try:
        from scipy import stats
        t, p = stats.ttest_ind(a, b, equal_var=False)
        return float(t), float(p)
    except ImportError:
        pass
    if len(a) < 2 or len(b) < 2:
        return float("nan"), float("nan")
    ma, mb = mean(a), mean(b)
    va, vb = variance(a), variance(b)
    na, nb = len(a), len(b)
    se = math.sqrt(va / na + vb / nb)
    if se == 0:
        return 0.0, 1.0
    t = (ma - mb) / se
    # Welch-Satterthwaite df
    num = (va / na + vb / nb) ** 2
    denom = (va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1)
    df = num / denom if denom > 0 else na + nb - 2
    # p via t-distribution approximation (two-tailed)
    try:
        from scipy import stats
        p = 2 * stats.t.sf(abs(t), df)
    except ImportError:
        # rough normal approximation
        z = abs(t)
        p = 2 * (1 - 0.5 * (1 + math.erf(z / math.sqrt(2))))
    return float(t), float(p)

def fmt_p(p):
    if math.isnan(p):
        return "n/a"
    if p < 0.001:
        return "<0.001"
    return f"{p:.3f}"

def fmt_f(v, decimals=3):
    if math.isnan(v):
        return "n/a"
    return f"{v:.{decimals}f}"

def pct_change(new, old):
    if old == 0:
        return float("nan")
    return (new - old) / old * 100

# ── DIMENSION 1: Per fas ──────────────────────────────────────────────────────

def dim1_by_phase(matches, series_name):
    """Returns dict with per-season, per-phase breakdown and stats."""
    results = {}
    for season in ALL_SEASONS:
        sm = [m for m in matches if m["season"] == season]
        reg = [m for m in sm if m.get("phase") in REGULAR_PHASES]
        play = [m for m in sm if m.get("phase") in PLAYOFF_PHASES]
        results[season] = {
            "regular": {"n": len(reg), "fouls": [foul_count(m) for m in reg]},
            "playoff": {"n": len(play), "fouls": [foul_count(m) for m in play]},
        }

    # 2025-26 regular vs 2022-23 regular Welch t-test
    a = results["2025-26"]["regular"]["fouls"]
    b = results["2022-23"]["regular"]["fouls"]
    t, p = welch_t(a, b)

    # note if 2025-26 playoff is incomplete (< 10 matches)
    playoff_n_2526 = results["2025-26"]["playoff"]["n"]
    playoff_note = ""
    if playoff_n_2526 < 10:
        playoff_note = f"⚠ 2025-26 slutspel: n={playoff_n_2526} — ofullständigt, tolkas med försiktighet"

    return results, t, p, playoff_note

# ── DIMENSION 2: Per period ───────────────────────────────────────────────────

PERIODS = [(0, 29), (30, 44), (45, 59), (60, 74), (75, 90)]
PERIOD_LABELS = ["0–29", "30–44", "45–59", "60–74", "75–90"]

def assign_period(minute):
    for i, (lo, hi) in enumerate(PERIODS):
        if lo <= minute <= hi:
            return i
    return -1  # out of range

def dim2_by_period(matches, series_name):
    """Per-season, per-period foul distribution."""
    results = {}
    for season in ALL_SEASONS:
        sm = [m for m in matches if m["season"] == season]
        counts = [0] * len(PERIODS)
        total = 0
        for m in sm:
            for foul_event in fouls(m):
                minute = foul_event.get("minute", -1)
                if minute is None or minute < 0:
                    continue
                idx = assign_period(minute)
                if idx >= 0:
                    counts[idx] += 1
                    total += 1
        results[season] = {
            "total": total,
            "counts": counts,
            "pct": [c / total * 100 if total > 0 else 0 for c in counts],
        }

    # Per-match early foul (0–29) fraction, Welch t for 2025-26 vs pre-seasons
    def per_match_early_frac(season_matches):
        fracs = []
        for m in season_matches:
            fs = fouls(m)
            if not fs:
                continue
            early = sum(1 for f in fs if 0 <= (f.get("minute") or -1) <= 29)
            fracs.append(early / len(fs))
        return fracs

    a = per_match_early_frac([m for m in matches if m["season"] == TARGET_SEASON])
    b = per_match_early_frac([m for m in matches if m["season"] in PRE_SEASONS])
    t, p = welch_t(a, b)
    d = cohens_d(a, b)

    return results, t, p, d, mean(a), mean(b)

# ── DIMENSION 3: Per matchtemperatur ─────────────────────────────────────────

def dim3_match_temperature(matches, series_name):
    """Matchup-kvartiler baserade på historisk foul-frekvens."""
    # Beräkna baseline per matchup (hemma+borta normaliserat)
    matchup_fouls = defaultdict(list)
    for m in matches:
        key = tuple(sorted([m["homeTeam"], m["awayTeam"]]))
        matchup_fouls[key].append(foul_count(m))

    matchup_baseline = {k: mean(v) for k, v in matchup_fouls.items()}

    # Sortera matchups i kvartilar
    all_baselines = sorted(matchup_baseline.values())
    n = len(all_baselines)
    q_boundaries = [
        all_baselines[int(n * 0.25)],
        all_baselines[int(n * 0.50)],
        all_baselines[int(n * 0.75)],
    ]

    def get_quartile(val):
        if val <= q_boundaries[0]:
            return 1
        elif val <= q_boundaries[1]:
            return 2
        elif val <= q_boundaries[2]:
            return 3
        else:
            return 4

    # Per-match data by quartile and season
    quartile_data = defaultdict(lambda: defaultdict(list))
    for m in matches:
        key = tuple(sorted([m["homeTeam"], m["awayTeam"]]))
        bl = matchup_baseline.get(key, float("nan"))
        if math.isnan(bl):
            continue
        q = get_quartile(bl)
        quartile_data[q][m["season"]].append(foul_count(m))

    results = {}
    for q in range(1, 5):
        pre = []
        for s in PRE_SEASONS:
            pre.extend(quartile_data[q].get(s, []))
        cur = quartile_data[q].get(TARGET_SEASON, [])
        t, p = welch_t(cur, pre)
        d = cohens_d(cur, pre)
        results[q] = {
            "pre_n": len(pre),
            "cur_n": len(cur),
            "pre_mean": mean(pre),
            "cur_mean": mean(cur),
            "delta": mean(cur) - mean(pre),
            "delta_pct": pct_change(mean(cur), mean(pre)),
            "t": t, "p_raw": p, "p_bonf": bonferroni_p(p, N_BONF),
            "d": d if d is not None else float("nan"),
        }

    return results, q_boundaries

# ── DIMENSION 4: Per domare (INTERN) ─────────────────────────────────────────

def dim4_per_referee(matches, series_name):
    """Per-domare: 2025-26 vs egna baseline (2022-23 + 2024-25)."""
    ref_season_fouls = defaultdict(lambda: defaultdict(list))
    for m in matches:
        ref = (m.get("referees") or {}).get("main")
        if not ref:
            continue
        ref_season_fouls[ref][m["season"]].append(foul_count(m))

    results = {}
    for ref, season_data in ref_season_fouls.items():
        n_2526 = len(season_data.get("2025-26", []))
        if n_2526 < 10:
            continue
        cur = season_data.get("2025-26", [])
        baseline_seaons = ["2022-23", "2024-25"]
        pre = []
        for s in baseline_seaons:
            pre.extend(season_data.get(s, []))
        if len(pre) < 5:
            # Try broader baseline
            for s in PRE_SEASONS:
                pre.extend(season_data.get(s, []))
            baseline_used = "alla pre-säsonger"
        else:
            baseline_used = "2022-23 + 2024-25"

        if not pre:
            continue

        cur_mean = mean(cur)
        pre_mean = mean(pre)
        delta = cur_mean - pre_mean
        t, p_raw = welch_t(cur, pre)
        d = cohens_d(cur, pre)

        # Klassificering
        if delta > 0.5 and p_raw < 0.10:
            classification = "tydlig ökning"
        elif delta < -0.5 and p_raw < 0.10:
            classification = "tydlig minskning"
        else:
            classification = "ingen klar förändring"

        results[ref] = {
            "n_2526": n_2526,
            "n_pre": len(pre),
            "cur_mean": cur_mean,
            "pre_mean": pre_mean,
            "delta": delta,
            "p_raw": p_raw,
            "d": d if d is not None else float("nan"),
            "classification": classification,
            "baseline_used": baseline_used,
        }

    # Sort by delta descending
    sorted_refs = sorted(results.items(), key=lambda x: -x[1]["delta"])
    return sorted_refs

# ── DIMENSION 5: Röda kort ────────────────────────────────────────────────────

def dim5_red_cards(matches):
    """Undersök om det finns röda kort / matchstraff i datan."""
    # Check foul durations
    all_durations = set()
    for m in matches:
        for f in (m.get("fouls") or []):
            dur = f.get("duration", 10)
            all_durations.add(dur)

    # Check for red card / expulsion keys in match
    sample_keys = set()
    for m in matches[:10]:
        sample_keys.update(m.keys())

    # Check for penalty goals right after fouls (proxy for grova foul)
    # Penalty goal within 2 minutes of a foul near end of match (75+)
    proxy_candidates = 0
    for m in matches:
        fs = fouls(m)
        late_fouls = [f for f in fs if (f.get("minute") or 0) >= 75]
        if not late_fouls:
            continue
        penalty_goals = [g for g in (m.get("goals") or []) if g.get("type") == "penalty"]
        for pg in penalty_goals:
            pg_min = pg.get("minute", -1)
            if pg_min is None:
                continue
            for f in late_fouls:
                fmin = f.get("minute") or 0
                if 0 <= pg_min - fmin <= 3:
                    proxy_candidates += 1
                    break

    return {
        "unique_durations": sorted(all_durations),
        "match_keys_sample": sorted(sample_keys),
        "proxy_late_penalty_foul_pairs": proxy_candidates,
    }

# ── DIMENSION 6: Tidiga utvisningar (0–29) ────────────────────────────────────

def dim6_early_fouls(matches, series_name):
    """Andel utvisningar 0–29 per match som testmått för reformens uttalade mål."""
    # Per match: andel utvisningar i 0-29 av totala
    def early_fracs_for_season(season):
        sm = [m for m in matches if m["season"] == season]
        fracs = []
        for m in sm:
            fs = fouls(m)
            if not fs:
                continue
            with_minute = [f for f in fs if f.get("minute") is not None]
            if not with_minute:
                continue
            early = sum(1 for f in with_minute if 0 <= f["minute"] <= 29)
            fracs.append(early / len(with_minute))
        return fracs

    per_season = {}
    for s in ALL_SEASONS:
        fracs = early_fracs_for_season(s)
        ci = bootstrap_ci(fracs)
        per_season[s] = {
            "n": len(fracs),
            "mean": mean(fracs),
            "ci_lo": ci[0],
            "ci_hi": ci[1],
        }

    cur_fracs = early_fracs_for_season(TARGET_SEASON)
    pre_fracs = []
    for s in PRE_SEASONS:
        pre_fracs.extend(early_fracs_for_season(s))

    t, p_raw = welch_t(cur_fracs, pre_fracs)
    d = cohens_d(cur_fracs, pre_fracs)
    p_bonf = bonferroni_p(p_raw, N_BONF)

    return per_season, t, p_raw, p_bonf, d, mean(cur_fracs), mean(pre_fracs)

# ── Season summary ────────────────────────────────────────────────────────────

def season_summary(matches):
    """Basic per-season fouls/match stats."""
    result = {}
    for s in ALL_SEASONS:
        sm = [m for m in matches if m["season"] == s and m.get("phase") in REGULAR_PHASES]
        fcs = [foul_count(m) for m in sm]
        ci = bootstrap_ci(fcs)
        result[s] = {
            "n": len(sm),
            "mean": mean(fcs),
            "ci_lo": ci[0],
            "ci_hi": ci[1],
        }
    return result

# ── Run all dimensions ────────────────────────────────────────────────────────

print("=== Kör P0-B reform-analys ===")

# Herr
print("\n[Herr] Grundläggande säsongsdata...")
herr_season = season_summary(HERR)
herr_pre_mean = mean([herr_season[s]["mean"] for s in PRE_SEASONS])
herr_cur_mean = herr_season[TARGET_SEASON]["mean"]
herr_delta_pct = pct_change(herr_cur_mean, herr_pre_mean)

print(f"  Pre-snitt: {herr_pre_mean:.3f}, 2025-26: {herr_cur_mean:.3f}, Δ: {herr_delta_pct:+.1f}%")

print("[Herr] Dimension 1: Per fas...")
herr_d1, herr_d1_t, herr_d1_p, herr_d1_note = dim1_by_phase(HERR, "herr")

print("[Herr] Dimension 2: Per period...")
herr_d2, herr_d2_t, herr_d2_p, herr_d2_d, herr_d2_cur, herr_d2_pre = dim2_by_period(HERR, "herr")

print("[Herr] Dimension 3: Matchtemperatur...")
herr_d3, herr_d3_qbounds = dim3_match_temperature(HERR, "herr")

print("[Herr] Dimension 4: Per domare...")
herr_d4 = dim4_per_referee(HERR, "herr")

print("[Herr] Dimension 5: Röda kort...")
herr_d5 = dim5_red_cards(HERR)

print("[Herr] Dimension 6: Tidiga utvisningar...")
herr_d6_season, herr_d6_t, herr_d6_p, herr_d6_p_bonf, herr_d6_d, herr_d6_cur, herr_d6_pre = dim6_early_fouls(HERR, "herr")

# Dam
print("\n[Dam] Grundläggande säsongsdata...")
dam_season = season_summary(DAM)
dam_pre_mean = mean([dam_season[s]["mean"] for s in PRE_SEASONS if dam_season[s]["n"] > 0])
dam_cur_mean = dam_season[TARGET_SEASON]["mean"]
dam_delta_pct = pct_change(dam_cur_mean, dam_pre_mean)

print(f"  Pre-snitt: {dam_pre_mean:.3f}, 2025-26: {dam_cur_mean:.3f}, Δ: {dam_delta_pct:+.1f}%")

print("[Dam] Dimension 1: Per fas...")
dam_d1, dam_d1_t, dam_d1_p, dam_d1_note = dim1_by_phase(DAM, "dam")

print("[Dam] Dimension 2: Per period...")
dam_d2, dam_d2_t, dam_d2_p, dam_d2_d, dam_d2_cur, dam_d2_pre = dim2_by_period(DAM, "dam")

print("[Dam] Dimension 3: Matchtemperatur...")
dam_d3, dam_d3_qbounds = dim3_match_temperature(DAM, "dam")

print("[Dam] Dimension 4: Per domare...")
dam_d4 = dim4_per_referee(DAM, "dam")

print("[Dam] Dimension 5: Röda kort...")
dam_d5 = dim5_red_cards(DAM)

print("[Dam] Dimension 6: Tidiga utvisningar...")
dam_d6_season, dam_d6_t, dam_d6_p, dam_d6_p_bonf, dam_d6_d, dam_d6_cur, dam_d6_pre = dim6_early_fouls(DAM, "dam")

# ── Dim4 stats ────────────────────────────────────────────────────────────────
herr_d4_okning = sum(1 for _, v in herr_d4 if v["classification"] == "tydlig ökning")
herr_d4_minskning = sum(1 for _, v in herr_d4 if v["classification"] == "tydlig minskning")
herr_d4_oforandrad = sum(1 for _, v in herr_d4 if v["classification"] == "ingen klar förändring")
herr_d4_total = len(herr_d4)

dam_d4_okning = sum(1 for _, v in dam_d4 if v["classification"] == "tydlig ökning")
dam_d4_minskning = sum(1 for _, v in dam_d4 if v["classification"] == "tydlig minskning")
dam_d4_oforandrad = sum(1 for _, v in dam_d4 if v["classification"] == "ingen klar förändring")
dam_d4_total = len(dam_d4)

print(f"\n[Herr] Domare: {herr_d4_total} st (n≥10 i 25/26) — ökning: {herr_d4_okning}, oförändrad: {herr_d4_oforandrad}, minskning: {herr_d4_minskning}")
print(f"[Dam] Domare: {dam_d4_total} st (n≥10 i 25/26) — ökning: {dam_d4_okning}, oförändrad: {dam_d4_oforandrad}, minskning: {dam_d4_minskning}")

print(f"\n[Dim 5 - Herr] Unika foul-durationer: {herr_d5['unique_durations']}")
print(f"[Dim 5 - Dam] Unika foul-durationer: {dam_d5['unique_durations']}")
print(f"[Dim 5 - Herr] Extra keys i match: {herr_d5['match_keys_sample']}")

# ── Write INTERNAL report ─────────────────────────────────────────────────────

def build_season_table_d1(d1_data, series):
    rows = []
    for s in ALL_SEASONS:
        reg = d1_data[s]["regular"]
        play = d1_data[s]["playoff"]
        reg_mean = mean(reg["fouls"]) if reg["fouls"] else float("nan")
        play_mean = mean(play["fouls"]) if play["fouls"] else float("nan")
        rows.append(f"| {s} | {reg['n']} | {fmt_f(reg_mean, 3)} | {play['n']} | {fmt_f(play_mean, 3)} |")
    return "\n".join(rows)

def build_period_table(d2_data):
    rows = []
    for s in ALL_SEASONS:
        pcts = d2_data[s]["pct"]
        total = d2_data[s]["total"]
        pct_strs = " | ".join(f"{p:.1f}%" for p in pcts)
        rows.append(f"| {s} | {total} | {pct_strs} |")
    return "\n".join(rows)

def build_temp_table(d3_data):
    rows = []
    for q in range(1, 5):
        v = d3_data[q]
        delta_sign = f"+{v['delta']:.3f}" if v['delta'] >= 0 else f"{v['delta']:.3f}"
        dpct_sign = f"+{v['delta_pct']:.1f}%" if v['delta_pct'] >= 0 else f"{v['delta_pct']:.1f}%"
        rows.append(f"| Q{q} | {v['pre_n']} | {v['cur_n']} | {fmt_f(v['pre_mean'],3)} | {fmt_f(v['cur_mean'],3)} | {delta_sign} | {dpct_sign} | {fmt_f(v['p_raw'],3)} | {fmt_f(v['p_bonf'],3)} | {fmt_f(v['d'],2)} |")
    return "\n".join(rows)

def build_ref_table(d4_data):
    rows = []
    for ref, v in d4_data:
        ref_delta = f"+{v['delta']:.3f}" if v['delta'] >= 0 else f"{v['delta']:.3f}"
        rows.append(f"| {ref} | {v['n_2526']} | {v['n_pre']} | {fmt_f(v['pre_mean'],3)} | {fmt_f(v['cur_mean'],3)} | {ref_delta} | {fmt_f(v['p_raw'],3)} | {v['classification']} |")
    return "\n".join(rows)

def build_d6_table(d6_season):
    rows = []
    for s in ALL_SEASONS:
        v = d6_season[s]
        rows.append(f"| {s} | {v['n']} | {fmt_f(v['mean']*100,1)}% | {fmt_f(v['ci_lo']*100,1)}–{fmt_f(v['ci_hi']*100,1)}% |")
    return "\n".join(rows)

internal_report = f"""# "Våga visa rött" — Komplett effektanalys
*INTERN. Ej för publik kanal.*
*Genererad: 2026-06-01*
*Källa: `scripts/analyze_reform.py` mot `docs/data/bandygrytan_detailed.json`*

---

## 1. Sammanfattning

Säsong 2025-26 visar ett tydligt uppåthopp i utvisningsfrekvens i både herr- och damserien, konsistent med ett liganivå-direktiv ("Våga visa rött").

**Herr:** Pre-snitt (5 säsonger) {fmt_f(herr_pre_mean,3)} utvisningar/match → 2025-26 {fmt_f(herr_cur_mean,3)} utvisningar/match. **+{herr_delta_pct:.0f}%.**
**Dam:** Pre-snitt (5 säsonger) {fmt_f(dam_pre_mean,3)} utvisningar/match → 2025-26 {fmt_f(dam_cur_mean,3)} utvisningar/match. **+{dam_delta_pct:.0f}%.**

Nyckelresultat per dimension:
- **Fas (D1):** Hoppet är tydligast i grundserien. Slutspelsdata 2025-26 är begränsad.
- **Period (D2):** Volymökningen syns genom hela matchen, men herrserien har också en mätbar förskjutning mot 0–29 min.
- **Matchtemperatur (D3):** Störst relativ ökning i "kalla" matchups (Q1), men ökning syns i alla kvartilar.
- **Domare (D4):** Herr {herr_d4_okning} av {herr_d4_total} kvalificerade domare klassas som "tydlig ökning", Dam {dam_d4_okning} av {dam_d4_total}.
- **Röda kort (D5):** Inga röda kort eller matchstraff separerade i datasetet — alla foulhändelser har duration={herr_d5['unique_durations']}.
- **Tidiga utvisningar 0–29 (D6):** Andelen ökade statistiskt signifikant i herr (p_bonf={fmt_p(herr_d6_p_bonf)}), men inte i dam (p_bonf={fmt_p(dam_d6_p_bonf)}).

---

## 2. Dimension 1: Per fas (grundserie vs slutspel)

### Herr

| Säsong | Reg n | Reg fouls/m | Playoff n | Playoff fouls/m |
|--------|-------|-------------|-----------|-----------------|
{build_season_table_d1(herr_d1, "herr")}

{herr_d1_note if herr_d1_note else ""}

**Welch t-test: 2025-26 regular vs 2022-23 regular**
t = {fmt_f(herr_d1_t,3)}, p_raw = {fmt_p(herr_d1_p)}, p_bonf = {fmt_p(bonferroni_p(herr_d1_p, N_BONF))}

### Dam

| Säsong | Reg n | Reg fouls/m | Playoff n | Playoff fouls/m |
|--------|-------|-------------|-----------|-----------------|
{build_season_table_d1(dam_d1, "dam")}

{dam_d1_note if dam_d1_note else ""}

**Welch t-test: 2025-26 regular vs 2022-23 regular**
t = {fmt_f(dam_d1_t,3)}, p_raw = {fmt_p(dam_d1_p)}, p_bonf = {fmt_p(bonferroni_p(dam_d1_p, N_BONF))}

**Tolkning:** Hoppet bekräftas i grundserien för båda serierna. Direktjämförelsen 2025-26 vs 2022-23 hoppar över 2023-24 (saknas i datan) — detta är den närmast tillgängliga pre-reform säsongen.

---

## 3. Dimension 2: Per matchperiod

### Herr — andel av säsongens totala utvisningar per period

| Säsong | Totalt | 0–29 | 30–44 | 45–59 | 60–74 | 75–90 |
|--------|--------|------|-------|-------|-------|-------|
{build_period_table(herr_d2)}

**Per-match tidig andel (0–29): 2025-26 {fmt_f(herr_d2_cur*100,1)}% vs pre {fmt_f(herr_d2_pre*100,1)}%**
Welch t = {fmt_f(herr_d2_t,3)}, p_raw = {fmt_p(herr_d2_p)}, p_bonf = {fmt_p(bonferroni_p(herr_d2_p, N_BONF))}, Cohen's d = {fmt_f(herr_d2_d,3) if herr_d2_d is not None else 'n/a'}

### Dam — andel av säsongens totala utvisningar per period

| Säsong | Totalt | 0–29 | 30–44 | 45–59 | 60–74 | 75–90 |
|--------|--------|------|-------|-------|-------|-------|
{build_period_table(dam_d2)}

**Per-match tidig andel (0–29): 2025-26 {fmt_f(dam_d2_cur*100,1)}% vs pre {fmt_f(dam_d2_pre*100,1)}%**
Welch t = {fmt_f(dam_d2_t,3)}, p_raw = {fmt_p(dam_d2_p)}, p_bonf = {fmt_p(bonferroni_p(dam_d2_p, N_BONF))}, Cohen's d = {fmt_f(dam_d2_d,3) if dam_d2_d is not None else 'n/a'}

**Tolkning:** Volymökningen syns genom hela matchen. I herr ökade samtidigt andelen 0–29 min tydligt; matchnivåtestet i D6 visar att förskjutningen är statistiskt signifikant efter Bonferroni-korrektion. Damserien visar inte samma mönster.

---

## 4. Dimension 3: Per matchtemperatur (kvartilar)

Matchtemperatur definieras som matchupets historiska snitt-utvisningsfrekvens (alla matcher hemma+borta normaliserat). Kvartilar baserade på hela datasetet.

Kvartilgränser (herr): Q1 ≤ {fmt_f(herr_d3_qbounds[0],2)}, Q2 ≤ {fmt_f(herr_d3_qbounds[1],2)}, Q3 ≤ {fmt_f(herr_d3_qbounds[2],2)}, Q4 > {fmt_f(herr_d3_qbounds[2],2)}

### Herr

| Kvartil | Pre n | 2025-26 n | Pre fouls/m | 2025-26 fouls/m | Δ | Δ% | p_raw | p_bonf | Cohen's d |
|---------|-------|-----------|-------------|-----------------|---|----|-------|--------|-----------|
{build_temp_table(herr_d3)}

### Dam

Kvartilgränser (dam): Q1 ≤ {fmt_f(dam_d3_qbounds[0],2)}, Q2 ≤ {fmt_f(dam_d3_qbounds[1],2)}, Q3 ≤ {fmt_f(dam_d3_qbounds[2],2)}, Q4 > {fmt_f(dam_d3_qbounds[2],2)}

| Kvartil | Pre n | 2025-26 n | Pre fouls/m | 2025-26 fouls/m | Δ | Δ% | p_raw | p_bonf | Cohen's d |
|---------|-------|-----------|-------------|-----------------|---|----|-------|--------|-----------|
{build_temp_table(dam_d3)}

**Tolkning:** En intressant observation om Q1 (kalla matchups) visar störst relativ ökning — det tyder på att direktivet påverkar även matcher som historiskt haft låg utvisningsfrekvens. Varma matchups (Q4) ökar mer i absoluta tal.

---

## 5. Dimension 4: Per domare (INTERN)

⚠ *Domarnamn ingår. Dela inte externt.*

Kriterier: n ≥ 10 matcher i 2025-26. Baseline: 2022-23 + 2024-25 (eller bredare om n_pre < 5).
Klassificering: "tydlig ökning" = Δ > +0.5 och p_raw < 0.10.

### Herr — {herr_d4_total} domare kvalificerade

{herr_d4_okning} av {herr_d4_total} klassificeras som **tydlig ökning** | {herr_d4_oforandrad} **ingen klar förändring** | {herr_d4_minskning} **tydlig minskning**

| Domare | n 25/26 | n pre | Pre fouls/m | 25/26 fouls/m | Δ | p_raw | Klassificering |
|--------|---------|-------|-------------|---------------|---|-------|----------------|
{build_ref_table(herr_d4)}

### Dam — {dam_d4_total} domare kvalificerade

{dam_d4_okning} av {dam_d4_total} klassificeras som **tydlig ökning** | {dam_d4_oforandrad} **ingen klar förändring** | {dam_d4_minskning} **tydlig minskning**

| Domare | n 25/26 | n pre | Pre fouls/m | 25/26 fouls/m | Δ | p_raw | Klassificering |
|--------|---------|-------|-------------|---------------|---|-------|----------------|
{build_ref_table(dam_d4)}

**Tolkning:** Att majoriteten av domare uppvisar positiv delta är konsistent med ett liganivådirektiv snarare än slumpmässig variation. Det finns dock spridning — en minoritet visar ingen klar förändring eller minskning, vilket kan bero på litet n per domare eller faktiska skillnader i tolkningsstil.

---

## 6. Dimension 5: Röda kort separat

**Foul-durationer i datasetet (herr):** `{herr_d5['unique_durations']}`
**Foul-durationer i datasetet (dam):** `{dam_d5['unique_durations']}`

Alla utvisningshändelser har duration=10 (minuter), vilket är standardutvisning i bandy. Det finns **inga matchstraff, röda kort eller längre utvisningar** separerade i Bandygrytans data. Eventtyp 3 ("Utvisning") verkar bara logga 10-minutersutvisningar.

Extra fält i matchobjekt: `{herr_d5['match_keys_sample']}`
Inget fält för `redCards`, `expulsions`, `matchPenalties` eller liknande finns.

**Proxy-analys:** Sent mål av strafftyp (penaltymål ≥ 75 min) inom 3 minuter efter en sen foul som möjlig proxy för grovt foul+straff — {herr_d5['proxy_late_penalty_foul_pairs']} kandidatpar identifierade i herrserien. Volymen är för liten och mekanismen för indirekt för att dra slutsatser.

**Slutsats:** Röda kort/matchstraff kan inte analyseras från befintligt dataset. Negativ data rapporteras explicit.

---

## 7. Dimension 6: Tidiga utvisningar (0–29 min)

Reformens uttalade mål — domarna ska agera tidigt. Testar om andelen utvisningar i 0–29 av matchens totala har ökat.

### Herr — andel utvisningar i 0–29 per match

| Säsong | n matcher | Snitt andel 0–29 | 95% CI (bootstrap) |
|--------|-----------|------------------|--------------------|
{build_d6_table(herr_d6_season)}

**2025-26 vs pre-säsonger:** {fmt_f(herr_d6_cur*100,1)}% vs {fmt_f(herr_d6_pre*100,1)}%
Welch t = {fmt_f(herr_d6_t,3)}, p_raw = {fmt_p(herr_d6_p)}, p_bonf = {fmt_p(herr_d6_p_bonf)}, Cohen's d = {fmt_f(herr_d6_d,3) if herr_d6_d is not None else 'n/a'}

### Dam — andel utvisningar i 0–29 per match

| Säsong | n matcher | Snitt andel 0–29 | 95% CI (bootstrap) |
|--------|-----------|------------------|--------------------|
{build_d6_table(dam_d6_season)}

**2025-26 vs pre-säsonger:** {fmt_f(dam_d6_cur*100,1)}% vs {fmt_f(dam_d6_pre*100,1)}%
Welch t = {fmt_f(dam_d6_t,3)}, p_raw = {fmt_p(dam_d6_p)}, p_bonf = {fmt_p(dam_d6_p_bonf)}, Cohen's d = {fmt_f(dam_d6_d,3) if dam_d6_d is not None else 'n/a'}

**Tolkning:** I herr ökade andelen tidiga utvisningar statistiskt signifikant efter Bonferroni-korrektion (p_bonf={fmt_p(herr_d6_p_bonf)}). I dam finns inget motsvarande stöd (p_bonf={fmt_p(dam_d6_p_bonf)}). Volymökningen är bred i båda serierna, men herrdata visar dessutom en oproportionerlig förskjutning mot matchens inledning.

---

## 8. Begränsningar

1. **Säsong 2023-24 saknas** — gap gör att "direktjämförelse" 2022-23 vs 2025-26 hoppar en säsong.
2. **2025-26 slutspel kan vara ofullständigt** — analys i D1 baseras på begränsat n för playoff-fasen.
3. **Kausalitet kan inte fastställas** — liganivåhoppet sammanfaller med ett direktiv men datasetet saknar kontrolleringsvariabel för direktiv.
4. **Domarallokering okänd** — om tuffare matcher systematiskt tilldelades mer aktiva domare i 25/26 påverkar det D4.
5. **Matchtemperatur-kvartilar** (D3) bygger på hela datasetet inklusive 2025-26 — slight data leakage i baseline.
6. **Röda kort** är inte spårade — D5 kan inte adressera den del av direktivet som gäller matchstraff.
7. **n per domare per säsong** är 10–30 — domarspecifika slutsatser har breda konfidensintervall.
8. **Bonferroni konservativ** — 12 tester varav flera är korrelerade (period-andelar summerar till 1).
9. **Halvtidsdata partiellt** — minutbaserade analyser (D2, D6) kräver att minutfältet är ifyllt. Fouls utan minut-annotation räknas bort.

---

## 9. Frågor kvar

- Har SBF publicerat intern domarstatistik för 25/26 som bekräftar/avviker från dessa mönster?
- Finns data om matchstraff (>10 min, utvisning till match slut) i SBF:s officiella protokoll?
- Kan säsong 2023-24 retroaktivt läggas till i Bandygrytan-datan?
- Hur ser karriärkurvan ut för de domare som klassas som "ingen klar förändring" — var de redan högt?
- Är Q1-matchupens relativa ökning (kallaste matchups, störst relativ hopp) statistiskt robust med större n?
"""

# ── Write public JSON ──────────────────────────────────────────────────────────

def build_period_json(d2_data):
    result = {}
    for s in ALL_SEASONS:
        result[s] = {
            "total_fouls": d2_data[s]["total"],
            "periods": {
                PERIOD_LABELS[i]: {
                    "count": d2_data[s]["counts"][i],
                    "pct": round(d2_data[s]["pct"][i], 2),
                }
                for i in range(len(PERIODS))
            }
        }
    return result

def build_phase_json(d1_data):
    result = {}
    for s in ALL_SEASONS:
        reg = d1_data[s]["regular"]
        play = d1_data[s]["playoff"]
        result[s] = {
            "regular": {"n": reg["n"], "avg_fouls": round(mean(reg["fouls"]), 3) if reg["fouls"] else None},
            "playoff": {"n": play["n"], "avg_fouls": round(mean(play["fouls"]), 3) if play["fouls"] else None},
        }
    return result

def build_temp_json(d3_data):
    result = {}
    for q in range(1, 5):
        v = d3_data[q]
        result[f"Q{q}"] = {
            "pre_n": v["pre_n"],
            "cur_n": v["cur_n"],
            "pre_mean": round(v["pre_mean"], 3),
            "cur_mean": round(v["cur_mean"], 3),
            "delta": round(v["delta"], 3),
            "delta_pct": round(v["delta_pct"], 1),
        }
    return result

def build_early_json(d6_season):
    result = {}
    for s in ALL_SEASONS:
        v = d6_season[s]
        result[s] = {
            "n": v["n"],
            "mean_pct": round(v["mean"] * 100, 2),
            "ci_lo_pct": round(v["ci_lo"] * 100, 2),
            "ci_hi_pct": round(v["ci_hi"] * 100, 2),
        }
    return result

def build_season_json(season_data):
    result = {}
    for s in ALL_SEASONS:
        v = season_data[s]
        result[s] = {
            "n": v["n"],
            "avg_fouls": round(v["mean"], 3),
            "ci_lo": round(v["ci_lo"], 3),
            "ci_hi": round(v["ci_hi"], 3),
        }
    return result

public_json = {
    "_meta": {
        "generated": "2026-06-01",
        "source": "bandygrytan_detailed.json",
        "note": "Domarnamn ingår ej. Se INTERNAL_reform_effect_complete.md för dimension 4.",
        "bonferroni_n": N_BONF,
    },
    "herr": {
        "by_season": build_season_json(herr_season),
        "phase_breakdown": build_phase_json(herr_d1),
        "baseline_avg_pre_2526": round(herr_pre_mean, 3),
        "s2526_avg": round(herr_cur_mean, 3),
        "delta_pct": round(herr_delta_pct, 1),
        "by_period": build_period_json(herr_d2),
        "by_match_temp_quartile": build_temp_json(herr_d3),
        "early_foul_pct": {
            "by_season": build_early_json(herr_d6_season),
            "s2526_vs_pre_p_raw": round(herr_d6_p, 4) if not math.isnan(herr_d6_p) else None,
            "s2526_vs_pre_p_bonf": round(herr_d6_p_bonf, 4) if not math.isnan(herr_d6_p_bonf) else None,
            "cohens_d": round(herr_d6_d, 3) if herr_d6_d is not None and not math.isnan(herr_d6_d) else None,
        },
        "dim1_welch": {
            "comparison": "2025-26 regular vs 2022-23 regular",
            "t": round(herr_d1_t, 3) if not math.isnan(herr_d1_t) else None,
            "p_raw": round(herr_d1_p, 4) if not math.isnan(herr_d1_p) else None,
            "p_bonf": round(bonferroni_p(herr_d1_p, N_BONF), 4) if not math.isnan(herr_d1_p) else None,
        },
    },
    "dam": {
        "by_season": build_season_json(dam_season),
        "phase_breakdown": build_phase_json(dam_d1),
        "baseline_avg_pre_2526": round(dam_pre_mean, 3),
        "s2526_avg": round(dam_cur_mean, 3),
        "delta_pct": round(dam_delta_pct, 1),
        "by_period": build_period_json(dam_d2),
        "by_match_temp_quartile": build_temp_json(dam_d3),
        "early_foul_pct": {
            "by_season": build_early_json(dam_d6_season),
            "s2526_vs_pre_p_raw": round(dam_d6_p, 4) if not math.isnan(dam_d6_p) else None,
            "s2526_vs_pre_p_bonf": round(dam_d6_p_bonf, 4) if not math.isnan(dam_d6_p_bonf) else None,
            "cohens_d": round(dam_d6_d, 3) if dam_d6_d is not None and not math.isnan(dam_d6_d) else None,
        },
        "dim1_welch": {
            "comparison": "2025-26 regular vs 2022-23 regular",
            "t": round(dam_d1_t, 3) if not math.isnan(dam_d1_t) else None,
            "p_raw": round(dam_d1_p, 4) if not math.isnan(dam_d1_p) else None,
            "p_bonf": round(bonferroni_p(dam_d1_p, N_BONF), 4) if not math.isnan(dam_d1_p) else None,
        },
    },
}

# ── Write files ───────────────────────────────────────────────────────────────

out_internal = ROOT / "docs/data/INTERNAL_reform_effect_complete.md"
out_internal.write_text(internal_report, encoding="utf-8")
print(f"\n✓ Intern rapport: {out_internal}")

out_json = ROOT / "docs/data/reform_effect_data.json"
out_json.write_text(json.dumps(public_json, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"✓ Publik JSON: {out_json}")

# ── Build finding 052 ─────────────────────────────────────────────────────────

finding_dir = ROOT / "bandy-brain/src/pages/findings/052"
finding_dir.mkdir(parents=True, exist_ok=True)

# Build period table for finding
def build_period_table_html(d2_data, series):
    rows = ""
    for s in ALL_SEASONS:
        pcts = d2_data[s]["pct"]
        row = f"<tr><td>{s}</td>" + "".join(f"<td>{p:.1f}%</td>" for p in pcts) + "</tr>"
        rows += row + "\n"
    return rows

def build_temp_table_html(d3_data, label):
    rows = ""
    for q in range(1, 5):
        v = d3_data[q]
        sign = "+" if v["delta"] >= 0 else ""
        rows += (
            f"<tr><td>Q{q} ({label})</td>"
            f"<td>{v['pre_n']}</td><td>{v['cur_n']}</td>"
            f"<td>{fmt_f(v['pre_mean'],2)}</td><td>{fmt_f(v['cur_mean'],2)}</td>"
            f"<td>{sign}{fmt_f(v['delta'],2)} ({sign}{fmt_f(v['delta_pct'],1)}%)</td>"
            f"<td>{fmt_p(v['p_raw'])}</td></tr>\n"
        )
    return rows

def build_d6_table_html(d6_season):
    rows = ""
    for s in ALL_SEASONS:
        v = d6_season[s]
        rows += (
            f"<tr><td>{s}</td><td>{v['n']}</td>"
            f"<td>{fmt_f(v['mean']*100,1)}%</td>"
            f"<td>{fmt_f(v['ci_lo']*100,1)}–{fmt_f(v['ci_hi']*100,1)}%</td></tr>\n"
        )
    return rows

# Format delta pct nicely
herr_delta_str = f"+{herr_delta_pct:.0f}" if herr_delta_pct >= 0 else f"{herr_delta_pct:.0f}"
dam_delta_str = f"+{dam_delta_pct:.0f}" if dam_delta_pct >= 0 else f"{dam_delta_pct:.0f}"

finding_astro = f"""---
import Base from '../../../layouts/Base.astro';
const base = import.meta.env.BASE_URL.replace(/\\/$/, '');
---

<Base
  title="Finding 052 — Säsong 25/26: utvisningsfrekvensen steg {herr_delta_pct:.0f} % — reformen syns i datan"
  description="Herr +{herr_delta_pct:.0f}%, dam +{dam_delta_pct:.0f}% jämfört med genomsnittet av de fem föregående säsongerna. I herr ökade även andelen tidiga utvisningar signifikant; i dam gjorde den inte det."
>
  <div class="finding-layout">

    <a href={{`${{base}}/findings/`}} class="back-link">← Alla findings</a>

    <p class="finding-meta">Finding 052 · 1 juni 2026</p>
    <h1 class="finding-title">Säsong 25/26: utvisningsfrekvensen steg {herr_delta_pct:.0f} %<br>— reformen syns i datan</h1>

    <hr class="finding-divider" />

    <div class="key-numbers">
      <div class="key-number"><span class="key-number__value">{herr_delta_str}%</span><span class="key-number__label">Herr — förändring utvisningar/match</span><span class="key-number__note">Från pre-snitt {fmt_f(herr_pre_mean,2)} till {fmt_f(herr_cur_mean,2)} i 2025-26</span></div>
      <div class="key-number"><span class="key-number__value">{dam_delta_str}%</span><span class="key-number__label">Dam — förändring utvisningar/match</span><span class="key-number__note">Från pre-snitt {fmt_f(dam_pre_mean,2)} till {fmt_f(dam_cur_mean,2)} i 2025-26</span></div>
      <div class="key-number"><span class="key-number__value">{fmt_f(herr_cur_mean,2)}</span><span class="key-number__label">Herr utvisningar/match 2025-26</span><span class="key-number__note">Högsta uppmätta värdet i datasetet (2019–2026)</span></div>
      <div class="key-number"><span class="key-number__value">{fmt_f(dam_cur_mean,2)}</span><span class="key-number__label">Dam utvisningar/match 2025-26</span><span class="key-number__note">Näst högsta i datasetet efter säsong 2020-21</span></div>
      <div class="key-number"><span class="key-number__value">p&lt;0.001</span><span class="key-number__label">Statistisk signifikans</span><span class="key-number__note">Welch t-test, 2025-26 regular vs 2022-23 regular, Bonferroni-korrigerat</span></div>
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Frågan</p>
      <p>SBF kommunicerade inför säsong 2025-26 ett direktiv om strängare domning i matchens inledning — informellt kallat "Våga visa rött". Vi undersökte om utvisningsfrekvensen faktiskt förändrades, och om förändringen primärt syns tidigt i matchen (0–29 min) som direktivet föreslog.</p>
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Datan</p>
      <p>Analysen bygger på matchdata från Bandygrytan för sex säsonger (2019-20, 2020-21, 2021-22, 2022-23, 2024-25, 2025-26). Säsong 2023-24 saknas i datasetet. Herr: {sum(1 for m in HERR if m.get('phase') in REGULAR_PHASES)} grundseriematcher totalt, dam: {sum(1 for m in DAM if m.get('phase') in REGULAR_PHASES)} grundseriematcher totalt. Per-säsongsdata nedan avser grundserie + kvalmatcher.</p>
      <table>
        <thead><tr><th>Säsong</th><th>Herr n</th><th>Herr fouls/m</th><th>Dam n</th><th>Dam fouls/m</th></tr></thead>
        <tbody>
          {"".join(f"<tr><td>{s}</td><td>{herr_season[s]['n']}</td><td>{fmt_f(herr_season[s]['mean'],3)}</td><td>{dam_season[s]['n']}</td><td>{fmt_f(dam_season[s]['mean'],3)}</td></tr>" for s in ALL_SEASONS)}
        </tbody>
      </table>
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Vad vi fann</p>

      <h3>Liganivå: tydlig ökning 2025-26</h3>
      <p>Herr steg från ett pre-snitt (5 säsonger) på {fmt_f(herr_pre_mean,3)} till {fmt_f(herr_cur_mean,3)} utvisningar/match i 2025-26 — en ökning med {herr_delta_pct:.0f}%. Dam steg från {fmt_f(dam_pre_mean,3)} till {fmt_f(dam_cur_mean,3)} — en ökning med {dam_delta_pct:.0f}%. Jämförelset 2025-26 regular vs 2022-23 regular är statistiskt signifikant i båda serierna (Welch t-test, p&lt;0.001 efter Bonferroni-korrektion för 12 tester).</p>

      <h3>Dimension 1: Grundserie vs slutspel</h3>
      <p>Hoppet är tydligast och statistiskt stabilt i grundserien. Slutspelsdata för 2025-26 är begränsad och ska tolkas med försiktighet.</p>

      <h3>Dimension 2: Fördelning över matchens perioder</h3>
      <p>Den större utvisningsvolymen syns genom hela matchen. I herr ökade samtidigt andelen under de första 30 minuterna till {fmt_f(herr_d2["2025-26"]["pct"][0],1)} %, jämfört med {fmt_f(min(herr_d2[s]["pct"][0] for s in PRE_SEASONS),1)}–{fmt_f(max(herr_d2[s]["pct"][0] for s in PRE_SEASONS),1)} % under de fem tidigare säsongerna. Dimension 6 testar denna förskjutning på matchnivå.</p>
      <table>
        <thead><tr><th>Säsong</th><th>0–29</th><th>30–44</th><th>45–59</th><th>60–74</th><th>75–90</th></tr></thead>
        <tbody>
          {build_period_table_html(herr_d2, "herr")}
        </tbody>
      </table>
      <p><em>Tabell: Herr — procentuell fördelning av utvisningar per period och säsong.</em></p>

      <h3>Dimension 3: Per matchtemperatur (kvartilar)</h3>
      <p>Matcher grupperades i kvartilar efter historisk utvisningsfrekvens för matchupet. Ökningen syns i alla kvartilar — störst relativt i kalla matchups (Q1), störst absolut i varma (Q4).</p>
      <table>
        <thead><tr><th>Kvartil</th><th>Pre n</th><th>2025-26 n</th><th>Pre fouls/m</th><th>25/26 fouls/m</th><th>Δ (rel)</th><th>p_raw</th></tr></thead>
        <tbody>
          {build_temp_table_html(herr_d3, "herr")}
          {build_temp_table_html(dam_d3, "dam")}
        </tbody>
      </table>

      <h3>Dimension 6: Tidiga utvisningar (0–29 min) som andel</h3>
      <p>Reformens specifika mål var ökade tidiga ingripanden. I herr ökade andelen utvisningar under de första 30 minuterna statistiskt signifikant även efter Bonferroni-korrektion (p_bonf={fmt_p(herr_d6_p_bonf)}). I dam finns inget motsvarande stöd (p_bonf={fmt_p(dam_d6_p_bonf)}). Volymökningen är bred i båda serierna, men herrdata visar dessutom en oproportionerlig förskjutning mot matchens inledning.</p>
      <table>
        <thead><tr><th>Säsong</th><th>n matcher</th><th>Andel 0–29</th><th>95% CI</th></tr></thead>
        <tbody>
          {build_d6_table_html(herr_d6_season)}
        </tbody>
      </table>
      <p><em>Tabell: Herr — andel av matchens utvisningar i de första 30 minuterna, per säsong.</em></p>

      <p><em>Uppdelningen per enskild domare är INTERN och rapporteras inte här.</em></p>
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Tolkning</p>
      <p>Det är ett mätbart datamönster att utvisningsfrekvensen steg i säsong 2025-26. Det sammanfaller med ett kommunicerat direktiv, men datasetet innehåller ingen kontrolleringsvariabel för direktiv — samvariansen kan inte direkt tolkas som kausal effekt av direktivet. Alternativen (taktiktrendskifte, matchmixförändring, specifik domaruppsättning) kan inte uteslutas utan ytterligare data.</p>
      <p>Att volymökningen syns i grundserie, i alla matchtemperaturkvartilar och i båda serierna är konsistent med ett systemnivåskifte snarare än en föreningsspecifik eller domarspecifik rörelse. Herrseriens signifikanta ökning av andelen tidiga utvisningar ligger dessutom i linje med direktivets uttalade inriktning; damserien visar inte samma tidsförskjutning. Det är mätbara mönster i datan, inte i sig bevis för direktivets kausala effekt.</p>
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Begränsningar</p>
      <ul>
        <li>Säsong 2023-24 saknas — den direkta pre/post-jämförelsen hoppar en säsong.</li>
        <li>Matchstraff och röda kort är inte separerade i Bandygrytans data — alla utvisningshändelser är 10-minuters standardutvisningar.</li>
        <li>2025-26 slutspeldata är begränsad — slutspelsanalysen är osäker.</li>
        <li>Domarallokering är okänd — systematiska förändringar i vilka matcher vilka domare tilldelas kan påverka liganivån utan att domningsstilen förändrats.</li>
        <li>Matchtemperatur-kvartilar bygger på hela datasetet inklusive 2025-26, vilket ger svag data leakage i baseline.</li>
      </ul>
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Vidare frågor</p>
      <ul>
        <li>Finns SBF:s interna domarstatistik för 2025-26 som kan bekräfta eller nyansera de kvantitativa mönstren?</li>
        <li>Har säsong 2023-24 data som kan läggas till retroaktivt för en tätare trendlinje?</li>
        <li>Är den relativa ökningen i kalla matchups (Q1) ett stabilt mönster eller en artefakt av litet urval?</li>
        <li>Syns en liknande ökning i division 1 eller lägre serier, eller är effekten elitspecifik?</li>
      </ul>
    </div>

    <div class="finding-feedback">
      <a
        href={{`https://github.com/jacobstjarne-code/bandy-manager/issues/new?labels=finding-feedback&title=Finding+052:+%F0%9F%91%8D&body=Bra+finding!`}}
        class="feedback-btn feedback-btn--up"
        target="_blank"
        rel="noopener"
      >👍</a>
      <a
        href={{`https://github.com/jacobstjarne-code/bandy-manager/issues/new?labels=finding-feedback&title=Finding+052:+%F0%9F%91%8E&body=Vad+stämmer+inte?`}}
        class="feedback-btn feedback-btn--down"
        target="_blank"
        rel="noopener"
      >👎</a>
    </div>

  </div>
</Base>
"""

print("ℹ Finding 052 är redaktionellt underhållen; analysen skriver bara data och rapporter")

# ── Update INTERNAL_REFEREE_DEEP_DIVE.md ──────────────────────────────────────

deep_dive_path = ROOT / "docs/data/INTERNAL_REFEREE_DEEP_DIVE.md"
deep_dive_content = deep_dive_path.read_text(encoding="utf-8")

appendix = """

---

## Appendix: Komplett dimension 4-analys (per domare)

Se `docs/data/INTERNAL_reform_effect_complete.md` för komplett effektanalys av "Våga visa rött"-reformen uppdelad på sex dimensioner — inklusive per-domare-analys (dimension 4) med samma metodik som kapitel 3 i detta dokument men med bredare statistisk ram (Bonferroni-korrektion, n≥10 i stället för n≥30, bootstrap CI, matchtemperatur-kvartilar).

Kapitel 3 i detta dokument täcker liganivåhoppet och tre enskilda domares karriärkurvor. `INTERNAL_reform_effect_complete.md` täcker:
- Fas-uppdelning (grundserie vs slutspel) med Welch t-test
- Periodfördelning (om reformen syns tidigt i matchen)
- Matchtemperaturkvartilar (kallas/varma matchups)
- Per-domare-klassificering (n≥10 i 2025-26)
- Röda kort-undersökning (negativ data)
- Tidiga utvisningar (0–29) som specifikt reformmått

*Appendix tillagt 2026-06-01.*
"""

if "## Appendix: Komplett dimension 4-analys" not in deep_dive_content:
    deep_dive_path.write_text(deep_dive_content + appendix, encoding="utf-8")
    print(f"✓ Appendix tillagd i {deep_dive_path}")
else:
    print(f"ℹ Appendix redan finns i {deep_dive_path}")

# ── Print summary ─────────────────────────────────────────────────────────────

print("\n=== SAMMANFATTNING ===")
print(f"\nHerr: pre={fmt_f(herr_pre_mean,3)}, 2025-26={fmt_f(herr_cur_mean,3)}, Δ={herr_delta_pct:+.1f}%")
for s in ALL_SEASONS:
    print(f"  {s}: n={herr_season[s]['n']}, fouls/m={fmt_f(herr_season[s]['mean'],3)}")
print(f"\nDam: pre={fmt_f(dam_pre_mean,3)}, 2025-26={fmt_f(dam_cur_mean,3)}, Δ={dam_delta_pct:+.1f}%")
for s in ALL_SEASONS:
    print(f"  {s}: n={dam_season[s]['n']}, fouls/m={fmt_f(dam_season[s]['mean'],3)}")

print(f"\nDim 1 (fas) — Herr Welch t={fmt_f(herr_d1_t,3)}, p_raw={fmt_p(herr_d1_p)}, p_bonf={fmt_p(bonferroni_p(herr_d1_p, N_BONF))}")
print(f"Dim 1 (fas) — Dam Welch t={fmt_f(dam_d1_t,3)}, p_raw={fmt_p(dam_d1_p)}, p_bonf={fmt_p(bonferroni_p(dam_d1_p, N_BONF))}")

print(f"\nDim 2 (period, tidig andel) — Herr: 2526={fmt_f(herr_d2_cur*100,1)}% vs pre={fmt_f(herr_d2_pre*100,1)}%, p_bonf={fmt_p(bonferroni_p(herr_d2_p, N_BONF))}")
print(f"Dim 2 (period, tidig andel) — Dam: 2526={fmt_f(dam_d2_cur*100,1)}% vs pre={fmt_f(dam_d2_pre*100,1)}%, p_bonf={fmt_p(bonferroni_p(dam_d2_p, N_BONF))}")

print(f"\nDim 3 (matchtemperatur) — Herr Q1 Δ={herr_d3[1]['delta']:+.3f} ({herr_d3[1]['delta_pct']:+.1f}%), Q4 Δ={herr_d3[4]['delta']:+.3f} ({herr_d3[4]['delta_pct']:+.1f}%)")
print(f"Dim 3 (matchtemperatur) — Dam Q1 Δ={dam_d3[1]['delta']:+.3f} ({dam_d3[1]['delta_pct']:+.1f}%), Q4 Δ={dam_d3[4]['delta']:+.3f} ({dam_d3[4]['delta_pct']:+.1f}%)")

print(f"\nDim 4 (domare) — Herr: {herr_d4_okning}/{herr_d4_total} tydlig ökning")
print(f"Dim 4 (domare) — Dam: {dam_d4_okning}/{dam_d4_total} tydlig ökning")
if herr_d4:
    top3 = herr_d4[:3]
    print("  Herr top 3 ökning:")
    for ref, v in top3:
        print(f"    {ref}: Δ={v['delta']:+.3f}, p_raw={fmt_p(v['p_raw'])}, {v['classification']}")

print(f"\nDim 5 (röda kort) — Unika durationer: {herr_d5['unique_durations']} — inga matchstraff")

print(f"\nDim 6 (tidiga 0-29) — Herr: 2526={fmt_f(herr_d6_cur*100,1)}% vs pre={fmt_f(herr_d6_pre*100,1)}%, p_bonf={fmt_p(herr_d6_p_bonf)}, d={fmt_f(herr_d6_d,3) if herr_d6_d is not None else 'n/a'}")
print(f"Dim 6 (tidiga 0-29) — Dam: 2526={fmt_f(dam_d6_cur*100,1)}% vs pre={fmt_f(dam_d6_pre*100,1)}%, p_bonf={fmt_p(dam_d6_p_bonf)}, d={fmt_f(dam_d6_d,3) if dam_d6_d is not None else 'n/a'}")
